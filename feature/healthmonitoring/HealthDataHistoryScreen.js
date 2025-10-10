import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from '../../component/common/Icon';
import { healthStyles } from './styles/HealthMonitoringStyles';
import { useHealthData } from '../../context/HealthDataContext';

// Mock data - in a real app, this would come from your backend
const MOCK_HEALTH_DATA = [
  {
    id: '1',
    date: '2023-05-20T10:30:00',
    heartRate: 75,
    systolicBP: 118,
    diastolicBP: 78,
    spo2: 98,
    bloodGlucose: 92,
    notes: 'Feeling good today',
  },
  {
    id: '2',
    date: '2023-05-19T09:15:00',
    heartRate: 82,
    systolicBP: 125,
    diastolicBP: 85,
    spo2: 97,
    bloodGlucose: 110,
    notes: 'After breakfast',
  },
  {
    id: '3',
    date: '2023-05-18T14:45:00',
    heartRate: 88,
    systolicBP: 132,
    diastolicBP: 90,
    spo2: 94,
    bloodGlucose: 145,
    notes: 'Stressed at work',
  },
];

const HealthDataHistoryScreen = ({ navigation }) => {
  const { healthHistory } = useHealthData();
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    abnormalOnly: false,
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const getStatus = (metric, value) => {
    if (metric === 'heartRate') {
      if (value < 60) return 'low';
      if (value > 100) return 'high';
      return 'normal';
    } else if (metric === 'systolicBP') {
      if (value > 120) return 'high';
      return 'normal';
    } else if (metric === 'diastolicBP') {
      if (value > 80) return 'high';
      return 'normal';
    } else if (metric === 'spo2') {
      if (value < 91) return 'low';
      if (value < 95) return 'warning';
      return 'normal';
    } else if (metric === 'bloodGlucose') {
      if (value < 70) return 'low';
      if (value > 140) return 'high';
      return 'normal';
    }
    return 'normal';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'normal':
        return healthStyles.historyItemNormal;
      case 'warning':
        return healthStyles.historyItemWarning;
      case 'high':
      case 'low':
        return healthStyles.historyItemDanger;
      default:
        return {};
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHealthDataItem = ({ item }) => {
    const hasAbnormalValues = 
      getStatus('heartRate', item.heartRate) !== 'normal' ||
      getStatus('systolicBP', item.systolicBP) !== 'normal' ||
      getStatus('diastolicBP', item.diastolicBP) !== 'normal' ||
      getStatus('spo2', item.spo2) !== 'normal' ||
      getStatus('bloodGlucose', item.bloodGlucose) !== 'normal';

    if (filters.abnormalOnly && !hasAbnormalValues) {
      return null;
    }

    return (
      <TouchableOpacity 
        style={[healthStyles.historyItem, 
          hasAbnormalValues ? healthStyles.historyItemDanger : healthStyles.historyItemNormal
        ]}
        onPress={() => setSelectedItem(item)}
      >
        <View style={healthStyles.historyItemHeader}>
          <Text style={healthStyles.historyItemDate}>{formatDate(item.date)}</Text>
          {hasAbnormalValues && (
            <View style={[healthStyles.statusIndicator, { backgroundColor: '#e74c3c' }]}>
              <Text style={healthStyles.statusText}>Check</Text>
            </View>
          )}
        </View>
        <View style={healthStyles.row}>
          <View style={{ marginRight: 15 }}>
            <Text style={{ fontSize: 12, color: '#7f8c8d' }}>Heart Rate</Text>
            <Text style={healthStyles.historyItemValue}>
              {item.heartRate} <Text style={{ fontSize: 12 }}>bpm</Text>
            </Text>
          </View>
          <View style={{ marginRight: 15 }}>
            <Text style={{ fontSize: 12, color: '#7f8c8d' }}>BP</Text>
            <Text style={healthStyles.historyItemValue}>
              {item.systolicBP}/{item.diastolicBP} <Text style={{ fontSize: 12 }}>mmHg</Text>
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 12, color: '#7f8c8d' }}>SpO₂</Text>
            <Text style={healthStyles.historyItemValue}>
              {item.spo2}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
        <View style={healthStyles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={healthStyles.modalContent}>
              <Text style={healthStyles.modalTitle}>Filter & Sort</Text>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Show Only Abnormal Readings</Text>
                <TouchableOpacity
                  style={[styles.checkbox, filters.abnormalOnly && styles.checkboxChecked]}
                  onPress={() => setFilters({...filters, abnormalOnly: !filters.abnormalOnly})}
                >
                  {filters.abnormalOnly && <Icon name="checkmark" size={20} color="#fff" />}
                </TouchableOpacity>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort By</Text>
                <View style={styles.sortOptions}>
                  <TouchableOpacity
                    style={[styles.sortOption, sortBy === 'date' && styles.sortOptionActive]}
                    onPress={() => setSortBy('date')}
                  >
                    <Text style={sortBy === 'date' ? styles.sortOptionTextActive : styles.sortOptionText}>
                      Date
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sortOption, sortBy === 'heartRate' && styles.sortOptionActive]}
                    onPress={() => setSortBy('heartRate')}
                  >
                    <Text style={sortBy === 'heartRate' ? styles.sortOptionTextActive : styles.sortOptionText}>
                      Heart Rate
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Order</Text>
                <View style={styles.sortOptions}>
                  <TouchableOpacity
                    style={[styles.sortOption, sortOrder === 'asc' && styles.sortOptionActive]}
                    onPress={() => setSortOrder('asc')}
                  >
                    <Text style={sortOrder === 'asc' ? styles.sortOptionTextActive : styles.sortOptionText}>
                      Ascending
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sortOption, sortOrder === 'desc' && styles.sortOptionActive]}
                    onPress={() => setSortOrder('desc')}
                  >
                    <Text style={sortOrder === 'desc' ? styles.sortOptionTextActive : styles.sortOptionText}>
                      Descending
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity
                style={[healthStyles.button, { marginTop: 20 }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={healthStyles.buttonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderDetailModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={!!selectedItem}
      onRequestClose={() => setSelectedItem(null)}
    >
      <View style={healthStyles.modalOverlay}>
        <View style={healthStyles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={healthStyles.modalTitle}>Health Data Details</Text>
            <TouchableOpacity onPress={() => setSelectedItem(null)}>
              <Icon name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{selectedItem && formatDate(selectedItem.date)}</Text>
          </View>
          
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Heart Rate</Text>
              <Text style={[
                styles.detailValue,
                getStatusStyle(getStatus('heartRate', selectedItem?.heartRate))
              ]}>
                {selectedItem?.heartRate} bpm
              </Text>
              <Text style={styles.detailNote}>Normal: 60-100 bpm</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Blood Pressure</Text>
              <Text style={[
                styles.detailValue,
                getStatusStyle(
                  getStatus('systolicBP', selectedItem?.systolicBP) === 'high' || 
                  getStatus('diastolicBP', selectedItem?.diastolicBP) === 'high' ? 'high' : 'normal'
                )
              ]}>
                {selectedItem?.systolicBP}/{selectedItem?.diastolicBP} mmHg
              </Text>
              <Text style={styles.detailNote}>Normal: {'<'}120/80 mmHg</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>SpO₂</Text>
              <Text style={[
                styles.detailValue,
                getStatusStyle(getStatus('spo2', selectedItem?.spo2))
              ]}>
                {selectedItem?.spo2}%
              </Text>
              <Text style={styles.detailNote}>Normal: 95-100%</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Blood Glucose</Text>
              <Text style={[
                styles.detailValue,
                getStatusStyle(getStatus('bloodGlucose', selectedItem?.bloodGlucose))
              ]}>
                {selectedItem?.bloodGlucose} mg/dL
              </Text>
              <Text style={styles.detailNote}>Normal: 70-140 mg/dL</Text>
            </View>
          </View>
          
          {selectedItem?.notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.notesText}>{selectedItem.notes}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[healthStyles.button, { marginTop: 20 }]}
            onPress={() => setSelectedItem(null)}
          >
            <Text style={healthStyles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={healthStyles.container}>
      {/* Header with Back Button */}
      <View style={healthStyles.header}>
        <TouchableOpacity 
          style={healthStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={healthStyles.headerTitle}>Health History</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon name="filter" size={20} color="#3498db" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {healthHistory.length > 0 ? (
          <FlatList
            data={[...healthHistory].sort((a, b) => {
              if (sortBy === 'date') {
                return sortOrder === 'asc' 
                  ? new Date(a.date) - new Date(b.date)
                  : new Date(b.date) - new Date(a.date);
              }
              return sortOrder === 'asc' 
                ? a[sortBy] - b[sortBy]
                : b[sortBy] - a[sortBy];
            })}
            renderItem={renderHealthDataItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="pulse" size={50} color="#bdc3c7" />
            <Text style={styles.emptyStateText}>No health data available</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first health reading to start tracking
            </Text>
          </View>
        )}
      </View>
      
      {renderFilterModal()}
      {renderDetailModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  filterButtonText: {
    color: '#3498db',
    fontWeight: '600',
    marginLeft: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateSubtext: {
    color: '#bdc3c7',
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginRight: 10,
    marginBottom: 10,
  },
  sortOptionActive: {
    backgroundColor: '#3498db',
  },
  sortOptionText: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
    width: '100%',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  detailNote: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  notesText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 22,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
  },
});

export default HealthDataHistoryScreen;
