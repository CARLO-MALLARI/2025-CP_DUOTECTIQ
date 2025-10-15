import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';

const LoadingScreen = () => (
  <View style={styles.container}>
    <Image
      source={require('../assets/splash.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#CACACA', // Splash background
  },
  logo: {
    width: 200,   // adjust size as needed
    height: 200,
    marginBottom: 20,
  },
  loader: {
    marginTop: 10,
  },
});

export default LoadingScreen;
