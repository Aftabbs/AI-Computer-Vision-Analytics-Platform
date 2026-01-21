import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getColorName(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'Unknown';

  const { r, g, b } = rgb;

  // Simple color classification
  const brightness = (r + g + b) / 3;

  if (brightness < 50) return 'Black';
  if (brightness > 200 && r > 180 && g > 180 && b > 180) return 'White';

  if (r > g && r > b) {
    if (r > 150 && g < 100 && b < 100) return 'Red';
    if (r > 150 && g > 100) return 'Orange';
    return 'Brown';
  }

  if (g > r && g > b) {
    return 'Green';
  }

  if (b > r && b > g) {
    if (b > 150 && r < 100 && g < 150) return 'Blue';
    return 'Purple';
  }

  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
    return 'Gray';
  }

  return 'Mixed';
}
