import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHealthData } from '../../context/HealthDataContext';

const DashboardScreen = ({ navigation }) => {
  const { latestHealthData } = useHealthData();
  const [showNotifications, setShowNotifications] = React.useState(false);

  // Default data for first-time users
  const defaultHealthData = {
    heartRate: { value: '--', unit: 'bpm', status: 'normal', time: 'No data' },
    bloodPressure: { value: '--/--', unit: 'mmHg', status: 'normal', time: 'No data' },
    oxygenLevel: { value: '--', unit: '%', status: 'normal', time: 'No data' },
    bloodGlucose: { value: '--', unit: 'mg/dL', status: 'normal', time: 'No data' }
  };

  // Use default data if no health data exists
  const displayData = latestHealthData || defaultHealthData;

  // Track read status of notifications
  const [readStatus, setReadStatus] = React.useState({});

  // Mark a notification as read
  const markAsRead = (id) => {
    setReadStatus(prev => {
      const newStatus = { ...prev, [id]: true };
      // Force re-render by updating the state
      return newStatus;
    });
  };

  // Generate stable IDs for notifications
  const notificationIds = React.useMemo(() => ({
    heartRate: 'hr-' + (latestHealthData?.heartRate?.value || '0'),
    bloodPressure: 'bp-' + (latestHealthData?.bloodPressure?.value?.replace('/', '') || '0'),
    oxygen: 'o2-' + (latestHealthData?.oxygenLevel?.value || '0'),
    glucose: 'glu-' + (latestHealthData?.bloodGlucose?.value || '0')
  }), [latestHealthData]);

  // Get health notifications for abnormal values with read status
  const healthNotifications = React.useMemo(() => {
    if (!latestHealthData) return [];
    const notifications = [];
    const now = new Date();
    
    // Helper function to safely get status
    const getStatus = (data) => {
      if (!data || typeof data !== 'object') return 'normal';
      return data.status || 'normal';
    };
    
    // Heart rate notification
    const heartRate = latestHealthData.heartRate || {};
    if (heartRate.status && heartRate.status !== 'normal' && heartRate.value) {
      notifications.push({
        id: notificationIds.heartRate,
        type: 'heart',
        message: `Your heart rate is ${heartRate.status} (${heartRate.value} bpm)`,
        time: 'Just now',
        status: heartRate.status,
        recommendation: 'Normal range: 60-100 bpm',
        isRead: readStatus[notificationIds.heartRate] || false
      });
    }

    // Blood pressure notification
    const bloodPressure = latestHealthData.bloodPressure || {};
    if (bloodPressure && bloodPressure.status && bloodPressure.status !== 'normal' && bloodPressure.value) {
      const bp = bloodPressure;
      const bpDetails = bp.details || {};
      const systolic = bpDetails.systolic || { value: '', status: 'normal' };
      const diastolic = bpDetails.diastolic || { value: '', status: 'normal' };
      
      // Build the message with available data
      let message = `Your blood pressure is ${bp.status.toUpperCase()} (${bp.value} mmHg)`;
      
      // Add systolic details if available
      if (systolic && systolic.status && systolic.status !== 'normal' && systolic.value) {
        message += `\n- Systolic: ${systolic.value} mmHg (${systolic.status})`;
      }
      
      // Add diastolic details if available
      if (diastolic && diastolic.status && diastolic.status !== 'normal' && diastolic.value) {
        message += `\n- Diastolic: ${diastolic.value} mmHg (${diastolic.status})`;
      }
      
      notifications.push({
        id: notificationIds.bloodPressure,
        type: 'blood-pressure',
        message: message,
        time: 'Just now',
        status: bp.status,
        recommendation: 'Normal range: <120/80 mmHg',
        isRead: readStatus[notificationIds.bloodPressure] || false
      });
    }

    // Oxygen Level notifications
    const oxygenLevel = latestHealthData.oxygenLevel || {};
    if (oxygenLevel.status && oxygenLevel.status !== 'normal' && oxygenLevel.value) {
      notifications.push({
        id: notificationIds.oxygen,
        type: 'oxygen',
        message: `Your oxygen level is ${oxygenLevel.status} (${oxygenLevel.value}%)`,
        time: 'Just now',
        status: oxygenLevel.status,
        recommendation: 'Normal range: 95-100%',
        isRead: readStatus[notificationIds.oxygen] || false
      });
    }

    // Blood Glucose notifications
    const bloodGlucose = latestHealthData.bloodGlucose || {};
    if (bloodGlucose.status && bloodGlucose.status !== 'normal' && bloodGlucose.value) {
      notifications.push({
        id: notificationIds.glucose,
        type: 'glucose',
        message: `Your blood glucose is ${bloodGlucose.status} (${bloodGlucose.value} mg/dL)`,
        time: 'Just now',
        status: bloodGlucose.status,
        recommendation: 'Normal range: 70-140 mg/dL',
        isRead: readStatus[notificationIds.glucose] || false
      });
    }

    return notifications;
  }, [latestHealthData, readStatus]); // Add readStatus to dependencies

  const handleAddHealthData = () => {
    navigation.navigate('AddHealthData');
  };

  const handleViewDashboard = () => {
    navigation.navigate('ViewDashboard');
  };

  const handlemonitorhealth = () => {
    navigation.navigate('MonitorHealth');
  };

  const handleNotifications = () => {
    // TODO: Navigate to notifications screen
    console.log('Navigate to notifications');
  };

  const handleViewNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#2ecc71';
      case 'warning': return '#f39c12';
      case 'high': 
      case 'low': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const renderHealthCard = (title, data, icon) => (
    <View style={styles.healthCard} key={title}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(data.status) }]} />
      <View style={styles.cardIconContainer}>
        <Ionicons name={icon} size={24} color="#3498db" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{data.value}</Text>
      <Text style={styles.cardUnit}>{data.unit}</Text>
      <Text style={styles.cardTime}>{data.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Health Monitoring</Text>
            <Text style={styles.subtitle}>Track your health metrics</Text>
          </View>

          {/* Journey Card */}
          <View style={styles.journeyCard}>
            <Ionicons name="medical" size={48} color="#4caf50" />
            <Text style={styles.journeyTitle}>Your Health Journey Starts Here</Text>
            <Text style={styles.journeySubtitle}>Monitor your vital signs and track your health metrics to maintain optimal wellness and achieve your health goals.</Text>
          </View>

          {/* Health Alert Bar - Always Visible */}
          <TouchableOpacity 
            style={[
              styles.healthAlertBar,
              { 
                backgroundColor: healthNotifications.length > 0 
                  ? (healthNotifications.some(n => !n.isRead) 
                      ? ' #2ecc71' // Light gray for unread alerts
                      : (healthNotifications.some(n => n.status === 'high' || n.status === 'low') 
                          ? '#e74c3c' // Red for high priority
                          : '#f39c12')) // Orange for warnings
                  : '#2ecc71', // Green for no alerts
                opacity: healthNotifications.length > 0 ? 1 : 0.8
              }
            ]}
            onPress={() => {
              if (healthNotifications.length > 0) {
                // Mark all as read when tapping the alert bar
                healthNotifications.forEach(notification => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                });
                setShowNotifications(!showNotifications);
              }
            }}
          >
            <View style={styles.healthAlertContent}>
              <Ionicons 
                name={healthNotifications.length > 0 ? "warning" : "checkmark-circle"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.healthAlertText}>
                {healthNotifications.length > 0 
                  ? `${healthNotifications.length} Health Alert${healthNotifications.length > 1 ? 's' : ''} - Tap to view`
                  : 'No Health Alerts - All Good!'}
              </Text>
              {healthNotifications.length > 0 && (
                <Ionicons 
                  name={showNotifications ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#fff"
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Notification Panel */}
          {showNotifications && healthNotifications.length > 0 && (
            <View style={styles.notificationPanel}>
              <View style={styles.notificationHeader}>
                <View style={styles.notificationHeaderContent}>
                  <Ionicons name="notifications" size={20} color="#fff" style={styles.notificationHeaderIcon} />
                  <Text style={styles.notificationTitle}>Health Alerts</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowNotifications(false)}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.notificationScroll}>
                {healthNotifications.map((notification, index) => (
                  <TouchableOpacity 
                    key={notification.id} 
                    style={[
                      styles.notificationItem,
                      { 
                        borderLeftColor: getStatusColor(notification.status),
                        backgroundColor: notification.isRead ? '#fff' : '#909fa1'
                      }
                    ]}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <View style={[
                      styles.notificationIconContainer,
                      { backgroundColor: `${getStatusColor(notification.status)}20` }
                    ]}>
                      <Ionicons 
                        name={notification.status === 'warning' ? 'warning' : 'information-circle'}
                        size={20} 
                        color={getStatusColor(notification.status)}
                      />
                    </View>
                    <View style={styles.notificationItemContent}>
                      <Text style={styles.notificationText}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>
                        <Ionicons name="time-outline" size={12} color="#95a5a6" /> {notification.time}
                      </Text>
                    </View>
                    <Ionicons 
                      name={notification.isRead ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={notification.isRead ? '#2ecc71' : '#bdc3c7'}
                      style={styles.notificationArrow}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

{/* Health Cards Section */}
          <View style={styles.healthCardsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Health Updates</Text>
            </View>
            {!latestHealthData && (
              <View style={styles.noDataMessage}>
                <Text style={styles.noDataText}>No health data recorded yet</Text>
                <Text style={styles.noDataSubtext}>Start by adding your first health measurements</Text>
              </View>
            )}
            <View style={styles.cardsGrid}>
              {renderHealthCard('Heart Rate', displayData.heartRate, 'pulse')}
              {renderHealthCard('Blood Pressure', displayData.bloodPressure, 'fitness')}
              {renderHealthCard('Oxygen Level', displayData.oxygenLevel, 'medical')}
              {renderHealthCard('Blood Glucose', displayData.bloodGlucose, 'water')}
            </View>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleAddHealthData}
            >
              <Ionicons name="add-circle" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.iconButtonText}>Add Health Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.dashboardButton]}
              onPress={handleViewDashboard}
            >
              <Ionicons name="stats-chart" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.iconButtonText}>Health History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, styles.monitorButton]}
              onPress={handlemonitorhealth}
            >
              <Ionicons name="pulse" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.iconButtonText}>Monitor Health</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop:60,
    alignItems: 'center',
    marginBottom: 30,
  },
  // Section header with title
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  healthCardsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'relative',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  cardIconContainer: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#7f8c8d',
    textAlign: 'center',
  },
  cardTime: {
    fontSize: 10,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  iconButton: {
    flex: 1,
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  buttonIcon: {
    marginBottom: 6,
  },
  iconButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  normalButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dashboardButton: {
    backgroundColor: '#66BB6A',
  },
  monitorButton: {
    backgroundColor: '#C5B722',
  },
  viewNotificationButton: {
    backgroundColor: '#FFA726',
  },
  normalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  journeyCard: {
    backgroundColor: '#ededed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  journeySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  noDataMessage: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  notificationPanel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#2c3e50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  notificationHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationArrow: {
    marginLeft: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  notificationScroll: {
    maxHeight: 300,
  },
  notificationItem: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    backgroundColor: '#fff',
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationItemContent: {
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  notificationMetric: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 4,
  },
  notificationValue: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  notificationRecommendation: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  buttonWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Health Alert Bar Styles */
  healthAlertBar: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthAlertText: {
    color: '#fff',
    marginLeft: 10,
    flex: 1,
    fontWeight: '500',
  },
  notificationBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
