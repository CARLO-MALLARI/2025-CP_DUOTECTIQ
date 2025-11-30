import * as ort from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import jpeg from 'jpeg-js';
import { Platform } from 'react-native';
import { Detection, CounterData } from '../types/detection.types';

let session: ort.InferenceSession | null = null;

// Session state for tracking
let seenTracks = new Set<string>();
let sessionCounters: CounterData = createEmptyCounter();
let nextTrackId = 0;

const CONF_THRESHOLD = 0.7; 
const IOU_THRESHOLD = 0.6;
const TOP_K = 1024;
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

export async function loadFallbackModel(): Promise<boolean> {
  try {
    let modelPath: string;
    
    if (Platform.OS === 'android') {
     const cachePath = `${RNFS.CachesDirectoryPath}/yolov8.onnx`;
      
      try {
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


export function jpegBase64ToTensorCHW(base64: string, targetW: number, targetH: number): Float32Array {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;

  // decode base64 into bytes
  let binary = '';
  try {
    binary = atob(clean);
  } catch (e) {
    const buff = Buffer.from(clean, 'base64');
    binary = Array.prototype.map.call(buff, (ch: any) => String.fromCharCode(ch)).join('');
  }
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const decoded = jpeg.decode(bytes, { useTArray: true });
  const srcW = decoded.width;
  const srcH = decoded.height;
  const srcPixels = decoded.data; // RGBA

  if (srcW === targetW && srcH === targetH) {
    // Fast path - no resize, just produce CHW
    const out = new Float32Array(3 * targetW * targetH);
    let px = 0;
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const r = srcPixels[px++] / 255;
        const g = srcPixels[px++] / 255;
        const b = srcPixels[px++] / 255;
        px++; // skip alpha
        const idx = y * targetW + x;
        out[0 * (targetW * targetH) + idx] = r;
        out[1 * (targetW * targetH) + idx] = g;
        out[2 * (targetW * targetH) + idx] = b;
      }
    }
    return out;
  }

  // Letterbox/resize preserving aspect ratio (nearest-neighbor)
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const resizeW = Math.round(srcW * scale);
  const resizeH = Math.round(srcH * scale);
  const padX = Math.floor((targetW - resizeW) / 2);
  const padY = Math.floor((targetH - resizeH) / 2);

  // Build resized buffer (RGBA) sized resizeW x resizeH with NN sampling
  const resizedRGBA = new Uint8ClampedArray(resizeW * resizeH * 4);

  for (let y = 0; y < resizeH; y++) {
    const srcY = Math.min(srcH - 1, Math.floor(y / scale));
    for (let x = 0; x < resizeW; x++) {
      const srcX = Math.min(srcW - 1, Math.floor(x / scale));
      const sidx = (srcY * srcW + srcX) * 4;
      const didx = (y * resizeW + x) * 4;
      resizedRGBA[didx] = srcPixels[sidx];
      resizedRGBA[didx + 1] = srcPixels[sidx + 1];
      resizedRGBA[didx + 2] = srcPixels[sidx + 2];
      resizedRGBA[didx + 3] = srcPixels[sidx + 3];
    }
  }

  // Now create final CHW float buffer with padding
  const out = new Float32Array(3 * targetW * targetH);
  // initialize with 0 (black) - already zeroed by Float32Array default

  for (let y = 0; y < resizeH; y++) {
    for (let x = 0; x < resizeW; x++) {
      const srcIdx = (y * resizeW + x) * 4;
      const r = resizedRGBA[srcIdx] / 255;
      const g = resizedRGBA[srcIdx + 1] / 255;
      const b = resizedRGBA[srcIdx + 2] / 255;
      const tx = x + padX;
      const ty = y + padY;
      const idx = ty * targetW + tx;
      out[0 * (targetW * targetH) + idx] = r;
      out[1 * (targetW * targetH) + idx] = g;
      out[2 * (targetW * targetH) + idx] = b;
    }
  }

  console.log(`🔁 resized ${srcW}x${srcH} -> ${resizeW}x${resizeH} (pad ${padX},${padY}) -> target ${targetW}x${targetH}`);
  return out;
}

/* -------------------- Utilities (sigmoid, NMS) -------------------- */
function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function boxIoU(boxA: number[], boxB: number[]) {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[2], boxB[2]);
  const yB = Math.min(boxA[3], boxB[3]);
  const interW = Math.max(0, xB - xA);
  const interH = Math.max(0, yB - yA);
  const interArea = interW * interH;
  const areaA = Math.max(0, (boxA[2] - boxA[0])) * Math.max(0, (boxA[3] - boxA[1]));
  const areaB = Math.max(0, (boxB[2] - boxB[0])) * Math.max(0, (boxB[3] - boxB[1]));
  const union = areaA + areaB - interArea;
  return union > 0 ? interArea / union : 0;
}

/**
 * Greedy NMS
 * boxes: [ [x1,y1,x2,y2], ... ]
 * scores: [s, ...]
 */
function nonMaxSuppression(boxes: number[][], scores: number[], iouThreshold = 0.45, topK = 100) {
  const idxs = scores.map((s, i) => [s, i] as [number, number])
    .sort((a, b) => b[0] - a[0])
    .slice(0, topK)
    .map(x => x[1]);

  const keep: number[] = [];
  while (idxs.length > 0) {
    const i = idxs.shift() as number;
    keep.push(i);
    for (let j = idxs.length - 1; j >= 0; j--) {
      const idx = idxs[j];
      if (boxIoU(boxes[i], boxes[idx]) > iouThreshold) {
        idxs.splice(j, 1);
      }
    }
  }
  return keep;
}

/**
 * Parse YOLOv8 output
 */
function parseYoloPostproc(
  preds: Float32Array,
  classNames: string[],
  modelW: number,
  modelH: number,
  confThreshold = 0.25,
  iouThreshold = 0.45,
): RawDetection[] {
  const numClasses = classNames.length;
  const recordLen = 4 + numClasses;
  const numPredictions = Math.floor(preds.length / recordLen);

  // Debug: show some stats about preds
  let minV = Number.POSITIVE_INFINITY, maxV = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < Math.min(1000, preds.length); i++) {
    minV = Math.min(minV, preds[i]);
    maxV = Math.max(maxV, preds[i]);
  }
  console.log(`🔍 Parsing ${numPredictions} predictions. sample preds range ≈ [${minV.toFixed(3)}, ${maxV.toFixed(3)}]`);

  const boxes: number[][] = [];
  const scores: number[] = [];
  const classIdxs: number[] = [];

  for (let i = 0; i < numPredictions; i++) {
    const base = i * recordLen;

    let x1 = preds[base + 0];
    let y1 = preds[base + 1];
    let x2 = preds[base + 2];
    let y2 = preds[base + 3];

    // If coords are normalized (0-1), scale them to modelW/modelH
    // Heuristic: if any coordinate is <=1.0, treat them as normalized.
    if (x1 <= 1.01 && y1 <= 1.01 && x2 <= 1.01 && y2 <= 1.01) {
      x1 = x1 * modelW;
      y1 = y1 * modelH;
      x2 = x2 * modelW;
      y2 = y2 * modelH;
    }

    // Strict validation
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) continue;
    if (x2 <= x1 || y2 <= y1) continue;
    if (x1 < 0 || y1 < 0 || x2 > modelW || y2 > modelH) {
      // allow small epsilon overflow due to rounding
      if (x1 < -1 || y1 < -1 || x2 > modelW + 1 || y2 > modelH + 1) continue;
    }

    const bboxWidth = x2 - x1;
    const bboxHeight = y2 - y1;
    if (bboxWidth < 3 || bboxHeight < 3) continue; // allow smaller min now

    // Find best class score — apply sigmoid to each class logit
    let bestScore = 0;
    let bestClass = -1;
    for (let c = 0; c < numClasses; c++) {
      const raw = preds[base + 4 + c];
      const classProb = sigmoid(raw); // <-- apply sigmoid here
      if (classProb > bestScore) {
        bestScore = classProb;
        bestClass = c;
      }
    }

    if (bestScore >= confThreshold && bestClass >= 0 && bestClass < numClasses) {
      boxes.push([x1, y1, x2, y2]);
      scores.push(bestScore);
      classIdxs.push(bestClass);

      if (boxes.length <= 8) {
        console.log(`✅ DETECTION ${boxes.length}: ${classNames[bestClass]} (${bestScore.toFixed(3)})`);
      }
    }
  }

  console.log(`🔍 ${boxes.length} detections passed ≥${confThreshold}`);

  if (boxes.length === 0) return [];

  const keep = nonMaxSuppression(boxes, scores, 0.4, 100);
  const finalDetections: RawDetection[] = [];
  for (const idx of keep) {
    const className = classNames[classIdxs[idx]];
    const { label, color, size, is_damaged } = parseClassName(className);
    finalDetections.push({
      bbox: boxes[idx] as [number, number, number, number],
      class: className,
      confidence: scores[idx],
      label, color, size, is_damaged,
    });
  }

  console.log(`🎯 FINAL: ${finalDetections.length} detections after NMS`);
  return finalDetections;
}



