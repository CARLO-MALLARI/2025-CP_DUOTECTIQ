import { useState, useEffect, useRef, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { Detection, DetectionData, CounterData } from '../types/detection.types';
import { SettingsContext } from '../context/SettingsContext';
import { auth } from '../lib/firebase';
import { uploadSummaryToFirestore } from '../helpers/firebaseUploadHelper';
export const useDetectionSocket = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [connected, setConnected] = useState(false);
  const [counters, setCounters] = useState<CounterData | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { serverUrl } = useContext(SettingsContext);
  const currentUrlRef = useRef<string>(serverUrl);

  const user = auth.currentUser;  
  const userId = user ? user.uid : 'anonymous';
  if (user) {
    console.log('User ID:', user.uid);
  } else {
    console.log('No user logged in');
  }
  useEffect(() => {
    // Skip if URL hasn't actually changed
    if (currentUrlRef.current === serverUrl && socketRef.current?.connected) {
      console.log('⏭️  Socket already connected to this URL, skipping reconnect');
      return;
    }

    console.log('🔄 Socket effect triggered');
    console.log('   Old URL:', currentUrlRef.current);
    console.log('   New URL:', serverUrl);
    
    // Update current URL reference
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
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected from:', serverUrl, 'Reason:', reason);
      setConnected(false);
    });

    newSocket.on('detections', async (data: DetectionData & { summary?: any[] }) => {
      const timestamp = new Date().toISOString();
      setDetections(data.detections || []);
      if (data.counters) setCounters(data.counters);

      // 🆕 Upload summary data (if any)
      if (data.summary && data.summary.length > 0) {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.warn('No authenticated user, skipping Firestore upload');
          return;
        }

        const realUserId = currentUser.uid;
        console.log('Uploading with userId:', realUserId);

        try {
          await uploadSummaryToFirestore(realUserId, data.summary, timestamp);
        } catch (error) {
          console.error('Failed to upload summary:', error);
        }
      }
    });
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error for URL:', serverUrl, error.message);
      setConnected(false);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber, 'for URL:', serverUrl);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed for URL:', serverUrl);
      setConnected(false);
    });

    // Cleanup function
    return () => {
      console.log('🧹 useDetectionSocket cleanup');
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [serverUrl]); // Only re-run when serverUrl changes

  return { detections, connected, counters, socketRef };
};