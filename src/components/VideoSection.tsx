import { useRef, useEffect, type RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Results as FaceResults } from '@mediapipe/face_mesh';
import type { Results as HandsResults } from '@mediapipe/hands';
import { useAppStore } from '../store/useAppStore';
import { GlassCard, StatusBadge } from './ui/GlassCard';

interface VideoSectionProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  faceLandmarks: FaceResults | null;
  handLandmarks: HandsResults | null;
}

export function VideoSection({ videoRef, faceLandmarks, handLandmarks }: VideoSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isCameraActive,
    isCameraLoading,
    cameraError,
    isSleeping,
    isBlinking,
    isHandDetected,
    fingerCount,
    raisedFingers,
    currentGesture,
    settings,
  } = useAppStore();

  // Draw landmarks on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face mesh if enabled
    if (settings.showFaceMesh && faceLandmarks?.multiFaceLandmarks?.[0]) {
      const landmarks = faceLandmarks.multiFaceLandmarks[0];

      ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
      for (const landmark of landmarks) {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw face outline
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 0.5;

      const faceOutline = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
        378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
        162, 21, 54, 103, 67, 109, 10,
      ];
      ctx.beginPath();
      for (let i = 0; i < faceOutline.length; i++) {
        const idx = faceOutline[i];
        const x = landmarks[idx].x * canvas.width;
        const y = landmarks[idx].y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw hand landmarks if enabled
    if (settings.showHandLandmarks && handLandmarks?.multiHandLandmarks) {
      for (const landmarks of handLandmarks.multiHandLandmarks) {
        // Draw landmarks
        ctx.fillStyle = 'rgba(236, 72, 153, 0.8)';
        for (const landmark of landmarks) {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Draw connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // Index
          [0, 9], [9, 10], [10, 11], [11, 12], // Middle
          [0, 13], [13, 14], [14, 15], [15, 16], // Ring
          [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
          [5, 9], [9, 13], [13, 17], // Palm
        ];

        ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
        ctx.lineWidth = 2;
        for (const [start, end] of connections) {
          ctx.beginPath();
          ctx.moveTo(
            landmarks[start].x * canvas.width,
            landmarks[start].y * canvas.height
          );
          ctx.lineTo(
            landmarks[end].x * canvas.width,
            landmarks[end].y * canvas.height
          );
          ctx.stroke();
        }
      }
    }
  }, [faceLandmarks, handLandmarks, settings, videoRef]);

  return (
    <div className="flex-1 p-4">
      <GlassCard className="h-full p-0 overflow-hidden" hover={false}>
        <div className="relative w-full h-full min-h-[400px] lg:min-h-[500px]">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            autoPlay
            playsInline
            muted
          />

          {/* Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] pointer-events-none"
          />

          {/* Loading State */}
          <AnimatePresence>
            {isCameraLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 border-4 border-primary-500 border-t-transparent rounded-full"
                  />
                  <p className="text-white">Initializing camera...</p>
                  <p className="text-white/60 text-sm mt-2">Loading AI models...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {cameraError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50"
              >
                <div className="text-center p-6">
                  <span className="text-5xl mb-4 block">⚠️</span>
                  <p className="text-red-400 mb-2">Camera Error</p>
                  <p className="text-white/60 text-sm max-w-md">{cameraError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inactive State */}
          <AnimatePresence>
            {!isCameraActive && !isCameraLoading && !cameraError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/80 to-purple-900/40"
              >
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center"
                  >
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Camera Ready
                  </h3>
                  <p className="text-white/60">
                    Click "Start Camera" in the sidebar to begin
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Badges Overlay */}
          {isCameraActive && (
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <AnimatePresence mode="wait">
                {isSleeping && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <StatusBadge status="warning" pulse>
                      😴 Sleep Detected
                    </StatusBadge>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {isBlinking && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <StatusBadge status="info">👁️ Blinking</StatusBadge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Hand Gesture Display */}
          {isCameraActive && isHandDetected && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <GlassCard className="p-4" hover={false} variant="dark">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">✋</span>
                    <div>
                      <p className="text-white/60 text-sm">Fingers Raised</p>
                      <p className="text-3xl font-bold gradient-text">
                        {fingerCount}
                      </p>
                    </div>
                  </div>

                  {currentGesture && (
                    <div className="text-right">
                      <p className="text-white/60 text-sm">Gesture</p>
                      <p className="text-lg font-medium text-purple-400">
                        {currentGesture}
                      </p>
                    </div>
                  )}

                  <div className="hidden sm:block">
                    <p className="text-white/60 text-sm mb-1">Fingers</p>
                    <div className="flex gap-1 flex-wrap">
                      {raisedFingers.map((finger) => (
                        <span
                          key={finger}
                          className="px-2 py-0.5 text-xs rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30"
                        >
                          {finger}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