export async function runLocalModel(
  imageUri: string,
  classNames: string[],
  originalWidth = 640,
  originalHeight = 640
): Promise<{ detections: Detection[], counters: CounterData, uniqueObjects: number }> {
  if (!session) {
    throw new Error('Model not loaded. Call loadFallbackModel() first.');
  }

  try {
    // Read resized image file to base64
    const base64 = await RNFS.readFile(imageUri, 'base64');

    // MODEL size must match ONNX export
    const MODEL_SIZE = 640;

    // Convert base64 JPEG to CHW Float32Array
    const chw = jpegBase64ToTensorCHW(base64, MODEL_SIZE, MODEL_SIZE);

    // ONNXRuntime expects a Tensor of shape [1,3,H,W]
    const inputTensor = new ort.Tensor('float32', chw, [1, 3, MODEL_SIZE, MODEL_SIZE]);

    // Run session
    const outputMap = await session.run({ images: inputTensor });

    // If model returns multiple outputs, pick the right one
    const outKey = Object.keys(outputMap)[0];
    const rawOut = outputMap[outKey].data as Float32Array;

    {
      let minV = Infinity, maxV = -Infinity;
      for (let i=0;i<Math.min(rawOut.length, 2000);i++){
        minV = Math.min(minV, rawOut[i]);
        maxV = Math.max(maxV, rawOut[i]);
      }
      console.log(`🔬 rawOut sample range: [${minV.toFixed(3)}, ${maxV.toFixed(3)}], length=${rawOut.length}`);
    }
    let rawDetections = parseYoloPostproc(rawOut, classNames, MODEL_SIZE, MODEL_SIZE, CONF_THRESHOLD, 0.45);

    let realWidth = originalWidth;
    let realHeight = originalHeight;
    if (!realWidth || !realHeight) {
      // try to read size from jpeg metadata as fallback
      const clean = base64.includes(',') ? base64.split(',')[1] : base64;
      let binary = '';
      try { binary = atob(clean); } catch (e) { /* ignore */ }
      const size = getImageSizeFromJpegBinary(binary);
      realWidth = size.width;
      realHeight = size.height;
    }

    let resolved = resolveConflicts(rawDetections, 0.5, 0.2);
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

    // final dedup by IoU
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

    console.log("Output keys:", Object.keys(outputMap));
    console.log('🔍 Model output shape:', outputMap[outKey].dims);
    console.log('🔍 Raw detections before filtering:', rawDetections.length);
    console.log('🔍 First few class names from model:', classNames.slice(0, 10));
    console.log('🔍 All detections with class names:');
    rawDetections.slice(0, 5).forEach((det, i) => {
      console.log(`  ${i}: ${det.class} (${det.confidence})`);
    });

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