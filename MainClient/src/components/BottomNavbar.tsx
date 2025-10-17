import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define your routes here - adjust based on your actual routes
type BottomNavRoute = 'Sorting' | 'Dashboard' | 'History' | 'Overview';

interface NavItem {
  name: BottomNavRoute;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Sorting', label: 'Sorting', icon: '📈' },
  { name: 'Dashboard', label: 'Dashboard', icon: '💻' },
  { name: 'History', label: 'Sorting History', icon: '📋' },
  { name: 'Overview', label: 'Overview', icon: '👤' },
];

interface BottomNavBarProps {
  isDarkMode?: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ isDarkMode = false }) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  
  const activeColor = '#2563EB';
  const inactiveColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const backgroundColor = isDarkMode ? '#1F2937' : '#FFFFFF';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';

  const isActive = (routeName: string) => {
    return route.name === routeName;
  };

  const handlePress = (routeName: BottomNavRoute) => {
    if (route.name !== routeName) {
      try {
        navigation.navigate(routeName as never);
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
              <Text style={[styles.icon, { opacity: active ? 1 : 0.6 }]}>
                {item.icon}
              </Text>
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
    shadowColor: '#000',
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