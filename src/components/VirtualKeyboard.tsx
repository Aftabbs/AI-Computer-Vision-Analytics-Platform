import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { audioFeedback } from '../utils/audioFeedback';

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (key: string) => void;
  highlightedKey?: string | null;
  dwellProgress?: number;
  soundEnabled?: boolean;
}

const KEYBOARD_LAYOUTS = {
  main: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Backspace'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Enter'],
    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
    ['Symbols', 'Space', 'Left', 'Right', 'Close'],
  ],
  symbols: [
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', 'Backspace'],
    ['-', '=', '[', ']', '\\', ';', "'", '/', '`', '~'],
    ['+', '_', '{', '}', '|', ':', '"', '?', '<', '>'],
    ['Tab', 'Esc', 'Home', 'End', 'PgUp', 'PgDn', 'Del', 'Ins'],
    ['ABC', 'Space', 'Left', 'Right', 'Close'],
  ],
};

const KEY_WIDTHS: Record<string, string> = {
  Backspace: 'w-24',
  Enter: 'w-20',
  Shift: 'w-20',
  Space: 'w-48',
  Symbols: 'w-20',
  ABC: 'w-16',
  Close: 'w-16',
  Tab: 'w-16',
  Esc: 'w-14',
};

const KEY_ICONS: Record<string, string> = {
  Backspace: '⌫',
  Enter: '↵',
  Shift: '⇧',
  Space: '␣',
  Left: '←',
  Right: '→',
  Close: '✕',
  Tab: '⇥',
  Esc: 'Esc',
  Home: '⇱',
  End: '⇲',
  PgUp: '⇞',
  PgDn: '⇟',
  Del: 'Del',
  Ins: 'Ins',
};

export function VirtualKeyboard({
  isOpen,
  onClose,
  onKeyPress,
  highlightedKey,
  dwellProgress = 0,
  soundEnabled = true,
}: VirtualKeyboardProps) {
  const [layout, setLayout] = useState<'main' | 'symbols'>('main');
  const [isShiftActive, setIsShiftActive] = useState(false);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (soundEnabled) {
        audioFeedback.keyPress();
      }

      switch (key) {
        case 'Shift':
          setIsShiftActive(!isShiftActive);
          break;
        case 'Symbols':
          setLayout('symbols');
          break;
        case 'ABC':
          setLayout('main');
          break;
        case 'Close':
          onClose();
          break;
        default:
          let outputKey = key;
          if (key === 'Space') outputKey = ' ';
          if (key.length === 1 && !isShiftActive) {
            outputKey = key.toLowerCase();
          }
          onKeyPress(outputKey);
          if (isShiftActive && key.length === 1) {
            setIsShiftActive(false);
          }
      }
    },
    [isShiftActive, onKeyPress, onClose, soundEnabled]
  );

  const currentLayout = KEYBOARD_LAYOUTS[layout];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <GlassCard className="max-w-4xl mx-auto p-4" hover={false}>
            {/* Text input preview */}
            <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Type with your eyes</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onKeyPress('SelectAll')}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => onKeyPress('Copy')}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => onKeyPress('Paste')}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white/70"
                  >
                    Paste
                  </button>
                </div>
              </div>
            </div>

            {/* Keyboard rows */}
            <div className="space-y-2">
              {currentLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                  {row.map((key) => {
                    const isHighlighted = highlightedKey === key;
                    const keyWidth = KEY_WIDTHS[key] || 'w-12';
                    const displayKey = KEY_ICONS[key] || (isShiftActive ? key : key.toLowerCase());

                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleKeyPress(key)}
                        className={`
                          relative h-14 ${keyWidth} rounded-lg font-medium text-lg
                          transition-all duration-150
                          ${isHighlighted
                            ? 'bg-primary-500/40 border-primary-400 text-white'
                            : key === 'Shift' && isShiftActive
                            ? 'bg-green-500/30 border-green-400/50 text-green-300'
                            : 'bg-white/10 border-white/20 text-white/90 hover:bg-white/20'
                          }
                          border backdrop-blur-sm
                        `}
                      >
                        {displayKey}

                        {/* Dwell progress indicator */}
                        {isHighlighted && dwellProgress > 0 && (
                          <motion.div
                            className="absolute bottom-0 left-0 h-1 bg-primary-400 rounded-b-lg"
                            initial={{ width: 0 }}
                            animate={{ width: `${dwellProgress * 100}%` }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Quick phrases */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-white/50 text-sm whitespace-nowrap">Quick:</span>
                {['Hello', 'Yes', 'No', 'Thanks', 'Please', 'Help'].map((phrase) => (
                  <button
                    key={phrase}
                    onClick={() => onKeyPress(phrase)}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-sm whitespace-nowrap transition-colors"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
