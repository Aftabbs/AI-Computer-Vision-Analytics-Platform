import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassButton } from './ui/GlassCard';
import { audioFeedback } from '../utils/audioFeedback';
import type { CalibrationData } from '../utils/headTracking';

interface CalibrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrate: () => CalibrationData | null;
  onComplete: (calibration: CalibrationData) => void;
  isFaceDetected: boolean;
  soundEnabled?: boolean;
}

type CalibrationStep = 'intro' | 'center' | 'testing' | 'complete';

export function CalibrationWizard({
  isOpen,
  onClose,
  onCalibrate,
  onComplete,
  isFaceDetected,
  soundEnabled = true,
}: CalibrationWizardProps) {
  const [step, setStep] = useState<CalibrationStep>('intro');
  const [countdown, setCountdown] = useState(3);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);
  const [testPhase, setTestPhase] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [testsPassed, setTestsPassed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('intro');
      setCountdown(3);
      setCalibrationData(null);
      setTestPhase(null);
      setTestsPassed(0);
    } else if (soundEnabled) {
      audioFeedback.calibrationStart();
    }
  }, [isOpen, soundEnabled]);

  // Countdown timer for center calibration
  useEffect(() => {
    if (step === 'center' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 'center' && countdown === 0) {
      const data = onCalibrate();
      if (data) {
        setCalibrationData(data);
        setStep('testing');
        setTestPhase('up');
      }
    }
  }, [step, countdown, onCalibrate]);

  const handleTestComplete = useCallback(() => {
    const phases: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
    const currentIndex = phases.indexOf(testPhase!);

    if (currentIndex < phases.length - 1) {
      setTestPhase(phases[currentIndex + 1]);
      setTestsPassed(testsPassed + 1);
      if (soundEnabled) audioFeedback.success();
    } else {
      setStep('complete');
      if (soundEnabled) audioFeedback.calibrationComplete();
    }
  }, [testPhase, testsPassed, soundEnabled]);

  const handleComplete = useCallback(() => {
    if (calibrationData) {
      onComplete(calibrationData);
    }
    onClose();
  }, [calibrationData, onComplete, onClose]);

  const steps = {
    intro: {
      title: 'Welcome to Calibration',
      description: 'This wizard will help you set up head tracking for optimal accuracy.',
      icon: '🎯',
    },
    center: {
      title: 'Look at the Center',
      description: 'Keep your head in a comfortable neutral position and look at the center circle.',
      icon: '👀',
    },
    testing: {
      title: 'Test Your Range',
      description: `Move your head ${testPhase?.toUpperCase()} while looking at the screen.`,
      icon: testPhase === 'up' ? '⬆️' : testPhase === 'down' ? '⬇️' : testPhase === 'left' ? '⬅️' : '➡️',
    },
    complete: {
      title: 'Calibration Complete!',
      description: 'Your head tracking is now calibrated. You can recalibrate anytime from settings.',
      icon: '✅',
    },
  };

  const currentStep = steps[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg"
          >
            <GlassCard className="p-8" hover={false}>
              {/* Progress indicator */}
              <div className="flex justify-center gap-2 mb-8">
                {['intro', 'center', 'testing', 'complete'].map((s, i) => (
                  <div
                    key={s}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      step === s
                        ? 'bg-primary-500'
                        : ['intro', 'center', 'testing', 'complete'].indexOf(step) > i
                        ? 'bg-green-500'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Step content */}
              <div className="text-center">
                <motion.div
                  key={step}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-6"
                >
                  <span className="text-6xl block">{currentStep.icon}</span>
                  <h2 className="text-2xl font-bold text-white">{currentStep.title}</h2>
                  <p className="text-white/60">{currentStep.description}</p>

                  {/* Face detection status */}
                  {step !== 'complete' && (
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                        isFaceDetected
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isFaceDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}
                      />
                      {isFaceDetected ? 'Face Detected' : 'No Face Detected'}
                    </div>
                  )}

                  {/* Step-specific content */}
                  {step === 'center' && (
                    <div className="relative w-32 h-32 mx-auto">
                      {/* Countdown circle */}
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="8"
                        />
                        <motion.circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="8"
                          strokeLinecap="round"
                          initial={{ pathLength: 1 }}
                          animate={{ pathLength: countdown / 3 }}
                          transition={{ duration: 1 }}
                          style={{ pathLength: countdown / 3 }}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                        {countdown}
                      </span>
                    </div>
                  )}

                  {step === 'testing' && (
                    <div className="space-y-4">
                      <div className="flex justify-center gap-4">
                        {['up', 'down', 'left', 'right'].map((dir, i) => (
                          <div
                            key={dir}
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              testPhase === dir
                                ? 'bg-primary-500/40 border-primary-400'
                                : i < testsPassed
                                ? 'bg-green-500/40 border-green-400'
                                : 'bg-white/10 border-white/20'
                            } border`}
                          >
                            {dir === 'up' && '⬆️'}
                            {dir === 'down' && '⬇️'}
                            {dir === 'left' && '⬅️'}
                            {dir === 'right' && '➡️'}
                          </div>
                        ))}
                      </div>
                      <GlassButton variant="success" onClick={handleTestComplete}>
                        Confirm {testPhase?.toUpperCase()} position
                      </GlassButton>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex justify-center gap-4">
                {step === 'intro' && (
                  <>
                    <GlassButton variant="default" onClick={onClose}>
                      Cancel
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      onClick={() => {
                        setStep('center');
                        setCountdown(3);
                      }}
                      disabled={!isFaceDetected}
                    >
                      Start Calibration
                    </GlassButton>
                  </>
                )}

                {step === 'complete' && (
                  <GlassButton variant="success" onClick={handleComplete}>
                    Done
                  </GlassButton>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
