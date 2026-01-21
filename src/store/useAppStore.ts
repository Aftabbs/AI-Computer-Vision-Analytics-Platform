import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FacialAttributes {
  skinColor: string;
  skinColorName: string;
  hairColor: string;
  hairColorName: string;
  eyeColor: string;
  eyeColorName: string;
}

export interface SessionHistoryEntry {
  timestamp: number;
  blinkCount: number;
  sleepDuration: number;
  engagementScore: number;
}

export interface Settings {
  showLandmarks: boolean;
  showFaceMesh: boolean;
  showHandLandmarks: boolean;
  enable3DBackground: boolean;
  detectionSensitivity: number;
  cameraFacing: 'user' | 'environment';
  enableSoundAlerts: boolean;
}

export interface AppState {
  // Camera state
  isCameraActive: boolean;
  isCameraLoading: boolean;
  cameraError: string | null;

  // Detection states
  isFaceDetected: boolean;
  isHandDetected: boolean;
  isSleeping: boolean;
  isBlinking: boolean;

  // Metrics
  blinkCount: number;
  sleepDuration: number;
  fingerCount: number;
  raisedFingers: string[];
  currentGesture: string | null;
  earValue: number;
  sleepScore: number;

  // Facial attributes
  facialAttributes: FacialAttributes;

  // Session history
  sessionHistory: SessionHistoryEntry[];
  sessionStartTime: number | null;

  // Settings
  settings: Settings;

  // Actions
  setCameraActive: (active: boolean) => void;
  setCameraLoading: (loading: boolean) => void;
  setCameraError: (error: string | null) => void;

  setFaceDetected: (detected: boolean) => void;
  setHandDetected: (detected: boolean) => void;
  setSleeping: (sleeping: boolean) => void;
  setBlinking: (blinking: boolean) => void;

  incrementBlinkCount: () => void;
  resetBlinkCount: () => void;
  updateSleepDuration: (duration: number) => void;
  resetSleepDuration: () => void;

  setFingerCount: (count: number, fingers: string[]) => void;
  setCurrentGesture: (gesture: string | null) => void;
  setEarValue: (ear: number) => void;
  setSleepScore: (score: number) => void;

  updateFacialAttributes: (attributes: Partial<FacialAttributes>) => void;

  addSessionEntry: (entry: Omit<SessionHistoryEntry, 'timestamp'>) => void;
  clearSessionHistory: () => void;
  startSession: () => void;
  endSession: () => void;

  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

const defaultFacialAttributes: FacialAttributes = {
  skinColor: '#c9a080',
  skinColorName: 'Unknown',
  hairColor: '#3d2314',
  hairColorName: 'Unknown',
  eyeColor: '#6b4423',
  eyeColorName: 'Unknown',
};

const defaultSettings: Settings = {
  showLandmarks: true,
  showFaceMesh: false,
  showHandLandmarks: true,
  enable3DBackground: true,
  detectionSensitivity: 0.5,
  cameraFacing: 'user',
  enableSoundAlerts: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial camera state
      isCameraActive: false,
      isCameraLoading: false,
      cameraError: null,

      // Initial detection states
      isFaceDetected: false,
      isHandDetected: false,
      isSleeping: false,
      isBlinking: false,

      // Initial metrics
      blinkCount: 0,
      sleepDuration: 0,
      fingerCount: 0,
      raisedFingers: [],
      currentGesture: null,
      earValue: 0,
      sleepScore: 0,

      // Initial facial attributes
      facialAttributes: defaultFacialAttributes,

      // Initial session history
      sessionHistory: [],
      sessionStartTime: null,

      // Initial settings
      settings: defaultSettings,

      // Camera actions
      setCameraActive: (active) => set({ isCameraActive: active }),
      setCameraLoading: (loading) => set({ isCameraLoading: loading }),
      setCameraError: (error) => set({ cameraError: error }),

      // Detection actions
      setFaceDetected: (detected) => set({ isFaceDetected: detected }),
      setHandDetected: (detected) => set({ isHandDetected: detected }),
      setSleeping: (sleeping) => set({ isSleeping: sleeping }),
      setBlinking: (blinking) => set({ isBlinking: blinking }),

      // Metrics actions
      incrementBlinkCount: () => set((state) => ({ blinkCount: state.blinkCount + 1 })),
      resetBlinkCount: () => set({ blinkCount: 0 }),
      updateSleepDuration: (duration) => set({ sleepDuration: duration }),
      resetSleepDuration: () => set({ sleepDuration: 0 }),

      setFingerCount: (count, fingers) => set({ fingerCount: count, raisedFingers: fingers }),
      setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
      setEarValue: (ear) => set({ earValue: ear }),
      setSleepScore: (score) => set({ sleepScore: score }),

      // Facial attributes actions
      updateFacialAttributes: (attributes) =>
        set((state) => ({
          facialAttributes: { ...state.facialAttributes, ...attributes },
        })),

      // Session actions
      addSessionEntry: (entry) =>
        set((state) => ({
          sessionHistory: [
            ...state.sessionHistory,
            { ...entry, timestamp: Date.now() },
          ].slice(-100), // Keep last 100 entries
        })),

      clearSessionHistory: () => set({ sessionHistory: [] }),

      startSession: () => set({ sessionStartTime: Date.now() }),

      endSession: () => {
        const state = get();
        if (state.sessionStartTime) {
          const entry = {
            blinkCount: state.blinkCount,
            sleepDuration: state.sleepDuration,
            engagementScore: calculateEngagementScore(state),
          };
          set((s) => ({
            sessionHistory: [
              ...s.sessionHistory,
              { ...entry, timestamp: Date.now() },
            ].slice(-100),
            sessionStartTime: null,
          }));
        }
      },

      // Settings actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'ai-cv-app-storage',
      partialize: (state) => ({
        sessionHistory: state.sessionHistory,
        settings: state.settings,
      }),
    }
  )
);

function calculateEngagementScore(state: AppState): number {
  // Simple engagement score based on attention metrics
  let score = 100;

  // Reduce score for sleeping
  if (state.sleepDuration > 0) {
    score -= Math.min(50, state.sleepDuration / 1000);
  }

  // Blink rate affects engagement (too few or too many blinks indicate issues)
  const sessionDuration = state.sessionStartTime
    ? (Date.now() - state.sessionStartTime) / 60000 // minutes
    : 1;
  const blinksPerMinute = state.blinkCount / sessionDuration;

  // Normal blink rate is 15-20 per minute
  if (blinksPerMinute < 10) {
    score -= 10; // Possible fatigue (reduced blinking)
  } else if (blinksPerMinute > 30) {
    score -= 10; // Possible stress or discomfort
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Selectors for optimized re-renders
export const selectCameraState = (state: AppState) => ({
  isCameraActive: state.isCameraActive,
  isCameraLoading: state.isCameraLoading,
  cameraError: state.cameraError,
});

export const selectDetectionState = (state: AppState) => ({
  isFaceDetected: state.isFaceDetected,
  isHandDetected: state.isHandDetected,
  isSleeping: state.isSleeping,
  isBlinking: state.isBlinking,
});

export const selectMetrics = (state: AppState) => ({
  blinkCount: state.blinkCount,
  sleepDuration: state.sleepDuration,
  fingerCount: state.fingerCount,
  raisedFingers: state.raisedFingers,
  currentGesture: state.currentGesture,
  earValue: state.earValue,
  sleepScore: state.sleepScore,
});

export const selectSettings = (state: AppState) => state.settings;
