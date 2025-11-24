import * as ort from 'onnxruntime-react-native';
import { decode as decodeJpegBase64 } from 'jpeg-js';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { Detection, CounterData } from '../types/detection.types';

let session: ort.InferenceSession | null = null;

// Session state for tracking
let seenTracks = new Set<string>();
let sessionCounters: CounterData = createEmptyCounter();
let nextTrackId = 0;

const CONF_THRESHOLD = 0.55;
const IOU_THRESHOLD = 0.6;
const SPECIFICITY_BONUS = 0.15;

interface RawDetection {
  bbox: [number, number, number, number];
  class: string;
  confidence: number;
  label: string;
  color: string;
  size: string;
  is_damaged: boolean;
  track_id?: string;
  effective_confidence?: number;
  is_new?: boolean;
}

function createEmptyCounter(): CounterData {
  return {
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
  };
}

/**
 * Parse class name into hierarchical attributes (matches Python backend)
 */
function parseClassName(className: string) {
  const parts = className.toLowerCase().split('_');
  
  // Determine crop type
  const label = parts.includes('tomato') 
    ? 'Tomato' 
    : parts.some(p => p === 'bellpepper' || p === 'pepper') 
    ? 'Bellpepper' 
    : 'Unknown';
  
  // Determine damage status first (highest priority)
  const is_damaged = parts.includes('damaged') || parts.includes('damage');
  
  // Determine color
  let color: string;
  if (is_damaged) {
    color = 'damaged';
  } else if (parts.includes('red')) {
    color = 'red';
  } else if (parts.includes('green')) {
    color = 'green';
  } else {
    color = 'unknown';
  }
  
  // Determine size from class name
  let size: string;
  if (parts.includes('small')) {
    size = 'small';
  } else if (parts.includes('medium')) {
    size = 'medium';
  } else if (parts.includes('large')) {
    size = 'large';
  } else {
    size = 'unknown';
  }
  
  return { label, color, size, is_damaged };
}

/**
 * Estimate size from bounding box dimensions (fallback when model doesn't provide size)
 */
function estimateSizeFromBbox(
  bbox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
  cropType: string
): string {
  const [x1, y1, x2, y2] = bbox;
  
  const bboxWidth = x2 - x1;
  const bboxHeight = y2 - y1;
  const bboxArea = bboxWidth * bboxHeight;
  const imageArea = imageWidth * imageHeight;
  const areaPercentage = (bboxArea / imageArea) * 100;
  
  const maxDimension = Math.max(bboxWidth, bboxHeight);
  const maxDimPercentage = (maxDimension / Math.max(imageWidth, imageHeight)) * 100;
  
  if (cropType === 'Tomato') {
    if (areaPercentage < 2.0 || maxDimPercentage < 10) return 'small';
    if (areaPercentage < 6.0 || maxDimPercentage < 18) return 'medium';
    return 'large';
  } else if (cropType === 'Bellpepper') {
    if (areaPercentage < 3.0 || maxDimPercentage < 12) return 'small';
    if (areaPercentage < 8.0 || maxDimPercentage < 20) return 'medium';
    return 'large';
  }
  
  // Default fallback
  if (areaPercentage < 3.0) return 'small';
  if (areaPercentage < 7.0) return 'medium';
  return 'large';
}

/**
 * Calculate IoU between two bounding boxes
 */
function iou(boxA: number[], boxB: number[]): number {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[2], boxB[2]);
  const yB = Math.min(boxA[3], boxB[3]);
  
  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]);
  const boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]);
  const unionArea = boxAArea + boxBArea - interArea;
  
  return unionArea > 0 ? interArea / unionArea : 0;
}

/**
 * Resolve conflicting detections (matches Python backend logic)
 */
