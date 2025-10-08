import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';

// Adjust this to your backend host if running on device/emulator
const API_BASE = 'http://192.168.8.190:5000';

export default function EditDoctorScreen({ route, navigation }) {
  const { doctorId, doctorProfile } = route.params;

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    bio: '',
    phone: '',
    email: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (doctorProfile) {
      setFormData({
        name: doctorProfile.name || '',
        specialization: doctorProfile.specialization || '',
        bio: doctorProfile.bio || '',
        phone: doctorProfile.phone || '',
        email: doctorProfile.email || '',
        location: doctorProfile.location || ''
      });
    }
  }, [doctorProfile]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.specialization.trim()) {
      Alert.alert('Error', 'Name and specialization are required fields.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/api/doctors/${doctorId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update doctor profile');
      }

      const updatedDoctor = await response.json();

      Alert.alert(
        'Success',
        'Doctor profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Success', {
              title: 'Profile Updated!',
              message: 'Doctor profile has been successfully updated. You will be redirected to the doctor details page.',
              nextScreen: 'DoctorDetail',
              nextScreenParams: { doctorId }
            })
          }
        ]
      );
    } catch (error) {
      console.error('Error updating doctor:', error);
      Alert.alert('Error', 'Failed to update doctor profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Doctor',
      'Are you sure you want to delete this doctor? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(`${API_BASE}/api/doctors/${doctorId}/profile`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                throw new Error('Failed to delete doctor');
              }

              Alert.alert(
                'Success',
                'Doctor deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Success', {
                      title: 'Doctor Deleted!',
                      message: 'The doctor has been successfully removed from the system.',
                      nextScreen: 'Home',
                      nextScreenParams: {}
                    })
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting doctor:', error);
              Alert.alert('Error', 'Failed to delete doctor. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Edit Doctor Profile</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter doctor's full name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialization *</Text>
            <TextInput
              style={styles.input}
              value={formData.specialization}
              onChangeText={(value) => handleInputChange('specialization', value)}
              placeholder="Enter specialization"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(value) => handleInputChange('bio', value)}
              placeholder="Enter doctor's bio"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="Enter location"
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            disabled={loading || saving}
          >
            <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete Doctor</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: '#fff',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
