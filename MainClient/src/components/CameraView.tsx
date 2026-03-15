import React, {useState, useRef, useEffect, useMemo} from 'react';
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

// ─── Guide box margin (fraction of frame) ────────────────────────────────────
// 0.20 means 20% margin on every side → guide box is the inner 60% × 60%
const GUIDE_MARGIN = 0.15;
// ─────────────────────────────────────────────────────────────────────────────

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
  const cornerAnim = useRef(new Animated.Value(0)).current;

  // ── Corner accent pulse when streaming ──────────────────────────────────
  useEffect(() => {
    if (isStreaming) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cornerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(cornerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      cornerAnim.stopAnimation();
      cornerAnim.setValue(0);
    }
  }, [isStreaming]);

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

  // ── Filter detections whose centre falls outside the guide box ───────────
  // The model always runs on full 640×640; we only suppress what we show.
  // bbox coords are in model space (0–640). Guide box occupies the inner
  // [GUIDE_MARGIN … 1-GUIDE_MARGIN] fraction of that space.
  const MODEL_SIZE = 640;
  const guideMin = GUIDE_MARGIN * MODEL_SIZE; // e.g. 128
  const guideMax = (1 - GUIDE_MARGIN) * MODEL_SIZE; // e.g. 512

  const filteredDetections = useMemo(() => {
    return detections.filter(det => {
      const [x1, y1, x2, y2] = det.bbox;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      return (
        cx >= guideMin && cx <= guideMax && cy >= guideMin && cy <= guideMax
      );
    });
  }, [detections, guideMin, guideMax]);

  const handleResetPress = () => {
    if (!onReset) return;
    Alert.alert(
      'Reset detection?',
      'This will clear all current detections. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Reset', style: 'destructive', onPress: () => onReset()},
      ],
      {cancelable: true},
    );
  };

  const borderColor = cornerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.55)', 'rgba(255,255,255,1)'],
  });

  return (
    <View
      style={styles.cameraContainer}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        cameraDimensionsRef.current = {width, height};
      }}>
      {/* ── Start / Stop ─────────────────────────────────────────────────── */}
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

      {/* ── Reset ────────────────────────────────────────────────────────── */}
      {onReset && isStreaming && (
        <TouchableOpacity onPress={handleResetPress} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>🔄 Reset</Text>
        </TouchableOpacity>
      )}

      {/* ── Scanning badge ───────────────────────────────────────────────── */}
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
          <Text style={styles.modeBadgeText}>Scan at least 30cm away</Text>
        </Animated.View>
      )}

      {/* ── Camera ───────────────────────────────────────────────────────── */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={isStreaming}
        photo={true}
        onInitialized={() => setCameraReady(true)}
        onError={err => console.error('Camera error:', err)}
      />

      {/* ── 4×4 grid (inside guide box only via clip) ────────────────────── */}
      <View style={styles.gridOverlay} pointerEvents="none">
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

      {/* ── Blur vignette — 4 panels covering the outer margin ──────────── */}
      {/* Top strip */}
      <View
        pointerEvents="none"
        style={[styles.vignettePanel, styles.vignetteTop]}
      />
      {/* Bottom strip */}
      <View
        pointerEvents="none"
        style={[styles.vignettePanel, styles.vignetteBottom]}
      />
      {/* Left strip (between top & bottom strips) */}
      <View
        pointerEvents="none"
        style={[styles.vignettePanel, styles.vignetteLeft]}
      />
      {/* Right strip (between top & bottom strips) */}
      <View
        pointerEvents="none"
        style={[styles.vignettePanel, styles.vignetteRight]}
      />

      {/* ── Guide box border + animated corners ─────────────────────────── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.guideBox, {borderColor}]}>
        {/* Corner accents */}
        {(['TL', 'TR', 'BL', 'BR'] as const).map(pos => (
          <Animated.View
            key={pos}
            style={[
              styles.corner,
              styles[`corner${pos}`],
              {
                borderColor,
                opacity: cornerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* ── Guide label ──────────────────────────────────────────────────── */}
      <View pointerEvents="none" style={styles.guideLabelContainer}>
        <Text style={styles.guideLabel}>Scan area</Text>
      </View>

      {/* ── Detection overlay (filtered) ─────────────────────────────────── */}
      <DetectionOverlay
        detections={filteredDetections}
        cameraWidth={cameraDimensionsRef.current.width}
        cameraHeight={cameraDimensionsRef.current.height}
        isLocalModel={isUsingLocal}
      />

      {/* ── Detection count badge ────────────────────────────────────────── */}
      {filteredDetections.length > 0 && (
        <View style={styles.detectionCountBadge}>
          <Text style={styles.detectionCountText}>
            {filteredDetections.length} detected
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── margin % as decimal for StyleSheet ──────────────────────────────────────
const M = `${GUIDE_MARGIN * 100}%` as `${number}%`;
const INNER = `${(1 - GUIDE_MARGIN * 2) * 100}%` as `${number}%`;

const CORNER_SIZE = 18;
const CORNER_THICKNESS = 3;

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

  // ── Buttons ────────────────────────────────────────────────────────────────
  startButton: {
    position: 'absolute',
    top: 2,
    left: 10,
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

  // ── Badges ─────────────────────────────────────────────────────────────────
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
    backgroundColor: 'rgba(0,0,0,0.7)',
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

  // ── Grid ───────────────────────────────────────────────────────────────────
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },

  // ── Vignette panels ────────────────────────────────────────────────────────
  vignettePanel: {
    position: 'absolute',
    zIndex: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  vignetteTop: {
    top: 0,
    left: 0,
    right: 0,
    height: M,
  },
  vignetteBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: M,
  },
  // left/right panels sit between the top & bottom strips
  vignetteLeft: {
    top: M,
    left: 0,
    width: M,
    bottom: M,
  },
  vignetteRight: {
    top: M,
    right: 0,
    width: M,
    bottom: M,
  },

  // ── Guide box ──────────────────────────────────────────────────────────────
  guideBox: {
    position: 'absolute',
    top: M,
    left: M,
    width: INNER,
    height: INNER,
    borderWidth: 1,
    borderRadius: 4,
    zIndex: 7,
  },

  // ── Corner accents ─────────────────────────────────────────────────────────
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: -CORNER_THICKNESS,
    left: -CORNER_THICKNESS,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: -CORNER_THICKNESS,
    right: -CORNER_THICKNESS,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: -CORNER_THICKNESS,
    left: -CORNER_THICKNESS,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: -CORNER_THICKNESS,
    right: -CORNER_THICKNESS,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },

  // ── Guide label ────────────────────────────────────────────────────────────
  guideLabelContainer: {
    position: 'absolute',
    top: M,
    left: M,
    zIndex: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderBottomRightRadius: 4,
  },
  guideLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
