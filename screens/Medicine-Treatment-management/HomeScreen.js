import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { 
  getMedicationsForDate, 
  updateStatus, 
  getSchedule, 
  deleteMedication, 
  removeScheduleEntriesForMedication 
} from '../../utils/storage';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [medications, setMedications] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isOnline, setIsOnline] = useState(true);

  const fetchMedications = useCallback(async () => {
    try {
      const meds = await getMedicationsForDate(selectedDate);
      setMedications(meds);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch medications.');
    }
  }, [selectedDate]);

  const fetchMarkedDates = useCallback(async () => {
    const schedule = await getSchedule();
    const marks = {};
    schedule.forEach(item => {
      marks[item.date] = { marked: true, dotColor: '#10B981' };
    });
    marks[selectedDate] = { ...marks[selectedDate], selected: true, selectedColor: '#2563EB' };
    setMarkedDates(marks);
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      fetchMedications();
      fetchMarkedDates();
      // Simulate online status
      setIsOnline(Math.random() > 0.2);
    }, [fetchMedications, fetchMarkedDates])
  );

    const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatus(id, status);
      fetchMedications(); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Could not update status.');
    }
  };

    const handleDelete = (item) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              // First, remove the schedule entries for this medication
              await removeScheduleEntriesForMedication(item.medicationId);
              
              // Then delete the medication itself
              await deleteMedication(item.medicationId);
              
              // Show success message
              Alert.alert(
                'Success',
                `"${item.name}" has been deleted successfully.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh the medication list
                      fetchMedications();
                      // Also refresh the marked dates
                      fetchMarkedDates();
                    }
                  },
                ]
              );
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert(
                'Error',
                `Could not delete "${item.name}". Please try again.\n\nError: ${error.message}`,
                [{ text: 'OK' }]
              );
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderMedicationItem = ({ item }) => (
    <View style={styles.medicationCard}>
        <View style={styles.medicationHeader}>
            <Text style={styles.medicationName}>{item.name}</Text>
            <View style={styles.medicationStatus}>
                <Feather name={item.status === 'pending' ? 'clock' : 'check-circle'} size={16} color={item.status === 'pending' ? '#F59E0B' : '#10B981'} />
                <Text style={[styles.statusText, { color: item.status === 'pending' ? '#F59E0B' : '#10B981' }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
            </View>
        </View>
        <View style={styles.medicationInfo}>
            <View style={styles.medicationIconContainer}>
                <MaterialIcons name="medication" size={24} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.medicationTime}>{item.time}</Text>
                {item.dosage && <Text style={styles.medicationDosage}>{item.dosage}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                <Feather name="trash-2" size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
        <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, styles.takenButton]} onPress={() => handleStatusUpdate(item.id, 'taken')}>
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Taken</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.missedButton]} onPress={() => handleStatusUpdate(item.id, 'missed')}>
                <Feather name="x" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Missed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.skipButton]} onPress={() => handleStatusUpdate(item.id, 'skipped')}>
                <Feather name="skip-forward" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Skip</Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Health Tracker</Text>
            <View style={styles.onlineStatus}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.onlineText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileIcon}>
              <Ionicons name="person-outline" size={24} color="#2563EB" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#2d4150',
              selectedDayBackgroundColor: '#2563EB',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#2563EB',
              dayTextColor: '#2d4150',
              arrowColor: '#2563EB',
              monthTextColor: '#2563EB',
              indicatorColor: 'blue',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14
            }}
          />
        </View>

        <View style={styles.card}>
            <View style={styles.medicationHeader}>
                <Text style={styles.medicationTitle}>Medications for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                <TouchableOpacity style={styles.addMedicineButton} onPress={() => navigation.navigate('AddMedication')}>
                    <Feather name="plus" size={16} color="#fff" />
                    <Text style={styles.addMedicineButtonText}>Add Medicine</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.deleteHint}>⚡ Long press to delete</Text>
            {medications.length > 0 ? (
                <FlatList
                    data={medications}
                    renderItem={renderMedicationItem}
                    keyExtractor={(item) => item.id.toString()}
                />
            ) : (
                <Text style={styles.noMedicationText}>No medications for this day.</Text>
            )}
        </View>

        <View style={styles.card}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('Tracker')}
            >
              <View style={[styles.quickActionIcon, {backgroundColor: '#3B82F6'}]}>
                <Feather name="activity" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Medicine Tracker</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <View style={[styles.quickActionIcon, {backgroundColor: '#A78BFA'}]}><Feather name="bell" size={24} color="#fff" /></View>
              <Text style={styles.quickActionText}>Test Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('ReminderSettings')}>
              <View style={[styles.quickActionIcon, {backgroundColor: '#6B7280'}]}><Feather name="settings" size={24} color="#fff" /></View>
              <Text style={styles.quickActionText}>Reminder Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  onlineText: { fontSize: 14, color: '#6B7280' },
  profileIcon: { padding: 8, backgroundColor: '#E0E7FF', borderRadius: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  medicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8},
  medicationTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  addMedicineButton: { flexDirection: 'row', backgroundColor: '#2563EB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  addMedicineButtonText: { color: '#fff', fontWeight: '500', marginLeft: 4 },
  deleteHint: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  noMedicationText: { textAlign: 'center', color: '#6B7280', paddingVertical: 20 },
  medicationCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1 },
  medicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  medicationInfo: { flexDirection: 'row', alignItems: 'center' },
  medicationIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  medicationName: { fontSize: 18, fontWeight: '700', color: '#1E40AF' },
  medicationDosage: { fontSize: 14, color: '#4B5563', marginTop: 2 },
  medicationTime: { fontSize: 14, color: '#6B7280' },
    medicationStatus: { flexDirection: 'row', alignItems: 'center'},
  deleteButton: { position: 'absolute', top: 16, right: 16, padding: 8 },
  statusText: { marginLeft: 6, color: '#6B7280' },
  editButton: { marginLeft: 12, padding: 4 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderRadius: 8, flex: 1, justifyContent: 'center', marginHorizontal: 4 },
  actionButtonText: { color: '#fff', fontWeight: '500', marginLeft: 6 },
  takenButton: { backgroundColor: '#10B981' },
  missedButton: { backgroundColor: '#EF4444' },
  skipButton: { backgroundColor: '#F59E0B' },
  quickActionsTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  quickActionButton: { alignItems: 'center' },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 12, color: '#374151' },
});

export default HomeScreen;
