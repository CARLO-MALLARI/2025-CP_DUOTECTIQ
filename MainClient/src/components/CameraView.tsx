import React, {useState, useRef, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {Camera, CameraDevice} from 'react-native-vision-camera';
import {Detection} from '../types/detection.types';
import {DetectionOverlay} from './DetectionOverlay';

interface CameraViewProps {
  cameraRef: React.RefObject<Camera>;
  device: CameraDevice;
  isStreaming: boolean;
  detections: Detection[];
  onToggleStreaming: () => void;
  onReset?: () => void;
  isUsingLocal?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  cameraRef,
  device,
  isStreaming,
  detections,
  onToggleStreaming,
  onReset,
  isUsingLocal = false,
}) => {
  const [cameraReady, setCameraReady] = useState(false);
  const cameraDimensionsRef = useRef({width: 0, height: 0});
  const blinkOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isStreaming && detections.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(blinkOpacity, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      blinkOpacity.stopAnimation();
      blinkOpacity.setValue(1); // reset when detection appears
    }
  }, [isStreaming, detections.length]);

  return (
    <View
      style={styles.cameraContainer}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        cameraDimensionsRef.current = {width, height};
      }}>
      {/* Start/Stop Button */}
      <TouchableOpacity
        onPress={onToggleStreaming}
        style={[
          styles.startButton,
          {backgroundColor: isStreaming ? '#DC2626' : '#2E7D32'},
        ]}>
        <Text style={styles.startButtonText}>
          {isStreaming ? '■ Stop' : '▶ Start'}
        </Text>
      </TouchableOpacity>

      {/* Reset Button */}
      {onReset && isStreaming && (
        <TouchableOpacity onPress={onReset} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>🔄 Reset</Text>
        </TouchableOpacity>
      )}

      {/* Inference Mode Badge */}
      {isStreaming && detections.length === 0 && (
        <Animated.View
          style={[
            styles.modeBadge,
            {
              opacity: blinkOpacity,
              transform: [
                {
                  scale: blinkOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
              backgroundColor: '#DC2626',
            },
          ]}>
          <Text style={styles.modeBadgeText}>Scan at least 1ft away</Text>
        </Animated.View>
      )}

      {/* Camera Component */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={isStreaming}
        photo={true}
        onInitialized={() => setCameraReady(true)}
        onError={err => console.error('Camera error:', err)}
      />

      {/* Detection Overlay */}
      <DetectionOverlay
        detections={detections}
        cameraWidth={cameraDimensionsRef.current.width}
        cameraHeight={cameraDimensionsRef.current.height}
        isLocalModel={isUsingLocal}
      />

      {/* Detection Count Badge */}
      {detections.length > 0 && (
        <View style={styles.detectionCountBadge}>
          <Text style={styles.detectionCountText}>
            {detections.length} detected
          </Text>
        </View>
      )}
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
    flex: 1,
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
    fontSize: 13,
  },
  resetButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 5,
    zIndex: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    elevation: 2,
    zIndex: 10,
  },
  modeBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
  },
  detectionCountBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    elevation: 3,
    zIndex: 10,
  },
  detectionCountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
});
