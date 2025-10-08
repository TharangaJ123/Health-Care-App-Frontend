import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import StorageService from '../../services/StorageService';
import { theme } from '../../utils/theme';
import Header from '../Header';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useUser();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    emergencyContact: '',
    medicalConditions: '',
    allergies: '',
    doctor: '',
    pharmacy: '',
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // First try to get user data from context
      if (user) {
        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
        }));
      }
      
      // Then load additional profile data from storage
      const preferences = await StorageService.getUserPreferences();
      setProfile(prev => ({
        ...prev,
        ...preferences.profile,
        name: user?.name || preferences.profile?.name || '',
        email: user?.email || preferences.profile?.email || '',
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      // Update user context with new profile data
      await updateUser({
        name: profile.name,
        email: profile.email,
      });
      
      // Save additional profile data to storage
      const preferences = await StorageService.getUserPreferences();
      await StorageService.saveUserPreferences({
        ...preferences,
        profile,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (label, field, placeholder, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={profile[field]}
          onChangeText={(text) => updateField(field, text)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>
          {profile[field] || 'Not provided'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Profile" 
        onBack={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
          >
            <Ionicons 
              name={isEditing ? "checkmark" : "create"} 
              size={24} 
              color="#ffffff" 
            />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color={theme.colors.accentPrimary} />
          </View>
          <Text style={styles.userName}>{profile.name || 'Your Name'}</Text>
          <Text style={styles.userEmail}>{profile.email || 'your.email@example.com'}</Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            {renderField('Full Name', 'name', 'Enter your full name')}
            {renderField('Age', 'age', 'Enter your age')}
            {renderField('Email', 'email', 'Enter your email address')}
            {renderField('Phone', 'phone', 'Enter your phone number')}
            {renderField('Emergency Contact', 'emergencyContact', 'Enter emergency contact')}
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.card}>
            {renderField('Medical Conditions', 'medicalConditions', 'List any medical conditions', true)}
            {renderField('Allergies', 'allergies', 'List any allergies or adverse reactions', true)}
            {renderField('Primary Doctor', 'doctor', 'Enter your doctor\'s name and contact')}
            {renderField('Pharmacy', 'pharmacy', 'Enter your pharmacy information')}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="medical" size={24} color={theme.colors.accentPrimary} />
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Medications</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="calendar" size={24} color={theme.colors.accentPrimary} />
              <Text style={styles.statNumber}>30</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={32} color={theme.colors.accentSecondary} />
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="mail" size={24} color={theme.colors.accentPrimary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Export Health Data</Text>
              <Text style={styles.actionDescription}>Share your medication history</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="cloud-upload" size={24} color="#4CAF50" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Backup Data</Text>
              <Text style={styles.actionDescription}>Save your data to cloud</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#FFEBEE' }]}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                      await logout();
                      navigation.replace('Login');
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="log-out" size={24} color="#F44336" />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: '#F44336' }]}>Logout</Text>
              <Text style={styles.actionDescription}>Sign out of your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in the next update')}
          >
            <Ionicons name="people" size={24} color={theme.colors.accentSecondary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Share with Caregiver</Text>
              <Text style={styles.actionDescription}>Give access to family member</Text>
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
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
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 8,
  },
  fieldInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
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
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default ProfileScreen;