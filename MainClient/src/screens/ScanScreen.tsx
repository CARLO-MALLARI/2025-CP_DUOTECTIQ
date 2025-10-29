import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { useDetectionSocket } from '../hooks/useDetectionSocket';
import { useCameraStream } from '../hooks/useCameraStream';
import { CameraView } from '../components/CameraView';
import { DetectionLegend } from '../components/DetectionLegend';
import { ClassificationCounter } from '../components/ClassificationCounter';
import { CounterData } from '../types/detection.types';
import BottomNavBar from '../components/BottomNavbar';

const ScanScreen: React.FC = () => {
  const { permission, isLoading: permissionLoading } = useCameraPermission();
  const { detections, connected, socketRef, counters } = useDetectionSocket();
  const { isStreaming, toggleStreaming, cameraRef, device } = useCameraStream(socketRef);

  // fallback in case counters are not yet available
  const counterData: CounterData = counters ?? {
    Tomato: {
      total: { green: 0, damaged: 0, red: 0 },
      small: { green: 0, damaged: 0, red: 0 },
      medium: { green: 0, damaged: 0, red: 0 },
      large: { green: 0, damaged: 0, red: 0 },
    },
    Bellpepper: {
      total: { green: 0, damaged: 0, red: 0 },
      small: { green: 0, damaged: 0, red: 0 },
      medium: { green: 0, damaged: 0, red: 0 },
      large: { green: 0, damaged: 0, red: 0 },
    },
  };

  if (permissionLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Checking camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (permission !== 'granted') {
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

      <CameraView
        cameraRef={cameraRef}
        device={device}
        isStreaming={isStreaming}
        detections={detections}
        onToggleStreaming={toggleStreaming}
      />

      <DetectionLegend />

      <Text style={styles.title}>Classification Counter</Text>
      <ClassificationCounter data={counterData} />

      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f4', 
    alignItems: 'center' 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    marginVertical: 8 
  },
});

export default ScanScreen;
