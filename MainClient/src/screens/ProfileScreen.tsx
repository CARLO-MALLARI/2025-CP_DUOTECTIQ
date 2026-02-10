import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import {auth, db} from '../lib/firebase';
import {doc, getDoc, updateDoc, setDoc} from 'firebase/firestore';
import LoadingOverlay from '../components/LoadingOverlay';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../types/navigation';
import BottomNavBar from '../components/BottomNavbar';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Picker} from '@react-native-picker/picker';

const {height} = Dimensions.get('window');
type Nav = NativeStackNavigationProp<AuthStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setMiddleName(data.middleName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setRole(data.role || '');
          setAddress(data.address || '');
          setCity(data.city || '');
          setState(data.state || '');
          setZip(data.zip || '');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePhoneChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    setPhone(digitsOnly);
  };

  const handleSave = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(
        docRef,
        {
          firstName,
          lastName,
          middleName,
          phone,
          role,
          address,
          city,
          state,
          zip,
          email: user.email,
          updatedAt: new Date(),
        },
        {merge: true},
      );

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingOverlay visible message="Loading profile..." />;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f0f0f0'}}>
      <View style={styles.container}>
        <View style={styles.modalCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={styles.divider} />

            {/* Name */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter First Name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter Last Name"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput
                placeholder="Optional"
                placeholderTextColor="#666"
                style={styles.input}
                value={middleName}
                onChangeText={setMiddleName}
              />
            </View>

            {/* Email (read-only) and Phone */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, {backgroundColor: '#b2b2b2ff'}]}
                  value={email}
                  editable={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="Enter Phone Number"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Barangay"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Street</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="Street"
                />
              </View>
            </View>

            {/* City & Zip */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numeric"
                  placeholder="Zip"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <LoadingOverlay visible={updating} message="Updating profile..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {flex: 1},
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(230,230,230,0.85)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2d5016',
    padding: 12,
    paddingTop: 22,
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
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(200,200,200,0.6)',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2d5016',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  pickerContainer: {
    backgroundColor: 'rgba(200, 200, 200, 0.6)',
    borderWidth: 1.5,
    borderColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    color: '#333',
    fontSize: 13,
  },
});

export default ProfileScreen;
