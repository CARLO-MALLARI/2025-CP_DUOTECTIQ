import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Detection } from '../types/detection.types';

interface DetectionOverlayProps {
  detections: Detection[];
  cameraWidth: number;
  cameraHeight: number;
}

const DETECTION_IMAGE_WIDTH = 640;
const DETECTION_IMAGE_HEIGHT = 480;

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  detections,
  cameraWidth,
  cameraHeight,
}) => {
  const scaleX = cameraWidth / DETECTION_IMAGE_WIDTH || 1;
  const scaleY = cameraHeight / DETECTION_IMAGE_HEIGHT || 1;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {detections.map((det, index) => {
        if (!det?.bbox) return null;

        const [x1, y1, x2, y2] = det.bbox;
        const boxWidth = (x2 - x1) * scaleX;
        const boxHeight = (y2 - y1) * scaleY;

        return (
          <View
            key={`${index}-${det.class}`}
            style={[
              styles.detectionBox,
              {
                left: x1 * scaleX,
                top: y1 * scaleY,
                width: boxWidth,
                height: boxHeight,
              },
            ]}
          >
            <Text style={styles.label}>
              {det.class} ({(det.confidence * 100).toFixed(1)}%)
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