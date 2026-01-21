import type { HandLandmark, FingerCountResult } from './fingerCounting';
import { countFingers } from './fingerCounting';

export type GestureType =
  | 'fist'
  | 'openPalm'
  | 'thumbsUp'
  | 'thumbsDown'
  | 'peaceSign'
  | 'pointUp'
  | 'pointLeft'
  | 'pointRight'
  | 'rockSign'
  | 'okSign'
  | 'ok'
  | 'callMe'
  | 'oneFingers'
  | 'twoFingers'
  | 'threeFingers'
  | 'fourFingers'
  | 'fiveFingers'
  | null;

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  fingerCount: number;
  fingerStates: FingerCountResult['fingerStates'];
}

export interface GestureAction {
  type: 'click' | 'key' | 'scroll' | 'custom';
  action: string;
  description: string;
}

// Default gesture to action mapping
export const defaultGestureActions: Record<string, GestureAction> = {
  fist: { type: 'key', action: 'Escape', description: 'Cancel / Escape' },
  openPalm: { type: 'custom', action: 'pause', description: 'Pause / Resume' },
  thumbsUp: { type: 'key', action: 'Enter', description: 'Confirm / Enter' },
  peaceSign: { type: 'key', action: 'ctrl+c', description: 'Copy' },
  pointUp: { type: 'scroll', action: 'up', description: 'Scroll Up' },
  threeFingers: { type: 'key', action: 'Alt+Left', description: 'Go Back' },
  fourFingers: { type: 'key', action: 'Alt+Right', description: 'Go Forward' },
  fiveFingers: { type: 'key', action: 'ctrl+Home', description: 'Go Home' },
  rockSign: { type: 'custom', action: 'quickActions', description: 'Quick Actions' },
  callMe: { type: 'custom', action: 'keyboard', description: 'Toggle Keyboard' },
};

export class GestureRecognizer {
  private lastGesture: GestureType = null;
  private gestureStartTime: number | null = null;
  private gestureHoldTime: number = 0;
  private readonly MIN_HOLD_TIME = 300; // ms - minimum time to hold gesture
  private readonly GESTURE_COOLDOWN = 500; // ms - cooldown between gestures
  private lastGestureTime: number = 0;

  recognize(landmarks: HandLandmark[], isRightHand: boolean = true): GestureResult {
    const fingerResult = countFingers(landmarks, isRightHand);
    const { count, fingerStates } = fingerResult;
    const { thumb, index, middle, ring, pinky } = fingerStates;

    let gesture: GestureType = null;
    let confidence = 0.8;

    // Fist - no fingers raised
    if (count === 0) {
      gesture = 'fist';
      confidence = 0.95;
    }
    // Thumbs up - only thumb
    else if (thumb && !index && !middle && !ring && !pinky) {
      // Check if thumb is pointing up (y of thumb tip is above wrist)
      const thumbTip = landmarks[4];
      const wrist = landmarks[0];
      if (thumbTip.y < wrist.y) {
        gesture = 'thumbsUp';
        confidence = 0.9;
      } else {
        gesture = 'thumbsDown';
        confidence = 0.85;
      }
    }
    // Point up - only index finger
    else if (!thumb && index && !middle && !ring && !pinky) {
      gesture = 'pointUp';
      confidence = 0.9;
    }
    // Peace sign - index and middle
    else if (!thumb && index && middle && !ring && !pinky) {
      gesture = 'peaceSign';
      confidence = 0.9;
    }
    // Three fingers
    else if (!thumb && index && middle && ring && !pinky) {
      gesture = 'threeFingers';
      confidence = 0.85;
    }
    // Four fingers
    else if (!thumb && index && middle && ring && pinky) {
      gesture = 'fourFingers';
      confidence = 0.85;
    }
    // Open palm - all five
    else if (thumb && index && middle && ring && pinky) {
      gesture = 'openPalm';
      confidence = 0.95;
    }
    // Rock sign - index and pinky
    else if (!thumb && index && !middle && !ring && pinky) {
      gesture = 'rockSign';
      confidence = 0.85;
    }
    // Call me - thumb and pinky
    else if (thumb && !index && !middle && !ring && pinky) {
      gesture = 'callMe';
      confidence = 0.85;
    }
    // Number gestures based on count
    else if (count === 1) {
      gesture = 'oneFingers';
    } else if (count === 2) {
      gesture = 'twoFingers';
    } else if (count === 3) {
      gesture = 'threeFingers';
    } else if (count === 4) {
      gesture = 'fourFingers';
    } else if (count === 5) {
      gesture = 'fiveFingers';
    }

    return {
      gesture,
      confidence,
      fingerCount: count,
      fingerStates,
    };
  }

