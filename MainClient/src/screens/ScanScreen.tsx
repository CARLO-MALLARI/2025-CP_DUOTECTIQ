import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { useDetectionSocket } from '../hooks/useDetectionSocket';
import { useCameraStream } from '../hooks/useCameraStream';
import { CameraView } from '../components/CameraView';
import { DetectionLegend } from '../components/DetectionLegend';
import { ClassificationCounter } from '../components/ClassificationCounter';
import { CounterData, Detection } from '../types/detection.types';
import BottomNavBar from '../components/BottomNavbar';
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner';

const ScanScreen: React.FC = () => {
  const { permission, isLoading: permissionLoading } = useCameraPermission();
  
  // Socket connection and detection handling
  const { 
    detections: serverDetections, 
    connected, 
    socketRef, 
    counters: serverCounters,
    isUsingLocalModel,
    localModelReady,
    resetCounters: resetServerCounters
  } = useDetectionSocket();

  // Local state for combined detections
  const [displayDetections, setDisplayDetections] = useState<Detection[]>([]);
  const [displayCounters, setDisplayCounters] = useState<CounterData | null>(null);
  const [uniqueObjects, setUniqueObjects] = useState(0);

  // Handle local detections callback
  const handleLocalDetections = useCallback((
    detections: Detection[], 
    counters: CounterData, 
    uniqueObjs: number
  ) => {
    setDisplayDetections(detections);
    setDisplayCounters(counters);
    setUniqueObjects(uniqueObjs);
  }, []);

  // Camera stream management
  const { 
    isStreaming, 
    toggleStreaming, 
    cameraRef, 
    device,
    localDetections,
    counters: localCounters,
    uniqueObjects: localUniqueObjects,
    resetCounters: resetLocalCounters
  } = useCameraStream(socketRef, {
    isUsingLocalModel,
    localModelReady,
    onLocalDetections: handleLocalDetections
  });

  // Update display detections based on active mode
  useEffect(() => {
    if (isUsingLocalModel) {
      // Use local model results
      setDisplayDetections(localDetections);
      setDisplayCounters(localCounters);
      setUniqueObjects(localUniqueObjects);
    } else {
      // Use server results
      setDisplayDetections(serverDetections);
      setDisplayCounters(serverCounters);
    }
  }, [
    isUsingLocalModel, 
    localDetections, 
    localCounters, 
    localUniqueObjects,
    serverDetections, 
    serverCounters
  ]);

  // Fallback counter data
  const counterData: CounterData = displayCounters ?? {
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

  // Reset handler
  const handleReset = useCallback(() => {
    if (isUsingLocalModel) {
      resetLocalCounters();
    } else {
      resetServerCounters();
    }
  }, [isUsingLocalModel, resetLocalCounters, resetServerCounters]);

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
      {/* Connection Status Banner */}
      <ConnectionStatusBanner
        connected={connected}
        stale={false}
        isLocal={isUsingLocalModel}
        localReady={localModelReady}
      />

      <View style={styles.mainContent}>
        {/* Camera View with Detection Overlay */}
        <CameraView
          cameraRef={cameraRef}
          device={device}
          isStreaming={isStreaming}
          detections={displayDetections}
          onToggleStreaming={toggleStreaming}
          onReset={handleReset}
          isUsingLocal={isUsingLocalModel}
        />

        {/* Detection Legend */}
        <DetectionLegend />

        {/* Classification Counter */}
        <View style={styles.counterSection}>
          <View style={styles.counterHeader}>
            <Text style={styles.title}>Classification Counter</Text>
            {isStreaming && (
              <View style={styles.modeIndicator}>
                <View style={[
                  styles.modeDot, 
                  { backgroundColor: isUsingLocalModel ? '#FF9800' : '#4CAF50' }
                ]} />
                <Text style={styles.modeText}>
                  {isUsingLocalModel ? 'Local' : 'Server'}
                </Text>
              </View>
            )}
          </View>
          <ClassificationCounter data={counterData} />
          {uniqueObjects > 0 && isUsingLocalModel && (
            <Text style={styles.uniqueObjectsText}>
              Unique Objects Tracked: {uniqueObjects}
            </Text>
          )}
        </View>
      </View>

      <BottomNavBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  centered: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterSection: {
    width: '100%',
    alignItems: 'center',
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { 
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  uniqueObjectsText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
});

export default ScanScreen;