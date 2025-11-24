import * as ort from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { Detection, CounterData } from '../types/detection.types';

let session: ort.InferenceSession | null = null;

// Session state for tracking
let seenTracks = new Set<string>();
let sessionCounters: CounterData = createEmptyCounter();
let nextTrackId = 0;

const CONF_THRESHOLD = 0.80;
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
 * Debug function to verify model file exists
 */
export async function debugModelPath(): Promise<void> {
  console.log('🔍 Debugging model path...');
  
  if (Platform.OS === 'android') {
    try {
      console.log('📱 Platform: Android');
      
      // Try copying from assets to verify it exists
      const destPath = `${RNFS.CachesDirectoryPath}/test_model.onnx`;
      console.log(`Attempting to copy from assets to: ${destPath}`);
      
      await RNFS.copyFileAssets('yolov8.onnx', destPath);
      
      const stats = await RNFS.stat(destPath);
      console.log('✅ Model file found in Android assets!');
      console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Clean up test file
      await RNFS.unlink(destPath);
    } catch (error) {
      console.error('❌ Model file NOT found in Android assets');
      console.error('Make sure yolov8.onnx is in: android/app/src/main/assets/');
      console.error('Error:', error);
    }
  } else if (Platform.OS === 'ios') {
    try {
      console.log('📱 Platform: iOS');
      
      const mainBundlePath = RNFS.MainBundlePath;
      const modelPath = `${mainBundlePath}/yolov8.onnx`;
      
      console.log(`Checking iOS bundle path: ${modelPath}`);
      
      const exists = await RNFS.exists(modelPath);
      if (exists) {
        const stats = await RNFS.stat(modelPath);
        console.log('✅ Model file found in iOS bundle!');
        console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.error('❌ Model file NOT found at:', modelPath);
        
        // List files in bundle to help debug
        try {
          const bundleFiles = await RNFS.readDir(mainBundlePath);
          console.log('📂 Files in iOS bundle:');
          bundleFiles.slice(0, 20).forEach(f => {
            console.log(`  - ${f.name}`);
          });
          if (bundleFiles.length > 20) {
            console.log(`  ... and ${bundleFiles.length - 20} more files`);
          }
        } catch (listError) {
          console.error('Could not list bundle files:', listError);
        }
      }
    } catch (error) {
      console.error('❌ Error checking iOS model:', error);
    }
  }
}

/**
 * Load the ONNX fallback model
 * 
 * File placement:
 * - Android: android/app/src/main/assets/yolov8.onnx
 * - iOS: Add to Xcode project (Copy Bundle Resources)
 */
