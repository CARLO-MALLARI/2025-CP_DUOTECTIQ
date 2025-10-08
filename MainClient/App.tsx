
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useColorScheme } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const App: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [cameraPermission, setCameraPermission] = useState<string | null>(null);
  const [results, setResults] = useState<string>('No results yet');
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back') || devices[0];

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await Camera.requestCameraPermission();
        console.log('Camera permission status:', status);
        setCameraPermission((prev) => {
          console.log('Setting cameraPermission state from', prev, 'to', status);
          return status;
        });
      } catch (error) {
        console.error('Permission check error:', error);
        setCameraPermission('denied');
      }
    };
    checkPermission();
  }, []);

  const retryPermission = async () => {
    try {
      const status = await Camera.requestCameraPermission();
      console.log('Retry permission status:', status);
      setCameraPermission((prev) => {
        console.log('Setting cameraPermission state from', prev, 'to', status);
        return status;
      });
    } catch (error) {
      console.error('Retry permission error:', error);
      setCameraPermission('denied');
    }
  };

  const processFrame = () => {
    setResults(`Processed frame at ${new Date().toLocaleTimeString()}`);
  };

  console.log('Current cameraPermission state:', cameraPermission); // Debug state on every render

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  const textColor = isDarkMode ? Colors.white : Colors.black;

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={textColor} />
          <Text style={[styles.statusText, { color: textColor }]}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraPermission !== 'granted') {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <Text style={[styles.statusText, { color: textColor }]}>
            Camera permission denied (Status: {cameraPermission})
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDarkMode ? '#4B5EAA' : '#2563EB', marginTop: 16 }]}
            onPress={retryPermission}
          >
            <Text style={styles.buttonText}>Retry Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={backgroundStyle}>
        <View style={styles.centered}>
          <Text style={[styles.statusText, { color: textColor }]}>No camera device found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <View style={styles.container}>
        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            device={device}
            isActive={true}
          />
        </View>

        {/* Results Display */}
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsTitle, { color: textColor }]}>ML Results</Text>
          <Text style={[styles.resultsText, { color: textColor }]}>{results}</Text>
        </View>

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: isDarkMode ? '#4B5EAA' : '#2563EB' }]}
            onPress={() => setResults('Processing...')}
          >
            <Text style={styles.buttonText}>Run Inference</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  cameraContainer: {
    flex: 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  camera: {
    flex: 1,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 16,
  },
  controlPanel: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    marginTop: 16,
  },
});

export default App;