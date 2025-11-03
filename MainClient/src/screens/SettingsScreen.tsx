import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SettingsContext } from '../context/SettingsContext';
import BottomNavBar from '../components/BottomNavbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen: React.FC = () => {
  const { serverUrl, setServerUrl, reloadUrl } = useContext(SettingsContext);
  const [tempUrl, setTempUrl] = useState(serverUrl);
  const [isSaving, setIsSaving] = useState(false);

  // Sync tempUrl when serverUrl changes
  useEffect(() => {
    console.log('📱 SettingsScreen - serverUrl changed to:', serverUrl);
    setTempUrl(serverUrl);
  }, [serverUrl]);

  const handleSave = async () => {
    if (!tempUrl.trim()) {
      Alert.alert('Error', 'URL cannot be empty');
      return;
    }

    if (!tempUrl.startsWith('http://') && !tempUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setIsSaving(true);
    try {
      console.log('🚀 User clicked Save. New URL:', tempUrl);
      
      // Save using context
      await setServerUrl(tempUrl);
      
      // Double-check AsyncStorage directly
      const stored = await AsyncStorage.getItem('serverUrl');
      console.log('🔍 Double-check - AsyncStorage now contains:', stored);
      
      // Force reload to ensure context is in sync
      await reloadUrl();
      
      Alert.alert(
        'Success',
        `Server URL updated to:\n${tempUrl}\n\nThe app will reconnect automatically.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      Alert.alert('Error', `Failed to save URL: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset to Default',
      'Reset server URL to default (http://192.168.100.35:5000)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const defaultUrl = 'http://192.168.100.35:5000';
              await setServerUrl(defaultUrl);
              await reloadUrl();
              setTempUrl(defaultUrl);
              Alert.alert('Reset Complete', 'Server URL reset to default');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset URL');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleTest = async () => {
    try {
      console.log('🧪 Testing AsyncStorage...');
      
      // Read current value
      const current = await AsyncStorage.getItem('serverUrl');
      console.log('Current stored value:', current);
      
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('All storage keys:', allKeys);
      
      Alert.alert(
        'Storage Test',
        `Current URL in storage:\n${current || 'None'}\n\nAll keys: ${allKeys.join(', ')}`
      );
    } catch (error) {
      Alert.alert('Test Failed', `${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Server Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={tempUrl}
            onChangeText={setTempUrl}
            placeholder="http://example.com:5000"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSaving}
          />
          <Text style={styles.hint}>Enter the IP address and port of your server</Text>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Button 
                title="💾 Save" 
                onPress={handleSave}
                disabled={tempUrl === serverUrl}
              />
            )}
          </View>
          <View style={styles.buttonWrapper}>
            <Button 
              title="♻️ Reset" 
              color="#FF3B30" 
              onPress={handleReset}
              disabled={isSaving}
            />
          </View>
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug Info</Text>
          <Text style={styles.debugText}>Current URL: {serverUrl}</Text>
          <Text style={styles.debugText}>Input URL: {tempUrl}</Text>
          <Text style={styles.debugText}>
            Status: {tempUrl === serverUrl ? '✅ Saved' : '⚠️ Unsaved changes'}
          </Text>
          
          <View style={styles.testButtonWrapper}>
            <Button 
              title="🧪 Test Storage" 
              onPress={handleTest}
              color="#5AC8FA"
            />
          </View>
        </View>
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
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F2F2F7',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  buttonWrapper: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  debugSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  debugText: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  testButtonWrapper: {
    marginTop: 12,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default SettingsScreen;