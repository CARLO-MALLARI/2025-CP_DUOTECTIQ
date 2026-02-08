import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface ConnectionStatusBannerProps {
  connected: boolean;
  stale: boolean;
  isLocal?: boolean;
  localReady?: boolean;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  connected,
  stale,
  isLocal = false,
  localReady = false,
}) => {
  // Determine status and styling
  let statusText = '';
  let statusColor = '';
  let icon = '';

  if (isLocal) {
    statusText = 'Running Local Inference';
    statusColor = '#FF9800'; // Orange
    icon = '📱';
  } else if (connected && !stale) {
    statusText = 'Connected to Server';
    statusColor = '#4CAF50'; // Green
    icon = '🌐';
  } else if (stale) {
    statusText = 'Connection Stale - Switching to Local';
    statusColor = '#FFC107'; // Amber
    icon = '⚠️';
  } else {
    statusText = localReady ? 'Offline - Local Mode Available' : 'Disconnected';
    statusColor = '#DC2626'; // Red
    icon = '🔌';
  }

  return (
    <View style={[styles.banner, {backgroundColor: statusColor}]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{statusText}</Text>
      {isLocal && localReady && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>OFFLINE MODE</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  badge: {
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
