import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { styles } from './styles/AppointmentStyles';
import { initDatabase, saveAppointment, getAllAppointments, getDoctors } from './database/db';

function DoctorAppointmentScreen({ navigation }) {
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
    const list = await getDoctors();
    setDoctors(list);
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
        <View style={styles.form}>
          <Text style={styles.formTitle}>{selectedDoctor.name}</Text>
          <Text style={styles.formSubtitle}>{selectedDoctor.specialization}</Text>

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
            <Text style={styles.buttonText}>Book Appointment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => setSelectedDoctor(null)}
          >
            <Text style={styles.buttonSecondaryText}>Back</Text>
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
      <View style={styles.content}>
        <Text style={styles.title}>Select Doctor</Text>

        {doctors.map((doctor) => (
          <TouchableOpacity
            key={doctor.id}
            style={styles.doctorCard}
            onPress={() => setSelectedDoctor(doctor)}
          >
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
          </TouchableOpacity>
        ))}

        {/* All Appointments List */}
        {appointments.length > 0 && (
          <View style={styles.appointmentsListSection}>
            <Text style={styles.sectionTitle}>All Appointments</Text>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentListCard}>
                <Text style={styles.appointmentDoctor}>{appointment.doctorName}</Text>
                <Text style={styles.appointmentSpec}>{appointment.doctorSpecialization}</Text>
                <Text style={styles.appointmentDate}>
                  📅 {appointment.appointmentDate} at {appointment.appointmentTime}
                </Text>
                <Text style={styles.appointmentPatient}>Patient: {appointment.patientName}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default DoctorAppointmentScreen;
