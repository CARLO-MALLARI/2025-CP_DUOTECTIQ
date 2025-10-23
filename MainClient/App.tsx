import { enableScreens } from 'react-native-screens';
enableScreens(true);

import React, { useEffect } from 'react';
import RNBootSplash from "react-native-bootsplash";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/providers/AuthProvider';
import AppNavigator from './src/navigation/AppNavigator';

const App = () => {
  
  useEffect(() => {
    RNBootSplash.hide({ fade: true }); 
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
