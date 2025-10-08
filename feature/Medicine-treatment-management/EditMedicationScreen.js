import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getMedications, updateMedication, deleteMedication } from '../../utils/storage';
import { scheduleMedicationReminder, cancelScheduledReminder } from '../../services/NotificationService';
import { getSampleMedicationCategories, getMedicationColors } from '../../utils/sampleData';
import { theme } from '../../utils/theme';
import Header from '../Header';

const EditMedicationScreen = ({ navigation, route }) => {
  const { medicationId } = route.params;
  const [medicationData, setMedicationData] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00 AM'],
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    category: 'Other',
    color: '#10B981',
    prescribedBy: '',
    instructions: '',
    reminderEnabled: true,
  });
  const [loading, setLoading] = useState(true);

  const frequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'As Needed', value: 'as-needed' },
  ];
  const [selectedFrequency, setSelectedFrequency] = useState('daily');
  const categories = getSampleMedicationCategories();
  const colors = getMedicationColors();

  // Validate YYYY-MM-DD date format and ensure it results in a valid Date
  const isValidISODate = (value) => {
    if (!value || typeof value !== 'string') return false;
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(value)) return false;
    const d = new Date(value);
    return !isNaN(d.getTime()) && value === d.toISOString().split('T')[0];
  };

  useEffect(() => {
    loadMedication();
  }, [medicationId]);

  const loadMedication = async () => {
    try {
      const medications = await getMedications();
      // Convert medicationId to number for comparison
      const idToFind = typeof medicationId === 'string' ? parseInt(medicationId, 10) : medicationId;
      const medication = medications.find(med => med.id === idToFind);
      
      if (medication) {
        setMedicationData(medication);
        setSelectedFrequency(medication.frequency);
      } else {
        console.log('Medication not found. Looking for ID:', idToFind, 'Type:', typeof idToFind);
        console.log('Available medications:', medications.map(m => ({ id: m.id, name: m.name })));
        Alert.alert('Error', 'Medication not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error loading medication:', error);
      Alert.alert('Error', 'Failed to load medication');
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = (frequency) => {
    setSelectedFrequency(frequency);
    let defaultTimes = [];
    
    switch (frequency) {
      case 'daily':
        defaultTimes = ['08:00 AM'];
        break;
      case 'weekly':
        defaultTimes = ['08:00 AM'];
        break;
      case 'monthly':
        defaultTimes = ['08:00 AM'];
        break;
      case 'as-needed':
        defaultTimes = [];
        break;
    }
    
    setMedicationData(prev => ({
      ...prev,
      frequency,
      times: defaultTimes,
    }));
  };

  const updateTime = (index, time) => {
    const newTimes = [...medicationData.times];
    newTimes[index] = time;
    setMedicationData(prev => ({ ...prev, times: newTimes }));
  };

  const addTimeSlot = () => {
    setMedicationData(prev => ({
      ...prev,
      times: [...prev.times, '12:00 PM'],
    }));
  };

  const removeTimeSlot = (index) => {
    const newTimes = medicationData.times.filter((_, i) => i !== index);
    setMedicationData(prev => ({ ...prev, times: newTimes }));
  };

  const handleUpdate = async () => {
    if (!medicationData.name.trim()) {
      Alert.alert('Error', 'Please enter medication name');
      return;
    }
    
    if (!medicationData.dosage.trim()) {
      Alert.alert('Error', 'Please enter dosage');
      return;
    }

    if (!medicationData.frequency) {
      Alert.alert('Error', 'Please select frequency');
      return;
    }

    if (medicationData.frequency !== 'as-needed' && medicationData.times.length === 0) {
      Alert.alert('Error', 'Please add at least one reminder time');
      return;
    }

    // Normalize startDate: if parsable, coerce to YYYY-MM-DD; otherwise block
    let normalizedStart = medicationData.startDate;
    const parsed = new Date(medicationData.startDate);
    if (!isNaN(parsed.getTime())) {
      normalizedStart = parsed.toISOString().split('T')[0];
    }
    if (!isValidISODate(normalizedStart)) {
      Alert.alert('Invalid Date', 'Please enter Start Date as YYYY-MM-DD (e.g., 2025-08-31).');
      return;
    }

    try {
      // Remove any empty/whitespace-only time entries
      const sanitizedTimes = (medicationData.times || []).map(t => t.trim()).filter(Boolean);

      const medicationToUpdate = {
        ...medicationData,
        startDate: normalizedStart,
        times: medicationData.frequency === 'as-needed' ? [] : sanitizedTimes,
        instructions: medicationData.instructions || medicationData.notes,
        updatedAt: new Date().toISOString(),
      };
      
      if (medicationToUpdate.frequency !== 'as-needed' && medicationToUpdate.times.length === 0) {
        Alert.alert('Error', 'Please add at least one valid reminder time (e.g., 08:00 AM).');
      }
      
      // Ensure numeric ID
      const idNum = typeof medicationId === 'string' ? parseInt(medicationId, 10) : medicationId;
      
      try {
        // Cancel existing notifications for this medication (only on native platforms)
        if (Platform.OS !== 'web') {
          await cancelScheduledReminder(idNum);
        }
        
        // Update the medication in storage
        await updateMedication(idNum, medicationToUpdate);
        
        // Schedule new notifications if reminders are enabled (only on native platforms)
        if (Platform.OS !== 'web' && medicationToUpdate.reminderEnabled && medicationToUpdate.times && medicationToUpdate.times.length > 0) {
          try {
            await scheduleMedicationReminder({
              id: idNum,
              ...medicationToUpdate,
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // Default to all days
            });
          } catch (error) {
            console.error('Error scheduling notifications:', error);
            // Don't block the update operation if notification scheduling fails
            Alert.alert('Warning', 'Medication updated, but there was an error scheduling reminders.');
          }
        }
        
        // Navigate back to Home after successful update
        navigation.navigate('Home');
      } catch (error) {
        console.error('Error in update process:', error);
        Alert.alert('Error', `Failed to update medication: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      Alert.alert('Error', `Failed to update medication: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    try {
      // Convert medicationId to number for consistency
      const idToDelete = typeof medicationId === 'string' ? parseInt(medicationId, 10) : medicationId;
      
      // First, verify we can find the medication in storage
      const allMeds = await getMedications();
      
      const medicationExists = allMeds.some(m => m.id === idToDelete);
      
      // Cancel all notifications for this medication
      await cancelScheduledReminder(idToDelete);
      
      if (!medicationExists) {
        console.error('Medication not found in storage');
        Alert.alert('Error', 'This medication was not found in the database. It may have already been deleted.');
        return;
      }
      
      Alert.alert(
        'Delete Medication',
        `Are you sure you want to delete "${medicationData.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteMedication(idToDelete);
                Alert.alert('Success', 'Medication deleted successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } catch (error) {
                console.error('Error in delete operation:', {
                  error: error.toString(),
                  message: error.message,
                  stack: error.stack,
                  medicationId: idToDelete,
                  medicationType: typeof idToDelete
                });
                
                // Try to get the current state of storage
                try {
                  const currentStorage = await AsyncStorage.getItem('@medications');
                } catch (storageError) {
                  console.error('Failed to read AsyncStorage:', storageError);
                }
                
                let errorMessage = 'Failed to delete medication. ';
                
                if (error.message.includes('not found in database')) {
                  errorMessage = 'This medication could not be found. It may have already been deleted.';
                } else if (error.message.includes('Invalid ID')) {
                  errorMessage = 'Invalid medication ID. Please try refreshing the app and try again.';
                } else if (error.message.includes('JSON')) {
                  errorMessage = 'Data corruption detected. The app will attempt to repair the data.';
                  // Try to repair corrupted data
                  try {
                    const allMeds = await getMedications();
                    const validMeds = allMeds.filter(m => m && m.id !== undefined);
                    await AsyncStorage.setItem('@medications', JSON.stringify(validMeds));
                  } catch (repairError) {
                    console.error('Failed to repair data:', repairError);
                  }
                }
                
                Alert.alert('Error', errorMessage, [
                  {
                    text: 'Force Remove',
                    onPress: async () => {
                      try {
                        const allItems = await AsyncStorage.getAllKeys();
                        
                        // Try to find the correct key
                        const medicationsKey = allItems.find(key => key.toLowerCase().includes('medications'));
                        
                        if (medicationsKey) {
                          const currentData = await AsyncStorage.getItem(medicationsKey);
                          
                          try {
                            const parsed = JSON.parse(currentData || '[]');
                            const filtered = parsed.filter(m => 
                              m && 
                              m.id !== idToDelete && 
                              String(m.id) !== String(idToDelete)
                            );
                            
                            await AsyncStorage.setItem(medicationsKey, JSON.stringify(filtered));
                            Alert.alert('Success', 'Medication was force removed', [
                              { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                          } catch (parseError) {
                            console.error('Failed to parse medications:', parseError);
                            // Last resort: clear all medication data
                            await AsyncStorage.removeItem(medicationsKey);
                            Alert.alert('Success', 'Medication data has been reset', [
                              { text: 'OK', onPress: () => navigation.goBack() }
                            ]);
                          }
                        } else {
                          throw new Error('Could not find medications in storage');
                        }
                      } catch (forceError) {
                        console.error('Force remove failed:', forceError);
                        Alert.alert('Critical Error', 'Please reinstall the app or contact support.');
                      }
                    } 
                  }
                ]);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleDelete:', error);
      Alert.alert('Error', 'An unexpected error occurred while preparing to delete the medication.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Edit Medication" 
        onBack={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={24} color="#ffffff" />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              value={medicationData.name}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, name: text }))}
              placeholder="Enter medication name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              value={medicationData.dosage}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, dosage: text }))}
              placeholder="e.g., 100mg, 2 tablets, 5ml"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyContainer}>
              {frequencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyOption,
                    selectedFrequency === option.value && styles.frequencyOptionSelected
                  ]}
                  onPress={() => handleFrequencyChange(option.value)}
                >
                  <Text style={[
                    styles.frequencyText,
                    selectedFrequency === option.value && styles.frequencyTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.frequencyOption,
                    medicationData.category === category && styles.frequencyOptionSelected
                  ]}
                  onPress={() => setMedicationData(prev => ({ ...prev, category }))}
                >
                  <Text style={[
                    styles.frequencyText,
                    medicationData.category === category && styles.frequencyTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorContainer}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    medicationData.color === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setMedicationData(prev => ({ ...prev, color }))}
                />
              ))}
            </ScrollView>
          </View>

          {selectedFrequency !== 'as-needed' && (
            <View style={styles.inputGroup}>
              <View style={styles.timesHeader}>
                <Text style={styles.label}>Reminder Times</Text>
                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={addTimeSlot}
                >
                  <Ionicons name="add" size={20} color="#667eea" />
                  <Text style={styles.addTimeText}>Add Time</Text>
                </TouchableOpacity>
              </View>
              
              {medicationData.times.map((time, index) => (
                <View key={index} style={styles.timeSlot}>
                  <TextInput
                    style={styles.timeInput}
                    value={time}
                    onChangeText={(text) => updateTime(index, text)}
                    placeholder="HH:MM AM/PM"
                    placeholderTextColor="#999"
                  />
                  {medicationData.times.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeTimeButton}
                      onPress={() => removeTimeSlot(index)}
                    >
                      <Ionicons name="close" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={medicationData.startDate}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, startDate: text }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date (Optional)</Text>
            <TextInput
              style={styles.input}
              value={medicationData.endDate}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, endDate: text }))}
              placeholder="YYYY-MM-DD (Leave empty for ongoing)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prescribed By (Optional)</Text>
            <TextInput
              style={styles.input}
              value={medicationData.prescribedBy}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, prescribedBy: text }))}
              placeholder="Doctor's name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={medicationData.instructions}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, instructions: text }))}
              placeholder="Take with food, before meals, etc."
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={medicationData.notes}
              onChangeText={(text) => setMedicationData(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleUpdate}
        >
          <Text style={styles.saveButtonText}>Update Medication</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  deleteButton: {
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
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
  },
  frequencyOption: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  frequencyOptionSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  frequencyText: {
    fontSize: 14,
    color: '#333',
  },
  frequencyTextSelected: {
    color: '#ffffff',
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  addTimeText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 10,
  },
  removeTimeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default EditMedicationScreen;