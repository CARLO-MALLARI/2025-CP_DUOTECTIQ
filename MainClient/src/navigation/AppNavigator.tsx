import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../providers/AuthProvider';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ScanScreen from '../screens/ScanScreen';
import SortingHistoryScreen from '../screens/SortingHistoryScreen';
import OverviewScreen from '../screens/OverviewScreen';
import AuthStack from './AuthStack';
import { theme } from '../styles/theme';

export type RootStackParamList = {
  Auth: undefined;
  DashboardScreen: undefined;
  Settings: undefined;
  Scan: undefined;
  SortingHistoryScreen: undefined;
  OverviewScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        {user ? (
          <>
            <Stack.Screen name="Scan" component={ScanScreen} />
            <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="SortingHistoryScreen" component={SortingHistoryScreen} />
            <Stack.Screen name="OverviewScreen" component={OverviewScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack}  options={{ headerShown: false }}/>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
