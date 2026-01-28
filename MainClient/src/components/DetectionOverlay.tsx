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
  // Scale from 640x640 model space to camera display size
  const scaleX = cameraWidth / MODEL_SIZE;
  const scaleY = cameraHeight / MODEL_SIZE;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {detections.map((det, index) => {
        if (!det?.bbox) return null;

        const [x1, y1, x2, y2] = det.bbox;

        // Scale bounding box coordinates
        const left = x1 * scaleX;
        const top = y1 * scaleY;
        const boxWidth = (x2 - x1) * scaleX;
        const boxHeight = (y2 - y1) * scaleY;

        return (
          <View
            key={`${index}-${det.class}-${det.track_id || ''}`}
            style={[
              styles.detectionBox,
              {
                left,
                top,
                width: boxWidth,
                height: boxHeight,
              },
            ]}>
            <Text style={styles.label}>
              {det.class} ({(det.confidence * 100).toFixed(1)}%)
              {det.track_id ? ` #${det.track_id}` : ''}
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
