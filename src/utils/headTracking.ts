import type { Landmark } from './blinkDetection';

// MediaPipe Face Mesh landmark indices
const NOSE_TIP = 4;
const FOREHEAD_CENTER = 10;
const CHIN = 152;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export interface HeadPosition {
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (up) to 1 (down)
  tilt: number; // head roll in radians
  yaw: number; // head turn left/right
  pitch: number; // head nod up/down
}

export interface CalibrationData {
  centerX: number;
  centerY: number;
  rangeX: number;
  rangeY: number;
  isCalibrated: boolean;
}

export class HeadTracker {
  private calibration: CalibrationData;
  private smoothedX: number = 0;
  private smoothedY: number = 0;
  private smoothingFactor: number = 0.7;

  constructor(calibration?: CalibrationData) {
    this.calibration = calibration || {
      centerX: 0.5,
      centerY: 0.5,
      rangeX: 0.3,
      rangeY: 0.2,
      isCalibrated: false,
    };
  }

  setCalibration(calibration: CalibrationData): void {
    this.calibration = calibration;
  }

  setSmoothing(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  track(landmarks: Landmark[]): HeadPosition {
    // Get nose position as primary tracking point
    const nose = landmarks[NOSE_TIP];
    const forehead = landmarks[FOREHEAD_CENTER];
    const chin = landmarks[CHIN];
    const leftEye = landmarks[LEFT_EYE_OUTER];
    const rightEye = landmarks[RIGHT_EYE_OUTER];

    // Calculate normalized position relative to calibration
    let rawX = (nose.x - this.calibration.centerX) / this.calibration.rangeX;
    let rawY = (nose.y - this.calibration.centerY) / this.calibration.rangeY;

    // Clamp to -1 to 1 range
    rawX = Math.max(-1, Math.min(1, rawX));
    rawY = Math.max(-1, Math.min(1, rawY));

    // Apply smoothing
    this.smoothedX = this.smoothedX * this.smoothingFactor + rawX * (1 - this.smoothingFactor);
    this.smoothedY = this.smoothedY * this.smoothingFactor + rawY * (1 - this.smoothingFactor);

    // Calculate head rotation (tilt/roll)
    const eyeDeltaY = rightEye.y - leftEye.y;
    const eyeDeltaX = rightEye.x - leftEye.x;
    const tilt = Math.atan2(eyeDeltaY, eyeDeltaX);

    // Calculate yaw (turning left/right)
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const noseToEyeCenter = nose.x - eyeCenter;
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const yaw = Math.atan2(noseToEyeCenter * 2, eyeDistance || 0.1);

    // Calculate pitch (nodding up/down)
    const faceHeight = Math.abs(forehead.y - chin.y);
    const noseOffset = nose.y - forehead.y;
    const normalizedPitch = noseOffset / (faceHeight || 0.1);
    const pitch = Math.atan2(normalizedPitch - 0.5, 1);

    return {
      x: this.smoothedX,
      y: this.smoothedY,
      tilt,
      yaw,
      pitch,
    };
  }

  calibrate(landmarks: Landmark[]): CalibrationData {
    const nose = landmarks[NOSE_TIP];

    this.calibration = {
      centerX: nose.x,
      centerY: nose.y,
      rangeX: 0.25, // Comfortable head movement range
      rangeY: 0.15,
      isCalibrated: true,
    };

    // Reset smoothed values
    this.smoothedX = 0;
    this.smoothedY = 0;

    return this.calibration;
  }

  getCalibration(): CalibrationData {
    return this.calibration;
  }

  reset(): void {
    this.smoothedX = 0;
    this.smoothedY = 0;
  }
}

// Convert head position to screen coordinates
export function headPositionToScreen(
  headPos: HeadPosition,
  screenWidth: number,
  screenHeight: number,
  speed: number = 1.5,
  deadZone: number = 0.05
): { x: number; y: number } {
  let { x, y } = headPos;

  // Apply dead zone
  if (Math.abs(x) < deadZone) x = 0;
  if (Math.abs(y) < deadZone) y = 0;

  // Apply speed multiplier
  x *= speed;
  y *= speed;

  // Convert to screen coordinates (0 to 1 range)
  const screenX = (x + 1) / 2;
  const screenY = (y + 1) / 2;

  return {
    x: Math.max(0, Math.min(1, screenX)) * screenWidth,
    y: Math.max(0, Math.min(1, screenY)) * screenHeight,
  };
}

// Check if head is in neutral position (for calibration)
export function isHeadNeutral(headPos: HeadPosition, threshold: number = 0.1): boolean {
  return (
    Math.abs(headPos.x) < threshold &&
    Math.abs(headPos.y) < threshold &&
    Math.abs(headPos.tilt) < 0.1
  );
}
