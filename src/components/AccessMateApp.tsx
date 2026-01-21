import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaceMesh, type Results as FaceResults } from '@mediapipe/face_mesh';
import { Hands, type Results as HandsResults } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { ThreeJSBackground } from './ThreeJSBackground';
import { GlassCard, GlassButton, StatusBadge } from './ui/GlassCard';
import { VirtualKeyboard } from './VirtualKeyboard';
import { QuickActionsWheel } from './QuickActionsWheel';
import { CalibrationWizard } from './CalibrationWizard';
import { AccessibilitySettings } from './AccessibilitySettings';
import { BreakReminder, BreakIndicator } from './BreakReminder';
import { useAccessMateStore } from '../store/useAccessMateStore';
import { HeadTracker } from '../utils/headTracking';
import { EyeGestureDetector, MouthGestureDetector } from '../utils/faceGestures';
import { GestureRecognizer, getGestureEmoji, getGestureDescription } from '../utils/gestureCommands';
import { audioFeedback, voiceFeedback } from '../utils/audioFeedback';
import { fatigueDetector, type FatigueState } from '../utils/fatigueDetection';
import type { Landmark } from '../utils/blinkDetection';
import type { HandLandmark } from '../utils/fingerCounting';

export function AccessMateApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  // Tracking utilities
  const headTrackerRef = useRef(new HeadTracker());
  const eyeDetectorRef = useRef(new EyeGestureDetector());
  const mouthDetectorRef = useRef(new MouthGestureDetector());
  const gestureRecognizerRef = useRef(new GestureRecognizer());

  // Store latest landmarks for calibration
  const latestFaceLandmarksRef = useRef<Landmark[] | null>(null);

  const [showCalibration, setShowCalibration] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [fatigueState, setFatigueState] = useState<FatigueState>({
    level: 'fresh',
    score: 0,
    shouldTakeBreak: false,
    timeUntilBreak: 30 * 60 * 1000,
  });

  // Get store state and actions
  const store = useAccessMateStore();

  // Use refs to always have latest store values in callbacks
  const storeRef = useRef(store);
  storeRef.current = store;

  // Handle face detection results
  const handleFaceResults = useCallback((results: FaceResults) => {
    const {
      isActive,
      isPaused,
      settings,
      cursor,
      updateDetection,
      updateCursor,
      incrementClickCount,
    } = storeRef.current;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0] as Landmark[];

      // Store latest landmarks for calibration
      latestFaceLandmarksRef.current = landmarks;

      // Head tracking
      const headPos = headTrackerRef.current.track(landmarks);

      // Eye detection
      const eyeState = eyeDetectorRef.current.detect(landmarks);

      // Mouth detection
      const mouthState = mouthDetectorRef.current.detect(landmarks);

      // Update detection state
      updateDetection({
        isFaceDetected: true,
        headX: headPos.x,
        headY: headPos.y,
        headTilt: headPos.tilt,
        leftEyeOpen: eyeState.leftOpen,
        rightEyeOpen: eyeState.rightOpen,
        isMouthOpen: mouthState.isOpen,
      });

      // Handle cursor movement if active and not paused
      if (isActive && !isPaused && settings.cursorMode === 'head') {
        const newX = (headPos.x + 1) / 2; // Convert -1..1 to 0..1
        const newY = (headPos.y + 1) / 2;

        updateCursor({
          x: newX,
          y: newY,
        });
      }

      // Handle eye wink clicks
      if (isActive && !isPaused && settings.clickMode === 'wink') {
        const wink = eyeDetectorRef.current.detectIntentionalWink(landmarks);
        if (wink === 'left') {
          if (settings.soundEnabled) audioFeedback.click();
          incrementClickCount();
          updateCursor({ isClicking: true });
          setTimeout(() => storeRef.current.updateCursor({ isClicking: false }), 100);
        } else if (wink === 'right') {
          if (settings.soundEnabled) audioFeedback.rightClick();
          incrementClickCount();
        }
      }

      // Handle mouth open for drag
      if (mouthState.isOpen && !cursor.isDragging) {
        if (settings.soundEnabled) audioFeedback.dragStart();
        updateCursor({ isDragging: true });
      } else if (!mouthState.isOpen && cursor.isDragging) {
        if (settings.soundEnabled) audioFeedback.dragEnd();
        updateCursor({ isDragging: false });
      }

      // Process fatigue detection if enabled
      if (settings.fatigueDetectionEnabled) {
        fatigueDetector.processEyeState(eyeState.leftOpen, eyeState.rightOpen);
        fatigueDetector.processMouthState(mouthState.isOpen, mouthState.openRatio);
        fatigueDetector.processHeadPosition(headPos.y);
      }
    } else {
      storeRef.current.updateDetection({ isFaceDetected: false });
      latestFaceLandmarksRef.current = null;
    }
  }, []);

  // Handle hand detection results
  const handleHandResults = useCallback((results: HandsResults) => {
    const {
      isActive,
      isPaused,
      settings,
      showKeyboard,
      showQuickActions,
      updateDetection,
      togglePause,
      setShowKeyboard,
      setShowQuickActions,
      incrementGestureCount,
    } = storeRef.current;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0] as HandLandmark[];
      const isRightHand = results.multiHandedness?.[0]?.label === 'Right';

      // Recognize gesture
      const gestureResult = gestureRecognizerRef.current.recognize(landmarks, isRightHand);

      updateDetection({
        isHandDetected: true,
        currentGesture: gestureResult.gesture,
        fingerCount: gestureResult.fingerCount,
      });

      // Handle gesture commands if enabled
      if (isActive && !isPaused && settings.gesturesEnabled) {
        const heldGesture = gestureRecognizerRef.current.detectHeldGesture(landmarks, isRightHand);

        if (heldGesture) {
          if (settings.soundEnabled) audioFeedback.gestureDetected();
          incrementGestureCount();

          // Execute gesture action
          switch (heldGesture) {
            case 'openPalm':
              togglePause();
              break;
            case 'callMe':
              setShowKeyboard(!showKeyboard);
              break;
            case 'rockSign':
              setShowQuickActions(!showQuickActions);
              break;
            case 'fist':
              // Cancel / Escape
              setShowKeyboard(false);
              setShowQuickActions(false);
              break;
          }
        }
      }
    } else {
      updateDetection({
        isHandDetected: false,
        currentGesture: null,
        fingerCount: 0,
      });
    }
  }, []);

  // Initialize camera and MediaPipe
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return;

    storeRef.current.setCameraLoading(true);

    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(handleFaceResults);
      faceMeshRef.current = faceMesh;

      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(handleHandResults);
      handsRef.current = hands;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && faceMeshRef.current && handsRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      cameraRef.current = camera;
      await camera.start();

      storeRef.current.setCameraActive(true);
      storeRef.current.setCameraLoading(false);
      storeRef.current.startSession();

      if (storeRef.current.settings.soundEnabled) audioFeedback.success();
    } catch (err) {
      console.error('Camera initialization error:', err);
      storeRef.current.setCameraError(err instanceof Error ? err.message : 'Failed to initialize camera');
      storeRef.current.setCameraLoading(false);
    }
  }, [handleFaceResults, handleHandResults]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    if (handsRef.current) {
      handsRef.current.close();
      handsRef.current = null;
    }
    storeRef.current.setCameraActive(false);
    storeRef.current.setActive(false);
    storeRef.current.endSession();
  }, []);

  // Handle calibration - now uses stored landmarks
  const handleCalibrate = useCallback(() => {
    if (!latestFaceLandmarksRef.current) return null;
    const calibration = headTrackerRef.current.calibrate(latestFaceLandmarksRef.current);
    return calibration;
  }, []);

  // Handle keyboard input
  const handleKeyPress = useCallback((key: string) => {
    // For now, just log the key press - in a real app, this would interact with the OS
    console.log('Key pressed:', key);
    if (storeRef.current.settings.soundEnabled) {
      audioFeedback.keyPress();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Update audio settings
  useEffect(() => {
    audioFeedback.setEnabled(store.settings.soundEnabled);
    audioFeedback.setVolume(store.settings.soundVolume);
    voiceFeedback.setEnabled(store.settings.voiceFeedbackEnabled);
    voiceFeedback.setRate(store.settings.voiceRate);
    voiceFeedback.setPitch(store.settings.voicePitch);
  }, [store.settings.soundEnabled, store.settings.soundVolume, store.settings.voiceFeedbackEnabled, store.settings.voiceRate, store.settings.voicePitch]);

  // Initialize fatigue detector when session starts
  useEffect(() => {
    if (store.isCameraActive) {
      fatigueDetector.setBreakInterval(store.settings.breakInterval);
      fatigueDetector.startSession();
    } else {
      fatigueDetector.endSession();
    }
  }, [store.isCameraActive, store.settings.breakInterval]);

  // Monitor fatigue state
  useEffect(() => {
    if (!store.isCameraActive || !store.settings.fatigueDetectionEnabled) return;

    const interval = setInterval(() => {
      const state = fatigueDetector.getFatigueState();
      setFatigueState(state);

      // Show break reminder if needed and reminders are enabled
      if (state.shouldTakeBreak && store.settings.breakRemindersEnabled && !showBreakReminder) {
        setShowBreakReminder(true);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [store.isCameraActive, store.settings.fatigueDetectionEnabled, store.settings.breakRemindersEnabled, showBreakReminder]);

  // Handle break
  const handleTakeBreak = useCallback(() => {
    fatigueDetector.recordBreak();
    storeRef.current.recordBreak();
    setShowBreakReminder(false);
  }, []);

  // Destructure for rendering
  const {
    isActive,
    isPaused,
    isCameraActive,
    isCameraLoading,
    showKeyboard,
    showQuickActions,
    detection,
    cursor,
    settings,
    stats,
    setActive,
    togglePause,
    setShowKeyboard,
    setShowQuickActions,
    saveCalibration,
  } = store;

  return (
    <div className={`min-h-screen ${settings.highContrast ? 'high-contrast' : ''}`}>
      {/* Background */}
      <ThreeJSBackground enabled={!settings.highContrast && !settings.reduceMotion} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-4">
        <GlassCard className="p-4" hover={false}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">♿</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AccessMate</h1>
                <p className="text-xs text-white/60">Hands-Free Computer Control</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Break indicator */}
              {isCameraActive && settings.breakRemindersEnabled && (
                <BreakIndicator
                  timeUntilBreak={fatigueState.timeUntilBreak}
                  fatigueLevel={fatigueState.level}
                  onClick={() => setShowBreakReminder(true)}
                />
              )}
              <StatusBadge status={detection.isFaceDetected ? 'success' : 'error'} pulse={detection.isFaceDetected}>
                {detection.isFaceDetected ? 'Face OK' : 'No Face'}
              </StatusBadge>
              <StatusBadge status={detection.isHandDetected ? 'info' : 'warning'} pulse={detection.isHandDetected}>
                {detection.isHandDetected ? `${detection.fingerCount} Fingers` : 'No Hand'}
              </StatusBadge>
              {isPaused && (
                <StatusBadge status="warning">PAUSED</StatusBadge>
              )}
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                ⚙️
              </button>
            </div>
          </div>
        </GlassCard>
      </header>

      {/* Main content */}
      <main className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <GlassCard className="p-0 overflow-hidden" hover={false}>
              <div className="relative aspect-video bg-black/50">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
                />

                {/* Cursor indicator overlay */}
                {isActive && !isPaused && detection.isFaceDetected && (
                  <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                    style={{ width: settings.cursorSize, height: settings.cursorSize }}
                    animate={{
                      left: `${cursor.x * 100}%`,
                      top: `${cursor.y * 100}%`,
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  >
                    <div
                      className={`w-full h-full rounded-full border-4 ${
                        cursor.isClicking
                          ? 'bg-green-500/50 border-green-400'
                          : cursor.isDragging
                          ? 'bg-yellow-500/50 border-yellow-400'
                          : 'bg-primary-500/30 border-primary-400'
                      }`}
                    />
                    {/* Dwell progress ring */}
                    {cursor.isDwelling && cursor.dwellProgress > 0 && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth="4"
                          strokeDasharray={`${cursor.dwellProgress * 283} 283`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </motion.div>
                )}

                {/* Status overlay */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center">
                      <span className="text-6xl block mb-4">📷</span>
                      <p className="text-white/80">Camera not active</p>
                      <p className="text-white/50 text-sm">Click "Start Camera" to begin</p>
                    </div>
                  </div>
                )}

                {/* Loading overlay */}
                {isCameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-white/80">Starting camera...</p>
                      <p className="text-white/50 text-sm">Loading face and hand detection models</p>
                    </div>
                  </div>
                )}

                {/* Gesture indicator */}
                {detection.currentGesture && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute bottom-4 right-4"
                  >
                    <GlassCard className="px-4 py-2" hover={false}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getGestureEmoji(detection.currentGesture)}</span>
                        <span className="text-sm text-white/80">
                          {getGestureDescription(detection.currentGesture)}
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Main Controls */}
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
              <div className="space-y-3">
                {!isCameraActive ? (
                  <GlassButton
                    variant="primary"
                    className="w-full"
                    onClick={initializeCamera}
                    disabled={isCameraLoading}
                  >
                    {isCameraLoading ? 'Starting...' : '📷 Start Camera'}
                  </GlassButton>
                ) : (
                  <>
                    <GlassButton
                      variant={isActive ? 'success' : 'primary'}
                      className="w-full"
                      onClick={() => setActive(!isActive)}
                    >
                      {isActive ? '✓ Control Active' : '▶ Enable Control'}
                    </GlassButton>
                    <GlassButton
                      variant={isPaused ? 'warning' : 'default'}
                      className="w-full"
                      onClick={togglePause}
                      disabled={!isActive}
                    >
                      {isPaused ? '▶ Resume' : '⏸ Pause'}
                    </GlassButton>
                    <GlassButton
                      variant="default"
                      className="w-full"
                      onClick={() => setShowCalibration(true)}
                      disabled={!detection.isFaceDetected}
                    >
                      🎯 Calibrate
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      className="w-full"
                      onClick={stopCamera}
                    >
                      ⏹ Stop Camera
                    </GlassButton>
                  </>
                )}
              </div>
            </GlassCard>

            {/* Quick Access */}
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Access</h3>
              <div className="grid grid-cols-2 gap-2">
                <GlassButton
                  variant="default"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                >
                  ⌨️ Keyboard
                </GlassButton>
                <GlassButton
                  variant="default"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                >
                  ⚡ Actions
                </GlassButton>
              </div>
            </GlassCard>

            {/* Detection Status */}
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-white mb-4">Detection Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Left Eye</span>
                  <span className={detection.leftEyeOpen ? 'text-green-400' : 'text-red-400'}>
                    {detection.leftEyeOpen ? '👁️ Open' : '😑 Closed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Right Eye</span>
                  <span className={detection.rightEyeOpen ? 'text-green-400' : 'text-red-400'}>
                    {detection.rightEyeOpen ? '👁️ Open' : '😑 Closed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Mouth</span>
                  <span className={detection.isMouthOpen ? 'text-yellow-400' : 'text-white/40'}>
                    {detection.isMouthOpen ? '😮 Open (Drag)' : '😶 Closed'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Head Position</span>
                  <span className="text-white/80 font-mono text-sm">
                    X:{detection.headX.toFixed(2)} Y:{detection.headY.toFixed(2)}
                  </span>
                </div>
                {detection.currentGesture && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Gesture</span>
                    <span className="text-primary-400">
                      {getGestureEmoji(detection.currentGesture)} {detection.currentGesture}
                    </span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Session Stats */}
            <GlassCard hover={false}>
              <h3 className="text-lg font-semibold text-white mb-4">Session Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-3xl font-bold text-primary-400">{stats.clickCount}</p>
                  <p className="text-xs text-white/50">Clicks</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/5">
                  <p className="text-3xl font-bold text-primary-400">{stats.gestureCount}</p>
                  <p className="text-xs text-white/50">Gestures</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Gesture Guide */}
        <div className="max-w-7xl mx-auto mt-6">
          <GlassCard hover={false}>
            <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                { gesture: '🔄', label: 'Head Move', action: 'Move Cursor' },
                { gesture: '😉', label: 'Left Wink', action: 'Left Click' },
                { gesture: '😜', label: 'Right Wink', action: 'Right Click' },
                { gesture: '😮', label: 'Mouth Open', action: 'Drag Mode' },
                { gesture: '✊', label: 'Fist', action: 'Cancel' },
                { gesture: '🖐️', label: 'Open Palm', action: 'Pause' },
                { gesture: '🤙', label: 'Call Me', action: 'Keyboard' },
                { gesture: '🤘', label: 'Rock Sign', action: 'Quick Menu' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-3xl block mb-2">{item.gesture}</span>
                  <p className="text-sm text-white/80 font-medium">{item.label}</p>
                  <p className="text-xs text-primary-400">{item.action}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </main>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        isOpen={showKeyboard}
        onClose={() => setShowKeyboard(false)}
        onKeyPress={handleKeyPress}
        soundEnabled={settings.soundEnabled}
      />

      {/* Quick Actions Wheel */}
      <QuickActionsWheel
        isOpen={showQuickActions}
        onClose={() => setShowQuickActions(false)}
      />

      {/* Calibration Wizard */}
      <CalibrationWizard
        isOpen={showCalibration}
        onClose={() => setShowCalibration(false)}
        onCalibrate={handleCalibrate}
        onComplete={saveCalibration}
        isFaceDetected={detection.isFaceDetected}
        soundEnabled={settings.soundEnabled}
      />

      {/* Accessibility Settings */}
      <AccessibilitySettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Break Reminder */}
      <BreakReminder
        isVisible={showBreakReminder}
        fatigueState={fatigueState}
        onDismiss={() => setShowBreakReminder(false)}
        onTakeBreak={handleTakeBreak}
        soundEnabled={settings.soundEnabled}
      />
    </div>
  );
}
