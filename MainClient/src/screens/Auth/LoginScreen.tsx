import React, {useState, useEffect} from 'react';
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
  Modal,
} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth, db} from '../../lib/firebase';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../../types/navigation';
import LoadingOverlay from '../../components/LoadingOverlay';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {GoogleAuthProvider, signInWithCredential, signOut} from 'firebase/auth';

const {width, height} = Dimensions.get('window');
type AuthNav = NativeStackNavigationProp<AuthStackParamList>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<AuthNav>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone login modal
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [phonePassword, setPhonePassword] = useState('');
  const [showPhonePassword, setShowPhonePassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text: string) => {
    // Remove any non-digit characters
    const digitsOnly = text.replace(/\D/g, '');
    setPhone(digitsOnly);
  };

  // Email + Password login
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Success', 'Logged in!');
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Phone + Password login
  const handlePhoneLogin = async () => {
    if (!phone || !phonePassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      // Query Firestore for the user with this phone
      const q = query(
        collection(db, 'users'),
        where('phone', '==', phone.trim()),
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('No user found with this phone number');
      }

      const userDoc = querySnapshot.docs[0];
      const userEmail = userDoc.data().email;
      if (!userEmail) throw new Error('No email associated with this phone');

      await signInWithEmailAndPassword(auth, userEmail, phonePassword);
      Alert.alert('Success', 'Logged in with phone!');
      setPhoneModalVisible(false);
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      await GoogleSignin.signOut();
      try {
        await GoogleSignin.revokeAccess();
      } catch (e) {
        console.warn('GoogleSignin.revokeAccess() failed:', e);
      }

      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (!tokens.idToken) throw new Error('No ID token received from Google!');
      const googleCredential = GoogleAuthProvider.credential(tokens.idToken);
      await signInWithCredential(auth, googleCredential);

      Alert.alert('Success', 'Logged in with Google!');
    } catch (err: any) {
      Alert.alert('Google Login Error', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '261048712743-0rbmk3d5lg1n69ielci24s5da5b11e05.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        {/* Top Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/auth-bg.jpg')}
            style={styles.topImage}
          />
          <View style={styles.overlay} />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg
              height={height * 0.4}
              width={width}
              style={{position: 'absolute'}}>
              <Defs>
                <LinearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="rgba(217,217,217,1)" />
                  <Stop offset="0.6" stopColor="rgba(230,230,230,0.98)" />
                  <Stop offset="1" stopColor="rgba(230,230,230,0.95)" />
                </LinearGradient>
              </Defs>
              <Path
                d={`M0 ${height * 0.18} Q${width * 0.25} ${height * 0.1} ${
                  width * 0.5
                } ${height * 0.2} T${width} ${height * 0.25} Q${width * 1} ${
                  height * 0.5
                } ${width} ${height * 0.75} L${width} ${height} L0 ${height} Z`}
                fill="url(#waveGrad)"
              />
            </Svg>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>

          {/* Email Input */}
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.icon}>🔒</Text>
            <TextInput
              style={[styles.input, {paddingRight: 35}]}
              placeholder="Password"
              placeholderTextColor="#555"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color="#444"
              />
            </TouchableOpacity>
          </View>

          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}>
              <Image
                source={{uri: 'https://www.google.com/favicon.ico'}}
                style={styles.socialIcon}
              />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>

            {/* Phone login trigger */}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => setPhoneModalVisible(true)}>
              <Text style={styles.socialText}>Phone</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleEmailLogin}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {/* Sign up link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign up here.</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone Modal */}
        <Modal visible={phoneModalVisible} transparent animationType="slide">
          <View style={styles.modalBackground}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Login with Phone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your phone number"
                keyboardType="numeric"
                value={phone}
                onChangeText={handlePhoneChange}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Password"
                secureTextEntry={!showPhonePassword}
                value={phonePassword}
                onChangeText={setPhonePassword}
              />
              <TouchableOpacity
                style={styles.showPassButton}
                onPress={() => setShowPhonePassword(!showPhonePassword)}>
                <Ionicons
                  name={showPhonePassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePhoneLogin}>
                <Text style={styles.modalButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPhoneModalVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '35%',
    position: 'relative',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  topImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    width: '90%',
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
    position: 'relative',
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
  eyeButton: {
    position: 'absolute',
    right: 15,
    padding: 4,
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
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {fontSize: 20, fontWeight: '700', marginBottom: 12},
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#4b7a1c',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonText: {color: '#fff', fontWeight: '600', fontSize: 16},
  modalCancel: {color: '#1e90ff', fontWeight: '600', fontSize: 14},
  showPassButton: {position: 'absolute', right: 15, top: 150},
});

export default LoginScreen;
