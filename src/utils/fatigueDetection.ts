// Fatigue detection system for AccessMate
// Monitors user behavior for signs of fatigue and suggests breaks

interface FatigueMetrics {
  blinkRate: number; // blinks per minute
  avgBlinkDuration: number; // ms
  yawnCount: number;
  headDroopEvents: number;
  slowEyeMovements: number;
  sessionDuration: number; // ms
}

export interface FatigueState {
  level: 'fresh' | 'mild' | 'moderate' | 'severe';
  score: number; // 0-100
  shouldTakeBreak: boolean;
  timeUntilBreak: number; // ms
}

export class FatigueDetector {
  // Blink tracking
  private blinkTimestamps: number[] = [];
  private blinkDurations: number[] = [];
  private lastBlinkStart: number | null = null;
  private wasBlinking = false;

  // Eye state tracking
  private leftEyeHistory: boolean[] = [];
  private rightEyeHistory: boolean[] = [];
  private eyeHistoryMaxLength = 30; // frames

  // Yawn detection
  private yawnCount = 0;
  private lastYawnTime = 0;
  private mouthOpenDuration = 0;
  private mouthWasOpen = false;
  private mouthOpenStart = 0;

  // Head droop detection
  private headYHistory: number[] = [];
  private headDroopEvents = 0;
  private headYBaseline: number | null = null;

  // Session tracking
  private sessionStartTime: number | null = null;
  private breakInterval = 30 * 60 * 1000; // 30 minutes default
  private lastBreakTime: number | null = null;

  // Thresholds (Normal blink rate is 15-20 per minute for reference)
  private readonly FATIGUE_BLINK_RATE = { min: 20, max: 26 }; // per minute - increased when fatigued
  private readonly DROWSY_BLINK_RATE = { min: 4, max: 14 }; // per minute - decreased when drowsy
  private readonly NORMAL_BLINK_DURATION = 200; // ms
  private readonly LONG_BLINK_DURATION = 400; // ms - sign of fatigue
  private readonly YAWN_DURATION_THRESHOLD = 2000; // ms
  private readonly HEAD_DROOP_THRESHOLD = 0.15; // 15% below baseline

  constructor(breakIntervalMinutes = 30) {
    this.breakInterval = breakIntervalMinutes * 60 * 1000;
  }

  setBreakInterval(minutes: number): void {
    this.breakInterval = minutes * 60 * 1000;
  }

  startSession(): void {
    this.sessionStartTime = Date.now();
    this.lastBreakTime = Date.now();
    this.reset();
  }

  endSession(): void {
    this.sessionStartTime = null;
  }

  recordBreak(): void {
    this.lastBreakTime = Date.now();
    this.yawnCount = Math.max(0, this.yawnCount - 2);
    this.headDroopEvents = Math.max(0, this.headDroopEvents - 1);
  }

  reset(): void {
    this.blinkTimestamps = [];
    this.blinkDurations = [];
    this.yawnCount = 0;
    this.headDroopEvents = 0;
    this.leftEyeHistory = [];
    this.rightEyeHistory = [];
    this.headYHistory = [];
    this.headYBaseline = null;
  }

  // Process eye state from face detection
  processEyeState(leftEyeOpen: boolean, rightEyeOpen: boolean): void {
    const now = Date.now();
    const isBlinking = !leftEyeOpen && !rightEyeOpen;

    // Track eye history
    this.leftEyeHistory.push(leftEyeOpen);
    this.rightEyeHistory.push(rightEyeOpen);
    if (this.leftEyeHistory.length > this.eyeHistoryMaxLength) {
      this.leftEyeHistory.shift();
      this.rightEyeHistory.shift();
    }

    // Detect blink start
    if (isBlinking && !this.wasBlinking) {
      this.lastBlinkStart = now;
    }

    // Detect blink end
    if (!isBlinking && this.wasBlinking && this.lastBlinkStart) {
      const blinkDuration = now - this.lastBlinkStart;

      // Only count reasonable blink durations (50ms - 500ms)
      if (blinkDuration >= 50 && blinkDuration <= 500) {
        this.blinkTimestamps.push(now);
        this.blinkDurations.push(blinkDuration);

        // Keep only last 2 minutes of data
        const twoMinutesAgo = now - 120000;
        while (this.blinkTimestamps.length > 0 && this.blinkTimestamps[0] < twoMinutesAgo) {
          this.blinkTimestamps.shift();
          this.blinkDurations.shift();
        }
      }

      this.lastBlinkStart = null;
    }

    this.wasBlinking = isBlinking;
  }

