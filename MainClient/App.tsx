import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import io from 'socket.io-client';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

const SERVER_URL = 'http://192.168.100.2:5000'; // Change to your IP
const FRAME_INTERVAL = 500;

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [cameraPermission, setCameraPermission] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [results, setResults] = useState<string>('No results yet');

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const socketRef = useRef<any>(null);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];
  const streamInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await Camera.getCameraPermissionStatus();
        console.log('Initial camera permission:', status);
        if (status === 'not-determined') {
          const newStatus = await Camera.requestCameraPermission();
          setCameraPermission(newStatus);
        } else {
          setCameraPermission(status);
        }
      } catch (error) {
        console.error('Permission check error:', error);
      }
    };
    checkPermission();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
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
        socketRef.current.on('detections', (data: any) => {
          console.log('Received detections:', data);
          setDetections(data.detections || []);
          setResults(JSON.stringify(data.detections, null, 2));
        });

        socketRef.current.on('connect_error', (err: any) => {
          console.error('Socket connection error:', err.message);
          setConnected(false);
        });
        socketRef.current.on('error', (err: any) => {
          console.error('Socket error:', err);
        });
      } catch (error) {
        console.error('Socket init error:', error);
      }
    };
    init();

    return () => {
      socketRef.current?.disconnect();
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  const captureAndSend = async () => {
    if (!cameraRef.current || !connected) {
      console.warn('Cannot capture: cameraRef:', !!cameraRef.current, 'connected:', connected);
      return;
    }
    try {
      console.log('Capturing photo...');
      const photo = await cameraRef.current.takePhoto();
      console.log('Photo captured:', photo.path);

      const resized = await ImageResizer.createResizedImage(photo.path, 640, 480, 'JPEG', 60);
      console.log('Resized image:', resized.uri);

      const base64Image = await RNFS.readFile(resized.uri, 'base64');
      const encoded = `data:image/jpeg;base64,${base64Image}`;
      console.log('Encoded image length:', encoded.length);

      if (encoded && encoded.startsWith('data:image')) {
        socketRef.current.emit('frame', encoded);
        console.log('Frame sent to server');
      } else {
        console.error('Invalid base64 encoding');
      }
    } catch (error) {
      console.error('Frame send error:', error);
      setResults('Error capturing frame');
    }
  };

  // Toggle streaming loop
  const toggleStreaming = () => {
    if (isStreaming) {
      if (streamInterval.current) {
        clearInterval(streamInterval.current);
        streamInterval.current = null;
      }
      setIsStreaming(false);
      setResults('Stopped streaming');
      console.log('Streaming stopped');
    } else {
      streamInterval.current = setInterval(captureAndSend, FRAME_INTERVAL);
      setIsStreaming(true);
      setResults('Streaming...');
      console.log('Streaming started');
    }
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };
  const textColor = isDarkMode ? Colors.white : Colors.black;

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={textColor} />
          <Text style={[styles.statusText, { color: textColor }]}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraPermission !== 'granted' || !device) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={textColor} />
          <Text style={[styles.statusText, { color: textColor }]}>
            {cameraPermission !== 'granted'
              ? 'Waiting for camera permission...'
              : 'Loading camera device...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  if (!device) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <Text style={[styles.statusText, { color: textColor }]}>No camera device found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />
          
          {/* Overlay layer */}
          <View style={StyleSheet.absoluteFill}>
            {detections.map((det, index) => {
              const [x1, y1, x2, y2] = det.bbox;
              return (
                <View
                  key={index}
                  style={{
                    position: 'absolute',
                    left: x1,
                    top: y1,
                    width: x2 - x1,
                    height: y2 - y1,
                    borderWidth: 2,
                    borderColor: '#00FF00',
                    borderRadius: 4,
                  }}
                >
                  <Text style={styles.label}>
                    {det.class} ({(det.confidence * 100).toFixed(1)}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        <Text style={[styles.statusText, { color: textColor, textAlign: 'center' }]}>
          {connected ? 'Connected to server ✅' : 'Connecting...'}
        </Text>
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: textColor }]}>Detections</Text>
          <Text style={[styles.resultsText, { color: textColor }]} numberOfLines={8}>
            {results}
          </Text>
        </View>
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isStreaming ? '#DC2626' : '#2563EB' }]}
            onPress={toggleStreaming}
          >
            <Text style={styles.buttonText}>{isStreaming ? 'Stop Stream' : 'Start Stream'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cameraContainer: {
    flex: 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.7)',
    color: '#000',
    paddingHorizontal: 4,
    fontSize: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  camera: { flex: 1 },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultsTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  resultsText: { fontSize: 14, lineHeight: 18 },
  controlPanel: { flexDirection: 'row', justifyContent: 'center' },
  button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusText: { fontSize: 18, marginTop: 16 },
});

export default App;