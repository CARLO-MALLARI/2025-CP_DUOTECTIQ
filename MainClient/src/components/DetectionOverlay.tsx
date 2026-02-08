import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Detection} from '../types/detection.types';

interface DetectionOverlayProps {
  detections: Detection[];
  cameraWidth: number;
  cameraHeight: number;
  isLocalModel?: boolean;
}

const MODEL_SIZE = 640;

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  detections,
  cameraWidth,
  cameraHeight,
  isLocalModel = false,
}) => {
  const scaleX = cameraWidth / MODEL_SIZE;
  const scaleY = cameraHeight / MODEL_SIZE;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {detections.map((det, index) => {
        if (!det?.bbox) return null;

        const [x1, y1, x2, y2] = det.bbox;
        const left = x1 * scaleX;
        const top = y1 * scaleY;
        const boxWidth = (x2 - x1) * scaleX;
        const boxHeight = (y2 - y1) * scaleY;

        // Determine box color based on counting status
        const borderColor = det.counted
          ? '#9CA3AF' // Gray if already counted
          : det.frames_lost && det.frames_lost > 0
          ? '#FFA500' // Orange if tracking is shaky
          : '#00FF00'; // Green if actively tracked

        return (
          <View
            key={det.id || `${index}-${det.class}`} // Use tracking ID as key
            style={[
              styles.detectionBox,
              {
                left,
                top,
                width: boxWidth,
                height: boxHeight,
                borderColor, // Dynamic color
              },
            ]}>
            <Text style={[styles.label, {backgroundColor: `${borderColor}B3`}]}>
              {det.class} ({(det.confidence * 100).toFixed(1)}%)
              {det.id ? ` #${det.id.slice(0, 4)}` : ''} {/* Show short ID */}
              {det.counted ? ' ✓' : ''} {/* Checkmark if counted */}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  detectionBox: {
    position: 'absolute',
    borderColor: '#00FF00',
    borderWidth: 2,
    borderRadius: 4,
  },
  label: {
    position: 'absolute',
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0,255,0,0.7)',
    color: '#000',
    paddingHorizontal: 4,
    fontSize: 7,
    borderRadius: 4,
  },
});