  // Process mouth state for yawn detection
  processMouthState(isMouthOpen: boolean, mouthOpenRatio: number): void {
    const now = Date.now();

    // Detect yawn (mouth wide open for extended period)
    if (isMouthOpen && mouthOpenRatio > 0.6) {
      if (!this.mouthWasOpen) {
        this.mouthOpenStart = now;
      }
      this.mouthOpenDuration = now - this.mouthOpenStart;

      // Count as yawn if mouth open for threshold duration
      if (this.mouthOpenDuration >= this.YAWN_DURATION_THRESHOLD &&
          now - this.lastYawnTime > 5000) { // Min 5 seconds between yawns
        this.yawnCount++;
        this.lastYawnTime = now;
      }
    } else {
      this.mouthOpenDuration = 0;
    }

    this.mouthWasOpen = isMouthOpen && mouthOpenRatio > 0.6;
  }

  // Process head position for droop detection
  processHeadPosition(headY: number): void {
    // Establish baseline from first few readings
    if (this.headYBaseline === null && this.headYHistory.length >= 30) {
      this.headYBaseline = this.headYHistory.reduce((a, b) => a + b, 0) / this.headYHistory.length;
    }

    this.headYHistory.push(headY);
    if (this.headYHistory.length > 60) {
      this.headYHistory.shift();
    }

    // Detect head droop (head position significantly lower than baseline)
    if (this.headYBaseline !== null) {
      const droopAmount = headY - this.headYBaseline;
      if (droopAmount > this.HEAD_DROOP_THRESHOLD) {
        // Check if this is a sustained droop
        const recentAvg = this.headYHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
        if (recentAvg - this.headYBaseline > this.HEAD_DROOP_THRESHOLD * 0.8) {
          this.headDroopEvents++;
        }
      }
    }
  }

  // Calculate current blink rate (per minute)
  getBlinkRate(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentBlinks = this.blinkTimestamps.filter(t => t > oneMinuteAgo);
    return recentBlinks.length;
  }

  // Calculate average blink duration
  getAverageBlinkDuration(): number {
    if (this.blinkDurations.length === 0) return this.NORMAL_BLINK_DURATION;
    return this.blinkDurations.reduce((a, b) => a + b, 0) / this.blinkDurations.length;
  }

  // Get fatigue metrics
  getMetrics(): FatigueMetrics {
    return {
      blinkRate: this.getBlinkRate(),
      avgBlinkDuration: this.getAverageBlinkDuration(),
      yawnCount: this.yawnCount,
      headDroopEvents: this.headDroopEvents,
      slowEyeMovements: this.countSlowEyeMovements(),
      sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
    };
  }

  // Count slow eye movements (PERCLOS-like metric)
  private countSlowEyeMovements(): number {
    if (this.leftEyeHistory.length < 10) return 0;

    // Count how many frames eyes were closed
    const closedFrames = this.leftEyeHistory.filter((_, i) =>
      !this.leftEyeHistory[i] && !this.rightEyeHistory[i]
    ).length;

    // Return percentage of time eyes closed
    return (closedFrames / this.leftEyeHistory.length) * 100;
  }

