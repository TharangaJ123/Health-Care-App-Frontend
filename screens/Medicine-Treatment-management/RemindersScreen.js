import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StorageService from '../../services/StorageService';
import Header from '../../components/Header';

const RemindersScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [medsData, remindersData, prefsData] = await Promise.all([
        StorageService.getMedications(),
        StorageService.getReminders(),
        StorageService.getUserPreferences(),
      ]);
      
      setMedications(medsData);
      setReminders(remindersData);
      setPreferences(prefsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleReminder = async (medicationId, enabled) => {
    try {
      if (enabled) {
        const medication = medications.find(med => med.id === medicationId);
        if (medication) {
          await StorageService.addReminder({
            medicationId,
            medicationName: medication.name,
            times: medication.times || ['08:00'],
            enabled: true,
            soundEnabled: preferences.soundEnabled,
            vibrationEnabled: preferences.vibrationEnabled,
          });
        }
      } else {
        const reminder = reminders.find(r => r.medicationId === medicationId);
        if (reminder) {
          await StorageService.deleteReminder(reminder.id);
        }
      }
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const updatePreference = async (key, value) => {
    try {
      const newPreferences = { ...preferences, [key]: value };
      await StorageService.saveUserPreferences(newPreferences);
      setPreferences(newPreferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const isReminderEnabled = (medicationId) => {
    return reminders.some(r => r.medicationId === medicationId && r.enabled);
  };

  return (
    <View style={styles.container}>
      <Header 
        title="Reminders" 
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={24} color="#2196F3" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Enable Notifications</Text>
                  <Text style={styles.settingDescription}>Receive medication reminders</Text>
                </View>
              </View>
              <Switch
                value={preferences.notifications}
                onValueChange={(value) => updatePreference('notifications', value)}
                trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
                thumbColor={preferences.notifications ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="volume-high" size={24} color="#2196F3" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Sound</Text>
                  <Text style={styles.settingDescription}>Play notification sound</Text>
                </View>
              </View>
              <Switch
                value={preferences.soundEnabled}
                onValueChange={(value) => updatePreference('soundEnabled', value)}
                trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
                thumbColor={preferences.soundEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait" size={24} color="#2196F3" />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Vibration</Text>
                  <Text style={styles.settingDescription}>Vibrate on notifications</Text>
                </View>
              </View>
              <Switch
                value={preferences.vibrationEnabled}
                onValueChange={(value) => updatePreference('vibrationEnabled', value)}
                trackColor={{ false: '#E0E0E0', true: '#2196F3' }}
                thumbColor={preferences.vibrationEnabled ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Medication Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Reminders</Text>
          
          {medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={64} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>No medications added yet</Text>
              <TouchableOpacity
                style={styles.addMedicationButton}
                onPress={() => navigation.navigate('AddMedication')}
              >
                <Text style={styles.addMedicationButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            medications.map((medication) => (
              <View key={medication.id} style={styles.medicationCard}>
                <View style={styles.medicationHeader}>
                  <View style={styles.medicationInfo}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDetails}>
                      {medication.dosage} • {medication.frequency}
                    </Text>
                  </View>
                  <Switch
                    value={isReminderEnabled(medication.id)}
                    onValueChange={(value) => toggleReminder(medication.id, value)}
                    trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
                    thumbColor={isReminderEnabled(medication.id) ? '#ffffff' : '#f4f3f4'}
                  />
                </View>
                
                {medication.times && medication.times.length > 0 && (
                  <View style={styles.timesContainer}>
                    <Text style={styles.timesLabel}>Reminder Times:</Text>
                    <View style={styles.timesList}>
                      {medication.times.map((time, index) => (
                        <View key={index} style={styles.timeChip}>
                          <Ionicons name="time" size={24} color="#2196F3" />
                          <Text style={styles.timeText}>{time}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddMedication')}
          >
            <Ionicons name="add-circle" size={32} color="#667eea" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Add New Medication</Text>
              <Text style={styles.actionDescription}>Set up reminders for a new medication</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'Snooze functionality will be available in the next update')}
          >
            <Ionicons name="alarm" size={32} color="#FF9800" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Snooze Settings</Text>
              <Text style={styles.actionDescription}>Configure snooze duration and limits</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => Alert.alert('Test Notification', 'This feature will send a test notification to verify your settings')}
          >
            <Ionicons name="notifications" size={32} color="#4CAF50" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Test Notification</Text>
              <Text style={styles.actionDescription}>Send a test reminder to check settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>
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
    fontWeight: 'bold',
    color: '#ffffff',
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
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  medicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
  },
  timesContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
  },
  addMedicationButton: {
    backgroundColor: '#667eea',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  addMedicationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default RemindersScreen;
