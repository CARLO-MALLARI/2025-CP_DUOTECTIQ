import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { Detection, DetectionData } from '../types/detection.types';

const SERVER_URL = 'http://192.168.100.2:5000';

export const useDetectionSocket = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    initializeSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = io(SERVER_URL, {
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
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  };

  return { detections, connected, socketRef };
};