import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard, GlassButton } from './ui/GlassCard';
import { useAccessMateStore } from '../store/useAccessMateStore';
import type { GestureType } from '../utils/gestureCommands';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const GESTURE_OPTIONS: { value: GestureType; label: string; icon: string }[] = [
  { value: 'fist', label: 'Fist', icon: '✊' },
  { value: 'openPalm', label: 'Open Palm', icon: '🖐️' },
  { value: 'thumbsUp', label: 'Thumbs Up', icon: '👍' },
  { value: 'thumbsDown', label: 'Thumbs Down', icon: '👎' },
  { value: 'peaceSign', label: 'Peace Sign', icon: '✌️' },
  { value: 'pointUp', label: 'Point Up', icon: '☝️' },
  { value: 'rockSign', label: 'Rock Sign', icon: '🤘' },
  { value: 'callMe', label: 'Call Me', icon: '🤙' },
  { value: 'ok', label: 'OK Sign', icon: '👌' },
];

const ACTION_OPTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'doubleClick', label: 'Double Click' },
  { value: 'rightClick', label: 'Right Click' },
  { value: 'scroll', label: 'Scroll Mode' },
  { value: 'drag', label: 'Drag Mode' },
  { value: 'keyboard', label: 'Open Keyboard' },
  { value: 'quickActions', label: 'Quick Actions' },
  { value: 'pause', label: 'Pause Control' },
  { value: 'escape', label: 'Escape' },
  { value: 'enter', label: 'Enter' },
  { value: 'back', label: 'Go Back' },
  { value: 'forward', label: 'Go Forward' },
];

type SettingsTab = 'cursor' | 'gestures' | 'audio' | 'display' | 'advanced';

