import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}

interface QuickActionsWheelProps {
  isOpen: boolean;
  onClose: () => void;
  actions?: QuickAction[];
  selectedIndex?: number | null;
  dwellProgress?: number;
}

const defaultActions: QuickAction[] = [
  { id: 'copy', label: 'Copy', icon: '📋', action: () => {} },
  { id: 'paste', label: 'Paste', icon: '📄', action: () => {} },
  { id: 'undo', label: 'Undo', icon: '↩️', action: () => {} },
  { id: 'redo', label: 'Redo', icon: '↪️', action: () => {} },
  { id: 'scroll-up', label: 'Scroll Up', icon: '⬆️', action: () => {} },
  { id: 'scroll-down', label: 'Scroll Down', icon: '⬇️', action: () => {} },
  { id: 'keyboard', label: 'Keyboard', icon: '⌨️', action: () => {} },
  { id: 'close', label: 'Close', icon: '✕', action: () => {} },
];

export function QuickActionsWheel({
  isOpen,
  onClose,
  actions = defaultActions,
  selectedIndex = null,
  dwellProgress = 0,
}: QuickActionsWheelProps) {
  const wheelItems = useMemo(() => {
    const itemCount = actions.length;
    const angleStep = (2 * Math.PI) / itemCount;
    const radius = 120;

    return actions.map((action, index) => {
      const angle = angleStep * index - Math.PI / 2; // Start from top
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return {
        ...action,
        x,
        y,
        angle,
      };
    });
  }, [actions]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Wheel container */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="relative w-80 h-80">
              {/* Center hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center">
                <span className="text-white/60 text-sm text-center">
                  {selectedIndex !== null ? actions[selectedIndex]?.label : 'Select'}
                </span>
              </div>

              {/* Wheel items */}
              {wheelItems.map((item, index) => {
                const isSelected = selectedIndex === index;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition: { delay: index * 0.05 },
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px))`,
                    }}
                    className={`
                      w-16 h-16 rounded-full pointer-events-auto
                      flex flex-col items-center justify-center gap-1
                      transition-all duration-200
                      ${isSelected
                        ? 'bg-primary-500/40 border-primary-400 scale-110'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                      }
                      border backdrop-blur-lg
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[10px] text-white/70">{item.label}</span>

                    {/* Dwell progress ring */}
                    {isSelected && dwellProgress > 0 && (
                      <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="46"
                          fill="none"
                          stroke="rgba(99, 102, 241, 0.5)"
                          strokeWidth="4"
                          strokeDasharray={`${dwellProgress * 289} 289`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </motion.button>
                );
              })}

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {wheelItems.map((item, index) => (
                  <line
                    key={index}
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${item.x}px)`}
                    y2={`calc(50% + ${item.y}px)`}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
