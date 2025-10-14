import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useUserStore } from '../stores/useUserStore';

const SettingsScreen: React.FC = () => {
  const settings = useUserStore((s) => s.settings);
  const setSettings = useUserStore((s) => s.setSettings);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text>Dark mode: {settings.darkMode ? 'On' : 'Off'}</Text>
      <Button title="Toggle" onPress={() => setSettings({ darkMode: !settings.darkMode })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 12 },
});

export default SettingsScreen;
