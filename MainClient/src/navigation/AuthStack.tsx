import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthSelectScreen from '../screens/Auth/AuthSelectScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import { AuthStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => (
  <Stack.Navigator initialRouteName="AuthSelect">
    <Stack.Screen name="AuthSelect" component={AuthSelectScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

export default AuthStack;
