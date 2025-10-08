import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '../../services/StorageService';
import Header from '../Header';

const SettingsScreen = ({ navigation }) => {
  const [preferences, setPreferences] = useState({
    notifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    reminderAdvanceTime: 15,
    theme: 'light',
    autoBackup: false,
    shareWithDoctor: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await StorageService.getUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      await StorageService.saveUserPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your medications, logs, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const exportData = () => {
    Alert.alert('Export Data', 'This feature will be available in the next update');
  };

  const renderSettingRow = (icon, title, description, value, onToggle, iconColor = '#667eea') => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  const renderActionRow = (icon, title, description, onPress, iconColor = '#2196F3', showArrow = true) => (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Ionicons name={icon} size={24} color={iconColor} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Settings" 
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'notifications',
              'Push Notifications',
              'Receive medication reminders',
              preferences.notifications,
              (value) => updatePreference('notifications', value)
            )}
            {renderSettingRow(
              'volume-high',
              'Sound',
              'Play notification sound',
              preferences.soundEnabled,
              (value) => updatePreference('soundEnabled', value)
            )}
            {renderSettingRow(
              'phone-portrait',
              'Vibration',
              'Vibrate on notifications',
              preferences.vibrationEnabled,
              (value) => updatePreference('vibrationEnabled', value)
            )}
          </View>
        </View>

        {/* Privacy & Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'cloud-upload',
              'Auto Backup',
              'Automatically backup data to cloud',
              preferences.autoBackup,
              (value) => updatePreference('autoBackup', value),
              '#4CAF50'
            )}
            {renderSettingRow(
              'medical',
              'Share with Doctor',
              'Allow doctor access to adherence data',
              preferences.shareWithDoctor,
              (value) => updatePreference('shareWithDoctor', value),
              '#2196F3'
            )}
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={styles.card}>
            {renderActionRow(
              'color-palette',
              'Theme',
              `Current: ${preferences.theme === 'light' ? 'Light' : 'Dark'}`,
              () => Alert.alert('Coming Soon', 'Dark theme will be available in the next update')
            )}
            {renderActionRow(
              'time',
              'Reminder Advance Time',
              `${preferences.reminderAdvanceTime} minutes before`,
              () => Alert.alert('Coming Soon', 'Custom reminder timing will be available soon')
            )}
            {renderActionRow(
              'language',
              'Language',
              'English (US)',
              () => Alert.alert('Coming Soon', 'Multiple languages will be supported soon')
            )}
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            {renderActionRow(
              'download',
              'Export Data',
              'Download your medication data',
              exportData,
              '#4CAF50'
            )}
            {renderActionRow(
              'refresh',
              'Sync Data',
              'Sync with cloud backup',
              () => Alert.alert('Coming Soon', 'Cloud sync will be available soon'),
              '#2196F3'
            )}
            {renderActionRow(
              'trash',
              'Clear All Data',
              'Permanently delete all app data',
              clearAllData,
              '#F44336'
            )}
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            {renderActionRow(
              'help-circle',
              'Help & FAQ',
              'Get help and find answers',
              () => Alert.alert('Help', 'Help documentation will be available soon')
            )}
            {renderActionRow(
              'chatbubble',
              'Contact Support',
              'Get in touch with our team',
              () => Alert.alert('Contact', 'Support contact will be available soon')
            )}
            {renderActionRow(
              'star',
              'Rate App',
              'Rate MediCare on the app store',
              () => Alert.alert('Thank You', 'Rating feature will be available soon')
            )}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            {renderActionRow(
              'information-circle',
              'App Version',
              'Version 1.0.0',
              () => {},
              '#667eea',
              false
            )}
            {renderActionRow(
              'document-text',
              'Privacy Policy',
              'Read our privacy policy',
              () => Alert.alert('Privacy Policy', 'Privacy policy will be available soon')
            )}
            {renderActionRow(
              'document-text',
              'Terms of Service',
              'Read terms and conditions',
              () => Alert.alert('Terms of Service', 'Terms will be available soon')
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 82,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default SettingsScreen;