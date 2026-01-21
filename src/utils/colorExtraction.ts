import type { Landmark } from './blinkDetection';
import { rgbToHex, getColorName } from '../lib/utils';

export interface FacialColors {
  skinColor: string;
  skinColorName: string;
  hairColor: string;
  hairColorName: string;
  eyeColor: string;
  eyeColorName: string;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

// MediaPipe Face Mesh landmark indices for color extraction regions
// Cheek regions (for skin color)
const LEFT_CHEEK_INDICES = [205, 206, 207, 187, 123, 116, 117, 118];
const RIGHT_CHEEK_INDICES = [425, 426, 427, 411, 352, 345, 346, 347];

// Forehead region (for hair color estimation - area above forehead)
const FOREHEAD_INDICES = [10, 67, 109, 297, 338, 151, 108, 69];

// Iris region (for eye color) - MediaPipe refined landmarks
const LEFT_IRIS_INDICES = [468, 469, 470, 471, 472];
const RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477];

function getRegionBounds(
  landmarks: Landmark[],
  indices: number[],
  videoWidth: number,
  videoHeight: number
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const idx of indices) {
    if (landmarks[idx]) {
      const x = landmarks[idx].x * videoWidth;
      const y = landmarks[idx].y * videoHeight;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return {
    x: Math.max(0, Math.floor(minX)),
    y: Math.max(0, Math.floor(minY)),
    width: Math.max(1, Math.ceil(maxX - minX)),
    height: Math.max(1, Math.ceil(maxY - minY)),
  };
}

function getAverageColor(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; width: number; height: number }
): RGB {
  try {
    const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
    const data = imageData.data;

    let r = 0, g = 0, b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      // Skip very dark or very bright pixels (likely shadows or highlights)
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (brightness > 20 && brightness < 240) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
    }

    if (count === 0) {
      return { r: 128, g: 128, b: 128 };
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
    };
  } catch {
    return { r: 128, g: 128, b: 128 };
  }
}

