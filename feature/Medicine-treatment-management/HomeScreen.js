import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Alert, 
  FlatList,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Ionicons, 
  Feather, 
  MaterialCommunityIcons 
} from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import * as storage from '../../utils/storage';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [medications, setMedications] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isOnline, setIsOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMedications = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log(`[HomeScreen] Fetching medications for date: ${selectedDate}`);
      const meds = await storage.getMedicationsForDate(selectedDate);
      console.log(`[HomeScreen] Found ${meds.length} medications for ${selectedDate}:`, meds);
      setMedications(Array.isArray(meds) ? meds : []);

      // Update marked dates for calendar
      await updateMarkedDates();
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Failed to load medications');
      setMedications([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedDate]);

  // Function to update calendar marked dates
  const updateMarkedDates = useCallback(async () => {
    try {
      const allMedications = await storage.getMedications();
      const schedule = await storage.getSchedule();

      const marked = {};

      // Mark today
      const today = new Date().toISOString().split('T')[0];
      marked[today] = {
        today: true,
        todayTextColor: '#2563EB',
      };

      // Mark selected date
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#2563EB',
        selectedTextColor: '#ffffff',
      };

      // Mark dates with medications
      schedule.forEach(entry => {
        if (entry.date && entry.medicationId) {
          if (!marked[entry.date]) {
            marked[entry.date] = {
              marked: true,
              dotColor: '#10B981', // Green dot for dates with medications
            };
          } else {
            marked[entry.date].marked = true;
            marked[entry.date].dotColor = '#10B981';
          }
        }
      });

      console.log(`[HomeScreen] Updated marked dates for ${Object.keys(marked).length} dates`);
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error updating marked dates:', error);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadData = async () => {
        try {
          await fetchMedications();
          // Simulate online status
          if (isActive) {
            setIsOnline(Math.random() > 0.2);
          }
        } catch (error) {
          console.error('Error in useFocusEffect:', error);
        }
      };
      
      loadData();
      
      return () => {
        isActive = false;
      };
    }, [fetchMedications])
  );

  // Update marked dates when selectedDate changes
  useEffect(() => {
    updateMarkedDates();
  }, [selectedDate, updateMarkedDates]);

  const handleStatusUpdate = async (id, status) => {
    try {
      if (!id) {
        throw new Error('Invalid medication ID');
      }
      await storage.updateStatus(id, status);
      await fetchMedications();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', error.message || 'Failed to update status');
    }
  };

  const handleDeleteMedication = async (id) => {
    try {
      if (!id) {
        throw new Error('Invalid medication ID');
      }
      
      // Log the ID for debugging
      console.log('Attempting to delete medication with ID:', id, 'Type:', typeof id);
      
      // Show confirmation dialog
      Alert.alert(
        'Delete Medication',
        'Are you sure you want to delete this medication? This will also remove all associated schedule entries.',
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
                // Ensure we're using the correct ID format (number)
                const medicationId = typeof id === 'string' ? parseInt(id, 10) : id;
                console.log('Deleting medication with ID:', medicationId, 'Type:', typeof medicationId);
                
                await storage.deleteMedication(medicationId);
                await fetchMedications();
                Alert.alert('Success', 'Medication deleted successfully');
              } catch (error) {
                console.error('Error deleting medication:', error);
                // Get current medications to debug
                const meds = await storage.getMedications();
                console.log('Available medications:', meds);
                Alert.alert('Error', 'Failed to delete medication. Please try again.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error in delete confirmation:', error);
      Alert.alert('Error', 'Failed to delete medication. Please try again.');
    }
  };

  const renderMedicationItem = ({ item }) => {
    if (!item || !item.id) return null;
    
    // Log the item for debugging
    console.log('Rendering medication item:', item);
    
    return (
    <TouchableOpacity 
      style={styles.medicationCard}
      onLongPress={() => handleDeleteMedication(item.medicationId)}
      activeOpacity={0.8}
    >
      <View style={styles.medicationHeader}>
        <View style={styles.medicationInfo}>
          <View style={styles.medicationIconContainer}>
            <MaterialCommunityIcons name="pill" size={24} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.medicationName}>{item.name}</Text>
            <Text style={styles.medicationDosage}>{item.dosage}</Text>
            <Text style={styles.medicationTime}>{item.time}</Text>
          </View>
        </View>
        <View style={styles.headerRightSection}>
          {item.status ? (
            <View
              style={[
                styles.statusChip,
                item.status === 'taken'
                  ? styles.statusChipTaken
                  : item.status === 'missed'
                  ? styles.statusChipMissed
                  : styles.statusChipSkipped,
              ]}
            >
              <Text style={styles.statusChipText}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => navigation.navigate('EditMedication', { medicationId: item.medicationId })}>
            <Feather name="edit-2" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            styles.takenButton,
            item.status === 'taken' && styles.actionButtonSelected,
          ]}
          onPress={() => handleStatusUpdate(item.id, 'taken')}
          disabled={item.status === 'taken'}
        >
          <Feather name="check" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Taken</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            styles.missedButton,
            item.status === 'missed' && styles.actionButtonSelected,
          ]}
          onPress={() => handleStatusUpdate(item.id, 'missed')}
          disabled={item.status === 'missed'}
        >
          <Feather name="x" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Missed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            styles.skipButton,
            item.status === 'skipped' && styles.actionButtonSelected,
          ]}
          onPress={() => handleStatusUpdate(item.id, 'skipped')}
          disabled={item.status === 'skipped'}
        >
          <Feather name="skip-forward" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F3F4F6" 
        translucent={false} 
      />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={fetchMedications}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
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
              indicatorColor: '#10B981',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
              'stylesheet.calendar.header': {
                week: {
                  marginTop: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              },
            }}
            markingType={'multi-dot'}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.medicationHeader}>
            <Text style={styles.medicationTitle}>Medications for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                
          </View>
          <Text style={styles.deleteHint}>⚡ Long press to delete           <TouchableOpacity style={styles.addMedicineButton} onPress={() => navigation.navigate('AddMedication')}>
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.addMedicineButtonText}>Add Medicine</Text>
              </TouchableOpacity></Text>
          
          {medications && medications.length > 0 ? (
            <View>
              {medications.map((item) => (
                <View key={item.id || item.medicationId || Math.random()}>
                  {renderMedicationItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMedicationText}>No medications for this day.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {/* PillTrack */}
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('Tracker')}
            >
              <View style={[styles.quickActionIcon, {backgroundColor: '#3B82F6'}]}>
                <Feather name="trending-up" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>PillTrack</Text>
            </TouchableOpacity>

            {/* Goal */}
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Reports')}>
              <View style={[styles.quickActionIcon, {backgroundColor: '#8B5CF6'}]}>
                <Feather name="target" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Goal</Text>
            </TouchableOpacity>

            {/* Blog */}
            <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Blog', 'Coming soon') }>
              <View style={[styles.quickActionIcon, {backgroundColor: '#6B7280'}]}>
                <Feather name="file-text" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Blog</Text>
            </TouchableOpacity>

            {/* Community */}
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Community')}>
              <View style={[styles.quickActionIcon, {backgroundColor: '#F59E0B'}]}>
                <Feather name="users" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Community</Text>
            </TouchableOpacity>

            {/* Appointment */}
            <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('DoctorAppointment')}>
              <View style={[styles.quickActionIcon, {backgroundColor: '#EC4899'}]}>
                <Feather name="calendar" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#F3F4F6',
    paddingTop: StatusBar.currentHeight || 20
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  onlineText: { fontSize: 14, color: '#6B7280' },
  profileIcon: { padding: 8, backgroundColor: '#E0E7FF', borderRadius: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
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
  headerRightSection: { flexDirection: 'row', alignItems: 'center' },
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
  quickActionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 8 },
  quickActionButton: { alignItems: 'center', marginVertical: 8, width: '30%' },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionText: { fontSize: 12, color: '#374151' },
  // Status visuals
  statusChip: { marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 },
  statusChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusChipTaken: { backgroundColor: '#10B981' },
  statusChipMissed: { backgroundColor: '#EF4444' },
  statusChipSkipped: { backgroundColor: '#F59E0B' },
  actionButtonSelected: { opacity: 0.7 }
});

export default HomeScreen;