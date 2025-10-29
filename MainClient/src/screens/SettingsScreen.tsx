import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingsContext } from '../context/SettingsContext';
import BottomNavBar from '../components/BottomNavbar';

const SettingsScreen: React.FC = () => {
  const { serverUrl, setServerUrl } = useContext(SettingsContext);
  const [tempUrl, setTempUrl] = useState(serverUrl);

  const handleSave = async () => {
    if (!tempUrl.startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }
    await setServerUrl(tempUrl);
    Alert.alert('Saved', 'Server URL updated successfully!');
  };

  const handleReset = async () => {
    const defaultUrl = 'http://10.160.65.143:5000';
    await setServerUrl(defaultUrl);
    setTempUrl(defaultUrl);
    Alert.alert('Reset', 'Server URL reset to default.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Server URL:</Text>
        <TextInput
          style={styles.input}
          value={tempUrl}
          onChangeText={setTempUrl}
          placeholder="http://example.com:5000"
          autoCapitalize="none"
        />

        <View style={styles.buttonContainer}>
          <Button title="💾 Save" onPress={handleSave} />
          <Button title="♻️ Reset" color="#d9534f" onPress={handleReset} />
        </View>

        <Text style={styles.current}>Current URL: {serverUrl}</Text>
      </View>

      <View style={styles.bottomBar}>
        <BottomNavBar />
      </View>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  current: {
    marginTop: 30,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default SettingsScreen;
