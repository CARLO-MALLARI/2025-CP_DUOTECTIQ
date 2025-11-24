import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { Detection, DetectionData, CounterData } from '../types/detection.types';
import { SettingsContext } from '../context/SettingsContext';
import { auth } from '../lib/firebase';
import { uploadSummaryToFirestore } from '../helpers/firebaseUploadHelper';
import { runLocalModel, loadFallbackModel, resetLocalTracking } from './useLocalModel';

interface EnhancedDetectionData extends DetectionData {
  summary?: any[];
  isLocal?: boolean; // Flag to indicate if detection came from local model
}

export const useDetectionSocket = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [connected, setConnected] = useState(false);
  const [counters, setCounters] = useState<CounterData | null>(null);
  const [isUsingLocalModel, setIsUsingLocalModel] = useState(false);
  const [localModelReady, setLocalModelReady] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { serverUrl } = useContext(SettingsContext);
  const currentUrlRef = useRef<string>(serverUrl);
  
  // Track last detection time for staleness detection
  const lastDetectionTimeRef = useRef<number>(Date.now());
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const user = auth.currentUser;  
  const userId = user ? user.uid : 'anonymous';

  // Load local model on mount
  useEffect(() => {
    const initLocalModel = async () => {
      try {
        console.log('🔄 Loading local ONNX model...');
        await loadFallbackModel();
        setLocalModelReady(true);
        console.log('✅ Local model ready for fallback');
      } catch (error) {
        console.error('❌ Failed to load local model:', error);
        setLocalModelReady(false);
      }
    };

    initLocalModel();
  }, []);

  // Monitor connection health
  useEffect(() => {
    const checkConnectionHealth = () => {
      const timeSinceLastDetection = Date.now() - lastDetectionTimeRef.current;
      const STALE_THRESHOLD = 10000; // 10 seconds
      
      // If connected but no detections for a while, consider it stale
      if (connected && timeSinceLastDetection > STALE_THRESHOLD) {
        console.warn('⚠️ Connection appears stale, switching to local model');
        setIsUsingLocalModel(true);
      }
      
      // If disconnected and we have local model, use it
      if (!connected && localModelReady) {
        setIsUsingLocalModel(true);
      }
      
      // If reconnected and receiving data, switch back to server
      if (connected && timeSinceLastDetection < STALE_THRESHOLD) {
        setIsUsingLocalModel(false);
      }
    };

    // Check every 5 seconds
    connectionCheckIntervalRef.current = setInterval(checkConnectionHealth, 5000);

    return () => {
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
    };
  }, [connected, localModelReady]);

  // Socket connection management
  useEffect(() => {
    if (currentUrlRef.current === serverUrl && socketRef.current?.connected) {
      console.log('⏭️  Socket already connected to this URL, skipping reconnect');
      return;
    }

    console.log('🔄 Socket effect triggered');
    console.log('   Old URL:', currentUrlRef.current);
    console.log('   New URL:', serverUrl);
    
    currentUrlRef.current = serverUrl;

    // Clean up previous socket
    if (socketRef.current) {
      console.log('🧹 Cleaning up old socket connection');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }

    // Create new socket connection
    console.log('🔌 Creating new socket connection to:', serverUrl);
    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('✅ Socket connected to:', serverUrl);
      setConnected(true);
      setIsUsingLocalModel(false); // Switch back to server when connected
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected from:', serverUrl, 'Reason:', reason);
      setConnected(false);
      
      // Switch to local model if available
      if (localModelReady) {
        console.log('📱 Switching to local inference mode');
        setIsUsingLocalModel(true);
      }
    });

    newSocket.on('detections', async (data: DetectionData & { summary?: any[] }) => {
      const timestamp = new Date().toISOString();
      lastDetectionTimeRef.current = Date.now(); // Update last detection time
      
      setDetections(data.detections || []);
      if (data.counters) setCounters(data.counters);
      
      // Mark as server-based detection
      setIsUsingLocalModel(false);

      // Upload summary data if available
      if (data.summary && data.summary.length > 0) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user, skipping Firestore upload');
          return;
        }

        try {
          await uploadSummaryToFirestore(currentUser.uid, data.summary, timestamp);
        } catch (error) {
          console.error('Failed to upload summary:', error);
        }
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error for URL:', serverUrl, error.message);
      setConnected(false);
      
      // Switch to local model on connection error
      if (localModelReady) {
        console.log('📱 Connection error, switching to local model');
        setIsUsingLocalModel(true);
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber, 'for URL:', serverUrl);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed for URL:', serverUrl);
      setConnected(false);
      
      if (localModelReady) {
        console.log('📱 Reconnection failed, using local model');
        setIsUsingLocalModel(true);
      }
    });

    return () => {
      console.log('🧹 useDetectionSocket cleanup');
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [serverUrl, localModelReady]);

  // Reset counters function
  const resetCounters = useCallback(() => {
    if (connected && socketRef.current) {
      socketRef.current.emit('reset_counters');
    } else {
      // Reset local tracking
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
    resetCounters
  };
};