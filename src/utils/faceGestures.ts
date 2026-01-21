import type { Landmark } from './blinkDetection';

// Eye landmark indices for MediaPipe Face Mesh
const LEFT_EYE = {
  upper: [159, 158, 157, 173, 246],
  lower: [145, 144, 163, 7, 33],
  outer: 33,
  inner: 133,
  // EAR calculation points
  p1: 33,
  p2: 160,
  p3: 158,
  p4: 133,
  p5: 153,
  p6: 144,
};

const RIGHT_EYE = {
  upper: [386, 385, 384, 398, 466],
  lower: [374, 373, 390, 249, 263],
  outer: 263,
  inner: 362,
  // EAR calculation points
  p1: 362,
  p2: 385,
  p3: 387,
  p4: 263,
  p5: 373,
  p6: 380,
};

// Mouth landmark indices
const MOUTH = {
  upperOuter: 13,
  lowerOuter: 14,
  upperInner: 78,
  lowerInner: 308,
  left: 61,
  right: 291,
  upperLip: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  lowerLip: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
};

// Eyebrow landmark indices
const LEFT_EYEBROW = [70, 63, 105, 66, 107];
const RIGHT_EYEBROW = [300, 293, 334, 296, 336];

function euclideanDistance(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Calculate Eye Aspect Ratio for a single eye
function calculateEAR(landmarks: Landmark[], eye: typeof LEFT_EYE): number {
  const p1 = landmarks[eye.p1];
  const p2 = landmarks[eye.p2];
  const p3 = landmarks[eye.p3];
  const p4 = landmarks[eye.p4];
  const p5 = landmarks[eye.p5];
  const p6 = landmarks[eye.p6];

  const vertical1 = euclideanDistance(p2, p6);
  const vertical2 = euclideanDistance(p3, p5);
  const horizontal = euclideanDistance(p1, p4);

  if (horizontal === 0) return 0;
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

export interface EyeState {
  leftOpen: boolean;
  rightOpen: boolean;
  leftEAR: number;
  rightEAR: number;
  isWinkingLeft: boolean;
  isWinkingRight: boolean;
  isBothClosed: boolean;
}

export class EyeGestureDetector {
  private leftEARHistory: number[] = [];
  private rightEARHistory: number[] = [];
  private readonly HISTORY_SIZE = 5;
  private readonly WINK_THRESHOLD = 0.18;
  private readonly OPEN_THRESHOLD = 0.22;
  private readonly WINK_DIFF_THRESHOLD = 0.08; // Difference between eyes for wink

  private leftWinkStartTime: number | null = null;
  private rightWinkStartTime: number | null = null;
  private readonly MIN_WINK_DURATION = 100; // ms
  private readonly MAX_WINK_DURATION = 500; // ms

  detect(landmarks: Landmark[]): EyeState {
    const leftEAR = calculateEAR(landmarks, LEFT_EYE);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE);

    // Add to history for smoothing
    this.leftEARHistory.push(leftEAR);
    this.rightEARHistory.push(rightEAR);
    if (this.leftEARHistory.length > this.HISTORY_SIZE) {
      this.leftEARHistory.shift();
      this.rightEARHistory.shift();
    }

    // Calculate smoothed values
    const avgLeftEAR = this.leftEARHistory.reduce((a, b) => a + b, 0) / this.leftEARHistory.length;
    const avgRightEAR = this.rightEARHistory.reduce((a, b) => a + b, 0) / this.rightEARHistory.length;

    const leftOpen = avgLeftEAR > this.OPEN_THRESHOLD;
    const rightOpen = avgRightEAR > this.OPEN_THRESHOLD;

    // Detect wink: one eye closed while the other is open
    const earDiff = Math.abs(avgLeftEAR - avgRightEAR);
    const isWinkingLeft = !leftOpen && rightOpen && earDiff > this.WINK_DIFF_THRESHOLD;
    const isWinkingRight = !rightOpen && leftOpen && earDiff > this.WINK_DIFF_THRESHOLD;

    // Both eyes closed detection
    const isBothClosed = avgLeftEAR < this.WINK_THRESHOLD && avgRightEAR < this.WINK_THRESHOLD;

    return {
      leftOpen,
      rightOpen,
      leftEAR: avgLeftEAR,
      rightEAR: avgRightEAR,
      isWinkingLeft,
      isWinkingRight,
      isBothClosed,
    };
  }

  // Check for intentional wink (with duration validation)
  detectIntentionalWink(landmarks: Landmark[]): 'left' | 'right' | 'double' | null {
    const state = this.detect(landmarks);
    const now = Date.now();

    // Left wink detection
    if (state.isWinkingLeft) {
      if (this.leftWinkStartTime === null) {
        this.leftWinkStartTime = now;
      }
    } else {
      if (this.leftWinkStartTime !== null) {
        const duration = now - this.leftWinkStartTime;
        this.leftWinkStartTime = null;
        if (duration >= this.MIN_WINK_DURATION && duration <= this.MAX_WINK_DURATION) {
          return 'left';
        }
      }
    }

    // Right wink detection
    if (state.isWinkingRight) {
      if (this.rightWinkStartTime === null) {
        this.rightWinkStartTime = now;
      }
    } else {
      if (this.rightWinkStartTime !== null) {
        const duration = now - this.rightWinkStartTime;
        this.rightWinkStartTime = null;
        if (duration >= this.MIN_WINK_DURATION && duration <= this.MAX_WINK_DURATION) {
          return 'right';
        }
      }
    }

    // Double blink detection (both eyes closed briefly)
    if (state.isBothClosed) {
      // Could implement double-blink detection here
    }

    return null;
  }

  setThresholds(wink: number, open: number): void {
    (this as any).WINK_THRESHOLD = wink;
    (this as any).OPEN_THRESHOLD = open;
  }
}

export interface MouthState {
  isOpen: boolean;
  openness: number; // 0 to 1
  openRatio: number; // normalized 0 to 1 for fatigue detection
  isSmiling: boolean;
  smileIntensity: number;
}

export class MouthGestureDetector {
  private opennessHistory: number[] = [];
  private readonly HISTORY_SIZE = 5;
  private readonly OPEN_THRESHOLD = 0.03;

  detect(landmarks: Landmark[]): MouthState {
    // Calculate mouth openness
    const upperLip = landmarks[MOUTH.upperOuter];
    const lowerLip = landmarks[MOUTH.lowerOuter];
    const mouthLeft = landmarks[MOUTH.left];
    const mouthRight = landmarks[MOUTH.right];

    const mouthHeight = euclideanDistance(upperLip, lowerLip);
    const mouthWidth = euclideanDistance(mouthLeft, mouthRight);

    // Normalize by mouth width
    const openness = mouthWidth > 0 ? mouthHeight / mouthWidth : 0;

    // Smooth the value
    this.opennessHistory.push(openness);
    if (this.opennessHistory.length > this.HISTORY_SIZE) {
      this.opennessHistory.shift();
    }
    const avgOpenness = this.opennessHistory.reduce((a, b) => a + b, 0) / this.opennessHistory.length;

    const isOpen = avgOpenness > this.OPEN_THRESHOLD;

    // Detect smile (mouth corners higher than center)
    const mouthCenter = (upperLip.y + lowerLip.y) / 2;
    const leftCornerHeight = mouthCenter - mouthLeft.y;
    const rightCornerHeight = mouthCenter - mouthRight.y;
    const avgCornerHeight = (leftCornerHeight + rightCornerHeight) / 2;

    const isSmiling = avgCornerHeight > 0.005;
    const smileIntensity = Math.max(0, Math.min(1, avgCornerHeight * 100));

    // Calculate normalized open ratio (0 to 1) for fatigue detection
    // Average mouth openness when yawning is around 0.15-0.25
    const openRatio = Math.min(1, avgOpenness / 0.2);

    return {
      isOpen,
      openness: avgOpenness,
      openRatio,
      isSmiling,
      smileIntensity,
    };
  }
}

export interface EyebrowState {
  leftRaised: boolean;
  rightRaised: boolean;
  bothRaised: boolean;
}

export class EyebrowDetector {
  private baselineLeftY: number | null = null;
  private baselineRightY: number | null = null;
  private readonly RAISE_THRESHOLD = 0.015;

  calibrate(landmarks: Landmark[]): void {
    const leftBrow = LEFT_EYEBROW.map(i => landmarks[i]);
    const rightBrow = RIGHT_EYEBROW.map(i => landmarks[i]);

    this.baselineLeftY = leftBrow.reduce((sum, p) => sum + p.y, 0) / leftBrow.length;
    this.baselineRightY = rightBrow.reduce((sum, p) => sum + p.y, 0) / rightBrow.length;
  }

  detect(landmarks: Landmark[]): EyebrowState {
    const leftBrow = LEFT_EYEBROW.map(i => landmarks[i]);
    const rightBrow = RIGHT_EYEBROW.map(i => landmarks[i]);

    const currentLeftY = leftBrow.reduce((sum, p) => sum + p.y, 0) / leftBrow.length;
    const currentRightY = rightBrow.reduce((sum, p) => sum + p.y, 0) / rightBrow.length;

    // Auto-calibrate if not set
    if (this.baselineLeftY === null) {
      this.baselineLeftY = currentLeftY;
      this.baselineRightY = currentRightY;
    }

    // Detect raised eyebrows (y decreases when raised)
    const leftRaised = (this.baselineLeftY! - currentLeftY) > this.RAISE_THRESHOLD;
    const rightRaised = (this.baselineRightY! - currentRightY) > this.RAISE_THRESHOLD;

    return {
      leftRaised,
      rightRaised,
      bothRaised: leftRaised && rightRaised,
    };
  }
}
