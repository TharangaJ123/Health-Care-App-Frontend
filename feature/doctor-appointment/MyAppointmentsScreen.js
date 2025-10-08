import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { styles } from './styles/AppointmentStyles';

// Adjust per environment: iOS sim localhost, Android emulator 10.0.2.2, real device LAN IP
const API_BASE = 'http://192.168.8.190:5000';

function MyAppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/appointments`);
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = (id) => {
    Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/api/appointments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await loadAppointments();
          } catch (e) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const openEdit = (apt) => {
    setEditingId(apt.id);
    setEditDate(apt.appointmentDate || apt.date || '');
    setEditTime(apt.appointmentTime || apt.time || '');
    setEditReason(apt.reason || '');
    setEditStatus(apt.status || '');
    setEditVisible(true);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      const patch = {
        appointmentDate: editDate,
        appointmentTime: editTime,
        reason: editReason,
        status: editStatus,
      };
      const res = await fetch(`${API_BASE}/api/appointments/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditVisible(false);
      setEditingId(null);
      await loadAppointments();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Appointments</Text>

        {/* Calendar to pick and filter by date */}
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={appointments.reduce((acc, apt) => {
            acc[apt.appointmentDate] = {
              marked: true,
              dotColor: '#2196F3',
              selected: selectedDate === apt.appointmentDate,
              selectedColor: '#2196F3',
            };
            return acc;
          }, {})}
          theme={{
            selectedDayBackgroundColor: '#2196F3',
            todayTextColor: '#2196F3',
            arrowColor: '#2196F3',
          }}
        />

        {/* Filtered list by selected date (if any) */}
        {loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#2196F3" />
          </View>
        ) : error ? (
          <View style={{ paddingTop: 20 }}>
            <Text style={{ color: 'red' }}>{error}</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <Text style={{ color: '#757575', fontSize: 16 }}>No appointments yet</Text>
          </View>
        ) : (
          appointments
            .filter((apt) => (selectedDate ? apt.appointmentDate === selectedDate : true))
            .map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appointmentDoctor}>{appointment.doctorName}</Text>
                  <Text style={styles.appointmentSpec}>{appointment.doctorSpecialization}</Text>
                  <Text style={styles.appointmentDate}>
                    {appointment.appointmentDate} at {appointment.appointmentTime}
                  </Text>
                  <Text style={styles.appointmentPatient}>Patient: {appointment.patientName}</Text>
                  {appointment.reason && (
                    <Text style={styles.appointmentReason}>{appointment.reason}</Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity
                    style={[styles.buttonSecondary, { marginBottom: 8 }]}
                    onPress={() => openEdit(appointment)}
                  >
                    <Text style={styles.buttonSecondaryText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(appointment.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}
      </View>

      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '90%' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0D47A1', marginBottom: 8 }}>Edit Appointment</Text>

            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={editDate} onChangeText={setEditDate} placeholder="e.g., 2025-10-06" />

            <Text style={styles.label}>Time (HH:MM)</Text>
            <TextInput style={styles.input} value={editTime} onChangeText={setEditTime} placeholder="e.g., 10:30" />

            <Text style={styles.label}>Reason</Text>
            <TextInput style={[styles.input, styles.textArea]} value={editReason} onChangeText={setEditReason} placeholder="Reason" multiline />

            <Text style={styles.label}>Status</Text>
            <TextInput style={styles.input} value={editStatus} onChangeText={setEditStatus} placeholder="e.g., scheduled | completed | cancelled" />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.button, { flex: 1, marginRight: 8, opacity: saving ? 0.7 : 1 }]}
                onPress={saveEdit}
                disabled={saving}
              >
                <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonSecondary, { flex: 1, marginLeft: 8 }]}
                onPress={() => setEditVisible(false)}
                disabled={saving}
              >
                <Text style={styles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

export default MyAppointmentsScreen;
