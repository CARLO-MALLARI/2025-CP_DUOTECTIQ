import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import io from 'socket.io-client';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import BottomNavBar from '../components/BottomNavbar';

const SERVER_URL = 'http://10.0.11.197:5000';
const FRAME_INTERVAL = 500;

const ScanScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [cameraPermission, setCameraPermission] = useState<string | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [results, setResults] = useState<string>('No results yet');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState(false);

  const socketRef = useRef<any>(null);
  const cameraRef = useRef<Camera>(null);
  const streamInterval = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const permissionCheckedRef = useRef<boolean>(false);
  
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') ?? devices[0];
  const cameraWidthRef = useRef(0);
  const cameraHeightRef = useRef(0);

  useEffect(() => {
    const setupPermission = async () => {
      const current = await Camera.getCameraPermissionStatus();
      if (current !== 'granted') {
        const newStatus = await Camera.requestCameraPermission();
        setCameraPermission(newStatus);
      } else {
        setCameraPermission(current);
      }
    };
    setupPermission();
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
      if (streamInterval.current) {
        clearInterval(streamInterval.current);
      }
      socketRef.current?.disconnect();
    };
  }, []);

  const captureAndSend = async () => {
    // Prevent concurrent captures
    if (!cameraRef.current || !connected || isCapturingRef.current) {
      return;
    }
    
    isCapturingRef.current = true;
    
    try {
      // Use fast capture settings to avoid permission dialog
      const photo = await cameraRef.current.takeSnapshot({
        quality: 50
      });

      // Resize image for faster processing
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

      if (encoded && encoded.startsWith('data:image')) {
        socketRef.current.emit('frame', encoded);
        console.log('Frame sent');
      }
      
      // Clean up resized image
      await RNFS.unlink(resized.uri).catch(() => {});
      
    } catch (error: any) {
      // Log error but don't stop streaming
      console.error('Frame capture error:', error.message);
      
      // If permission error, stop streaming
      if (error.message?.includes('permission')) {
        setIsStreaming(false);
        if (streamInterval.current) {
          clearInterval(streamInterval.current);
          streamInterval.current = null;
        }
        setResults('Camera permission error. Please restart.');
      }
    } finally {
      isCapturingRef.current = false;
    }
  };

  const toggleStreaming = async () => {  // Make async to await permission if needed
    if (isStreaming) {
      // Stop logic unchanged
      if (streamInterval.current) {
        clearInterval(streamInterval.current);
        streamInterval.current = null;
      }
      setIsStreaming(false);
      setResults('Stopped streaming');
      console.log('Streaming stopped');
    } else {
      // Check permission before starting
      let perm = cameraPermission;
      if (perm === 'not-determined') {
        perm = await Camera.requestCameraPermission();
        setCameraPermission(perm);
      }
      if (perm !== 'granted') {
        setResults('Camera permission required. Please grant access.');
        return;  // Don't start if not granted
      }

      // Start streaming (unchanged)
      setIsStreaming(true);
      setResults('Streaming...');
      console.log('Streaming started');
      const waitForReady = async () => {
        let retries = 0;
        while (!cameraReady && retries < 10) {
          await new Promise(r => setTimeout(r, 300));
          retries++;
        }
        if (cameraReady) captureAndSend();
        streamInterval.current = setInterval(() => {
          if (cameraReady) captureAndSend();
        }, FRAME_INTERVAL);
      };
      waitForReady();
      streamInterval.current = setInterval(() => {
        captureAndSend();
      }, FRAME_INTERVAL);
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
          <Text style={[styles.statusText, { color: textColor }]}>
            Checking camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraPermission !== 'granted') {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <Text style={[styles.statusText, { color: textColor }]}>
            Camera permission denied. Please enable camera access in your device settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <Text style={[styles.statusText, { color: textColor }]}>
            No camera device found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={styles.container}>
        <View 
          style={styles.cameraContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            cameraWidthRef.current = width;
            cameraHeightRef.current = height;
          }}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={isStreaming && cameraPermission === 'granted'}
            photo={true}
            onInitialized={() => setCameraReady(true)}
            onError={(error: any) => console.error('Camera error:', error?.message ?? error)}
          />
          
          {/* Overlay layer */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {detections.map((det, index) => {
            if (!det || !det.bbox) return null;
            const [x1, y1, x2, y2] = det.bbox;

            // Scale boxes based on model input size vs actual preview
            const modelW = det.image_size?.width || 640;
            const modelH = det.image_size?.height || 480;

            // Measure your actual preview size
            const previewW = cameraWidthRef.current || 640;
            const previewH = cameraHeightRef.current || 480;

            const scaleX = previewW / modelW;
            const scaleY = previewH / modelH;

            return (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  left: x1 * scaleX,
                  top: y1 * scaleY,
                  width: (x2 - x1) * scaleX,
                  height: (y2 - y1) * scaleY,
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
            style={[
              styles.button, 
              { 
                backgroundColor: isStreaming ? '#DC2626' : '#2563EB',
                opacity: connected ? 1 : 0.5
              }
            ]}
            onPress={toggleStreaming}
            disabled={!connected}
          >
            <Text style={styles.buttonText}>
              {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomNavBar />
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

export default ScanScreen