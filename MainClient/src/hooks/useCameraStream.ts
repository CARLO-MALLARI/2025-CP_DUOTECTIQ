import { useState, useRef, useCallback } from 'react';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import { Socket } from 'socket.io-client';

const FRAME_INTERVAL = 800;

export const useCameraStream = (socketRef: React.MutableRefObject<Socket | null>) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false);

  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];

  const captureAndSend = useCallback(async () => {
    if (!cameraRef.current || !socketRef.current?.connected || isCapturingRef.current) {
      return;
    }

    isCapturingRef.current = true;

    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 50 });
      
      const resized = await ImageResizer.createResizedImage(
        photo.path,
        640,
        480,
        'JPEG',
        60,
        0,
        undefined,
        false,
        { mode: 'contain', onlyScaleDown: true }
      );

      const base64Image = await RNFS.readFile(resized.uri, 'base64');
      const encoded = `data:image/jpeg;base64,${base64Image}`;
      
      socketRef.current.emit('frame', encoded);
      
      // Cleanup temp file
      await RNFS.unlink(resized.uri).catch(() => {});
    } catch (error: any) {
      console.error('Frame capture error:', error.message);
    } finally {
      isCapturingRef.current = false;
    }
  }, [socketRef]);

  const startStreaming = useCallback(() => {
    setIsStreaming(true);
    streamInterval.current = setInterval(captureAndSend, FRAME_INTERVAL);
  }, [captureAndSend]);

  const stopStreaming = useCallback(() => {
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

  return {
    isStreaming,
    toggleStreaming,
    cameraRef,
    device,
  };
};