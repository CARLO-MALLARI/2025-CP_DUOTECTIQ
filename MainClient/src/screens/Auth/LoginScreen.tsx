import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { 
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import LoadingOverlay from '../../components/LoadingOverlay';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AuthNav = NativeStackNavigationProp<AuthStackParamList>;
type RootStackNav = NativeStackNavigationProp<RootStackParamList>;
const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<AuthNav>();
  const rootnavigation = useNavigation<RootStackNav>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔧 Configuring GoogleSignin...');
    
    try {
      GoogleSignin.configure({
        webClientId: '968013919047-23d0agsvnc6180be4opip8qrhhnhv34v.apps.googleusercontent.com',
        offlineAccess: true,
      });
      console.log('✅ GoogleSignin configured SUCCESSFULLY');
    } catch (error) {
      console.error('❌ GoogleSignin config FAILED:', error);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // ✅ NEW: Check device clock
      const deviceTime = new Date().getTime();
      const expectedTime = Date.now();
      if (Math.abs(deviceTime - expectedTime) > 60000) { // 1 min diff
        Alert.alert('Clock Error', 'Please sync your device clock!');
        return;
      }

      await signOut(auth);
      await GoogleSignin.signOut();
      
      try {
        await GoogleSignin.revokeAccess();
      } catch (e) {
        console.warn('GoogleSignin.revokeAccess() failed:', e);
      }
      
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      
      console.log('User Info:', userInfo);
      
      // ✅ CRITICAL: Get FRESH tokens immediately after signIn
      const tokens = await GoogleSignin.getTokens();
      console.log('🔥 TOKENS:', tokens); // Debug token timestamp

      if (!tokens.idToken) {
        throw new Error('No ID token received from Google!');
      }

      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      const result = await signInWithCredential(auth, googleCredential);
      
      console.log('Firebase User:', result.user);
      Alert.alert('Success', 'Logged in with Google!');
      rootnavigation.navigate('Scan');
    } catch (error: any) {
      console.error('❌ DETAILED ERROR:', {
        code: error.code,
        message: error.message,
        nativeError: error.nativeError,
        userCancelled: error.userCancelled
      });

      Alert.alert('Debug Error', `Code: ${error.code}\nMessage: ${error.message}`);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelled', 'Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('In Progress', 'Sign in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available or outdated');
      } else {
        Alert.alert('Error', error.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  // Facebook Sign-In
  const handleFacebookSignIn = async () => {
    setLoading(true);
    try {
      // Login with Facebook
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        Alert.alert('Cancelled', 'Login cancelled');
        setLoading(false);
        return;
      }

      // Get the access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        throw new Error('Failed to get access token');
      }

      // Create Firebase credential
      const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
      
      // Sign in to Firebase
      await signInWithCredential(auth, facebookCredential);
      
      Alert.alert('Success', 'Logged in with Facebook!');
      rootnavigation.navigate('Scan');
    } catch (error: any) {
      console.error('Facebook Sign-In Error:', error);
      Alert.alert('Facebook Sign-In Error', error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        {/* 🥬 Top Image with wave cut */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/auth-bg.jpg')}
            style={styles.topImage}
          />

          {/* 🩵 Wave Overlay */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg height={height * 0.4} width={width} style={{ position: 'absolute' }}>
              <Defs>
                <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="rgba(217, 217, 217, 1)" />
                  <Stop offset="0.6" stopColor="rgba(230, 230, 230, 0.98)" />
                  <Stop offset="1" stopColor="rgba(230, 230, 230, 0.95)" />
                </LinearGradient>
              </Defs>

              <Path
                d={`
                  M0 ${height * 0.18}
                  Q${width * 0.25} ${height * 0.10} ${width * 0.5} ${height * 0.2}
                  T${width} ${height * 0.25}
                  Q${width * 1} ${height * 0.5} ${width} ${height * 0.75}
                  L${width} ${height}
                  L0 ${height}
                  Z
                `}
                fill="url(#waveGrad)"
              />
            </Svg>
          </View>
        </View>

        {/* 🥗 Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {/* Inputs */}
          <View style={styles.inputContainer}>
            <Text style={styles.icon}>📨</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#555"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.icon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#555"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
            >
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleFacebookSignIn}
            >
              <Image
                source={{ uri: 'https://www.facebook.com/favicon.ico' }}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Login */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {/* Sign up */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign up here.</Text>
            </TouchableOpacity>
          </View>
        </View>

        <LoadingOverlay visible={loading} message="Logging in..." />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: '#d9d9d9',
  },
  container: {
    flex: 1,
    backgroundColor: '#d9d9d9',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  topImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  content: {
    width: '90%',
    backgroundColor: '#d9d9d9',
    marginTop: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d5016',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c9d2c0',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 16,
    height: 50,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    justifyContent: 'center',
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  socialText: {
    color: '#333',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4b7a1c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#555',
    fontSize: 14,
  },
  signupLink: {
    color: '#1e90ff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LoginScreen;