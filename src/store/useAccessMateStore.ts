import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GestureType } from '../utils/gestureCommands';

// Control modes
export type CursorMode = 'head' | 'nose' | 'disabled';
export type ClickMode = 'wink' | 'dwell' | 'gesture' | 'disabled';

// Gesture mapping (as array for UI)
export interface GestureMappingItem {
  gesture: GestureType;
  action: string;
  enabled: boolean;
}

// Calibration data
export interface CalibrationData {
  centerX: number;
  centerY: number;
  rangeX: number;
  rangeY: number;
  isCalibrated: boolean;
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  settings: AccessMateSettings;
  gestureMappings: GestureMappingItem[];
  calibration: CalibrationData;
}

// Detection states
export interface DetectionState {
  isFaceDetected: boolean;
  isHandDetected: boolean;
  leftEyeOpen: boolean;
  rightEyeOpen: boolean;
  isMouthOpen: boolean;
  headX: number; // -1 to 1 (left to right)
  headY: number; // -1 to 1 (up to down)
  headTilt: number;
  currentGesture: GestureType | null;
  fingerCount: number;
}

// Cursor state
export interface CursorState {
  x: number;
  y: number;
  isClicking: boolean;
  isDragging: boolean;
  isDwelling: boolean;
  dwellProgress: number;
}

// Comprehensive settings
export interface AccessMateSettings {
  // Cursor settings
  cursorSpeed: number;
  cursorSmoothing: number;
  cursorSize: number;
  cursorMode: CursorMode;

  // Click settings
  clickMode: ClickMode;
  dwellTime: number;
  dwellClickEnabled: boolean;

  // Detection thresholds
  winkThreshold: number;
  mouthThreshold: number;
  deadZone: number;

  // Gesture settings
  gesturesEnabled: boolean;
  gestureHoldTime: number;

  // Audio settings
  soundEnabled: boolean;
  soundVolume: number;
  voiceFeedbackEnabled: boolean;
  voiceRate: number;
  voicePitch: number;

  // Display settings
  highContrast: boolean;
  reduceMotion: boolean;
  showCameraPreview: boolean;
  showDebugOverlay: boolean;
  showGestureHints: boolean;

  // Accessibility
  edgeScrolling: boolean;

  // Fatigue & breaks
  breakRemindersEnabled: boolean;
  breakInterval: number; // minutes
  fatigueDetectionEnabled: boolean;
}

// App state
export interface AccessMateState {
  // App status
  isActive: boolean;
  isPaused: boolean;
  isCalibrating: boolean;
  showKeyboard: boolean;
  showQuickActions: boolean;
  showSettings: boolean;

  // Camera
  isCameraActive: boolean;
  isCameraLoading: boolean;
  cameraError: string | null;

  // Detection
  detection: DetectionState;

  // Cursor
  cursor: CursorState;

  // Settings
  settings: AccessMateSettings;

  // Gesture mappings
  gestureMappings: GestureMappingItem[];

  // Calibration
  calibration: CalibrationData;

  // User profiles
  profiles: UserProfile[];
  activeProfileId: string;

  // Statistics
  stats: {
    sessionStartTime: number | null;
    clickCount: number;
    gestureCount: number;
    totalUsageTime: number;
    lastBreakTime: number | null;
  };

  // Actions
  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setCalibrating: (calibrating: boolean) => void;
  setShowKeyboard: (show: boolean) => void;
  setShowQuickActions: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;

  setCameraActive: (active: boolean) => void;
  setCameraLoading: (loading: boolean) => void;
  setCameraError: (error: string | null) => void;

  updateDetection: (detection: Partial<DetectionState>) => void;
  updateCursor: (cursor: Partial<CursorState>) => void;

  updateSettings: (settings: Partial<AccessMateSettings>) => void;
  resetSettings: () => void;

  saveCalibration: (calibration: CalibrationData) => void;

  // Gesture mapping actions
  updateGestureMapping: (gesture: GestureType, action: string, enabled?: boolean) => void;

  // Profile actions
  createProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;

  // Stats actions
  incrementClickCount: () => void;
  incrementGestureCount: () => void;
  startSession: () => void;
  endSession: () => void;
  recordBreak: () => void;
}

const defaultGestureMappings: GestureMappingItem[] = [
  { gesture: 'fist', action: 'escape', enabled: true },
  { gesture: 'openPalm', action: 'pause', enabled: true },
  { gesture: 'thumbsUp', action: 'enter', enabled: true },
  { gesture: 'thumbsDown', action: 'back', enabled: true },
  { gesture: 'peaceSign', action: 'doubleClick', enabled: true },
  { gesture: 'pointUp', action: 'scroll', enabled: true },
  { gesture: 'rockSign', action: 'rightClick', enabled: true },
  { gesture: 'callMe', action: 'keyboard', enabled: true },
  { gesture: 'ok', action: 'quickActions', enabled: true },
];

const defaultCalibration: CalibrationData = {
  centerX: 0.5,
  centerY: 0.5,
  rangeX: 0.3,
  rangeY: 0.2,
  isCalibrated: false,
};

