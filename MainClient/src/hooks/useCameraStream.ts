import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { Socket } from 'socket.io-client';
import { runLocalModel, resetLocalTracking } from './useLocalModel';
import { Detection, CounterData } from '../types/detection.types';

const FRAME_INTERVAL = 800;

const DEFAULT_CLASS_NAMES = [
  'tomato_green', 'tomato_red', 'tomato_damaged',
  'tomato_green_small', 'tomato_green_medium', 'tomato_green_large',
  'tomato_red_small', 'tomato_red_medium', 'tomato_red_large',
  'bellpepper_green', 'bellpepper_red', 'bellpepper_damaged',
  'bellpepper_green_small', 'bellpepper_green_medium', 'bellpepper_green_large',
  'bellpepper_red_small', 'bellpepper_red_medium', 'bellpepper_red_large',
];

interface UseCameraStreamProps {
  classNames?: string[];
  isUsingLocalModel: boolean;
  localModelReady: boolean;
  onLocalDetections?: (detections: Detection[], counters: CounterData, uniqueObjects: number) => void;
}

export const useCameraStream = (
  socketRef: React.MutableRefObject<Socket | null>,
  { 
    classNames = DEFAULT_CLASS_NAMES,
    isUsingLocalModel,
    localModelReady,
    onLocalDetections
  }: UseCameraStreamProps
) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false);

  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];

  const [localDetections, setLocalDetections] = useState<Detection[]>([]);
  const [counters, setCounters] = useState<CounterData | null>(null);
  const [uniqueObjects, setUniqueObjects] = useState(0);

  // Capture and process frame
  const captureAndSend = useCallback(async () => {
    if (!cameraRef.current || isCapturingRef.current) return;

    isCapturingRef.current = true;

    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 50 });
      
      const resized = await ImageResizer.createResizedImage(
        photo.path,
        640,    // force width
        640,    // force height
        'JPEG',
        60,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );

      const base64Image = await RNFS.readFile(resized.uri, 'base64');
      
      // Decide which inference method to use
      const shouldUseLocal = isUsingLocalModel || !socketRef.current?.connected;
      
      if (shouldUseLocal && localModelReady) {
        // Use local model
        console.log('📱 Running local inference');
        try {
          const result = await runLocalModel(resized.uri, classNames, 640, 480);
          setLocalDetections(result.detections);
          setCounters(result.counters);
          setUniqueObjects(result.uniqueObjects);
          
          // Notify parent component
          if (onLocalDetections) {
            onLocalDetections(result.detections, result.counters, result.uniqueObjects);
          }
        } catch (error) {
          console.error('❌ Local inference error:', error);
        }
      } else if (socketRef.current?.connected) {
        // Use server
        console.log('🌐 Sending frame to server');
        socketRef.current.emit('frame', base64Image);
      } else {
        console.warn('⚠️ No inference method available');
      }
      
      // Cleanup temp file
      await RNFS.unlink(resized.uri).catch(() => {});
    } catch (error: any) {
      console.error('Frame capture error:', error.message);
    } finally {
      isCapturingRef.current = false;
    }
  }, [socketRef, classNames, isUsingLocalModel, localModelReady, onLocalDetections]);

  const startStreaming = useCallback(() => {
    console.log('▶️ Starting camera stream');
    setIsStreaming(true);
    streamInterval.current = setInterval(captureAndSend, FRAME_INTERVAL);
  }, [captureAndSend]);

  const stopStreaming = useCallback(() => {
    console.log('⏹️ Stopping camera stream');
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
    setIsStreaming(false);
  }, []);

  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      stopStreaming();
    } else {
      startStreaming();
    }
  }, [isStreaming, startStreaming, stopStreaming]);

  const resetCounters = useCallback(() => {
    if (socketRef.current?.connected && !isUsingLocalModel) {
      socketRef.current.emit('reset_counters');
    } else {
      resetLocalTracking();
      setCounters(null);
      setUniqueObjects(0);
      setLocalDetections([]);
    }
  }, [socketRef, isUsingLocalModel]);

  // Auto-switch logic when mode changes
  useEffect(() => {
    if (isStreaming) {
      console.log(`🔄 Inference mode switched to: ${isUsingLocalModel ? 'LOCAL' : 'SERVER'}`);
    }
  }, [isUsingLocalModel, isStreaming]);

  return {
    isStreaming,
    toggleStreaming,
    resetCounters,
    cameraRef,
    device,
    localDetections,
    counters,
    uniqueObjects,
    isUsingLocalModel,
  };
};