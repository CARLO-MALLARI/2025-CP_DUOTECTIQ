import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Scan: undefined;
  DashboardScreen: undefined;
  SortingHistoryScreen: undefined;
  OverviewScreen: undefined;
};

type BottomNavRoute = 'Scan' | 'DashboardScreen' | 'SortingHistoryScreen' | 'OverviewScreen';

interface NavItem {
  name: BottomNavRoute;
  label: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { name: 'Scan', label: 'Sorting', icon: 'stats-chart-outline' },
  { name: 'DashboardScreen', label: 'Dashboard', icon: 'speedometer-outline' },
  { name: 'SortingHistoryScreen', label: 'Sorting History', icon: 'time-outline' },
  { name: 'OverviewScreen', label: 'Overview', icon: 'person-outline' },
];

interface BottomNavBarProps {
  isDarkMode?: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ isDarkMode = false }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, BottomNavRoute>>();
  
  const activeColor = '#25ebb6ff';
  const inactiveColor = isDarkMode ? '#9CA3AF' : '#fff';
  const backgroundColor = isDarkMode ? '#1F2937' : '#3d8209bd';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';

  const isActive = (routeName: string) => {
    return route.name === routeName;
  };

  const handlePress = (routeName: BottomNavRoute) => {
    if (route.name !== routeName) {
      try {
        navigation.replace(routeName);
      } catch (error) {
        console.warn(`Navigation to ${routeName} failed:`, error);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor, borderTopColor: borderColor }]}>
      {navItems.map((item) => {
        const active = isActive(item.name);
        const color = active ? activeColor : inactiveColor;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => handlePress(item.name)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon} size={24} color="#fff" />
              {active && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
            </View>
            <Text
              style={[
                styles.label,
                { color, fontWeight: active ? '600' : '400' }
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
    elevation: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default BottomNavBar;