export function AccessibilitySettings({ isOpen, onClose }: AccessibilitySettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('cursor');
  const {
    settings,
    updateSettings,
    gestureMappings,
    updateGestureMapping,
  } = useAccessMateStore();

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'cursor', label: 'Cursor', icon: '🖱️' },
    { id: 'gestures', label: 'Gestures', icon: '🤚' },
    { id: 'audio', label: 'Audio', icon: '🔊' },
    { id: 'display', label: 'Display', icon: '🖥️' },
    { id: 'advanced', label: 'Advanced', icon: '⚙️' },
  ];

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
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <GlassCard className="p-0" hover={false}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <span className="text-3xl">♿</span>
                  Accessibility Settings
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex h-[70vh]">
                {/* Sidebar tabs */}
                <div className="w-48 border-r border-white/10 p-4 space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full px-4 py-3 rounded-lg text-left flex items-center gap-3
                        transition-all duration-200
                        ${activeTab === tab.id
                          ? 'bg-primary-500/30 text-white border border-primary-400/50'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Content area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeTab === 'cursor' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Cursor Settings</h3>

                      {/* Cursor Speed */}
                      <div className="space-y-2">
                        <label className="text-white/80 flex items-center justify-between">
                          <span>Cursor Speed</span>
                          <span className="text-primary-400">{settings.cursorSpeed.toFixed(1)}x</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={settings.cursorSpeed}
                          onChange={(e) => updateSettings({ cursorSpeed: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-white/50">
                          <span>Slower</span>
                          <span>Faster</span>
                        </div>
                      </div>

                      {/* Cursor Smoothing */}
                      <div className="space-y-2">
                        <label className="text-white/80 flex items-center justify-between">
                          <span>Cursor Smoothing</span>
                          <span className="text-primary-400">{Math.round(settings.cursorSmoothing * 100)}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.cursorSmoothing}
                          onChange={(e) => updateSettings({ cursorSmoothing: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <p className="text-xs text-white/50">Higher smoothing reduces jitter but increases lag</p>
                      </div>

                      {/* Dwell Time */}
                      <div className="space-y-2">
                        <label className="text-white/80 flex items-center justify-between">
                          <span>Dwell Click Time</span>
                          <span className="text-primary-400">{settings.dwellTime}ms</span>
                        </label>
                        <input
                          type="range"
                          min="300"
                          max="2000"
                          step="100"
                          value={settings.dwellTime}
                          onChange={(e) => updateSettings({ dwellTime: parseInt(e.target.value) })}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <p className="text-xs text-white/50">Time to hover over an element before clicking</p>
                      </div>

                      {/* Toggle options */}
                      <div className="space-y-3 pt-4 border-t border-white/10">
                        <ToggleSetting
                          label="Enable Dwell Clicking"
                          description="Click by hovering over elements"
                          enabled={settings.dwellClickEnabled}
                          onChange={(v) => updateSettings({ dwellClickEnabled: v })}
                        />
                        <ToggleSetting
                          label="Edge Scrolling"
                          description="Scroll when cursor reaches screen edges"
                          enabled={settings.edgeScrolling}
                          onChange={(v) => updateSettings({ edgeScrolling: v })}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'gestures' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Gesture Mappings</h3>
                      <p className="text-white/60 text-sm mb-4">
                        Customize which actions are triggered by each hand gesture.
                      </p>

                      <div className="grid gap-4">
                        {gestureMappings.map((mapping) => {
                          const gestureInfo = GESTURE_OPTIONS.find(g => g.value === mapping.gesture);
                          return (
                            <div
                              key={mapping.gesture}
                              className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10"
                            >
                              <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-3xl">
                                {gestureInfo?.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{gestureInfo?.label}</h4>
                                <select
                                  value={mapping.action}
                                  onChange={(e) => updateGestureMapping(mapping.gesture, e.target.value)}
                                  className="mt-2 w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-400"
                                >
                                  {ACTION_OPTIONS.map((action) => (
                                    <option key={action.value} value={action.value} className="bg-gray-800">
                                      {action.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <ToggleSetting
                                label=""
                                description=""
                                enabled={mapping.enabled}
                                onChange={(v) => updateGestureMapping(mapping.gesture, mapping.action, v)}
                                compact
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-white font-medium mb-3">Gesture Settings</h4>
                        <div className="space-y-2">
                          <label className="text-white/80 flex items-center justify-between">
                            <span>Gesture Hold Time</span>
                            <span className="text-primary-400">{settings.gestureHoldTime}ms</span>
                          </label>
                          <input
                            type="range"
                            min="200"
                            max="1500"
                            step="50"
                            value={settings.gestureHoldTime}
                            onChange={(e) => updateSettings({ gestureHoldTime: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <p className="text-xs text-white/50">How long to hold a gesture before it triggers</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Audio Settings</h3>

                      <ToggleSetting
                        label="Sound Effects"
                        description="Play sounds for clicks, gestures, and other actions"
                        enabled={settings.soundEnabled}
                        onChange={(v) => updateSettings({ soundEnabled: v })}
                      />

                      {settings.soundEnabled && (
                        <div className="space-y-2 pl-4 border-l-2 border-primary-500/30">
                          <label className="text-white/80 flex items-center justify-between">
                            <span>Volume</span>
                            <span className="text-primary-400">{Math.round(settings.soundVolume * 100)}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.soundVolume}
                            onChange={(e) => updateSettings({ soundVolume: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/10">
                        <ToggleSetting
                          label="Voice Feedback"
                          description="Speak actions and navigation announcements"
                          enabled={settings.voiceFeedbackEnabled}
                          onChange={(v) => updateSettings({ voiceFeedbackEnabled: v })}
                        />

                        {settings.voiceFeedbackEnabled && (
                          <div className="space-y-4 pl-4 mt-4 border-l-2 border-primary-500/30">
                            <div className="space-y-2">
                              <label className="text-white/80 flex items-center justify-between">
                                <span>Speech Rate</span>
                                <span className="text-primary-400">{settings.voiceRate.toFixed(1)}x</span>
                              </label>
                              <input
                                type="range"
                                min="0.5"
                                max="2"
                                step="0.1"
                                value={settings.voiceRate}
                                onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-white/80 flex items-center justify-between">
                                <span>Speech Pitch</span>
                                <span className="text-primary-400">{settings.voicePitch.toFixed(1)}</span>
                              </label>
                              <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.1"
                                value={settings.voicePitch}
                                onChange={(e) => updateSettings({ voicePitch: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'display' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>

                      {/* Cursor Size */}
                      <div className="space-y-2">
                        <label className="text-white/80 flex items-center justify-between">
                          <span>Cursor Size</span>
                          <span className="text-primary-400">{settings.cursorSize}px</span>
                        </label>
                        <input
                          type="range"
                          min="20"
                          max="80"
                          step="5"
                          value={settings.cursorSize}
                          onChange={(e) => updateSettings({ cursorSize: parseInt(e.target.value) })}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex items-center justify-center mt-4">
                          <div
                            className="rounded-full bg-primary-500 border-4 border-white"
                            style={{ width: settings.cursorSize, height: settings.cursorSize }}
                          />
                        </div>
                      </div>

                      <ToggleSetting
                        label="High Contrast Mode"
                        description="Increase contrast for better visibility"
                        enabled={settings.highContrast}
                        onChange={(v) => updateSettings({ highContrast: v })}
                      />

                      <ToggleSetting
                        label="Reduce Animations"
                        description="Minimize motion for users sensitive to movement"
                        enabled={settings.reduceMotion}
                        onChange={(v) => updateSettings({ reduceMotion: v })}
                      />

                      <ToggleSetting
                        label="Show Camera Preview"
                        description="Display camera feed in corner of screen"
                        enabled={settings.showCameraPreview}
                        onChange={(v) => updateSettings({ showCameraPreview: v })}
                      />

                      <ToggleSetting
                        label="Show Debug Overlay"
                        description="Display tracking data and landmarks"
                        enabled={settings.showDebugOverlay}
                        onChange={(v) => updateSettings({ showDebugOverlay: v })}
                      />
                    </div>
                  )}

                  {activeTab === 'advanced' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>

                      <ToggleSetting
                        label="Break Reminders"
                        description="Get reminded to take breaks to prevent eye strain"
                        enabled={settings.breakRemindersEnabled}
                        onChange={(v) => updateSettings({ breakRemindersEnabled: v })}
                      />

                      {settings.breakRemindersEnabled && (
                        <div className="space-y-2 pl-4 border-l-2 border-primary-500/30">
                          <label className="text-white/80 flex items-center justify-between">
                            <span>Break Interval</span>
                            <span className="text-primary-400">{settings.breakInterval} min</span>
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="60"
                            step="5"
                            value={settings.breakInterval}
                            onChange={(e) => updateSettings({ breakInterval: parseInt(e.target.value) })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      )}

                      <ToggleSetting
                        label="Fatigue Detection"
                        description="Detect signs of fatigue and suggest breaks"
                        enabled={settings.fatigueDetectionEnabled}
                        onChange={(v) => updateSettings({ fatigueDetectionEnabled: v })}
                      />

                      <div className="pt-4 border-t border-white/10">
                        <h4 className="text-white font-medium mb-3">Detection Sensitivity</h4>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-white/80 flex items-center justify-between">
                              <span>Wink Detection Threshold</span>
                              <span className="text-primary-400">{settings.winkThreshold.toFixed(2)}</span>
                            </label>
                            <input
                              type="range"
                              min="0.15"
                              max="0.35"
                              step="0.01"
                              value={settings.winkThreshold}
                              onChange={(e) => updateSettings({ winkThreshold: parseFloat(e.target.value) })}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <p className="text-xs text-white/50">Lower values = more sensitive wink detection</p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-white/80 flex items-center justify-between">
                              <span>Mouth Open Threshold</span>
                              <span className="text-primary-400">{settings.mouthThreshold.toFixed(2)}</span>
                            </label>
                            <input
                              type="range"
                              min="0.3"
                              max="0.7"
                              step="0.05"
                              value={settings.mouthThreshold}
                              onChange={(e) => updateSettings({ mouthThreshold: parseFloat(e.target.value) })}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <p className="text-xs text-white/50">How wide mouth must open to trigger drag mode</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <GlassButton
                          variant="default"
                          onClick={() => {
                            if (confirm('Reset all settings to defaults?')) {
                              // Reset settings logic would go here
                            }
                          }}
                          className="w-full"
                        >
                          Reset All Settings to Defaults
                        </GlassButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-4 p-6 border-t border-white/10">
                <GlassButton variant="default" onClick={onClose}>
                  Close
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Toggle Setting Component
interface ToggleSettingProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  compact?: boolean;
}

function ToggleSetting({ label, description, enabled, onChange, compact = false }: ToggleSettingProps) {
  if (compact) {
    return (
      <button
        onClick={() => onChange(!enabled)}
        className={`
          w-12 h-6 rounded-full transition-colors relative
          ${enabled ? 'bg-primary-500' : 'bg-white/20'}
        `}
      >
        <motion.div
          className="w-5 h-5 rounded-full bg-white absolute top-0.5"
          animate={{ left: enabled ? '26px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <h4 className="text-white font-medium">{label}</h4>
        {description && <p className="text-white/50 text-sm">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`
          w-14 h-7 rounded-full transition-colors relative
          ${enabled ? 'bg-primary-500' : 'bg-white/20'}
        `}
      >
        <motion.div
          className="w-6 h-6 rounded-full bg-white absolute top-0.5"
          animate={{ left: enabled ? '30px' : '2px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
