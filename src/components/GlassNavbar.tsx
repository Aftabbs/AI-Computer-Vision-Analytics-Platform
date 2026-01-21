import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { StatusBadge } from './ui/GlassCard';

interface GlassNavbarProps {
  onToggleSidebar: () => void;
}

export function GlassNavbar({ onToggleSidebar }: GlassNavbarProps) {
  const { isFaceDetected, isHandDetected, isCameraActive, blinkCount, sleepDuration } =
    useAppStore();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-4 mt-4">
        <div className="glass-panel px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors lg:hidden"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">AI Vision Lab</h1>
                  <p className="text-xs text-white/50">Computer Vision Analytics</p>
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="hidden md:flex items-center gap-4">
              <StatusBadge
                status={isCameraActive ? 'success' : 'error'}
                pulse={isCameraActive}
              >
                {isCameraActive ? 'Camera Active' : 'Camera Off'}
              </StatusBadge>

              <StatusBadge
                status={isFaceDetected ? 'success' : 'warning'}
                pulse={isFaceDetected}
              >
                {isFaceDetected ? 'Face Detected' : 'No Face'}
              </StatusBadge>

              <StatusBadge
                status={isHandDetected ? 'info' : 'warning'}
                pulse={isHandDetected}
              >
                {isHandDetected ? 'Hand Detected' : 'No Hand'}
              </StatusBadge>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👁️</span>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50">Blinks</span>
                  <span className="text-lg font-bold text-white">{blinkCount}</span>
                </div>
              </div>

              <div className="w-px h-8 bg-white/10" />

              <div className="flex items-center gap-2">
                <span className="text-2xl">😴</span>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50">Sleep Time</span>
                  <span className="text-lg font-bold text-white">
                    {formatDuration(sleepDuration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
