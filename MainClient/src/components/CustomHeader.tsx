import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../styles/theme';
import { useAuth } from '../providers/AuthProvider';

const CustomHeader: React.FC = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            signOut();
          }
        }
      ]
    );
  };

  return (
    <View style={styles.header}>
      {/* Left Section — Logo + App Name */}
      <View style={styles.leftSection}>
        <Image
          source={require('../assets/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>
          <Text style={{ color: '#fff' }}>Duo</Text>
          <Text style={{ color: '#fff' }}>tect</Text>
          <Text style={{ color: '#ff4a4aff' }}>IQ</Text>
        </Text>
      </View>

      {/* Right Section — Profile dropdown */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.profileButton}
        onPress={() => setDropdownVisible(true)}
      >
        <Image
          source={require('../assets/Logo.png')}
          style={styles.avatar}
          resizeMode="cover"
        />
        <View style={{ marginLeft: 8 }}>
          <Text style={styles.userName}>Reallie Reyes</Text>
          <Text style={styles.userRole}>Farmer</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#222" style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        transparent
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.dropdownItem}>
              <Ionicons name="person-outline" size={18} color="#222" />
              <Text style={styles.dropdownText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem}>
              <Ionicons name="settings-outline" size={18} color="#222" />
              <Text style={styles.dropdownText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleSignOutPress}>
              <Ionicons name="log-out-outline" size={18} color="#222" />
              <Text style={styles.dropdownText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#4d8b36ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginRight: -10,
    marginTop: -20,
    marginBottom: -10,
    marginLeft: -20,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
  },
  profileButton: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 40,
    paddingHorizontal: 3,
    paddingVertical: 5,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userName: {
    color: '#222',
    fontWeight: '600',
    fontSize: 11,
  },
  userRole: {
    color: '#666',
    fontSize: 9,
  },
  overlay: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    width: 150,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
});

export default CustomHeader;
