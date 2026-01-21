import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassButton } from './ui/GlassCard';
import { audioFeedback } from '../utils/audioFeedback';
import type { FatigueState } from '../utils/fatigueDetection';

type FatigueLevel = FatigueState['level'];

interface BreakReminderProps {
  isVisible: boolean;
  fatigueState: FatigueState;
  onDismiss: () => void;
  onTakeBreak: () => void;
  soundEnabled?: boolean;
}

const FATIGUE_COLORS: Record<FatigueLevel, { bg: string; border: string; text: string }> = {
  fresh: { bg: 'from-green-500/20', border: 'border-green-400/50', text: 'text-green-400' },
  mild: { bg: 'from-yellow-500/20', border: 'border-yellow-400/50', text: 'text-yellow-400' },
  moderate: { bg: 'from-orange-500/20', border: 'border-orange-400/50', text: 'text-orange-400' },
  severe: { bg: 'from-red-500/20', border: 'border-red-400/50', text: 'text-red-400' },
};

const BREAK_SUGGESTIONS = [
  { icon: '👀', text: 'Look at something 20 feet away for 20 seconds (20-20-20 rule)' },
  { icon: '🚶', text: 'Stand up and take a short walk' },
  { icon: '💧', text: 'Drink some water to stay hydrated' },
  { icon: '🧘', text: 'Do some simple stretches' },
  { icon: '🌿', text: 'Look at something green to rest your eyes' },
];

export function BreakReminder({
  isVisible,
  fatigueState,
  onDismiss,
  onTakeBreak,
  soundEnabled = true,
}: BreakReminderProps) {
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [suggestion] = useState(() =>
    BREAK_SUGGESTIONS[Math.floor(Math.random() * BREAK_SUGGESTIONS.length)]
  );

  const colors = FATIGUE_COLORS[fatigueState.level];

  // Get suggested break duration based on fatigue level
  const getSuggestedBreakDuration = useCallback(() => {
    switch (fatigueState.level) {
      case 'severe': return 300; // 5 minutes
      case 'moderate': return 180; // 3 minutes
      case 'mild': return 60; // 1 minute
      default: return 60;
    }
  }, [fatigueState.level]);

  // Play reminder sound when modal appears
  useEffect(() => {
    if (isVisible && soundEnabled && !isOnBreak) {
      audioFeedback.breakReminder();
    }
  }, [isVisible, soundEnabled, isOnBreak]);

  // Break timer countdown
  useEffect(() => {
    if (isOnBreak && breakTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBreakTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsOnBreak(false);
            if (soundEnabled) audioFeedback.success();
            onTakeBreak();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOnBreak, breakTimeRemaining, onTakeBreak, soundEnabled]);

  const handleStartBreak = () => {
    setBreakTimeRemaining(getSuggestedBreakDuration());
    setIsOnBreak(true);
    if (soundEnabled) audioFeedback.pause();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessage = () => {
    switch (fatigueState.level) {
      case 'severe':
        return "High fatigue detected! It's important to take a longer break now.";
      case 'moderate':
        return "You've been working hard. Time for a refreshing break!";
      case 'mild':
        return 'A quick break will help you stay focused.';
      default:
        return "It's been a while. How about a short break?";
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md"
          >
            <GlassCard
              className={`p-6 bg-gradient-to-br ${colors.bg} to-transparent ${colors.border}`}
              hover={false}
            >
              {!isOnBreak ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-6xl mb-4"
                    >
                      {fatigueState.level === 'severe' ? '😴' :
                       fatigueState.level === 'moderate' ? '😮‍💨' :
                       fatigueState.level === 'mild' ? '😊' : '⏰'}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Time for a Break!</h2>
                    <p className={`${colors.text}`}>{getMessage()}</p>
                  </div>

                  {/* Fatigue meter */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Fatigue Level</span>
                      <span className={colors.text}>{fatigueState.level.charAt(0).toUpperCase() + fatigueState.level.slice(1)}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${fatigueState.score}%` }}
                        className={`h-full rounded-full ${
                          fatigueState.level === 'severe' ? 'bg-red-500' :
                          fatigueState.level === 'moderate' ? 'bg-orange-500' :
                          fatigueState.level === 'mild' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Suggestion */}
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{suggestion.icon}</span>
                      <p className="text-white/80 text-sm">{suggestion.text}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <GlassButton
                      variant="default"
                      onClick={onDismiss}
                      className="flex-1"
                    >
                      Skip this time
                    </GlassButton>
                    <GlassButton
                      variant="success"
                      onClick={handleStartBreak}
                      className="flex-1"
                    >
                      Start Break
                    </GlassButton>
                  </div>

                  {/* Suggested duration */}
                  <p className="text-center text-white/40 text-sm mt-4">
                    Suggested break: {formatTime(getSuggestedBreakDuration())}
                  </p>
                </>
              ) : (
                <>
                  {/* Break in progress */}
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-6xl mb-4"
                    >
                      🧘
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Break in Progress</h2>
                    <p className="text-white/60 mb-6">Relax and rest your eyes...</p>

                    {/* Timer */}
                    <div className="relative w-48 h-48 mx-auto mb-6">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="8"
                        />
                        <motion.circle
                          cx="96"
                          cy="96"
                          r="88"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={553}
                          strokeDashoffset={553 * (1 - breakTimeRemaining / getSuggestedBreakDuration())}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">
                          {formatTime(breakTimeRemaining)}
                        </span>
                      </div>
                    </div>

                    {/* Current suggestion */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 mb-6">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">{suggestion.icon}</span>
                        <p className="text-white/80 text-sm">{suggestion.text}</p>
                      </div>
                    </div>

                    <GlassButton
                      variant="default"
                      onClick={() => {
                        setIsOnBreak(false);
                        onTakeBreak();
                      }}
                    >
                      End Break Early
                    </GlassButton>
                  </div>
                </>
              )}
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mini break indicator for status bar
interface BreakIndicatorProps {
  timeUntilBreak: number; // ms
  fatigueLevel: FatigueState['level'];
  onClick: () => void;
}

export function BreakIndicator({ timeUntilBreak, fatigueLevel, onClick }: BreakIndicatorProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const colors = FATIGUE_COLORS[fatigueLevel];

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full
        ${colors.bg.replace('from-', 'bg-').replace('/20', '/30')}
        ${colors.border}
        border transition-all hover:scale-105
      `}
    >
      <span className="text-sm">
        {fatigueLevel === 'severe' ? '😴' :
         fatigueLevel === 'moderate' ? '😮‍💨' :
         fatigueLevel === 'mild' ? '😊' : '✨'}
      </span>
      <span className={`text-sm font-medium ${colors.text}`}>
        {timeUntilBreak > 0 ? formatTime(timeUntilBreak) : 'Break time!'}
      </span>
    </button>
  );
}