function resolveConflicts(
  detections: RawDetection[],
  iouThreshold = 0.7,
  specificityBonus = SPECIFICITY_BONUS
): RawDetection[] {
  if (detections.length === 0) return [];
  
  // Group overlapping detections
  const groups: RawDetection[][] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < detections.length; i++) {
    if (used.has(i)) continue;
    
    const group = [detections[i]];
    used.add(i);
    
    for (let j = i + 1; j < detections.length; j++) {
      if (used.has(j)) continue;
      
      if (iou(detections[i].bbox, detections[j].bbox) > iouThreshold) {
        group.push(detections[j]);
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  // Resolve each group
  const resolved: RawDetection[] = [];
  
  for (const group of groups) {
    if (group.length === 1) {
      resolved.push(group[0]);
      continue;
    }
    
    // Apply specificity bonus
    group.forEach(det => {
      det.effective_confidence = det.confidence;
      if (det.size !== 'unknown') {
        det.effective_confidence += specificityBonus;
      }
    });
    
    // Sort by effective confidence
    group.sort((a, b) => (b.effective_confidence || 0) - (a.effective_confidence || 0));
    
    const best = { ...group[0] };
    
    // Apply hierarchical logic
    
    // 1. If ANY detection shows damage, it's damaged
    if (group.some(d => d.is_damaged)) {
      best.is_damaged = true;
      best.color = 'damaged';
    }
    
    // 2. Inherit size from other detections if best doesn't have it
    if (best.size === 'unknown') {
      const sizesWithConf = group
        .filter(d => d.size !== 'unknown')
        .map(d => ({ size: d.size, conf: d.effective_confidence || 0 }));
      
      if (sizesWithConf.length > 0) {
        best.size = sizesWithConf.reduce((max, curr) => 
          curr.conf > max.conf ? curr : max
        ).size;
      }
    }
    
    // 3. Aggregate color info if not damaged
    if (!best.is_damaged) {
      const colors = group
        .filter(d => d.color !== 'unknown' && d.color !== 'damaged')
        .map(d => ({ color: d.color, conf: d.effective_confidence || 0 }));
      
      if (colors.length > 0) {
        const potentialColor = colors.reduce((max, curr) => 
          curr.conf > max.conf ? curr : max
        ).color;
        
        if (potentialColor !== best.color) {
          best.color = potentialColor;
        }
      }
    }
    
    // 4. Update class name to reflect resolved attributes
    if (best.is_damaged) {
      best.class = `${best.label.toLowerCase()}_${best.color}_damaged`;
    } else if (best.size !== 'unknown') {
      best.class = `${best.label.toLowerCase()}_${best.color}_${best.size}`;
    } else {
      best.class = `${best.label.toLowerCase()}_${best.color}`;
    }
    
    // Clean up temporary field
    delete best.effective_confidence;
    
    resolved.push(best);
  }
  
  return resolved;
}

/**
 * Simple object tracking by spatial proximity (basic ByteTrack approximation)
 */
const trackedObjects: Map<string, { bbox: number[], lastSeen: number }> = new Map();

function assignTrackId(bbox: number[]): string {
  const now = Date.now();
  const TRACK_TIMEOUT = 2000; // 2 seconds
  
  // Remove stale tracks
  for (const [id, track] of trackedObjects.entries()) {
    if (now - track.lastSeen > TRACK_TIMEOUT) {
      trackedObjects.delete(id);
    }
  }
  
  // Find matching track
  let bestMatch: string | null = null;
  let bestIou = 0.3; // Minimum IoU threshold
  
  for (const [id, track] of trackedObjects.entries()) {
    const iouScore = iou(bbox, track.bbox);
    if (iouScore > bestIou) {
      bestIou = iouScore;
      bestMatch = id;
    }
  }
  
  if (bestMatch) {
    trackedObjects.set(bestMatch, { bbox, lastSeen: now });
    return bestMatch;
  }
  
  // Create new track
  const newId = `track_${nextTrackId++}`;
  trackedObjects.set(newId, { bbox, lastSeen: now });
  return newId;
}

/**
 * Convert JPEG base64 to tensor
 */
export function jpegBase64ToTensor(base64: string, width: number, height: number): Float32Array {
  const raw = Buffer.from(base64, 'base64');
  const decoded = decodeJpegBase64(raw);
  const data = new Float32Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    data[i * 3 + 0] = decoded.data[i * 4 + 0] / 255; // R
    data[i * 3 + 1] = decoded.data[i * 4 + 1] / 255; // G
    data[i * 3 + 2] = decoded.data[i * 4 + 2] / 255; // B
  }

  return data;
}

/**
 * Load the ONNX fallback model
 * 
 * IMPORTANT: Place your model file in one of these locations:
 * - Android: android/app/src/main/assets/models/yolov8n_fallback.onnx
 * - iOS: Add to Xcode project (Copy Bundle Resources)
 */
export async function loadFallbackModel() {
  try {
    // Determine the model path based on platform
    let modelPath: string;
    
    if (RNFS.exists) {
      // For Android, the model should be in assets folder
      // For iOS, it should be in the bundle
      const androidPath = `${RNFS.MainBundlePath}/models/yolov8.onnx`;
      const iosPath = `${RNFS.MainBundlePath}/yolov8.onnx`;
      
      // Check which path exists
      const androidExists = await RNFS.exists(androidPath);
      const iosExists = await RNFS.exists(iosPath);
      
      if (androidExists) {
        modelPath = androidPath;
      } else if (iosExists) {
        modelPath = iosPath;
      } else {
        // Try common alternative paths
        const altPath = `../assets/yolov8.onnx`;
        const altExists = await RNFS.exists(altPath);
        
        if (altExists) {
          modelPath = altPath;
        } else {
          throw new Error(
            `Model not found. Tried:\n- ${androidPath}\n- ${iosPath}\n- ${altPath}\n\n` +
            'Please ensure yolov8.onnx is in the correct location.'
          );
        }
      }
    } else {
      throw new Error('RNFS not available');
    }
    
    console.log(`📦 Loading model from: ${modelPath}`);
    
    session = await ort.InferenceSession.create(modelPath);
    console.log("✅ Fallback model loaded successfully");
    
    // Reset tracking state
    seenTracks = new Set();
    sessionCounters = createEmptyCounter();
    nextTrackId = 0;
    trackedObjects.clear();
  } catch (error) {
    console.error("❌ Failed to load fallback model:", error);
    throw error;
  }
}

/**
 * Parse YOLOv8 output (8400 predictions format)
 */
function parseYolo(
  preds: Float32Array, 
  classNames: string[],
  imageWidth: number,
  imageHeight: number
): RawDetection[] {
  const detections: RawDetection[] = [];
  const numPredictions = 8400; // YOLOv8 default
  const numClasses = classNames.length;
  
  // YOLOv8 output format: [batch, 4 + num_classes, 8400]
  // Transposed to [batch, 8400, 4 + num_classes]
  
  for (let i = 0; i < numPredictions; i++) {
    // Get bbox coordinates (center format)
    const cx = preds[i * (4 + numClasses) + 0] * imageWidth;
    const cy = preds[i * (4 + numClasses) + 1] * imageHeight;
    const w = preds[i * (4 + numClasses) + 2] * imageWidth;
    const h = preds[i * (4 + numClasses) + 3] * imageHeight;
    
    // Convert to xyxy format
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;
    const x2 = cx + w / 2;
    const y2 = cy + h / 2;
    
    // Get class scores
    let maxScore = 0;
    let maxClassId = 0;
    
    for (let c = 0; c < numClasses; c++) {
      const score = preds[i * (4 + numClasses) + 4 + c];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }
    
    if (maxScore < CONF_THRESHOLD) continue;
    
    const className = classNames[maxClassId] || 'unknown';
    const { label, color, size, is_damaged } = parseClassName(className);
    
    detections.push({
      bbox: [x1, y1, x2, y2],
      class: className,
      confidence: maxScore,
      label,
      color,
      size,
      is_damaged,
    });
  }
  
  return detections;
}

/**
 * Run local ONNX inference on an image URI
 */
export async function runLocalModel(
  imageUri: string, 
  classNames: string[]
): Promise<{ detections: Detection[], counters: CounterData, uniqueObjects: number }> {
  if (!session) {
    throw new Error('Model not loaded. Call loadFallbackModel() first.');
  }

  try {
    const base64 = await RNFS.readFile(imageUri, 'base64');
    
    // Get image dimensions (you may need to adjust based on your preprocessing)
    const MODEL_WIDTH = 640;
    const MODEL_HEIGHT = 640;
    
    const tensorData = jpegBase64ToTensor(base64, MODEL_WIDTH, MODEL_HEIGHT);
    const tensor = new ort.Tensor('float32', tensorData, [1, 3, MODEL_WIDTH, MODEL_HEIGHT]);

    const output = await session.run({ images: tensor });
    const preds = output['output0'].data as Float32Array;

    // Parse raw detections
    let rawDetections = parseYolo(preds, classNames, MODEL_WIDTH, MODEL_HEIGHT);
    
    // Estimate size for detections without size info
    rawDetections = rawDetections.map(det => {
      if (det.size === 'unknown' && !det.is_damaged) {
        det.size = estimateSizeFromBbox(det.bbox, MODEL_WIDTH, MODEL_HEIGHT, det.label);
      }
      return det;
    });
    
    // Assign track IDs
    rawDetections = rawDetections.map(det => ({
      ...det,
      track_id: assignTrackId(det.bbox),
    }));
    
    // Resolve conflicts
    let resolved = resolveConflicts(rawDetections, 0.7, SPECIFICITY_BONUS);
    
    // Update counters for new tracks
    resolved = resolved.map(det => {
      const isNew = !!(det.track_id && !seenTracks.has(det.track_id));
      
      if (isNew && det.track_id) {
        const { label, color, size } = det;
        
        if (label in sessionCounters) {
          const cropData = sessionCounters[label as keyof CounterData];
          
          if (color in cropData.total) {
            cropData.total[color as keyof typeof cropData.total]++;
          }
          
          if (size in cropData && color in cropData[size as keyof typeof cropData]) {
            (cropData[size as keyof typeof cropData] as any)[color]++;
          }
        }
        
        seenTracks.add(det.track_id);
      }
      
      return { ...det, is_new: isNew };
    });
    
    // Final NMS filtering
    const filtered: RawDetection[] = [];
    resolved.sort((a, b) => b.confidence - a.confidence);
    
    for (const det of resolved) {
      if (!filtered.some(f => iou(det.bbox, f.bbox) > IOU_THRESHOLD)) {
        filtered.push(det);
      }
    }
    
    // Convert to Detection format
    const detections: Detection[] = filtered.map(det => ({
      bbox: det.bbox,
      class: det.class,
      confidence: Math.round(det.confidence * 1000) / 1000,
    }));
    
    return {
      detections,
      counters: sessionCounters,
      uniqueObjects: seenTracks.size,
    };
  } catch (error) {
    console.error('❌ Local model inference error:', error);
    throw error;
  }
}

/**
 * Reset tracking state
 */
export function resetLocalTracking() {
  seenTracks = new Set();
  sessionCounters = createEmptyCounter();
  nextTrackId = 0;
  trackedObjects.clear();
  console.log('🔄 Local tracking reset');
}