const defaultSettings: AccessMateSettings = {
  // Cursor
  cursorSpeed: 1.5,
  cursorSmoothing: 0.7,
  cursorSize: 40,
  cursorMode: 'head',

  // Click
  clickMode: 'wink',
  dwellTime: 1000,
  dwellClickEnabled: true,

  // Detection
  winkThreshold: 0.25,
  mouthThreshold: 0.5,
  deadZone: 0.05,

  // Gestures
  gesturesEnabled: true,
  gestureHoldTime: 500,

  // Audio
  soundEnabled: true,
  soundVolume: 0.5,
  voiceFeedbackEnabled: false,
  voiceRate: 1.0,
  voicePitch: 1.0,

  // Display
  highContrast: false,
  reduceMotion: false,
  showCameraPreview: true,
  showDebugOverlay: false,
  showGestureHints: true,

  // Accessibility
  edgeScrolling: true,

  // Fatigue
  breakRemindersEnabled: true,
  breakInterval: 30,
  fatigueDetectionEnabled: true,
};

const defaultDetection: DetectionState = {
  isFaceDetected: false,
  isHandDetected: false,
  leftEyeOpen: true,
  rightEyeOpen: true,
  isMouthOpen: false,
  headX: 0,
  headY: 0,
  headTilt: 0,
  currentGesture: null,
  fingerCount: 0,
};

const defaultCursor: CursorState = {
  x: 0.5,
  y: 0.5,
  isClicking: false,
  isDragging: false,
  isDwelling: false,
  dwellProgress: 0,
};

export const useAccessMateStore = create<AccessMateState>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      isPaused: false,
      isCalibrating: false,
      showKeyboard: false,
      showQuickActions: false,
      showSettings: false,

      isCameraActive: false,
      isCameraLoading: false,
      cameraError: null,

      detection: defaultDetection,
      cursor: defaultCursor,
      settings: defaultSettings,
      gestureMappings: defaultGestureMappings,
      calibration: defaultCalibration,

      profiles: [],
      activeProfileId: 'default',

      stats: {
        sessionStartTime: null,
        clickCount: 0,
        gestureCount: 0,
        totalUsageTime: 0,
        lastBreakTime: null,
      },

      // Actions
      setActive: (active) => set({ isActive: active }),
      setPaused: (paused) => set({ isPaused: paused }),
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      setCalibrating: (calibrating) => set({ isCalibrating: calibrating }),
      setShowKeyboard: (show) => set({ showKeyboard: show }),
      setShowQuickActions: (show) => set({ showQuickActions: show }),
      setShowSettings: (show) => set({ showSettings: show }),

      setCameraActive: (active) => set({ isCameraActive: active }),
      setCameraLoading: (loading) => set({ isCameraLoading: loading }),
      setCameraError: (error) => set({ cameraError: error }),

      updateDetection: (detection) =>
        set((state) => ({
          detection: { ...state.detection, ...detection },
        })),

      updateCursor: (cursor) =>
        set((state) => ({
          cursor: { ...state.cursor, ...cursor },
        })),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () => set({ settings: defaultSettings }),

      saveCalibration: (calibration) => set({ calibration }),

      updateGestureMapping: (gesture, action, enabled) =>
        set((state) => ({
          gestureMappings: state.gestureMappings.map((mapping) =>
            mapping.gesture === gesture
              ? { ...mapping, action, enabled: enabled ?? mapping.enabled }
              : mapping
          ),
        })),

      createProfile: (name) => {
        const state = get();
        const newProfile: UserProfile = {
          id: `profile-${Date.now()}`,
          name,
          createdAt: Date.now(),
          settings: { ...state.settings },
          gestureMappings: [...state.gestureMappings],
          calibration: { ...state.calibration },
        };
        set((state) => ({
          profiles: [...state.profiles, newProfile],
          activeProfileId: newProfile.id,
        }));
      },

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId:
            state.activeProfileId === id ? 'default' : state.activeProfileId,
        })),

      setActiveProfile: (id) => {
        const state = get();
        const profile = state.profiles.find((p) => p.id === id);
        if (profile) {
          set({
            activeProfileId: id,
            settings: profile.settings,
            gestureMappings: profile.gestureMappings,
            calibration: profile.calibration,
          });
        } else {
          set({
            activeProfileId: 'default',
            settings: defaultSettings,
            gestureMappings: defaultGestureMappings,
            calibration: defaultCalibration,
          });
        }
      },

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      incrementClickCount: () =>
        set((state) => ({
          stats: { ...state.stats, clickCount: state.stats.clickCount + 1 },
        })),

      incrementGestureCount: () =>
        set((state) => ({
          stats: { ...state.stats, gestureCount: state.stats.gestureCount + 1 },
        })),

      startSession: () =>
        set((state) => ({
          stats: { ...state.stats, sessionStartTime: Date.now() },
        })),

      endSession: () => {
        const state = get();
        if (state.stats.sessionStartTime) {
          const sessionDuration = Date.now() - state.stats.sessionStartTime;
          set({
            stats: {
              ...state.stats,
              sessionStartTime: null,
              totalUsageTime: state.stats.totalUsageTime + sessionDuration,
            },
          });
        }
      },

      recordBreak: () =>
        set((state) => ({
          stats: { ...state.stats, lastBreakTime: Date.now() },
        })),
    }),
    {
      name: 'accessmate-storage',
      partialize: (state) => ({
        settings: state.settings,
        gestureMappings: state.gestureMappings,
        calibration: state.calibration,
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        stats: {
          totalUsageTime: state.stats.totalUsageTime,
          clickCount: state.stats.clickCount,
          gestureCount: state.stats.gestureCount,
        },
      }),
    }
  )
);
