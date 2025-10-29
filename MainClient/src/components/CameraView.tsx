import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera, CameraDevice } from 'react-native-vision-camera';
import { Detection } from '../types/detection.types';
import { DetectionOverlay } from './DetectionOverlay';

interface CameraViewProps {
  cameraRef: React.RefObject<Camera>;
  device: CameraDevice;
  isStreaming: boolean;
  detections: Detection[];
  onToggleStreaming: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  cameraRef,
  device,
  isStreaming,
  detections,
  onToggleStreaming,
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const cameraDimensionsRef = useRef({ width: 0, height: 0 });

  return (
    <View
      style={styles.cameraContainer}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        cameraDimensionsRef.current = { width, height };
      }}
    >
      <TouchableOpacity
        onPress={onToggleStreaming}
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
        onError={(err) => console.error('Camera error:', err)}
      />

      <DetectionOverlay
        detections={detections}
        cameraWidth={cameraDimensionsRef.current.width}
        cameraHeight={cameraDimensionsRef.current.height}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    position: 'relative',
    width: '90%',
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  camera: { 
    flex: 1 
  },
  startButton: {
    position: 'absolute',
    top: 10,
    left: 10,
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
  startButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 13 
  },
});