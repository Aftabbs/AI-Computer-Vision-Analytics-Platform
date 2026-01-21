export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// EAR (Eye Aspect Ratio) calculation points for MediaPipe Face Mesh
const LEFT_EYE_EAR_POINTS = {
  p1: 33,   // Outer corner
  p2: 160,  // Upper lid outer
  p3: 158,  // Upper lid inner
  p4: 133,  // Inner corner
  p5: 153,  // Lower lid inner
  p6: 144,  // Lower lid outer
};

const RIGHT_EYE_EAR_POINTS = {
  p1: 362,  // Inner corner
  p2: 385,  // Upper lid inner
  p3: 387,  // Upper lid outer
  p4: 263,  // Outer corner
  p5: 373,  // Lower lid outer
  p6: 380,  // Lower lid inner
};

function euclideanDistance(p1: Landmark, p2: Landmark): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}

function calculateEAR(landmarks: Landmark[], eyePoints: typeof LEFT_EYE_EAR_POINTS): number {
  const p1 = landmarks[eyePoints.p1];
  const p2 = landmarks[eyePoints.p2];
  const p3 = landmarks[eyePoints.p3];
  const p4 = landmarks[eyePoints.p4];
  const p5 = landmarks[eyePoints.p5];
  const p6 = landmarks[eyePoints.p6];

  // Calculate vertical distances
  const vertical1 = euclideanDistance(p2, p6);
  const vertical2 = euclideanDistance(p3, p5);

  // Calculate horizontal distance
  const horizontal = euclideanDistance(p1, p4);

  // Avoid division by zero
  if (horizontal === 0) return 0;

  // Calculate EAR
  const ear = (vertical1 + vertical2) / (2.0 * horizontal);
  return ear;
}

export interface BlinkDetectionResult {
  isBlinking: boolean;
  leftEAR: number;
  rightEAR: number;
  avgEAR: number;
}

export class BlinkDetector {
  private readonly EAR_THRESHOLD = 0.21;
  private readonly CONSEC_FRAMES = 2;

  private frameCounter = 0;
  private blinkCount = 0;

  detect(landmarks: Landmark[]): BlinkDetectionResult {
    const leftEAR = calculateEAR(landmarks, LEFT_EYE_EAR_POINTS);
    const rightEAR = calculateEAR(landmarks, RIGHT_EYE_EAR_POINTS);
    const avgEAR = (leftEAR + rightEAR) / 2;

    const isBlinking = avgEAR < this.EAR_THRESHOLD;

    // Count blinks (transition from blinking to not blinking)
    if (isBlinking) {
      this.frameCounter++;
    } else {
      if (this.frameCounter >= this.CONSEC_FRAMES) {
        this.blinkCount++;
      }
      this.frameCounter = 0;
    }

    return {
      isBlinking,
      leftEAR,
      rightEAR,
      avgEAR,
    };
  }

  getBlinkCount(): number {
    return this.blinkCount;
  }

  resetBlinkCount(): void {
    this.blinkCount = 0;
  }

  setThreshold(threshold: number): void {
    (this as any).EAR_THRESHOLD = threshold;
  }
}

export function areEyesClosed(landmarks: Landmark[], threshold = 0.21): boolean {
  const leftEAR = calculateEAR(landmarks, LEFT_EYE_EAR_POINTS);
  const rightEAR = calculateEAR(landmarks, RIGHT_EYE_EAR_POINTS);
  const avgEAR = (leftEAR + rightEAR) / 2;
  return avgEAR < threshold;
}

export function getEyeAspectRatio(landmarks: Landmark[]): { left: number; right: number; avg: number } {
  const left = calculateEAR(landmarks, LEFT_EYE_EAR_POINTS);
  const right = calculateEAR(landmarks, RIGHT_EYE_EAR_POINTS);
  return {
    left,
    right,
    avg: (left + right) / 2,
  };
}
