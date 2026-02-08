import React, {useEffect, useRef, useState} from 'react';
import {Animated, View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Scan: undefined;
  DashboardScreen: undefined;
  SortingHistoryScreen: undefined;
  OverviewScreen: undefined;
};

type BottomNavRoute =
  | 'Scan'
  | 'DashboardScreen'
  | 'SortingHistoryScreen'
  | 'OverviewScreen';

interface NavItem {
  name: BottomNavRoute;
  label: string;
  icon: string;
}

export const navItems: NavItem[] = [
  {name: 'Scan', label: 'Sorting', icon: 'stats-chart-outline'},
  {name: 'DashboardScreen', label: 'Dashboard', icon: 'speedometer-outline'},
  {
    name: 'SortingHistoryScreen',
    label: 'Sorting History',
    icon: 'time-outline',
  },
  {name: 'OverviewScreen', label: 'Overview', icon: 'person-outline'},
];

interface BottomNavBarProps {
  isDarkMode?: boolean;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({isDarkMode = false}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, BottomNavRoute>>();

  const activeColor = '#25ebb6ff';
  const inactiveColor = isDarkMode ? '#9CA3AF' : '#fff';
  const backgroundColor = isDarkMode ? '#1F2937' : '#578534ff';
  const borderColor = isDarkMode ? '#374151' : '#E5E7EB';

  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden
  const [hidden, setHidden] = useState(false);

  // Auto-hide after 4 seconds
  useEffect(() => {
    const timeout = setTimeout(() => hideNav(), 4000);
    return () => clearTimeout(timeout);
  }, []);

  const hideNav = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setHidden(true));
  };

  const showNav = () => {
    setHidden(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  // slide down 65px + extra padding
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 80],
  });

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
    <>
      {/* Arrow Tab (only shown when hidden) */}
      {hidden && (
        <TouchableOpacity style={styles.arrowTab} onPress={showNav}>
          <Ionicons name="chevron-up" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Animated bottom bar */}
      <Animated.View
        style={[
          styles.container,
          {transform: [{translateY}]},
          {backgroundColor, borderTopColor: borderColor},
        ]}>
        {navItems.map(item => {
          const active = isActive(item.name);
          const color = active ? '#fff' : '#aaa';

          return (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => {
                handlePress(item.name);
                showNav(); // bring it back when user interacts
              }}
              activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={24} color="#fff" />
                {active && <View style={styles.activeDot} />}
              </View>
              <Text style={[styles.label, {color}]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingHorizontal: 8,
    backgroundColor: '#222',
    elevation: 8,
    zIndex: 999,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 11,
    marginTop: 2,
  },
  arrowTab: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    transform: [{translateX: -15}],
    backgroundColor: '#337a00ff',
    width: 40,
    height: 25,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 999,
  },
});

export default BottomNavBar;
