import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { GlassCard } from './ui/GlassCard';
import { formatDuration } from '../lib/utils';

export function StatsDashboard() {
  const {
    blinkCount,
    sleepDuration,
    fingerCount,
    currentGesture,
    isFaceDetected,
    isHandDetected,
    isSleeping,
    facialAttributes,
    sessionStartTime,
  } = useAppStore();

  const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
  const blinksPerMinute = sessionDuration > 0
    ? Math.round((blinkCount / (sessionDuration / 60000)) * 10) / 10
    : 0;

  const stats = [
    {
      label: 'Total Blinks',
      value: blinkCount,
      icon: '👁️',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Blinks/Min',
      value: blinksPerMinute || '-',
      icon: '📊',
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Sleep Duration',
      value: formatDuration(sleepDuration),
      icon: '😴',
      color: 'from-yellow-500 to-orange-500',
      warning: sleepDuration > 5000,
    },
    {
      label: 'Fingers',
      value: fingerCount,
      icon: '✋',
      color: 'from-pink-500 to-rose-500',
    },
    {
      label: 'Gesture',
      value: currentGesture || '-',
      icon: '🤌',
      color: 'from-purple-500 to-violet-500',
    },
    {
      label: 'Session',
      value: formatDuration(sessionDuration),
      icon: '⏱️',
      color: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="p-4"
    >
      <GlassCard className="p-4" hover={false}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="relative"
            >
              <div
                className={`
                  p-4 rounded-xl border transition-all duration-300
                  ${stat.warning
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/50 truncate">{stat.label}</p>
                    <p
                      className={`
                        text-lg font-bold truncate
                        bg-gradient-to-r ${stat.color} bg-clip-text text-transparent
                      `}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detection Status Bar */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isFaceDetected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-white/60">
                  Face: {isFaceDetected ? 'Detected' : 'Not Found'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isHandDetected ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                />
                <span className="text-sm text-white/60">
                  Hand: {isHandDetected ? 'Detected' : 'Not Found'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSleeping ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                  }`}
                />
                <span className="text-sm text-white/60">
                  Status: {isSleeping ? 'Drowsy' : 'Alert'}
                </span>
              </div>
            </div>

            {/* Facial Attributes Mini Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: facialAttributes.skinColor }}
                />
                <span className="text-xs text-white/40">Skin</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: facialAttributes.hairColor }}
                />
                <span className="text-xs text-white/40">Hair</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: facialAttributes.eyeColor }}
                />
                <span className="text-xs text-white/40">Eyes</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
