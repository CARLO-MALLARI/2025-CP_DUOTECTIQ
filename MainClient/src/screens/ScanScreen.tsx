import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import io from 'socket.io-client';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';
import BottomNavBar from '../components/BottomNavbar';
import { auth } from '../lib/firebase';

const SERVER_URL = 'http://10.163.17.143:5000';
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
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));
    socketRef.current.on('detections', (data: any) => {
      setDetections(data.detections || []);
      setResults(JSON.stringify(data.detections, null, 2));
    });

    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
      socketRef.current?.disconnect();
    };
  }, []);

  const captureAndSend = async () => {
    if (!cameraRef.current || !connected || isCapturingRef.current) return;
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
      await RNFS.unlink(resized.uri).catch(() => {});
    } catch (error: any) {
      console.error('Frame capture error:', error.message);
    } finally {
      isCapturingRef.current = false;
    }
  };

  const toggleStreaming = async () => {
    if (isStreaming) {
      if (streamInterval.current) clearInterval(streamInterval.current);
      setIsStreaming(false);
      setResults('Stopped streaming');
      return;
    }

    if (cameraPermission !== 'granted') {
      const perm = await Camera.requestCameraPermission();
      setCameraPermission(perm);
      if (perm !== 'granted') return;
    }

    setIsStreaming(true);
    setResults('Streaming...');
    streamInterval.current = setInterval(captureAndSend, FRAME_INTERVAL);
  };

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Checking camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (cameraPermission !== 'granted') {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>Please enable camera access in settings.</Text>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text>No camera found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CAMERA PREVIEW */}
      <View
        style={styles.cameraContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          cameraWidthRef.current = width;
          cameraHeightRef.current = height;
        }}
      >
        <TouchableOpacity
          onPress={toggleStreaming}
          style={[
            styles.startButton,
            { backgroundColor: isStreaming ? '#DC2626' : '#2E7D32' },
          ]}
        >
          <Text style={styles.startButtonText}>
            {isStreaming ? '■ Stop' : '▶ Start'}
          </Text>
        </TouchableOpacity>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={isStreaming}
          photo={true}
          onInitialized={() => setCameraReady(true)}
          onError={(err) => console.error(err)}
        />

        {/* DETECTION OVERLAY */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {detections.map((det, index) => {
            if (!det?.bbox) return null;
            const [x1, y1, x2, y2] = det.bbox;
            const scaleX = (cameraWidthRef.current / 640) || 1;
            const scaleY = (cameraHeightRef.current / 480) || 1;
            return (
              <View
                key={index}
                style={{
                  position: 'absolute',
                  left: x1 * scaleX,
                  top: y1 * scaleY,
                  width: (x2 - x1) * scaleX,
                  height: (y2 - y1) * scaleY,
                  borderColor: '#00FF00',
                  borderWidth: 2,
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

      {/* LEGEND */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'green' }]} />
          <Text style={styles.legendText}>Not Damaged Green</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
          <Text style={styles.legendText}>Damaged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'red' }]} />
          <Text style={styles.legendText}>Not Damaged Red</Text>
        </View>
      </View>

      {/* CLASSIFICATION COUNTER */}
      <Text style={styles.title}>Classification Counter</Text>

      <View style={styles.counterContainer}>
        {['Tomato', 'Bellpepper'].map((label, idx) => (
          <View key={idx} style={styles.counterColumn}>
            <Text style={styles.counterHeader}>{label}</Text>
            {['Small', 'Medium', 'Large'].map((size) => (
              <View style={styles.counterRow} key={size}>
                <View style={[styles.counterBox, { backgroundColor: '#22C55E' }]}>
                  <Text style={styles.counterValue}>0</Text>
                </View>
                <Text style={styles.counterLabel}>{size}</Text>
                <View style={[styles.counterBox, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.counterValue}>0</Text>
                </View>
                <View style={[styles.counterBox, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.counterValue}>0</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
        
    <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  startButton: {
    position: 'absolute',
    top: 10, // adjust vertically
    left: 10, // adjust horizontally
    backgroundColor: '#007a33',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    zIndex: 10,
  },
  startButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 30, height: 30, marginRight: 6 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

  cameraContainer: {
    position: 'relative',
    width: '90%',
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  camera: { flex: 1 },
  label: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0,255,0,0.7)',
    color: '#000',
    paddingHorizontal: 4,
    fontSize: 12,
    borderRadius: 4,
  },

  legendRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { fontSize: 12 },

  title: { fontWeight: 'bold', fontSize: 18, marginVertical: 8 },

  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 2,
  },
  counterColumn: { alignItems: 'center' },
  counterHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'center',
  },
  counterBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  counterValue: { color: 'white', fontWeight: 'bold' },
  counterLabel: { width: 50, textAlign: 'center', fontSize: 12 },
});

export default ScanScreen;
