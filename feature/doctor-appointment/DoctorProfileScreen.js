import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './styles/AppointmentStyles';

// Adjust this to your backend host if running on device/emulator
// e.g., Android emulator: http://10.0.2.2:5000, iOS simulator: http://localhost:5000, real device: http://<LAN-IP>:5000
const API_BASE = 'http://192.168.8.190:5000';

export default function DoctorProfileScreen({ navigation }) {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [errorDoctors, setErrorDoctors] = useState('');

  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [selectedDoctorName, setSelectedDoctorName] = useState('');
  const [selectedSpec, setSelectedSpec] = useState(null);

  // Add Doctor modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('');
  const [docBio, setDocBio] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docLocation, setDocLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      setErrorDoctors('');
      const res = await fetch(`${API_BASE}/api/doctors`);
      if (!res.ok) throw new Error('Failed to load doctors');
      const data = await res.json();
      setDoctors(data || []);
    } catch (e) {
      setErrorDoctors(e.message || 'Failed to load doctors');
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
    }, [fetchDoctors])
  );

  const specializations = useMemo(() => {
    const set = new Set();
    (doctors || []).forEach(d => {
      if (d.specialization && d.specialization.trim()) set.add(d.specialization.trim());
    });
    return ['All', ...Array.from(set).sort()];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    if (!selectedSpec) return [];
    if (selectedSpec === 'All') return doctors;
    return (doctors || []).filter(d => (d.specialization || '').trim() === selectedSpec);
  }, [doctors, selectedSpec]);

  const createDoctor = useCallback(async () => {
    if (!docName.trim() || !docSpec.trim()) {
      Alert.alert('Validation', 'Name and Specialization are required');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName.trim(),
          specialization: docSpec.trim(),
          bio: docBio.trim(),
          phone: docPhone.trim(),
          email: docEmail.trim(),
          location: docLocation.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to create doctor');
      const created = await res.json();
      Alert.alert('Success', `Doctor "${created.name}" has been added successfully!`);
      // refresh list
      await fetchDoctors();
      // reset form
      setDocName('');
      setDocSpec('');
      setDocBio('');
      setDocPhone('');
      setDocEmail('');
      setDocLocation('');
      setShowAddModal(false);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to create doctor');
    } finally {
      setSubmitting(false);
    }
  }, [docName, docSpec, docBio, docPhone, docEmail, docLocation, fetchDoctors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Doctor Profile</Text>

        {/* Specialization selector + Add button */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.label}>Specialization</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1976D2', borderRadius: 6 }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>+ Add Doctor</Text>
          </TouchableOpacity>
        </View>
        {loadingDoctors ? (
          <ActivityIndicator color="#1976D2" />
        ) : errorDoctors ? (
          <Text style={{ color: 'red' }}>{errorDoctors}</Text>
        ) : (
          <View>
            {/* Horizontal specialization chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {specializations.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  onPress={() => setSelectedSpec(spec)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: selectedSpec === spec ? '#1976D2' : '#E0E0E0',
                    backgroundColor: selectedSpec === spec ? '#E3F2FD' : '#FFFFFF',
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: selectedSpec === spec ? '#0D47A1' : '#424242', fontWeight: '600' }}>{spec}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Vertical doctors list (render after selecting a specialization) */}
            {selectedSpec ? (
              <View style={{ backgroundColor: '#F8F9FA', borderColor: '#E0E0E0', borderWidth: 1, borderRadius: 8 }}>
                {filteredDoctors.length === 0 ? (
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: '#757575' }}>No doctors available</Text>
                  </View>
                ) : (
                  filteredDoctors.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' }}
                      onPress={() => {
                        navigation.navigate('DoctorDetail', {
                          doctorId: d.id,
                          doctorName: d.name
                        });
                      }}
                    >
                      <Text style={{ fontWeight: selectedDoctorId === d.id ? '700' : '500', color: selectedDoctorId === d.id ? '#1976D2' : '#212121' }}>
                        {d.name}
                      </Text>
                      <Text style={{ color: '#607D8B', marginTop: 2 }}>
                        {d.specialization || 'General'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            ) : (
              <Text style={{ color: '#607D8B', marginBottom: 8 }}>Select a specialization to see doctors</Text>
            )}
          </View>
        )}

        {/* Add Doctor Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '90%' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0D47A1', marginBottom: 8 }}>Add Doctor</Text>

              <Text style={styles.label}>Name *</Text>
              <TextInput style={styles.input} value={docName} onChangeText={setDocName} placeholder="e.g., Dr. Jane Doe" />

              <Text style={styles.label}>Specialization *</Text>
              <TextInput style={styles.input} value={docSpec} onChangeText={setDocSpec} placeholder="e.g., Cardiologist" />

              <Text style={styles.label}>Bio</Text>
              <TextInput style={[styles.input, styles.textArea]} value={docBio} onChangeText={setDocBio} placeholder="Short bio" multiline />

              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={docPhone} onChangeText={setDocPhone} placeholder="e.g., +94 71 123 4567" />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} value={docEmail} onChangeText={setDocEmail} placeholder="e.g., doctor@example.com" />

              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} value={docLocation} onChangeText={setDocLocation} placeholder="e.g., Colombo" />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.button, { flex: 1, marginRight: 8, opacity: submitting ? 0.7 : 1 }]}
                  onPress={createDoctor}
                  disabled={submitting}
                >
                  <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.buttonSecondary, { flex: 1, marginLeft: 8 }]}
                  onPress={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  <Text style={styles.buttonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}
