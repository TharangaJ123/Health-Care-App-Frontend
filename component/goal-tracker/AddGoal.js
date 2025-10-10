import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import Icon from '../common/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiFetch } from '../../config/api';
import { useUser } from '../../context/UserContext';

const AddGoalScreen = ({ onGoBack, onAddGoal }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'physical',
    date: new Date(),
    time: new Date(),
    priority: 'medium',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [aiSuggestEnabled, setAiSuggestEnabled] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  React.useEffect(() => {
    const fetchAISuggestions = async () => {
      if (!aiSuggestEnabled) {
        setRemoteSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const payload = { type: formData.type, title: formData.title, description: formData.description };
        const resp = await apiFetch('/api/goals/generate-goals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const list = Array.isArray(resp?.suggestions) ? resp.suggestions : [];
        const normalized = list.map((s) => ({
          title: s.title || s.name || 'Suggested Goal',
          description: s.description || s.summary || '',
          time: s.time || 'Anytime',
          priority: (s.priority || 'medium').toLowerCase(),
        }));
        setRemoteSuggestions(normalized);
      } catch (e) {
        setRemoteSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchAISuggestions();
  }, [aiSuggestEnabled, formData.type, formData.title, formData.description]);

  
  const goalTypes = [
    { id: 'physical', label: 'Physical', icon: 'fitness-outline', color: '#FF3B30' },
    { id: 'mental', label: 'Mental', icon: 'happy-outline', color: '#5856D6' },
    { id: 'nutrition', label: 'Nutrition', icon: 'nutrition-outline', color: '#34C759' },
    { id: 'sleep', label: 'Sleep', icon: 'moon-outline', color: '#007AFF' },
    { id: 'social', label: 'Social', icon: 'people-outline', color: '#FF9500' },
    { id: 'other', label: 'Other', icon: 'flag-outline', color: '#8E8E93' },
  ];

  const priorities = [
    { id: 'high', label: 'High', color: '#FF3B30' },
    { id: 'medium', label: 'Medium', color: '#FF9500' },
    { id: 'low', label: 'Low', color: '#4CD964' },
  ];

  const getSuggestionsForType = (type) => {
    if (aiSuggestEnabled && remoteSuggestions && remoteSuggestions.length) {
      return remoteSuggestions;
    }
    return [];
  };

  const handleApplySuggestion = (s) => {
    setFormData((prev) => ({
      ...prev,
      title: s.title || prev.title,
      description: s.description || prev.description,
      priority: s.priority || prev.priority,
    }));
    Alert.alert('AI Suggestion Applied', 'We pre-filled the form. You can still edit anything.');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData(prev => ({
        ...prev,
        time: selectedTime
      }));
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a goal description');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const newGoal = {
      id: Date.now().toString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      date: formData.date.toISOString().split('T')[0],
      time: formatTime(formData.time),
      priority: formData.priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const payload = {
      name: String(newGoal.title || '').trim(),
      startDate: String(newGoal.date || '').trim(),
      endDate: String(newGoal.date || '').trim(),
      priority: String(newGoal.priority || '').trim(),
      description: newGoal.description,
      type: newGoal.type,
      time: newGoal.time,
      completed: newGoal.completed,
      createdAt: newGoal.createdAt,
      userId: user?.uid || user?.email || undefined,
    };

    try {
      console.log('POST /api/goals payload:', payload);
      const created = await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const createdId = created?.id || created?._id;
      if (createdId) {
        try {
          await apiFetch(`/api/goals/${encodeURIComponent(createdId)}/generate-steps`, { method: 'POST' });
        } catch (e) {
          console.log('generate-steps failed:', e?.message || e);
        }
      }
      const createdForParent = createdId ? { ...newGoal, id: String(createdId) } : newGoal;
      onAddGoal(createdForParent);
      Alert.alert('Done', 'Goal created successfully.', [
        { text: 'OK', onPress: onGoBack }
      ]);
    } catch (e) {
      console.log('POST /api/goals error:', e);
      Alert.alert('Error', String(e?.message || e || 'Failed to save goal.'));
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      type: 'physical',
      date: new Date(),
      time: new Date(),
      priority: 'medium',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onGoBack}
        >
          <Icon name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Goal</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleReset}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* AI Suggestions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>AI Suggestions</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{aiSuggestEnabled ? 'On' : 'Off'}</Text>
                <Switch
                  value={aiSuggestEnabled}
                  onValueChange={setAiSuggestEnabled}
                  thumbColor={aiSuggestEnabled ? '#fff' : '#fff'}
                  trackColor={{ false: '#E5E7EB', true: '#34C759' }}
                />
              </View>
            </View>

            {aiSuggestEnabled && (
              <View style={styles.suggestionsList}>
                {loadingSuggestions ? (
                  <Text style={{ color: '#666', marginBottom: 8 }}>Loading suggestions...</Text>
                ) : null}
                {getSuggestionsForType(formData.type).map((s, idx) => (
                  <TouchableOpacity
                    key={`${formData.type}-sugg-${idx}`}
                    style={styles.suggestionCard}
                    onPress={() => handleApplySuggestion(s)}
                  >
                    <View style={styles.suggestionIconWrap}>
                      <Icon name="sparkles-outline" size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.suggestionContent}>
                      <Text style={styles.suggestionTitle}>{s.title}</Text>
                      <Text style={styles.suggestionDesc}>{s.description}</Text>
                      <View style={styles.suggestionMetaRow}>
                        <View style={styles.metaPill}>
                          <Icon name="time-outline" size={14} color="#666" />
                          <Text style={styles.metaText}>{s.time || 'Anytime'}</Text>
                        </View>
                        <View style={[styles.metaPill, { marginLeft: 8 }]}>
                          <Icon name="flag-outline" size={14} color="#666" />
                          <Text style={styles.metaText}>{(s.priority || 'medium').toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.useButton}>
                      <Icon name="add" size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Goal Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Type</Text>
            <View style={styles.typeGrid}>
              {goalTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    formData.type === type.id && styles.typeButtonActive,
                    { borderColor: type.color }
                  ]}
                  onPress={() => handleInputChange('type', type.id)}
                >
                  <Icon 
                    name={type.icon} 
                    size={24} 
                    color={formData.type === type.id ? '#fff' : type.color} 
                  />
                  <Text style={[
                    styles.typeLabel,
                    formData.type === type.id && styles.typeLabelActive
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          

          {/* Basic Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            {/* Goal Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter goal title"
                placeholderTextColor="#999"
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
                maxLength={100}
              />
              <Text style={styles.charCount}>{formData.title.length}/100</Text>
            </View>

            {/* Goal Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your goal in detail..."
                placeholderTextColor="#999"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{formData.description.length}/500</Text>
            </View>
          </View>

      {/* Schedule Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schedule</Text>
            
            <View style={styles.scheduleRow}>
              {/* Date Picker */}
              <View style={styles.scheduleInput}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.pickerText}>
                    {formatDate(formData.date)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Time Picker */}
              <View style={styles.scheduleInput}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Icon name="time-outline" size={20} color="#666" />
                  <Text style={styles.pickerText}>
                    {formatTime(formData.time)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Priority Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityButton,
                    formData.priority === priority.id && styles.priorityButtonActive,
                    { borderColor: priority.color }
                  ]}
                  onPress={() => handleInputChange('priority', priority.id)}
                >
                  <View style={[
                    styles.priorityDot,
                    { backgroundColor: priority.color }
                  ]} />
                  <Text style={[
                    styles.priorityLabel,
                    formData.priority === priority.id && styles.priorityLabelActive
                  ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onGoBack}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Icon name="checkmark" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={formData.time}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop:25
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerButton: {
    padding: 8,
  },
  resetText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  suggestionsList: {
    marginTop: 4,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  suggestionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  suggestionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
    fontWeight: '600',
  },
  useButton: {
    marginLeft: 10,
    backgroundColor: '#7C3AED',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  typeLabelActive: {
    color: '#fff',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleInput: {
    width: '48%',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  priorityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priorityLabelActive: {
    color: '#fff',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: 16,
  },
  remindersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reminderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  reminderChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reminderChipText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  reminderChipTextActive: {
    color: '#fff',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default AddGoalScreen;
