import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height={height} width={width * 0.8} style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="rgba(225, 225, 225, 0.1)" />
              <Stop offset="0.3" stopColor="rgba(225, 225, 225, 0.7)" />
              <Stop offset="0.6" stopColor="rgba(226, 226, 226, 0.4)" />
              <Stop offset="0.85" stopColor="rgba(224, 224, 224, 0.1)" />
              <Stop offset="1" stopColor="rgba(225, 225, 225, 0)" />
            </LinearGradient>
          </Defs>

          {/* Main wave shape with actual curves */}
          <Path
            d={`
              M0 0
              L${width * 0.6} 0
              Q${width * 0.7} ${height * 0.15} ${width * 0.65} ${height * 0.25}
              Q${width * 0.6} ${height * 0.35} ${width * 0.7} ${height * 0.5}
              Q${width * 0.8} ${height * 0.65} ${width * 0.65} ${height * 0.75}
              Q${width * 0.5} ${height * 0.85} ${width * 0.6} ${height}
              L0 ${height}
              Z
            `}
            fill="url(#waveGrad)"
            opacity={0.5}
          />
        </Svg>
      </View>
        {/* Content Container */}
        <View style={styles.textContainer}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🍅</Text>
            </View>
            <Text style={styles.logoText}>
              <Text style={styles.logoGreen}>Duotect</Text>
              <Text style={styles.logoRed}>IQ</Text>
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Tired of sorting{'\n'}the hard way?
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            <Text style={styles.bold}>DUOTECTIQ</Text> makes{'\n'}
            crop checking smart,{'\n'}
            fast, and accurate.{'\n'}
            Better crops, less waste,{'\n'}
            more income - that's{'\n'}
            DuotectIQ way.
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signUpBtn} onPress={() => navigation.navigate('Signup')}>
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
  },
  background: {
    flex: 1,
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  textContainer: {
    position: 'absolute',
    top: '10%',
    left: 20,
    right: 80,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoEmoji: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoGreen: {
    color: '#1b5e20',
  },
  logoRed: {
    color: '#c62828',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2b3a2b',
    marginBottom: 10,
    lineHeight: 28,
  },
  subtitle: {
    color: '#2b3a2b',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  loginBtn: {
    backgroundColor: '#2b6e2f',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginRight: 10,
  },
  loginText: {
    color: 'white',
    fontWeight: 'bold',
  },
  signUpBtn: {
    borderWidth: 1,
    borderColor: '#2b6e2f',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  signUpText: {
    color: '#2b6e2f',
    fontWeight: 'bold',
  },
});

export default DuotectIQWelcome;