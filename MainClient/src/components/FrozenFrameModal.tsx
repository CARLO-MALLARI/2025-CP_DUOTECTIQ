import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import {FrozenDetection} from '../types/detection.types';

interface FrozenFrameModalProps {
  frozenFrame: FrozenDetection | null;
  visible: boolean;
  onCount: () => void;
  onSkip: () => void;
}

export const FrozenFrameModal: React.FC<FrozenFrameModalProps> = ({
  frozenFrame,
  visible,
  onCount,
  onSkip,
}) => {
  if (!frozenFrame) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onSkip}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Review Detections</Text>

          <Text style={styles.detectionCount}>
            {frozenFrame.detections.length} items detected
          </Text>

          <ScrollView style={styles.detectionList}>
            {frozenFrame.detections.map((det, idx) => (
              <View key={idx} style={styles.detectionItem}>
                <Text style={styles.detectionText}>
                  {det.crop} - {det.size} {det.color} ({det.status})
                </Text>
                <Text style={styles.confidenceText}>
                  {(det.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={onSkip}>
              <Text style={styles.buttonText}>❌ Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.countButton]}
              onPress={onCount}>
              <Text style={styles.buttonText}>
                ✅ Count ({frozenFrame.detections.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  detectionCount: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 15,
  },
  detectionList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  detectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  detectionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  confidenceText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#DC2626',
  },
  countButton: {
    backgroundColor: '#22C55E',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
