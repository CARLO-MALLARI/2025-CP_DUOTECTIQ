import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
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
      blinkOpacity.setValue(1);
    }
  }, [isStreaming, detections.length]);

  const handleResetPress = () => {
    if (!onReset) return;

    Alert.alert(
      'Reset detection?',
      'This will clear all current detections. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => onReset(),
        },
      ],
      {cancelable: true},
    );
  };

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
        <TouchableOpacity onPress={handleResetPress} style={styles.resetButton}>
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

      {/* 4x4 Grid Overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {/* Vertical Lines */}
        {[1, 2, 3].map(i => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              {left: `${(i * 100) / 4}%`},
            ]}
          />
        ))}
        {/* Horizontal Lines */}
        {[1, 2, 3].map(i => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              {top: `${(i * 100) / 4}%`},
            ]}
          />
        ))}
      </View>

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
    height: 350,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#d0bebe',
  },
  camera: {
    flex: 1,
  },
  startButton: {
    position: 'absolute',
    top: 2,
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
    top: 2,
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
  // Grid styles
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
});