  // Detect gesture with hold time validation
  detectHeldGesture(landmarks: HandLandmark[], isRightHand: boolean = true): GestureType {
    const result = this.recognize(landmarks, isRightHand);
    const now = Date.now();

    // Check cooldown
    if (now - this.lastGestureTime < this.GESTURE_COOLDOWN) {
      return null;
    }

    if (result.gesture === this.lastGesture) {
      // Same gesture - accumulate hold time
      if (this.gestureStartTime !== null) {
        this.gestureHoldTime = now - this.gestureStartTime;
      }
    } else {
      // New gesture - reset timer
      this.lastGesture = result.gesture;
      this.gestureStartTime = now;
      this.gestureHoldTime = 0;
    }

    // Return gesture if held long enough
    if (this.gestureHoldTime >= this.MIN_HOLD_TIME && result.gesture !== null) {
      this.lastGestureTime = now;
      this.gestureStartTime = null;
      this.gestureHoldTime = 0;
      const detectedGesture = this.lastGesture;
      this.lastGesture = null;
      return detectedGesture;
    }

    return null;
  }

  getHoldProgress(): number {
    if (this.gestureStartTime === null) return 0;
    return Math.min(1, this.gestureHoldTime / this.MIN_HOLD_TIME);
  }

  getCurrentGesture(): GestureType {
    return this.lastGesture;
  }

  setHoldTime(ms: number): void {
    (this as any).MIN_HOLD_TIME = ms;
  }

  reset(): void {
    this.lastGesture = null;
    this.gestureStartTime = null;
    this.gestureHoldTime = 0;
  }
}

// Execute a gesture action
export function executeGestureAction(gesture: GestureType, customActions?: Record<string, GestureAction>): GestureAction | null {
  if (!gesture) return null;

  const actions = { ...defaultGestureActions, ...customActions };
  return actions[gesture] || null;
}

// Get gesture description for UI
export function getGestureDescription(gesture: GestureType): string {
  const descriptions: Record<string, string> = {
    fist: 'Fist - Cancel',
    openPalm: 'Open Palm - Pause',
    thumbsUp: 'Thumbs Up - Confirm',
    thumbsDown: 'Thumbs Down',
    peaceSign: 'Peace Sign - Copy',
    pointUp: 'Point Up - Scroll Up',
    pointLeft: 'Point Left',
    pointRight: 'Point Right',
    rockSign: 'Rock Sign - Quick Actions',
    okSign: 'OK Sign',
    callMe: 'Call Me - Keyboard',
    oneFingers: 'One Finger',
    twoFingers: 'Two Fingers',
    threeFingers: 'Three Fingers - Back',
    fourFingers: 'Four Fingers - Forward',
    fiveFingers: 'Five Fingers - Home',
  };

  return gesture ? descriptions[gesture] || gesture : '';
}

// Get emoji for gesture
export function getGestureEmoji(gesture: GestureType): string {
  const emojis: Record<string, string> = {
    fist: '✊',
    openPalm: '🖐️',
    thumbsUp: '👍',
    thumbsDown: '👎',
    peaceSign: '✌️',
    pointUp: '☝️',
    rockSign: '🤘',
    callMe: '🤙',
    oneFingers: '1️⃣',
    twoFingers: '2️⃣',
    threeFingers: '3️⃣',
    fourFingers: '4️⃣',
    fiveFingers: '5️⃣',
  };

  return gesture ? emojis[gesture] || '✋' : '';
}
