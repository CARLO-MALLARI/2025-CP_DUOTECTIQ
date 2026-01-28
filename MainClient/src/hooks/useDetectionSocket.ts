import {useState, useEffect, useRef, useCallback} from 'react';
import io, {Socket} from 'socket.io-client';
import {
  Detection,
  DetectionData,
  CounterData,
  FrozenDetection,
  CropSummary,
} from '../types/detection.types';
import {auth} from '../lib/firebase';
import {uploadSummaryToFirestore} from '../helpers/firebaseUploadHelper';
import {
  runLocalModel,
  loadFallbackModel,
  resetLocalTracking,
} from './useLocalModel';
import {sharedStore} from '../stores/sharedStore';

interface EnhancedDetectionData extends DetectionData {
  summary?: any[];
  isLocal?: boolean;
}

export const useDetectionSocket = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [connected, setConnected] = useState(false);
  const [counters, setCounters] = useState<CounterData | null>(null);
  const [isUsingLocalModel, setIsUsingLocalModel] = useState(false);
  const [localModelReady, setLocalModelReady] = useState(false);
  const [frozenFrame, setFrozenFrame] = useState<FrozenDetection | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [pendingDetections, setPendingDetections] = useState<Detection[]>([]); // NEW

  const socketRef = useRef<Socket | null>(null);
  const currentUrlRef = useRef<string>(sharedStore.serverUrl);
  const currentFrameRef = useRef<string>(''); // Store current frame as base64
  const lastDetectionTimeRef = useRef<number>(Date.now());
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const user = auth.currentUser;

  // Load local fallback model
  useEffect(() => {
    const initLocalModel = async () => {
      try {
        console.log('🔄 Loading local ONNX model...');
        await loadFallbackModel();
        setLocalModelReady(true);
        console.log('✅ Local model ready');
      } catch (error) {
        console.error('❌ Failed to load local model', error);
        setLocalModelReady(false);
      }
    };
    initLocalModel();
  }, []);

  // Monitor connection health
  useEffect(() => {
    const checkHealth = () => {
      const delta = Date.now() - lastDetectionTimeRef.current;
      const STALE_THRESHOLD = 10000;
      // if (connected && delta > STALE_THRESHOLD) {
      //   console.warn('⚠️ Connection appears stale, switching to local model');
      //   setIsUsingLocalModel(true);
      // }
      if (connected && delta < STALE_THRESHOLD) setIsUsingLocalModel(false);
    };
    connectionCheckIntervalRef.current = setInterval(checkHealth, 5000);
    return () => clearInterval(connectionCheckIntervalRef.current!);
  }, [connected]);

  // Function to create/connect socket
  const connectSocket = useCallback(
    (url: string) => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
        setConnected(false);
      }

      console.log('🔌 Connecting to:', url);
      const socket = io(url, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;
      currentUrlRef.current = url;

      socket.on('connect', () => {
        console.log('✅ Socket connected to:', url);
        setConnected(true);
      });

      socket.on('connect', () => {
        console.log('✅ Socket connected to:', url);
        setConnected(true);
      });

      socket.on('detections', (data: DetectionData) => {
        lastDetectionTimeRef.current = Date.now();
        setDetections(data.detections || []);
        if (data.counters) setCounters(data.counters);
      });

      // NEW: Listen for count updates
      socket.on(
        'count_updated',
        (data: {counters: CounterData; summary: any[]; message: string}) => {
          setCounters(data.counters);
          console.log('✅', data.message);
        },
      );

      socket.on('disconnect', reason => {
        console.log('🔌 Socket disconnected from:', url, 'Reason:', reason);
        setConnected(false);
      });

      socket.on(
        'detections',
        async (data: DetectionData & {summary?: any[]}) => {
          lastDetectionTimeRef.current = Date.now();
          setDetections(data.detections || []);
          if (data.counters) setCounters(data.counters);
          setIsUsingLocalModel(false);

          // Keep original Firebase upload logic
          if (data.summary && data.summary.length > 0 && user) {
            const formatted: any = {};
            for (const item of data.summary) {
              const crop =
                item.crop.toLowerCase() === 'bellpepper'
                  ? 'Bell Pepper'
                  : item.crop;
              const size = item.type.toLowerCase();
              const color = (item.color || '').toLowerCase();
              if (!formatted[crop]) {
                formatted[crop] = {
                  small: {green: 0, red: 0},
                  medium: {green: 0, red: 0},
                  large: {green: 0, red: 0},
                  total: {damaged: 0},
                };
              }
              if (item.status.toLowerCase() === 'damaged') {
                formatted[crop].total.damaged += item.amount;
              } else if (formatted[crop][size] && color) {
                formatted[crop][size][color] += item.amount;
              }
            }
            try {
              await uploadSummaryToFirestore(
                user.uid,
                formatted,
                new Date().toISOString(),
              );
            } catch (err) {
              console.error('Failed to upload summary:', err);
            }
          }
        },
      );

      socket.on('connect_error', err => {
        console.error('❌ Socket connection error for URL:', url, err.message);
        setConnected(false);
      });

      socket.on('reconnect_attempt', attempt => {
        console.log('🔄 Reconnection attempt', attempt, 'for URL:', url);
      });

      socket.on('reconnect_failed', () => {
        console.error('❌ Reconnection failed for URL:', url);
        setConnected(false);
      });
    },
    [user],
  );

  const countCurrentDetections = useCallback(() => {
    if (!socketRef.current?.connected || detections.length === 0) {
      console.warn('⚠️ Not connected or no detections to count');
      return;
    }

    console.log('➕ Counting', detections.length, 'detections');
    socketRef.current.emit('manual_count', {detections});
  }, [detections]);

  // Subscribe to shared store changes and connect
  useEffect(() => {
    connectSocket(sharedStore.serverUrl);
    const unsubscribe = sharedStore.subscribe(newUrl => {
      if (newUrl !== currentUrlRef.current) {
        console.log('🔄 Server URL changed, reconnecting socket...');
        connectSocket(newUrl);
      }
    });
    return () => {
      unsubscribe();
      socketRef.current?.disconnect();
    };
  }, [connectSocket]);

  const resetCounters = useCallback(() => {
    if (connected && socketRef.current) {
      socketRef.current.emit('reset_counters');
    } else {
      resetLocalTracking();
      setCounters(null);
    }
  }, [connected]);

  return {
    detections,
    connected,
    counters,
    socketRef,
    isUsingLocalModel,
    localModelReady,
    countCurrentDetections,
    resetCounters,
  };
};

function generateSummaryFromDetections(detections: Detection[]): CropSummary[] {
  const counts: Record<string, CropSummary> = {};

  detections.forEach(det => {
    // Create unique key for grouping
    const key = `${det.crop}_${det.size || 'unknown'}_${det.color}_${
      det.status
    }`;

    if (!counts[key]) {
      counts[key] = {
        crop: det.crop,
        type: det.size || 'n/a',
        color: det.color || 'n/a',
        status: det.status,
        amount: 0,
      };
    }
    counts[key].amount += 1;
  });

  return Object.values(counts);
}
