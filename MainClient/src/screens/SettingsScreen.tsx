import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Linking,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
  deleteUser,
  signOut,
} from 'firebase/auth';
import {auth} from '../lib/firebase';
import Constants from 'expo-constants';
import {sharedStore} from '../stores/sharedStore';

const SettingsScreen = () => {
  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [inputUrl, setInputUrl] = useState(sharedStore.serverUrl);
  // Theme preference
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 🖥️ Server URL

  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      setIsDarkMode(savedTheme === 'dark');
    })();
  }, []);

  useEffect(() => {
    // Subscribe to store updates
    const unsubscribe = sharedStore.subscribe(url => setInputUrl(url));
    return unsubscribe;
  }, []);

  const handleSaveUrl = () => {
    if (!inputUrl.trim())
      return Alert.alert('Error', 'Please enter a valid URL.');
    sharedStore.setServerUrl(inputUrl.trim());
    Alert.alert('Saved', `Server URL set to: ${inputUrl}`);
  };

  const handleResetUrl = () => {
    sharedStore.setServerUrl('http://192.168.100.33:5000');
    Alert.alert('Reset', 'Server URL restored to default.');
  };

  // 🌍 Open URL in browser
  const handleOpenUrl = () => {
    if (sharedStore.serverUrl) Linking.openURL(sharedStore.serverUrl);
  };

  // 🔄 Change password
  const handleChangePassword = async () => {
    if (!auth.currentUser?.email)
      return Alert.alert('Error', 'No logged-in user.');
    if (!currentPassword || !newPassword || !confirmPassword)
      return Alert.alert('Error', 'Please fill in all fields.');
    if (newPassword !== confirmPassword)
      return Alert.alert('Error', 'New passwords do not match.');

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert('Success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update password.');
    }
  };

  // 🔑 Forgot password
  const handleResetPasswordEmail = async () => {
    if (!auth.currentUser?.email)
      return Alert.alert('Error', 'No user email found.');
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      Alert.alert('Email Sent', `Reset link sent to ${auth.currentUser.email}`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to send reset email.');
    }
  };

  // 🗑️ Delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
                Alert.alert('Deleted', 'Your account has been removed.');
              }
            } catch (err: any) {
              console.error(err);
              Alert.alert('Error', err.message || 'Failed to delete account.');
            }
          },
        },
      ],
    );
  };

  // 🚪 Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Signed Out', 'You have been logged out.');
    } catch (err) {
      console.error(err);
    }
  };

  // 🧹 Clear local data
  const handleClearData = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Cleared', 'Local app data has been removed.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to clear data.');
    }
  };

  // 🌙 Toggle theme
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    Alert.alert(
      'Theme Changed',
      newTheme ? 'Dark mode enabled.' : 'Light mode enabled.',
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {/* ACCOUNT SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Current Password"
            placeholderTextColor="#666"
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.icon}
            onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#666"
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Confirm New Password"
            placeholderTextColor="#666"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleChangePassword}>
          <Text style={styles.primaryButtonText}>Update Password</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetPasswordEmail}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteAccount}>
          <Text style={[styles.linkText, {color: 'red'}]}>Delete Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout}>
          <Text style={[styles.linkText, {color: '#007AFF'}]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* APP DATA SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Data</Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleClearData}>
          <Text style={styles.secondaryButtonText}>Clear Local Data</Text>
        </TouchableOpacity>

        {/* 🌐 URL CONFIGURATION */}
        <View style={{marginTop: 20}}>
          <Text style={styles.sectionTitle}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="Enter backend URL"
            placeholderTextColor="#666"
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveUrl}>
            <Text style={styles.primaryButtonText}>Save URL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleResetUrl}>
            <Text style={styles.secondaryButtonText}>Reset to Default</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleOpenUrl}>
            <Text style={[styles.linkText, {color: '#007AFF'}]}>Open URL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* INFO SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          App Version: {Constants.expoConfig?.version || '1.0.0'}
        </Text>

        <TouchableOpacity
          onPress={() => Linking.openURL('mailto:support@gymbuddy.app')}>
          <Text style={styles.linkText}>Contact Support</Text>
        </TouchableOpacity>

        {/* 🌐 Social Media Links */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL('https://facebook.com')}>
            <Ionicons
              name="logo-facebook"
              size={28}
              color="#1877F2"
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://instagram.com')}>
            <Ionicons
              name="logo-instagram"
              size={28}
              color="#E1306C"
              style={styles.socialIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://twitter.com')}>
            <Ionicons
              name="logo-twitter"
              size={28}
              color="#1DA1F2"
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  icon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{translateY: -11}],
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#eee',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  secondaryButtonText: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoText: {
    color: '#666',
    marginBottom: 5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  socialIcon: {
    marginHorizontal: 12,
  },
});
