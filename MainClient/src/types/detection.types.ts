export interface Detection {
  bbox: [number, number, number, number];
  class: string;
  confidence: number;
}

export interface DetectionData {
  detections: Detection[];
}

export interface CounterData {
  [key: string]: {
    total: { green: number; damaged: number; red: number };
    small: { green: number; red: number };
    medium: { green: number; red: number };
    large: { green: number; red: number };
  };
}

export interface CameraPermission {
  permission: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}