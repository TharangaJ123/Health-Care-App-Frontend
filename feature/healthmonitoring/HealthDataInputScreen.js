import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthStyles } from './styles/HealthMonitoringStyles';
import { useHealthData } from '../../context/HealthDataContext';

// Health data validation ranges
const HEALTH_RANGES = {
  heartRate: { min: 30, max: 200, normalMin: 60, normalMax: 100 },
  systolicBP: { min: 70, max: 200, normalMax: 120 },
  diastolicBP: { min: 40, max: 130, normalMax: 80 },
  spo2: { min: 70, max: 100, normalMin: 95 },
  bloodGlucose: { min: 50, max: 400, normalMin: 70, normalMax: 140 },
};

const HealthDataInputScreen = ({ navigation }) => {
  const { addHealthData } = useHealthData();
  
  const [formData, setFormData] = useState({
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    spo2: '',
    bloodGlucose: '',
    notes: '',
  });
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  const validateInput = (name, value) => {
    if (!value) return '';
    
    const numValue = Number(value);
    if (isNaN(numValue)) return 'Please enter a valid number';
    
    const range = HEALTH_RANGES[name];
    if (numValue < range.min || numValue > range.max) {
      return `Value must be between ${range.min} and ${range.max}`;
    }
    
    return '';
  };

  const getStatus = (name, value) => {
    if (!value) return null;
    const numValue = Number(value);
    const range = HEALTH_RANGES[name];
    
    if (name === 'systolicBP') {
      if (numValue < 90) return { status: 'low', message: 'Low' };
      if (numValue > range.normalMax) return { status: 'high', message: 'High' };
      return { status: 'normal', message: 'Normal' };
    }
    
    if (name === 'diastolicBP') {
      if (numValue < 60) return { status: 'low', message: 'Low' };
      if (numValue > range.normalMax) return { status: 'high', message: 'High' };
      return { status: 'normal', message: 'Normal' };
    }
    
    if (name === 'spo2') {
      if (numValue < 91) return { status: 'low', message: 'Low' };
      if (numValue < 95) return { status: 'warning', message: 'Slightly Low' };
      return { status: 'normal', message: 'Normal' };
    }
    
    if (numValue < range.normalMin) return { status: 'low', message: 'Low' };
    if (numValue > range.normalMax) return { status: 'high', message: 'High' };
    return { status: 'normal', message: 'Normal' };
  };

  const handleInputChange = (name, value) => {
    const validationMessage = validateInput(name, value);
    setValidationMessages({
      ...validationMessages,
      [name]: validationMessage
    });
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const showAlert = (title, message) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  };

  const handleSubmit = () => {
    // Check for any validation errors
    const hasErrors = Object.values(validationMessages).some(msg => msg !== '');
    if (hasErrors) {
      showAlert('Validation Error', 'Please fix the errors in the form before submitting.');
      return;
    }

    // Check for abnormal values and show alerts
    const alerts = [];
    
    const heartRateStatus = getStatus('heartRate', formData.heartRate);
    if (heartRateStatus && heartRateStatus.status !== 'normal') {
      alerts.push(`Heart Rate is ${heartRateStatus.message} (${formData.heartRate} bpm)`);
    }
    
    const spo2Status = getStatus('spo2', formData.spo2);
    if (spo2Status && spo2Status.status !== 'normal') {
      alerts.push(`Oxygen Level is ${spo2Status.message} (${formData.spo2}%)`);
    }
    
    const bpStatus = getStatus('systolicBP', formData.systolicBP);
    if (bpStatus && bpStatus.status !== 'normal') {
      alerts.push(`Blood Pressure is ${bpStatus.message} (${formData.systolicBP}/${formData.diastolicBP} mmHg)`);
    }
    
    const glucoseStatus = getStatus('bloodGlucose', formData.bloodGlucose);
    if (glucoseStatus && glucoseStatus.status !== 'normal') {
      alerts.push(`Blood Glucose is ${glucoseStatus.message} (${formData.bloodGlucose} mg/dL)`);
    }
    
    // Show all alerts if any
    if (alerts.length > 0) {
      Alert.alert(
        'Health Alert',
        alerts.join('\n\n'),
        [{ text: 'I Understand' }],
        { cancelable: false }
      );
    }
    
    // Save data to context
    addHealthData(formData);
    
    // Show success message
    setShowSuccessModal(true);
    
    // Clear form
    setFormData({
      heartRate: '',
      systolicBP: '',
      diastolicBP: '',
      spo2: '',
      bloodGlucose: '',
      notes: '',
    });
    
    console.log('Health data submitted:', formData);
  };

  const renderStatusIndicator = (name, value) => {
    if (!value) return null;
    const status = getStatus(name, value);
    if (!status) return null;
    
    const statusStyle = {
      backgroundColor: 
        status.status === 'normal' ? '#2ecc71' : 
        status.status === 'warning' ? '#f39c12' :
        '#e74c3c',
    };
    
    return (
      <View style={[healthStyles.statusIndicator, statusStyle]}>
        <Text style={healthStyles.statusText}>{status.message}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={healthStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Back Button */}
      <View style={healthStyles.header}>
        <TouchableOpacity 
          style={healthStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={healthStyles.headerTitle}>Add Health Data</Text>
        <View style={healthStyles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={healthStyles.scrollContainer}>
        <View style={healthStyles.section}>
          <Text style={healthStyles.sectionTitle}>Health Metrics</Text>
          
          {/* Heart Rate */}
          <View style={healthStyles.inputGroup}>
            <Text style={healthStyles.label}>Heart Rate (bpm)</Text>
            <TextInput
              style={healthStyles.input}
              placeholder="e.g., 72"
              keyboardType="numeric"
              value={formData.heartRate}
              onChangeText={(text) => handleInputChange('heartRate', text)}
            />
            {validationMessages.heartRate ? (
              <Text style={{ color: 'red', fontSize: 12 }}>{validationMessages.heartRate}</Text>
            ) : renderStatusIndicator('heartRate', formData.heartRate)}
            <Text style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
              Normal: 60-100 bpm
            </Text>
          </View>

          {/* Blood Pressure */}
          <View style={healthStyles.inputGroup}>
            <Text style={healthStyles.label}>Blood Pressure (mmHg)</Text>
            <View style={healthStyles.row}>
              <View style={[healthStyles.halfInput, { marginRight: 10 }]}>
                <TextInput
                  style={healthStyles.input}
                  placeholder="Systolic"
                  keyboardType="numeric"
                  value={formData.systolicBP}
                  onChangeText={(text) => handleInputChange('systolicBP', text)}
                />
              </View>
              <View style={healthStyles.halfInput}>
                <TextInput
                  style={healthStyles.input}
                  placeholder="Diastolic"
                  keyboardType="numeric"
                  value={formData.diastolicBP}
                  onChangeText={(text) => handleInputChange('diastolicBP', text)}
                />
              </View>
            </View>
            {(validationMessages.systolicBP || validationMessages.diastolicBP) && (
              <Text style={{ color: 'red', fontSize: 12 }}>
                {validationMessages.systolicBP || validationMessages.diastolicBP}
              </Text>
            )}
            {!validationMessages.systolicBP && !validationMessages.diastolicBP && 
              (formData.systolicBP || formData.diastolicBP) && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {renderStatusIndicator('systolicBP', formData.systolicBP)}
                  <Text style={{ fontSize: 12, color: '#7f8c8d', marginLeft: 8 }}>
                    Normal: {'<'}120/80 mmHg
                  </Text>
                </View>
              )}
          </View>

          {/* Oxygen Level */}
          <View style={healthStyles.inputGroup}>
            <Text style={healthStyles.label}>Oxygen Level (SpO₂ %)</Text>
            <TextInput
              style={healthStyles.input}
              placeholder="e.g., 98"
              keyboardType="numeric"
              value={formData.spo2}
              onChangeText={(text) => handleInputChange('spo2', text)}
            />
            {validationMessages.spo2 ? (
              <Text style={{ color: 'red', fontSize: 12 }}>{validationMessages.spo2}</Text>
            ) : renderStatusIndicator('spo2', formData.spo2)}
            <Text style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
              Normal: 95-100%
            </Text>
          </View>

          {/* Blood Glucose */}
          <View style={healthStyles.inputGroup}>
            <Text style={healthStyles.label}>Blood Glucose (mg/dL)</Text>
            <TextInput
              style={healthStyles.input}
              placeholder="e.g., 90"
              keyboardType="numeric"
              value={formData.bloodGlucose}
              onChangeText={(text) => handleInputChange('bloodGlucose', text)}
            />
            {validationMessages.bloodGlucose ? (
              <Text style={{ color: 'red', fontSize: 12 }}>{validationMessages.bloodGlucose}</Text>
            ) : renderStatusIndicator('bloodGlucose', formData.bloodGlucose)}
            <Text style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
              Fasting: 70-99 mg/dL | After meal: {'<'}140 mg/dL
            </Text>
          </View>

          {/* Notes */}
          <View style={healthStyles.inputGroup}>
            <Text style={healthStyles.label}>Notes (Optional)</Text>
            <TextInput
              style={[healthStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Any additional notes about your health status..."
              multiline
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
            />
          </View>

          <TouchableOpacity 
            style={healthStyles.button}
            onPress={handleSubmit}
          >
            <Text style={healthStyles.buttonText}>Save Health Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={healthStyles.modalOverlay}>
          <View style={healthStyles.modalContent}>
            <View style={[healthStyles.modalIcon, { backgroundColor: '#2ecc71' }]}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={healthStyles.modalTitle}>Health Data Saved</Text>
            <Text style={healthStyles.modalText}>
              Your health data has been successfully recorded. You can view your health history in the dashboard.
            </Text>
            <TouchableOpacity
              style={[healthStyles.button, { width: '100%' }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={healthStyles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default HealthDataInputScreen;
