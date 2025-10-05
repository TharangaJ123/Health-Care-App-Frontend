import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  FlatList,
  SafeAreaView
} from 'react-native';
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
      const meds = await storage.getMedicationsForDate(selectedDate);
      setMedications(Array.isArray(meds) ? meds : []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Failed to load medications');
      setMedications([]);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadData = async () => {
        try {
          await fetchMedications();
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

  const renderMedicationItem = ({ item }) => {
    if (!item || !item.id) return null;
    
    return (
      <View style={styles.medicationCard}>
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
          <TouchableOpacity onPress={() => navigation.navigate('EditMedication', { medicationId: item.medicationId })}>
            <Feather name="edit-2" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.takenButton]}
            onPress={() => handleStatusUpdate(item.id, 'taken')}
          >
            <Feather name="check" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Taken</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.missedButton]}
            onPress={() => handleStatusUpdate(item.id, 'missed')}
          >
            <Feather name="x" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Missed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.skipButton]}
            onPress={() => handleStatusUpdate(item.id, 'skipped')}
          >
            <Feather name="skip-forward" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* StatusBar removed */}
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
            <Text style={styles.medicationTitle}>
              Medications for {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <TouchableOpacity 
              style={styles.addMedicineButton} 
              onPress={() => navigation.navigate('AddMedication')}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addMedicineButtonText}>Add Medicine</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.deleteHint}>⚡ Long press to delete</Text>
          {medications && medications.length > 0 ? (
            <FlatList
              data={medications}
              renderItem={renderMedicationItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              refreshing={isRefreshing}
              onRefresh={fetchMedications}
              ListEmptyComponent={
                <Text style={styles.noMedicationText}>No medications for this day.</Text>
              }
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
              <View style={[styles.quickActionIcon, {backgroundColor: '#A78BFA'}]}>
                <Feather name="bell" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Test Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => navigation.navigate('ReminderSettings')}
            >
              <View style={[styles.quickActionIcon, {backgroundColor: '#6B7280'}]}>
                <Feather name="settings" size={24} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>Reminder Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#F3F4F6',
    paddingTop: 20
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  onlineStatus: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 6 
  },
  onlineText: { 
    fontSize: 14, 
    color: '#6B7280' 
  },
  profileIcon: { 
    padding: 8, 
    backgroundColor: '#E0E7FF', 
    borderRadius: 20 
  },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginHorizontal: 16, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 1 
  },
  medicationHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  medicationTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827' 
  },
  addMedicineButton: { 
    flexDirection: 'row', 
    backgroundColor: '#2563EB', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  addMedicineButtonText: { 
    color: '#fff', 
    fontWeight: '500', 
    marginLeft: 4 
  },
  deleteHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center'
  },
  noMedicationText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 16,
    fontStyle: 'italic'
  },
  medicationCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  medicationInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  medicationIconContainer: {
    backgroundColor: '#E0E7FF',
    padding: 8,
    borderRadius: 8,
    marginRight: 12
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  medicationDosage: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2
  },
  medicationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4
  },
  takenButton: {
    backgroundColor: '#10B981'
  },
  missedButton: {
    backgroundColor: '#EF4444'
  },
  skipButton: {
    backgroundColor: '#F59E0B'
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  quickActionButton: {
    alignItems: 'center',
    width: '30%'
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  quickActionText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center'
  }
});

export default HomeScreen;
