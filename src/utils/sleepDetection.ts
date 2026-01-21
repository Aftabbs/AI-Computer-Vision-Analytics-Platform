import { type Landmark, areEyesClosed } from './blinkDetection';

export interface SleepDetectionResult {
  isSleeping: boolean;
  sleepScore: number; // 0-100 confidence score
  eyeClosedDuration: number; // frames
  headDownDuration: number; // frames
  isHeadDown: boolean;
  headPitch: number;
}

export interface HeadPose {
  pitch: number; // nodding (up/down)
  yaw: number;   // turning (left/right)
  roll: number;  // tilting (side to side)
}

// MediaPipe Face Mesh landmark indices for head pose estimation
const NOSE_TIP = 1;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export class SleepDetector {
  private eyeClosedFrames = 0;
  private headDownFrames = 0;
  private readonly EYE_CLOSED_THRESHOLD = 45; // frames (~1.5s at 30fps)
  private readonly HEAD_DOWN_THRESHOLD = 30; // frames (~1s at 30fps)
  private readonly PITCH_THRESHOLD = 0.25; // radians (~14 degrees)
  private readonly EAR_THRESHOLD = 0.21;

  private sleepStartTime: number | null = null;
  private totalSleepDuration = 0;

  detect(landmarks: Landmark[]): SleepDetectionResult {
    const currentTime = Date.now();

    const eyesClosed = areEyesClosed(landmarks, this.EAR_THRESHOLD);
    const headPose = this.calculateHeadPose(landmarks);
    const isHeadDown = headPose.pitch > this.PITCH_THRESHOLD;

    // Update eye closed counter
    if (eyesClosed) {
      this.eyeClosedFrames++;
    } else {
      this.eyeClosedFrames = Math.max(0, this.eyeClosedFrames - 2); // Decay faster
    }

    // Update head down counter
    if (isHeadDown) {
      this.headDownFrames++;
    } else {
      this.headDownFrames = Math.max(0, this.headDownFrames - 2);
    }

    // Determine if sleeping
    const eyesFactor = this.eyeClosedFrames >= this.EYE_CLOSED_THRESHOLD;
    const headFactor = this.headDownFrames >= this.HEAD_DOWN_THRESHOLD;
    const combinedFactor = eyesClosed && this.headDownFrames >= this.HEAD_DOWN_THRESHOLD / 2;

    const isSleeping = eyesFactor || (eyesClosed && headFactor) || combinedFactor;

    // Track sleep duration
    if (isSleeping) {
      if (this.sleepStartTime === null) {
        this.sleepStartTime = currentTime;
      }
    } else {
      if (this.sleepStartTime !== null) {
        this.totalSleepDuration += currentTime - this.sleepStartTime;
        this.sleepStartTime = null;
      }
    }

    // Calculate sleep confidence score
    const eyeScore = Math.min(100, (this.eyeClosedFrames / this.EYE_CLOSED_THRESHOLD) * 60);
    const headScore = Math.min(40, (this.headDownFrames / this.HEAD_DOWN_THRESHOLD) * 40);
    const sleepScore = Math.min(100, eyeScore + headScore);

    return {
      isSleeping,
      sleepScore: Math.round(sleepScore),
      eyeClosedDuration: this.eyeClosedFrames,
      headDownDuration: this.headDownFrames,
      isHeadDown,
      headPitch: headPose.pitch,
    };
  }

  private calculateHeadPose(landmarks: Landmark[]): HeadPose {
    // Get key landmarks
    const noseTip = landmarks[NOSE_TIP];
    const forehead = landmarks[FOREHEAD];
    const chin = landmarks[CHIN];
    const leftEye = landmarks[LEFT_EYE_OUTER];
    const rightEye = landmarks[RIGHT_EYE_OUTER];

    // Calculate pitch (nodding) - based on nose tip vs forehead vertical difference
    // When head tilts down, nose tip moves down relative to forehead
    const faceHeight = Math.abs(forehead.y - chin.y);
    const noseOffset = noseTip.y - forehead.y;
    const normalizedPitch = noseOffset / (faceHeight || 1);
    const pitch = Math.atan2(normalizedPitch, 1);

    // Calculate yaw (turning) - based on eye positions
    const eyeCenter = (leftEye.x + rightEye.x) / 2;
    const noseToEyeCenter = noseTip.x - eyeCenter;
    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const yaw = Math.atan2(noseToEyeCenter * 2, eyeDistance || 1);

    // Calculate roll (tilting) - based on eye angle
    const eyeDeltaY = rightEye.y - leftEye.y;
    const eyeDeltaX = rightEye.x - leftEye.x;
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX || 1);

    return { pitch, yaw, roll };
  }

  getCurrentSleepDuration(): number {
    if (this.sleepStartTime !== null) {
      return this.totalSleepDuration + (Date.now() - this.sleepStartTime);
    }
    return this.totalSleepDuration;
  }

  getTotalSleepDuration(): number {
    return this.getCurrentSleepDuration();
  }

  resetSleepDuration(): void {
    this.totalSleepDuration = 0;
    this.sleepStartTime = null;
  }

  reset(): void {
    this.eyeClosedFrames = 0;
    this.headDownFrames = 0;
    this.sleepStartTime = null;
    this.totalSleepDuration = 0;
  }

  setThresholds(options: {
    eyeClosedThreshold?: number;
    headDownThreshold?: number;
    pitchThreshold?: number;
  }): void {
    if (options.eyeClosedThreshold !== undefined) {
      (this as any).EYE_CLOSED_THRESHOLD = options.eyeClosedThreshold;
    }
    if (options.headDownThreshold !== undefined) {
      (this as any).HEAD_DOWN_THRESHOLD = options.headDownThreshold;
    }
    if (options.pitchThreshold !== undefined) {
      (this as any).PITCH_THRESHOLD = options.pitchThreshold;
    }
  }
}

export function calculateHeadPose(landmarks: Landmark[]): HeadPose {
  const detector = new SleepDetector();
  return (detector as any).calculateHeadPose(landmarks);
}

export function isHeadDown(landmarks: Landmark[], threshold = 0.25): boolean {
  const pose = calculateHeadPose(landmarks);
  return pose.pitch > threshold;
}
