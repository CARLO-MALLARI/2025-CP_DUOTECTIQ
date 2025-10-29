import { useState, useEffect } from 'react';
import { Camera } from 'react-native-vision-camera';

export const useCameraPermission = () => {
  const [permission, setPermission] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setupPermission();
  }, []);

  const setupPermission = async () => {
    try {
      const current = await Camera.getCameraPermissionStatus();
      if (current !== 'granted') {
        const newStatus = await Camera.requestCameraPermission();
        setPermission(newStatus);
      } else {
        setPermission(current);
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setPermission('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setPermission(status);
  };

  return { permission, isLoading, requestPermission };
};