export async function loadFallbackModel(): Promise<boolean> {
  try {
    let modelPath: string;
    
    if (Platform.OS === 'android') {
     const cachePath = `${RNFS.CachesDirectoryPath}/yolov8.onnx`;
      
      try {
        // Always copy from assets on first launch (guaranteed to work)
        const exists = await RNFS.exists(cachePath);
        if (!exists) {
          console.log('Copying yolov8.onnx from assets to cache...');
          await RNFS.copyFileAssets('yolov8.onnx', cachePath);
          console.log('Model copied to:', cachePath);
        }

        session = await ort.InferenceSession.create(cachePath);
        console.log("ONNX model loaded from cache!");
        return true;
      } catch (error) {
        console.error("Still failed after copy:", error);
        throw error;
      }
      
    } else if (Platform.OS === 'ios') {
      // For iOS: Use the bundle path
      const mainBundlePath = RNFS.MainBundlePath;
      modelPath = `${mainBundlePath}/yolov8.onnx`;
      
      console.log("📦 Loading ONNX model from iOS bundle...");
      console.log(`📂 Path: ${modelPath}`);
      
      // Verify file exists
      const exists = await RNFS.exists(modelPath);
      if (!exists) {
        throw new Error(
          `Model file not found at: ${modelPath}\n` +
          `Make sure yolov8.onnx is added to Xcode project with "Copy Bundle Resources"`
        );
      }
      
      const stats = await RNFS.stat(modelPath);
      console.log(`📊 Model size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      session = await ort.InferenceSession.create(modelPath);
      console.log("✅ ONNX model loaded successfully");
      
    } else {
      throw new Error('Unsupported platform');
    }

    // Reset tracking state
    seenTracks.clear();
    sessionCounters = createEmptyCounter();
    nextTrackId = 0;
    trackedObjects.clear();

    console.log("🎯 Model ready for inference");
    return true;
    
  } catch (err: any) {
    console.error("❌ Failed to load ONNX model");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    // Helpful error messages
    if (Platform.OS === 'android') {
      console.error("\n📝 Android troubleshooting:");
      console.error("  1. Verify file exists: android/app/src/main/assets/yolov8.onnx");
      console.error("  2. Run: ./gradlew clean in android/ folder");
      console.error("  3. Rebuild: npx react-native run-android");
    } else {
      console.error("\n📝 iOS troubleshooting:");
      console.error("  1. Open Xcode and verify yolov8.onnx is in project");
      console.error("  2. Check Build Phases → Copy Bundle Resources");
      console.error("  3. Clean build: Product → Clean Build Folder");
    }
    
    throw err;
  }
}

/**
 * Parse class name into hierarchical attributes (matches Python backend)
 */
function parseClassName(className: string) {
  const parts = className.toLowerCase().split('_');
  
  const label = parts.includes('tomato') 
    ? 'Tomato' 
    : parts.some(p => p === 'bellpepper' || p === 'pepper') 
    ? 'Bellpepper' 
    : 'Unknown';
  
  const is_damaged = parts.includes('damaged') || parts.includes('damage');
  
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
 * Estimate size from bounding box dimensions
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
 * Resolve conflicting detections
 */
function resolveConflicts(
  detections: RawDetection[],
  iouThreshold = IOU_THRESHOLD,
  specificityBonus = SPECIFICITY_BONUS
): RawDetection[] {
  if (detections.length === 0) return [];

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

  const resolved: RawDetection[] = [];

  for (const group of groups) {
    group.forEach(det => {
      det.effective_confidence = det.confidence + (det.size !== 'unknown' ? specificityBonus : 0);
    });

    group.sort((a, b) => (b.effective_confidence || 0) - (a.effective_confidence || 0));
    const best = { ...group[0] };

    // Merge damaged flag
    if (group.some(d => d.is_damaged)) {
      best.is_damaged = true;
      best.color = 'damaged';
    }

    // Resolve unknown sizes
    if (best.size === 'unknown') {
      const sizesWithConf = group.filter(d => d.size !== 'unknown');
      if (sizesWithConf.length > 0) {
        best.size = sizesWithConf.reduce((max, curr) => 
          (curr.effective_confidence || 0) > (max.effective_confidence || 0) ? curr : max
        ).size;
      }
    }

    // Resolve colors
    if (!best.is_damaged) {
      const colors = group.filter(d => d.color !== 'unknown' && d.color !== 'damaged');
      if (colors.length > 0) {
        best.color = colors.reduce((max, curr) => 
          (curr.effective_confidence || 0) > (max.effective_confidence || 0) ? curr : max
        ).color;
      }
    }

    // Construct class name
    if (best.is_damaged) {
      best.class = `${best.label.toLowerCase()}_${best.color}_damaged`;
    } else if (best.size !== 'unknown') {
      best.class = `${best.label.toLowerCase()}_${best.color}_${best.size}`;
    } else {
      best.class = `${best.label.toLowerCase()}_${best.color}`;
    }

    resolved.push(best);
  }

  // Final filter by confidence
  return resolved.filter(det => (det.effective_confidence || 0) >= CONF_THRESHOLD);
}


/**
 * Simple object tracking
 */
const trackedObjects: Map<string, { bbox: number[], lastSeen: number }> = new Map();

function assignTrackId(bbox: number[]): string {
  const now = Date.now();
  const TRACK_TIMEOUT = 2000;
  
  for (const [id, track] of trackedObjects.entries()) {
    if (now - track.lastSeen > TRACK_TIMEOUT) {
      trackedObjects.delete(id);
    }
  }
  
  let bestMatch: string | null = null;
  let bestIou = 0.3;
  
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
  
  const newId = `track_${nextTrackId++}`;
  trackedObjects.set(newId, { bbox, lastSeen: now });
  return newId;
}


/**
 * Convert JPEG base64 to Float32Array tensor (NO Buffer! Works on Android/iOS)
 */
export function jpegBase64ToTensor(base64: string, width = 320, height = 320): Float32Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binary = atob(clean);
  const data = new Float32Array(width * height * 3);
  let idx = 0;

  for (let i = 0; i < binary.length && idx < data.length; i += 4) {
    data[idx++] = binary.charCodeAt(i) / 255;
    data[idx++] = binary.charCodeAt(i + 1) / 255;
    data[idx++] = binary.charCodeAt(i + 2) / 255;
  }

  return data;
}

/**
 * Parse YOLOv8 output
 */
function parseYolo(
  preds: Float32Array, 
  classNames: string[],
  imageWidth: number,
  imageHeight: number,
  confThreshold = CONF_THRESHOLD
): RawDetection[] {
  const detections: RawDetection[] = [];
  const numClasses = classNames.length;
  const numPredictions = preds.length / (4 + numClasses);

  for (let i = 0; i < numPredictions; i++) {
    const cx = preds[i * (4 + numClasses) + 0] * imageWidth;
    const cy = preds[i * (4 + numClasses) + 1] * imageHeight;
    const w = preds[i * (4 + numClasses) + 2] * imageWidth;
    const h = preds[i * (4 + numClasses) + 3] * imageHeight;

    const x1 = cx - w / 2;
    const y1 = cy - h / 2;
    const x2 = cx + w / 2;
    const y2 = cy + h / 2;

    let maxScore = 0;
    let maxClassId = 0;

    for (let c = 0; c < numClasses; c++) {
      const score = preds[i * (4 + numClasses) + 4 + c];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = c;
      }
    }

    if (maxScore < confThreshold) continue; // Filter low-confidence early

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
 * Run local ONNX inference
 */
export async function runLocalModel(
  imageUri: string,
  classNames: string[],
  originalWidth = 640,  
  originalHeight = 480
): Promise<{ detections: Detection[], counters: CounterData, uniqueObjects: number }> {
  if (!session) {
    throw new Error('Model not loaded. Call loadFallbackModel() first.');
  }

  try {
    const base64 = await RNFS.readFile(imageUri, 'base64');
    
    const MODEL_WIDTH = 320;
    const MODEL_HEIGHT = 320;
    
    // AUTO DETECT image size from base64 if not provided!
    let realWidth = originalWidth;
    let realHeight = originalHeight;

    if (!realWidth || !realHeight) {
      // Extract size from JPEG metadata (super fast & reliable)
      const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
      const binary = atob(cleanBase64);
      const size = getImageSizeFromJpegBinary(binary);
      realWidth = size.width;
      realHeight = size.height;
    }

    // Fallback if still missing (should never happen)
    if (!realWidth || !realHeight) {
      realWidth = 1280;
      realHeight = 720;
      console.warn('Image size unknown, using fallback 1280x720');
    }

    console.log(`Scaling from ${MODEL_WIDTH}x${MODEL_HEIGHT} → ${realWidth}x${realHeight}`);

    const tensorData = jpegBase64ToTensor(base64, MODEL_WIDTH, MODEL_HEIGHT);
    const tensor = new ort.Tensor('float32', tensorData, [1, 3, MODEL_WIDTH, MODEL_HEIGHT]);

    const output = await session.run({ images: tensor });
    const preds = output['output0'].data as Float32Array;

    let rawDetections = parseYolo(preds, classNames, MODEL_WIDTH, MODEL_HEIGHT);
    
    // SAFE SCALING — NO MORE NaN!
    const scaleX = realWidth / MODEL_WIDTH;
    const scaleY = realHeight / MODEL_HEIGHT;

    rawDetections = rawDetections.map(det => {
      const [x1, y1, x2, y2] = det.bbox;
      return {
        ...det,
        bbox: [
          x1 * scaleX,
          y1 * scaleY,
          x2 * scaleX,
          y2 * scaleY,
        ] as [number, number, number, number],
      };
    });
    
    rawDetections = rawDetections.map(det => ({
      ...det,
      track_id: assignTrackId(det.bbox),
    }));
    
    let resolved = resolveConflicts(rawDetections, 0.7, SPECIFICITY_BONUS);
    resolved = sanitizeDetections(resolved);
    
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
    
    const filtered: RawDetection[] = [];
    resolved.sort((a, b) => b.confidence - a.confidence);
    
    for (const det of resolved) {
      if (!filtered.some(f => iou(det.bbox, f.bbox) > IOU_THRESHOLD)) {
        filtered.push(det);
      }
    }
    
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

function getImageSizeFromJpegBinary(binaryString: string): { width: number; height: number } {
  try {
    // JPEG SOF markers for size
    let i = 0;
    while (i < binaryString.length) {
      if (binaryString.charCodeAt(i) === 0xFF && binaryString.charCodeAt(i + 1) === 0xC0) {
        const height = (binaryString.charCodeAt(i + 5) << 8) | binaryString.charCodeAt(i + 6);
        const width = (binaryString.charCodeAt(i + 7) << 8) | binaryString.charCodeAt(i + 8);
        return { width, height };
      }
      i++;
    }
  } catch (e) {
    // ignore
  }
  return { width: 640, height: 640 }; // fallback
}

function sanitizeDetections(detections: RawDetection[]): RawDetection[] {
  return detections.filter(det => {
    const [x1, y1, x2, y2] = det.bbox;
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return false;
    if (x2 <= x1 || y2 <= y1) return false;
    if ((det.effective_confidence || 0) < CONF_THRESHOLD) return false;
    return true;
  });
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