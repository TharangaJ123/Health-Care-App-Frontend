import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { saveMedication } from '../../utils/storage';
import { theme } from '../../utils/theme';
import { getSampleMedicationCategories, getMedicationColors } from '../../utils/sampleData';
import ScreenHeader from '../../component/common/ScreenHeader';
import { scheduleMedicationReminder, showMedicationAddedConfirmation } from '../../services/NotificationService';

const AddMedicationScreen = ({ navigation }) => {
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

  const handleSave = async () => {
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

    if (!isValidISODate(medicationData.startDate)) {
      Alert.alert('Error', 'Please enter a valid Start Date in YYYY-MM-DD format');
      return;
    }

    try {
      // Remove any empty/whitespace-only time entries
      const sanitizedTimes = (medicationData.times || []).map(t => t.trim()).filter(Boolean);

      const medicationToSave = {
        ...medicationData,
        times: medicationData.frequency === 'as-needed' ? [] : sanitizedTimes,
        instructions: medicationData.instructions || medicationData.notes,
      };
      
      const savedMedication = await saveMedication(medicationToSave);
      
      // Show immediate confirmation notification
      if (savedMedication.reminderEnabled && savedMedication.times && savedMedication.times.length > 0) {
        try {
          await showMedicationAddedConfirmation(savedMedication);
        } catch (error) {
          console.error('Error showing confirmation notification:', error);
        }
      }

      // Schedule actual reminder notifications
      if (savedMedication.reminderEnabled && savedMedication.times && savedMedication.times.length > 0) {
        try {
          await scheduleMedicationReminder(savedMedication);
        } catch (error) {
          console.error('Error scheduling reminder notifications:', error);
          // Don't block the save operation if notification scheduling fails
        }
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to add medication. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader 
        title="Add Medication" 
        onBack={() => navigation.goBack()}       
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
                    placeholder="HH:MM"
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
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save Medication</Text>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
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

export default AddMedicationScreen;