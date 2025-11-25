
export interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  classId: number;
  className: string;
  label: string;
  color: string;
  size: string;
  isDamaged: boolean;
  trackId?: number;
}

export interface Counter {
  total: { green: number; damaged: number; red: number };
  small: { green: number; damaged: number; red: number };
  medium: { green: number; damaged: number; red: number };
  large: { green: number; damaged: number; red: number };
}

export interface CounterData {
  Tomato: Counter;
  Bellpepper: Counter;
}

export const createEmptyCounter = (): CounterData => ({
  Tomato: {
    total: { green: 0, damaged: 0, red: 0 },
    small: { green: 0, damaged: 0, red: 0 },
    medium: { green: 0, damaged: 0, red: 0 },
    large: { green: 0, damaged: 0, red: 0 },
  },
  Bellpepper: {
    total: { green: 0, damaged: 0, red: 0 },
    small: { green: 0, damaged: 0, red: 0 },
    medium: { green: 0, damaged: 0, red: 0 },
    large: { green: 0, damaged: 0, red: 0 },
  },
});

export const parseClassName = (name: string) => {
  const parts = name.toLowerCase().split('_');
  const isTomato = parts.some(p => p.includes('tomato'));
  const isBell = parts.some(p => p.includes('bell') || p.includes('pepper'));
  const label = isTomato ? 'Tomato' : isBell ? 'Bellpepper' : 'Unknown';

  const isDamaged = parts.some(p => p.includes('damage') || p.includes('damaged'));
  let color = 'unknown';
  if (isDamaged) color = 'damaged';
  else if (parts.includes('red')) color = 'red';
  else if (parts.includes('green')) color = 'green';

  let size = 'unknown';
  if (!isDamaged) {
    if (parts.includes('small')) size = 'small';
    else if (parts.includes('medium')) size = 'medium';
    else if (parts.includes('large')) size = 'large';
  }

  return { label, color, size, isDamaged };
};

export const estimateSizeFromBbox = (
  bbox: number[],
  imgW: number,
  imgH: number,
  crop: string
) => {
  const [x1, y1, x2, y2] = bbox;
  const area = (x2 - x1) * (y2 - y1);
  const areaPct = (area / (imgW * imgH)) * 100;

  if (crop === 'Tomato') {
    if (areaPct < 2) return 'small';
    if (areaPct < 6) return 'medium';
    return 'large';
  } else {
    if (areaPct < 3) return 'small';
    if (areaPct < 8) return 'medium';
    return 'large';
  }
};

export const iou = (a: number[], b: number[]) => {
  const [ax1, ay1, ax2, ay2] = a;
  const [bx1, by1, bx2, by2] = b;
  const x1 = Math.max(ax1, bx1);
  const y1 = Math.max(ay1, by1);
  const x2 = Math.min(ax2, bx2);
  const y2 = Math.min(ay2, by2);
  if (x2 <= x1 || y2 <= y1) return 0;
  const inter = (x2 - x1) * (y2 - y1);
  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  return inter / (areaA + areaB - inter);
};