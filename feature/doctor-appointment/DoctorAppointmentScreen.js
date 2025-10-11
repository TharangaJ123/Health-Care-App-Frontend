import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './styles/AppointmentStyles';
import { initDatabase, saveAppointment, getAllAppointments, getUsers, deleteAppointment } from './database/db';
import AppHeader from '../../component/common/AppHeader';
import Icon from '../../component/common/Icon';
import { useAuth } from '../../context/AuthContext';

function DoctorAppointmentScreen({ navigation }) {
  const { user } = useAuth();
  const currentUserId = (user?.id || user?.uid || user?.email || '').toString();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [reason, setReason] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    initDatabase();
    loadDoctors();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const loadAppointments = async () => {
    const data = await getAllAppointments();
    setAppointments(data);
  };

  const loadDoctors = async () => {
    // Fetch all users, then filter client-side to be case-insensitive and resilient to data variations
    const list = await getUsers();
    const normalized = (list || [])
      .map((u) => {
        const userType = ((u?.userType ?? u?.role ?? u?.type ?? '') + '').toLowerCase();
        return {
          id: u.id || u.uid || u._id,
          name: u.name || u.fullName || u.firstName || u.displayName || u.email || 'Doctor',
          specialization: u.occupation || u.specialization || u.title || 'General',
          userType,
          raw: u,
        };
      })
      .filter((u) => u.userType === 'doctor');
    setDoctors(normalized);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Appointment', 'Are you sure you want to delete this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAppointment(id);
            await loadAppointments();
          } catch (e) {
            Alert.alert('Error', e.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  // doctors loaded from backend

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !patientName || !selectedDate || !selectedTime) {
      setErrorMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    try {
      await saveAppointment({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialization: selectedDoctor.specialization,
        userId: currentUserId,
        patientName,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason,
      });

      setShowSuccessModal(true);
      
      // Reset form
      setTimeout(() => {
        setSelectedDoctor(null);
        setPatientName('');
        setSelectedDate('');
        setSelectedTime('');
        setReason('');
        setShowSuccessModal(false);
        loadAppointments();
      }, 2000);
    } catch (error) {
      setErrorMessage('Failed to book appointment. Please try again.');
      setShowErrorModal(true);
    }
  };

  if (selectedDoctor) {
    return (
      <ScrollView style={styles.container}>
        <AppHeader
          title={selectedDoctor.name}
          subtitle={selectedDoctor.specialization}
          onBack={() => setSelectedDoctor(null)}
          rightIconName="information-circle"
          onRightPress={() => Alert.alert('Booking', 'Fill the form to book your appointment')}
        />
        <View style={styles.form}>
          <Text style={styles.formTitle}>Appointment Details</Text>

          <Text style={styles.label}>Your Name *</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter your name"
          />

          <Text style={styles.label}>Select Date *</Text>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              [selectedDate]: { selected: true, selectedColor: '#2196F3' },
            }}
            theme={{
              selectedDayBackgroundColor: '#2196F3',
              todayTextColor: '#2196F3',
              arrowColor: '#2196F3',
            }}
            minDate={new Date().toISOString().split('T')[0]}
          />

          <Text style={styles.label}>Select Time *</Text>
          <View style={styles.timeGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.timeSlot, selectedTime === slot && styles.timeSlotActive]}
                onPress={() => setSelectedTime(slot)}
              >
                <Text style={[styles.timeSlotText, selectedTime === slot && styles.timeSlotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Reason (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Describe your symptoms..."
            multiline
          />

          <TouchableOpacity style={styles.button} onPress={handleBookAppointment}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Icon name="calendar" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Book Appointment</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => setSelectedDoctor(null)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="chevron-back" size={18} color="#2196F3" />
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Success Modal */}
        <Modal visible={showSuccessModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successMessage}>Appointment booked successfully</Text>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal visible={showErrorModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.errorModal}>
              <Text style={styles.errorIcon}>✕</Text>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.errorButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <AppHeader
        title="Doctor Appointments"
        subtitle="Choose a doctor and time"
        rightIconName="calendar"
        onRightPress={() => {/* no-op or navigate to my appointments if available */}}
        onBack={() => navigation?.goBack?.()}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Select Doctor</Text>

        {doctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={styles.doctorCard}
            onPress={() => setSelectedDoctor(doctor)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="person" size={18} color="#1976D2" />
              <Text style={styles.doctorName}>{doctor.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="medical" size={16} color="#90CAF9" />
              <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* All Appointments List */}
        {appointments.length > 0 && (
          <View style={styles.appointmentsListSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar-outline" size={18} color="#0D47A1" />
              <Text style={styles.sectionTitle}>All Appointments</Text>
            </View>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentListCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.appointmentDoctor}>{appointment.doctorName}</Text>
                  <Text style={styles.appointmentSpec}>{appointment.doctorSpecialization}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="calendar-outline" size={14} color="#616161" />
                    <Text style={styles.appointmentDate}>
                      {appointment.appointmentDate} at {appointment.appointmentTime}
                    </Text>
                  </View>
                  <Text style={styles.appointmentPatient}>Patient: {appointment.patientName}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.deleteButton, { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }]}
                  onPress={() => handleDelete(appointment.id)}
                >
                  <Icon name="trash-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default DoctorAppointmentScreen;
