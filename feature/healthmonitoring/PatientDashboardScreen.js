import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../../component/common/Icon';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useHealthData } from '../../context/HealthDataContext';

const PatientDashboardScreen = () => {
  const navigation = useNavigation();
  const { healthData } = useHealthData();
  const [timeRange, setTimeRange] = useState('week');
  const [latestHealthData, setLatestHealthData] = useState(null);

  // Get latest health data
  useEffect(() => {
    if (healthData && healthData.length > 0) {
      setLatestHealthData(healthData[0]);
    }
  }, [healthData]);

  // Mock chart data
  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    heartRate: [72, 75, 80, 78, 82, 85, 79],
    bloodPressure: {
      systolic: [120, 118, 122, 119, 121, 123, 120],
      diastolic: [80, 78, 81, 79, 82, 83, 80],
    },
    oxygen: [98, 97, 98, 99, 98, 97, 98],
    glucose: [95, 100, 110, 105, 115, 120, 110],
  };

  // Get latest health data values
  const latestValues = {
    heartRate: latestHealthData?.heartRate?.value || '--',
    bloodPressure: latestHealthData?.bloodPressure?.value || '--/--',
    oxygen: latestHealthData?.oxygenLevel?.value || '--',
    glucose: latestHealthData?.bloodGlucose?.value || '--',
  };

  // Get status for each metric
  const metricStatus = {
    heartRate: getHealthStatus('heartRate', latestValues.heartRate),
    bloodPressure: getHealthStatus('bloodPressure', latestValues.bloodPressure),
    oxygen: getHealthStatus('oxygen', latestValues.oxygen),
    glucose: getHealthStatus('glucose', latestValues.glucose),
  };

  // Determine health status based on metric and value
  function getHealthStatus(metric, value) {
    if (value === '--' || value === '--/--') return 'unknown';
    
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    
    switch (metric) {
      case 'heartRate':
        if (numValue < 60) return 'low';
        if (numValue > 100) return 'high';
        return 'normal';
        
      case 'bloodPressure':
        const [systolic, diastolic] = value.split('/').map(Number);
        if (systolic < 90 || diastolic < 60) return 'low';
        if (systolic > 140 || diastolic > 90) return 'high';
        if (systolic > 120 || diastolic > 80) return 'elevated';
        return 'normal';
        
      case 'oxygen':
        if (numValue < 90) return 'low';
        if (numValue < 95) return 'warning';
        return 'normal';
        
      case 'glucose':
        if (numValue < 70) return 'low';
        if (numValue > 140) return 'high';
        if (numValue > 100) return 'elevated';
        return 'normal';
        
      default:
        return 'normal';
    }
  }

  // Get color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'warning':
      case 'elevated': return '#FFC107';
      case 'high':
      case 'low': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#fff',
    },
  };

  // Render a line chart
  const renderLineChart = (data, color, unit = '') => {
    const chartData = {
      labels: chartData.labels,
      datasets: [
        {
          data: data,
          color: (opacity = 1) => color,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 48}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => color,
          }}
          bezier
          style={styles.chart}
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
        />
      </View>
    );
  };

  // Render Blood Pressure Chart
  const renderBPChart = () => {
    const chartData = {
      labels: chartData.labels,
      datasets: [
        {
          data: chartData.bloodPressure.systolic,
          color: (opacity = 1) => '#4E79A7',
          strokeWidth: 2,
        },
        {
          data: chartData.bloodPressure.diastolic,
          color: (opacity = 1) => '#F28E2B',
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Blood Pressure</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => '#000',
            }}
            bezier
            style={styles.chart}
            withDots={true}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={true}
            withHorizontalLines={true}
          />
        </View>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4E79A7' }]} />
            <Text style={styles.legendText}>Systolic</Text>
          </View>
          <View style={[styles.legendItem, { marginLeft: 20 }]}>
            <View style={[styles.legendColor, { backgroundColor: '#F28E2B' }]} />
            <Text style={styles.legendText}>Diastolic</Text>
          </View>
        </View>
        <View style={styles.thresholdLine}>
          <Text style={styles.thresholdText}>Normal Range: Systolic: 90-120 mmHg, Diastolic: 60-80 mmHg</Text>
        </View>
      </View>
    );
  };

  // Render a metric card
  const renderMetricCard = (title, value, unit, status, icon) => (
    <View style={[styles.metricCard, { borderLeftColor: getStatusColor(status) }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <Icon name={icon} size={20} color="#666" />
      </View>
      <Text style={styles.metricValue}>
        {value} <Text style={styles.metricUnit}>{unit}</Text>
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
        <Text style={styles.statusText}>{status.toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Dashboard</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Patient Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={40} color="#666" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.patientName}>John Doe</Text>
              <Text style={styles.patientId}>ID: PT-123456</Text>
              <Text style={styles.patientAge}>45 years old</Text>
            </View>
          </View>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'day' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('day')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'day' && styles.timeRangeTextActive]}>
              Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'week' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('week')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'week' && styles.timeRangeTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeRangeButton, timeRange === 'month' && styles.timeRangeButtonActive]}
            onPress={() => setTimeRange('month')}
          >
            <Text style={[styles.timeRangeText, timeRange === 'month' && styles.timeRangeTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Health Metrics Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Health Metrics</Text>
            <Text style={styles.lastUpdated}>Last updated: Today, 10:30 AM</Text>
          </View>
          
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Heart Rate', 
              latestValues.heartRate, 
              'bpm', 
              metricStatus.heartRate,
              'heart-outline'
            )}
            {renderMetricCard(
              'Blood Pressure', 
              latestValues.bloodPressure, 
              'mmHg', 
              metricStatus.bloodPressure,
              'speedometer-outline'
            )}
            {renderMetricCard(
              'Oxygen Level', 
              latestValues.oxygen, 
              '%', 
              metricStatus.oxygen,
              'pulse-outline'
            )}
            {renderMetricCard(
              'Blood Glucose', 
              latestValues.glucose, 
              'mg/dL', 
              metricStatus.glucose,
              'flask-outline'
            )}
          </View>
        </View>

        {/* Heart Rate Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Rate</Text>
          {renderLineChart(chartData.heartRate, '#FF6B6B', ' bpm')}
          <View style={styles.thresholdLine}>
            <View style={[styles.thresholdDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.thresholdText}>Normal Range: 60-100 bpm</Text>
          </View>
        </View>

        {/* Blood Pressure Chart */}
        {renderBPChart()}

        {/* Oxygen Level Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oxygen Level</Text>
          {renderLineChart(chartData.oxygen, '#4ECDC4', '%')}
          <View style={styles.thresholdLine}>
            <View style={[styles.thresholdDot, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.thresholdText}>Normal Range: 95-100%</Text>
          </View>
        </View>

        {/* Blood Glucose Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blood Glucose</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: [
                  {
                    data: chartData.glucose,
                  },
                ],
              }}
              width={Dimensions.get('window').width - 48}
              height={220}
              yAxisLabel=""
              yAxisSuffix=" mg/dL"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => '#9B59B6',
                barPercentage: 0.6,
              }}
              style={styles.chart}
              fromZero
            />
          </View>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#9B59B6' }]} />
              <Text style={styles.legendText}>Glucose</Text>
            </View>
            <View style={[styles.legendItem, { marginLeft: 20 }]}>
              <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
              <Text style={styles.legendText}>Normal Range</Text>
            </View>
            <View style={[styles.legendItem, { marginLeft: 20 }]}>
              <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
              <Text style={styles.legendText}>High</Text>
            </View>
          </View>
          <View style={styles.thresholdLine}>
            <Text style={styles.thresholdText}>Normal Range: 70-100 mg/dL (fasting), {'<'}140 mg/dL (after meals)</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientAge: {
    fontSize: 14,
    color: '#666',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  metricCard: {
    width: '50%',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  metricUnit: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'normal',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  thresholdLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  thresholdDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  thresholdText: {
    fontSize: 12,
    color: '#666',
  },
});

export default PatientDashboardScreen;
