import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { GlassCard, GlassButton } from './ui/GlassCard';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onResetMetrics: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onStartCamera,
  onStopCamera,
  onResetMetrics,
}: SidebarProps) {
  const {
    isCameraActive,
    isCameraLoading,
    settings,
    updateSettings,
    facialAttributes,
    earValue,
    sleepScore,
  } = useAppStore();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-24 bottom-0 w-72 z-40 overflow-y-auto transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Camera Controls */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-medium text-white/70 mb-4">Camera Controls</h3>
            <div className="space-y-3">
              {!isCameraActive ? (
                <GlassButton
                  variant="primary"
                  className="w-full"
                  onClick={onStartCamera}
                  disabled={isCameraLoading}
                >
                  {isCameraLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        ⟳
                      </motion.span>
                      Loading...
                    </span>
                  ) : (
                    'Start Camera'
                  )}
                </GlassButton>
              ) : (
                <GlassButton
                  variant="danger"
                  className="w-full"
                  onClick={onStopCamera}
                >
                  Stop Camera
                </GlassButton>
              )}

              <GlassButton
                variant="warning"
                className="w-full"
                onClick={onResetMetrics}
              >
                Reset Metrics
              </GlassButton>
            </div>
          </GlassCard>

          {/* Display Settings */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-medium text-white/70 mb-4">Display Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-white/80">3D Background</span>
                <input
                  type="checkbox"
                  checked={settings.enable3DBackground}
                  onChange={(e) =>
                    updateSettings({ enable3DBackground: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-primary-500 focus:ring-primary-500/20"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-white/80">Show Face Mesh</span>
                <input
                  type="checkbox"
                  checked={settings.showFaceMesh}
                  onChange={(e) =>
                    updateSettings({ showFaceMesh: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-primary-500 focus:ring-primary-500/20"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-white/80">Show Hand Landmarks</span>
                <input
                  type="checkbox"
                  checked={settings.showHandLandmarks}
                  onChange={(e) =>
                    updateSettings({ showHandLandmarks: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-primary-500 focus:ring-primary-500/20"
                />
              </label>

              <div>
                <label className="text-sm text-white/80 block mb-2">
                  Detection Sensitivity: {Math.round(settings.detectionSensitivity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.1"
                  value={settings.detectionSensitivity}
                  onChange={(e) =>
                    updateSettings({ detectionSensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                />
              </div>
            </div>
          </GlassCard>

          {/* Real-time Metrics */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-medium text-white/70 mb-4">Real-time Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/60">Eye Aspect Ratio</span>
                <span className="text-sm font-mono text-primary-400">
                  {earValue.toFixed(3)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-purple-500"
                  animate={{ width: `${Math.min(earValue * 200, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-white/60">Sleep Score</span>
                <span className="text-sm font-mono text-yellow-400">{sleepScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${sleepScore > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                  animate={{ width: `${sleepScore}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </GlassCard>

          {/* Facial Attributes */}
          <GlassCard hover={false}>
            <h3 className="text-sm font-medium text-white/70 mb-4">Facial Attributes</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: facialAttributes.skinColor }}
                />
                <div>
                  <span className="text-xs text-white/50">Skin Tone</span>
                  <p className="text-sm text-white">{facialAttributes.skinColorName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: facialAttributes.hairColor }}
                />
                <div>
                  <span className="text-xs text-white/50">Hair Color</span>
                  <p className="text-sm text-white">{facialAttributes.hairColorName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: facialAttributes.eyeColor }}
                />
                <div>
                  <span className="text-xs text-white/50">Eye Color</span>
                  <p className="text-sm text-white">{facialAttributes.eyeColorName}</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </aside>
    </>
  );
}
