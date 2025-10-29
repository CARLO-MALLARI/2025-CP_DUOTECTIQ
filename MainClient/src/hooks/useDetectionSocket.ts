import { useState, useEffect, useRef, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { Detection, DetectionData, CounterData } from '../types/detection.types';
import { SettingsContext } from '../context/SettingsContext';

export const useDetectionSocket = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [connected, setConnected] = useState(false);
  const [counters, setCounters] = useState<CounterData | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { serverUrl } = useContext(SettingsContext);
    
  useEffect(() => {
    initializeSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = io(serverUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketRef.current.on('detections', (data: DetectionData) => {
      setDetections(data.detections || []);
      if (data.counters) setCounters(data.counters);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  };

  return { detections, connected, counters, socketRef };
};