function getDominantColor(
  ctx: CanvasRenderingContext2D,
  region: { x: number; y: number; width: number; height: number }
): RGB {
  try {
    const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
    const data = imageData.data;

    // Simple color binning
    const colorBins: Map<string, { count: number; r: number; g: number; b: number }> = new Map();

    for (let i = 0; i < data.length; i += 4) {
      // Quantize colors to reduce unique values
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;

      const key = `${r},${g},${b}`;
      const existing = colorBins.get(key);

      if (existing) {
        existing.count++;
        existing.r += data[i];
        existing.g += data[i + 1];
        existing.b += data[i + 2];
      } else {
        colorBins.set(key, { count: 1, r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }

    // Find most common color
    let maxCount = 0;
    let dominant: RGB = { r: 128, g: 128, b: 128 };

    colorBins.forEach((value) => {
      if (value.count > maxCount) {
        maxCount = value.count;
        dominant = {
          r: Math.round(value.r / value.count),
          g: Math.round(value.g / value.count),
          b: Math.round(value.b / value.count),
        };
      }
    });

    return dominant;
  } catch {
    return { r: 128, g: 128, b: 128 };
  }
}

export function extractFacialColors(
  videoElement: HTMLVideoElement,
  landmarks: Landmark[]
): FacialColors {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return getDefaultColors();
  }

  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;

  if (width === 0 || height === 0) {
    return getDefaultColors();
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(videoElement, 0, 0);

  // Extract skin color from cheeks
  const leftCheekRegion = getRegionBounds(landmarks, LEFT_CHEEK_INDICES, width, height);
  const rightCheekRegion = getRegionBounds(landmarks, RIGHT_CHEEK_INDICES, width, height);

  const leftCheekColor = getAverageColor(ctx, leftCheekRegion);
  const rightCheekColor = getAverageColor(ctx, rightCheekRegion);

  const skinColor: RGB = {
    r: Math.round((leftCheekColor.r + rightCheekColor.r) / 2),
    g: Math.round((leftCheekColor.g + rightCheekColor.g) / 2),
    b: Math.round((leftCheekColor.b + rightCheekColor.b) / 2),
  };

  // Extract hair color from forehead top (area above the detected forehead)
  const foreheadRegion = getRegionBounds(landmarks, FOREHEAD_INDICES, width, height);
  // Move region up to get hair area
  const hairRegion = {
    ...foreheadRegion,
    y: Math.max(0, foreheadRegion.y - foreheadRegion.height),
    height: Math.min(foreheadRegion.height, foreheadRegion.y),
  };
  const hairColor = getDominantColor(ctx, hairRegion);

  // Extract eye color from iris (if refined landmarks are available)
  let eyeColor: RGB = { r: 100, g: 80, b: 60 }; // Default brown

  if (landmarks.length > 477) {
    // Refined landmarks available
    const leftIrisRegion = getRegionBounds(landmarks, LEFT_IRIS_INDICES, width, height);
    const rightIrisRegion = getRegionBounds(landmarks, RIGHT_IRIS_INDICES, width, height);

    const leftEyeColor = getDominantColor(ctx, leftIrisRegion);
    const rightEyeColor = getDominantColor(ctx, rightIrisRegion);

    eyeColor = {
      r: Math.round((leftEyeColor.r + rightEyeColor.r) / 2),
      g: Math.round((leftEyeColor.g + rightEyeColor.g) / 2),
      b: Math.round((leftEyeColor.b + rightEyeColor.b) / 2),
    };
  }

  const skinHex = rgbToHex(skinColor.r, skinColor.g, skinColor.b);
  const hairHex = rgbToHex(hairColor.r, hairColor.g, hairColor.b);
  const eyeHex = rgbToHex(eyeColor.r, eyeColor.g, eyeColor.b);

  return {
    skinColor: skinHex,
    skinColorName: getSkinToneName(skinColor),
    hairColor: hairHex,
    hairColorName: getHairColorName(hairColor),
    eyeColor: eyeHex,
    eyeColorName: getEyeColorName(eyeColor),
  };
}

function getDefaultColors(): FacialColors {
  return {
    skinColor: '#c9a080',
    skinColorName: 'Medium',
    hairColor: '#3d2314',
    hairColorName: 'Dark Brown',
    eyeColor: '#6b4423',
    eyeColorName: 'Brown',
  };
}

function getSkinToneName(rgb: RGB): string {
  const brightness = (rgb.r + rgb.g + rgb.b) / 3;

  if (brightness > 200) return 'Fair';
  if (brightness > 170) return 'Light';
  if (brightness > 140) return 'Medium';
  if (brightness > 100) return 'Olive';
  if (brightness > 70) return 'Tan';
  return 'Dark';
}

function getHairColorName(rgb: RGB): string {
  const { r, g, b } = rgb;
  const brightness = (r + g + b) / 3;

  if (brightness < 40) return 'Black';
  if (brightness > 180 && r > 200 && g > 180) return 'Blonde';
  if (r > g + 30 && r > b + 30) {
    if (brightness > 120) return 'Ginger';
    return 'Auburn';
  }
  if (brightness < 80) return 'Dark Brown';
  if (brightness < 120) return 'Brown';
  if (brightness > 160) return 'Light Brown';
  if (r < 100 && g < 100 && b < 100 && brightness > 60) return 'Gray';

  return 'Brown';
}

function getEyeColorName(rgb: RGB): string {
  const { r, g, b } = rgb;

  // Blue eyes
  if (b > r + 20 && b > g + 20) return 'Blue';

  // Green eyes
  if (g > r && g > b - 20) return 'Green';

  // Hazel eyes
  if (r > 80 && g > 60 && b < r && Math.abs(r - g) < 40) return 'Hazel';

  // Gray eyes
  if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 100) return 'Gray';

  // Brown eyes (default for most cases)
  return 'Brown';
}

export function analyzeColorInRegion(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): { hex: string; name: string; rgb: RGB } {
  const rgb = getAverageColor(ctx, { x, y, width, height });
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const name = getColorName(hex);

  return { hex, name, rgb };
}