  // Calculate fatigue score (0-100)
  calculateFatigueScore(): number {
    const metrics = this.getMetrics();
    let score = 0;

    // Blink rate analysis
    const blinkRate = metrics.blinkRate;
    if (blinkRate < this.DROWSY_BLINK_RATE.min) {
      // Very low blink rate - possible severe drowsiness
      score += 30;
    } else if (blinkRate < this.DROWSY_BLINK_RATE.max) {
      // Low blink rate - some drowsiness
      score += 20;
    } else if (blinkRate > this.FATIGUE_BLINK_RATE.max) {
      // High blink rate - eye strain/fatigue
      score += 15;
    } else if (blinkRate > this.FATIGUE_BLINK_RATE.min) {
      // Elevated blink rate
      score += 10;
    }

    // Long blinks indicate fatigue
    if (metrics.avgBlinkDuration > this.LONG_BLINK_DURATION) {
      score += 20;
    } else if (metrics.avgBlinkDuration > this.NORMAL_BLINK_DURATION * 1.5) {
      score += 10;
    }

    // Yawns are strong fatigue indicator
    score += Math.min(metrics.yawnCount * 10, 30);

    // Head droops indicate severe fatigue
    score += Math.min(metrics.headDroopEvents * 15, 30);

    // PERCLOS (eyes closed percentage)
    if (metrics.slowEyeMovements > 20) {
      score += 25;
    } else if (metrics.slowEyeMovements > 15) {
      score += 15;
    } else if (metrics.slowEyeMovements > 10) {
      score += 5;
    }

    // Session duration factor
    const sessionHours = metrics.sessionDuration / (60 * 60 * 1000);
    if (sessionHours > 2) {
      score += 10;
    } else if (sessionHours > 1) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  // Get current fatigue state
  getFatigueState(): FatigueState {
    const score = this.calculateFatigueScore();
    const now = Date.now();

    let level: FatigueState['level'];
    if (score < 20) {
      level = 'fresh';
    } else if (score < 40) {
      level = 'mild';
    } else if (score < 60) {
      level = 'moderate';
    } else {
      level = 'severe';
    }

    // Check if break is needed
    const timeSinceBreak = this.lastBreakTime ? now - this.lastBreakTime :
      (this.sessionStartTime ? now - this.sessionStartTime : 0);
    const timeUntilBreak = Math.max(0, this.breakInterval - timeSinceBreak);
    const shouldTakeBreak = timeUntilBreak === 0 || score >= 60;

    return {
      level,
      score,
      shouldTakeBreak,
      timeUntilBreak,
    };
  }

  // Get fatigue warnings/suggestions
  getWarnings(): string[] {
    const metrics = this.getMetrics();
    const state = this.getFatigueState();
    const warnings: string[] = [];

    if (state.level === 'severe') {
      warnings.push('High fatigue detected. Please take a break immediately.');
    }

    if (metrics.yawnCount >= 3) {
      warnings.push('Multiple yawns detected - you may be getting tired.');
    }

    if (metrics.headDroopEvents >= 2) {
      warnings.push('Head drooping detected - consider taking a short break.');
    }

    if (metrics.avgBlinkDuration > this.LONG_BLINK_DURATION) {
      warnings.push('Prolonged blinks detected - your eyes may be tired.');
    }

    if (metrics.blinkRate < this.DROWSY_BLINK_RATE.min) {
      warnings.push('Reduced blink rate detected - try blinking more often.');
    }

    if (state.timeUntilBreak === 0) {
      warnings.push("It's time for a break! Rest your eyes for a few minutes.");
    }

    return warnings;
  }
}

// Singleton instance
export const fatigueDetector = new FatigueDetector();

// Break reminder component helper
export interface BreakReminderData {
  isVisible: boolean;
  fatigueLevel: FatigueState['level'];
  score: number;
  message: string;
  suggestedBreakDuration: number; // seconds
}

export function getBreakReminderData(state: FatigueState): BreakReminderData {
  let message: string;
  let suggestedBreakDuration: number;

  switch (state.level) {
    case 'severe':
      message = 'High fatigue detected! Please take a longer break to rest your eyes and mind.';
      suggestedBreakDuration = 300; // 5 minutes
      break;
    case 'moderate':
      message = 'You\'ve been working for a while. Take a short break to stay fresh.';
      suggestedBreakDuration = 180; // 3 minutes
      break;
    case 'mild':
      message = 'Time for a quick stretch! Look away from the screen for a moment.';
      suggestedBreakDuration = 60; // 1 minute
      break;
    default:
      message = 'Scheduled break time. Rest your eyes for a moment.';
      suggestedBreakDuration = 60;
  }

  return {
    isVisible: state.shouldTakeBreak,
    fatigueLevel: state.level,
    score: state.score,
    message,
    suggestedBreakDuration,
  };
}
