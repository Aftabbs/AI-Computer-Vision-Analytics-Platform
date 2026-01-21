export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// MediaPipe hand landmark indices
const FINGER_TIP_IDS = {
  THUMB: 4,
  INDEX: 8,
  MIDDLE: 12,
  RING: 16,
  PINKY: 20,
};

const FINGER_PIP_IDS = {
  THUMB: 2,  // Actually CMC for thumb comparison
  INDEX: 6,
  MIDDLE: 10,
  RING: 14,
  PINKY: 18,
};

const FINGER_MCP_IDS = {
  INDEX: 5,
  MIDDLE: 9,
  RING: 13,
  PINKY: 17,
};

const WRIST = 0;

export interface FingerCountResult {
  count: number;
  fingers: string[];
  fingerStates: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  gesture: string | null;
}

export function countFingers(landmarks: HandLandmark[], isRightHand: boolean = true): FingerCountResult {
  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  const raisedFingers: string[] = [];
  let count = 0;

  const fingerStates = {
    thumb: false,
    index: false,
    middle: false,
    ring: false,
    pinky: false,
  };

  // Thumb: Compare x-coordinates (different logic for left/right hand)
  const thumbTip = landmarks[FINGER_TIP_IDS.THUMB];
  const thumbIP = landmarks[3]; // IP joint

  // For thumb, check if tip is to the side of IP joint
  if (isRightHand) {
    // Right hand: thumb is raised if tip is to the left of IP
    if (thumbTip.x < thumbIP.x) {
      count++;
      raisedFingers.push(fingerNames[0]);
      fingerStates.thumb = true;
    }
  } else {
    // Left hand: thumb is raised if tip is to the right of IP
    if (thumbTip.x > thumbIP.x) {
      count++;
      raisedFingers.push(fingerNames[0]);
      fingerStates.thumb = true;
    }
  }

  // Other fingers: Compare y-coordinates (tip should be above PIP for raised finger)
  // Note: In MediaPipe, y increases downward

  // Index finger
  if (landmarks[FINGER_TIP_IDS.INDEX].y < landmarks[FINGER_PIP_IDS.INDEX].y) {
    count++;
    raisedFingers.push(fingerNames[1]);
    fingerStates.index = true;
  }

  // Middle finger
  if (landmarks[FINGER_TIP_IDS.MIDDLE].y < landmarks[FINGER_PIP_IDS.MIDDLE].y) {
    count++;
    raisedFingers.push(fingerNames[2]);
    fingerStates.middle = true;
  }

  // Ring finger
  if (landmarks[FINGER_TIP_IDS.RING].y < landmarks[FINGER_PIP_IDS.RING].y) {
    count++;
    raisedFingers.push(fingerNames[3]);
    fingerStates.ring = true;
  }

  // Pinky finger
  if (landmarks[FINGER_TIP_IDS.PINKY].y < landmarks[FINGER_PIP_IDS.PINKY].y) {
    count++;
    raisedFingers.push(fingerNames[4]);
    fingerStates.pinky = true;
  }

  // Detect gestures
  const gesture = detectGesture(fingerStates);

  return {
    count,
    fingers: raisedFingers,
    fingerStates,
    gesture,
  };
}

function detectGesture(states: FingerCountResult['fingerStates']): string | null {
  const { thumb, index, middle, ring, pinky } = states;

  // Peace sign (V sign) - index and middle raised
  if (!thumb && index && middle && !ring && !pinky) {
    return 'Peace Sign';
  }

  // Thumbs up - only thumb raised
  if (thumb && !index && !middle && !ring && !pinky) {
    return 'Thumbs Up';
  }

  // OK sign - thumb and index forming circle (approximate)
  // This would need more complex detection, simplified here
  if (thumb && index && !middle && !ring && !pinky) {
    return 'Point';
  }

  // Rock sign - index and pinky raised
  if (!thumb && index && !middle && !ring && pinky) {
    return 'Rock Sign';
  }

  // Call me sign - thumb and pinky raised
  if (thumb && !index && !middle && !ring && pinky) {
    return 'Call Me';
  }

  // Fist - no fingers raised
  if (!thumb && !index && !middle && !ring && !pinky) {
    return 'Fist';
  }

  // Open hand - all fingers raised
  if (thumb && index && middle && ring && pinky) {
    return 'Open Hand';
  }

  // Three fingers - various combinations
  if (!thumb && index && middle && ring && !pinky) {
    return 'Three';
  }

  // Four fingers
  if (!thumb && index && middle && ring && pinky) {
    return 'Four';
  }

  return null;
}

export function isHandOpen(landmarks: HandLandmark[]): boolean {
  const result = countFingers(landmarks);
  return result.count >= 4;
}

export function isHandClosed(landmarks: HandLandmark[]): boolean {
  const result = countFingers(landmarks);
  return result.count === 0;
}

export function getHandOrientation(landmarks: HandLandmark[]): 'palm' | 'back' {
  // Compare z-coordinates of palm landmarks
  const wrist = landmarks[WRIST];
  const middleMCP = landmarks[FINGER_MCP_IDS.MIDDLE];
  const indexMCP = landmarks[FINGER_MCP_IDS.INDEX];
  const pinkyMCP = landmarks[FINGER_MCP_IDS.PINKY];

  // If index MCP is more towards camera than pinky MCP, it's palm facing
  const avgZ = (indexMCP.z + middleMCP.z + pinkyMCP.z) / 3;

  return avgZ < wrist.z ? 'palm' : 'back';
}
