export interface Detection {
  bbox: [number, number, number, number];
  class: string;
  confidence: number;
  track_id?: number | null;
  crop: string; // "Tomato" | "Bellpepper"
  color: string; // "Green" | "Red" | "Unknown"
  size: string | null; // "Small" | "Medium" | "Large" | null
  status: string; // "Good" | "Damaged"
  is_new?: boolean;
}

export interface DetectionData {
  detections: Detection[];
  counters?: CounterData;
  summary?: CropSummary[];
  image_size?: {width: number; height: number};
  unique_objects?: number;
}

export interface CounterData {
  [key: string]: {
    total: {green: number; damaged: number; red: number};
    small: {green: number; damaged: number; red: number};
    medium: {green: number; damaged: number; red: number};
    large: {green: number; damaged: number; red: number};
  };
}

export interface CameraPermission {
  permission: string | null;
  isLoading: boolean;
  requestPermission: () => Promise<void>;
}

export interface FrozenDetection {
  id: string;
  timestamp: string;
  frameImage: string; // base64 image
  detections: Detection[];
  summary: CropSummary[];
  counters: CounterData;
}

export interface CropSummary {
  crop: string;
  type: string;
  color: string;
  status: string;
  amount: number;
}
