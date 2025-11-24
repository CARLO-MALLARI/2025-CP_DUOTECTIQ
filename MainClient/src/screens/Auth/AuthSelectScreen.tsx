import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { AuthStackParamList } from '../../types/navigation';
import { useNavigation } from '@react-navigation/native';

type AuthSelectScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'AuthSelect'
>;

const { width, height } = Dimensions.get('window');

const DuotectIQWelcome: React.FC = () => {
  const navigation = useNavigation<AuthSelectScreenNavigationProp>();
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <ImageBackground
      source={require('../../assets/auth-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
      >
      <View style={styles.overlay} />

      {/* Full Screen Content */}
      <View style={styles.contentWrapper}>
        {/* Top Content (Logo + Title + Subtitle) */}
        <View style={styles.topContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Image
                source={require('../../assets/Logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoGreen}>Duotect</Text>
              <Text style={styles.logoRed}>IQ</Text>
            </Text>
          </View>

          <Text style={styles.title}>
            Tired of sorting the hard way?
          </Text>

          <Text style={styles.subtitle}>
            <Text style={styles.bold}>DuotectIQ</Text> makes
            crop checking smart,
            fast, and accurate.
            Better crops, less waste,
            more income - that's
            the DuotectIQ way.
          </Text>
        </View>

        {/* Bottom Buttons - Minimal Flat Style */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.loginBtn} 
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.signUpBtn} 
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ImageBackground>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  contentWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 50,
    justifyContent: 'space-between',
  },

  topContent: {
    alignItems: 'center',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { 
    fontSize: 34, 
    fontWeight: 'bold' 
  },
  logoGreen: { 
    color: '#1b5e20' 
  },
  logoRed: { 
    color: '#c62828' 
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2b3a2b',
    textAlign: 'center',
    marginTop: 150,
    lineHeight: 28,
    marginLeft: 25,
    marginRight: 25,
  },

  subtitle: {
    textAlign: 'center',
    color: '#040404ff',
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 25,
    marginRight: 25,
  },
  bold: { 
    fontWeight: 'bold' 
  },

  // Premium Modern Button Styles
  buttonsContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: 70,
    paddingHorizontal: 25,
  },

  loginBtn: {
    backgroundColor: '#1b5e20',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#1b5e20',
    shadowOffset: { 
      width: 0, 
      height: 8 
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  loginText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.8,
  },

  signUpBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 0,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpText: {
    color: '#1b5e20',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.8,
  },

  logo: {
    width: 72,
    height: 72,
    marginRight: -10,
    marginTop: -20,
    marginBottom: -10,
    marginLeft: -20,
  },
});

export default DuotectIQWelcome;