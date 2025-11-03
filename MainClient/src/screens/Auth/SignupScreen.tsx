import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import LoadingOverlay from '../../components/LoadingOverlay';

const { width, height } = Dimensions.get('window');

type AuthNav = NativeStackNavigationProp<AuthStackParamList>;

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<AuthNav>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match!');
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), 
      {
        firstName,
        lastName,
        role,
        address,
        city,
        state,
        zip,
        email: email.trim(),
        createdAt: new Date(),
      },
      { merge: true }
    );

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('Login');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Signup Error', err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/auth-bg.jpg')} // Replace with your background image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Modal-like Card Container */}
        <View style={styles.modalCard}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.title}>Sign Up</Text>
            <View style={styles.divider} />

            {/* First Name & Last Name */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  placeholder="Enter First Name"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  placeholder="Enter Last Name"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Email & Role */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  placeholder="Enter Email"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role</Text>
                <TextInput
                  placeholder="Select a role"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={role}
                  onChangeText={setRole}
                />
              </View>
            </View>

            {/* Address & Street */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  placeholder="Select Barangay"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street</Text>
                <TextInput
                  placeholder="Enter Street"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                />
              </View>
            </View>

            {/* City & Zip Code */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  placeholder="Enter City"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                  placeholder="Enter Zip Code"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Password & Confirm Password */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="Enter Password"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#666"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login here.</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      <LoadingOverlay visible={loading} message="Creating account..." />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(230, 230, 230, 0.85)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2d5016',
    padding: 12,
    paddingTop: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    maxHeight: height * 0.85,
  },
  closeButton: {
    position: 'absolute',
    top: 6,
    right: 10,
    zIndex: 10,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d5016',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#666',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 5,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(200, 200, 200, 0.6)',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
  },
  signupButton: {
    backgroundColor: '#2d5016',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 12,
    color: '#333',
  },
  loginLink: {
    fontSize: 12,
    color: '#1e90ff',
    fontWeight: '600',
  },
});


export default SignupScreen;