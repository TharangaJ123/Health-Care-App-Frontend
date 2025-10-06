import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Generate random data for charts
const generateChartData = (count, min, max, variance = 5) => {
  return Array(count).fill(0).map((_, i) => {
    const base = Math.random() * (max - min) + min;
    return Math.round(base + (Math.random() * variance * 2 - variance) * 10) / 10;
  });
};

const MonitorHealthScreen = ({ navigation }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState('00:00');
  const [heartRate, setHeartRate] = useState(72);
  const [bloodPressure, setBloodPressure] = useState({ systolic: 120, diastolic: 80 });
  const [oxygenLevel, setOxygenLevel] = useState(98);
  const [respiratoryRate, setRespiratoryRate] = useState(16);
  const [ecgStatus, setEcgStatus] = useState('NORMAL');
  const [ecgStatusColor, setEcgStatusColor] = useState('#00E096');
  const [timeFilter, setTimeFilter] = useState('day'); // 'day', 'week', or 'month'
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Generate time labels based on filter
  const getTimeLabels = (filter) => {
    const now = new Date();
    let labels = [];
    
    if (filter === 'day') {
      // Generate hourly labels for a day
      for (let i = 0; i < 24; i += 2) {
        labels.push(`${i.toString().padStart(2, '0')}:00`);
      }
    } else if (filter === 'week') {
      // Generate daily labels for a week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(days[date.getDay()]);
      }
    } else { // month
      // Generate weekly labels for a month
      const weeksInMonth = 4; // Approximation
      for (let i = 0; i < weeksInMonth; i++) {
        labels.push(`Week ${i + 1}`);
      }
    }
    
    return labels;
  };
  
  // Get data point count based on time filter
  const getDataPointCount = (filter) => {
    return filter === 'day' ? 12 : filter === 'week' ? 7 : 4;
  };
  
  // Simulated data for charts
  const [ecgData] = useState(() => 
    Array(100).fill(0).map((_, i) => {
      const x = i / 10;
      // More realistic ECG pattern with PQRST complex
      if (i % 25 === 0) {
        // QRS complex
        return 0.8 * Math.sin(x * 20) + 0.2 * Math.sin(x * 40);
      } else if (i % 25 === 5) {
        // T wave
        return 0.4 * Math.sin((x + 0.5) * 10);
      } else if (i % 25 === 20) {
        // P wave
        return 0.3 * Math.sin((x - 1) * 8);
      }
      return 0;
    })
  );
  
  // Generate data based on time filter
  const generateDataForFilter = (filter, min, max) => {
    const count = getDataPointCount(filter);
    const baseData = generateChartData(count, min, max);
    
    // Add some realistic variation based on time of day
    return baseData.map((value, index) => {
      if (filter === 'day') {
        // Higher values during day, lower at night
        const hour = (index * 2) % 24;
        const timeFactor = hour >= 6 && hour <= 22 ? 1.05 : 0.95; // 5% variation
        return Math.round(value * timeFactor);
      } else if (filter === 'week') {
        // Slightly lower on weekends
        const dayFactor = index >= 5 ? 0.98 : 1.02; // 2% variation
        return Math.round(value * dayFactor);
      }
      return Math.round(value);
    });
  };
  
  const [heartRateData, setHeartRateData] = useState(() => generateDataForFilter('day', 65, 85));
  const [heartRateVariability, setHeartRateVariability] = useState(() => generateDataForFilter('day', 20, 50));
  const [bloodPressureData, setBloodPressureData] = useState({
    systolic: generateDataForFilter('day', 110, 130),
    diastolic: generateDataForFilter('day', 70, 90),
    map: generateDataForFilter('day', 80, 100)
  });
  const [oxygenData, setOxygenData] = useState(() => generateDataForFilter('day', 95, 100));
  const [respiratoryData, setRespiratoryData] = useState(() => generateDataForFilter('day', 12, 20));
  
  // Update data when time filter changes
  useEffect(() => {
    setHeartRateData(generateDataForFilter(timeFilter, 65, 85));
    setHeartRateVariability(generateDataForFilter(timeFilter, 20, 50));
    setBloodPressureData({
      systolic: generateDataForFilter(timeFilter, 110, 130),
      diastolic: generateDataForFilter(timeFilter, 70, 90),
      map: generateDataForFilter(timeFilter, 80, 100)
    });
    setOxygenData(generateDataForFilter(timeFilter, 95, 100));
    setRespiratoryData(generateDataForFilter(timeFilter, 12, 20));
  }, [timeFilter]);
  
  // Calculate heart rate zones
  const maxHeartRate = 220 - 30; // Assuming age 30 for demo
  const heartRateZones = {
    zone1: Math.round(maxHeartRate * 0.5),
    zone2: Math.round(maxHeartRate * 0.6),
    zone3: Math.round(maxHeartRate * 0.7),
    zone4: Math.round(maxHeartRate * 0.8),
    zone5: Math.round(maxHeartRate * 0.9)
  };
  
  // Calculate current heart rate zone
  const getHeartRateZone = (hr) => {
    if (hr < heartRateZones.zone1) return { zone: 'Rest', color: '#8F9BB3' };
    if (hr < heartRateZones.zone2) return { zone: 'Warm Up', color: '#00E5FF' };
    if (hr < heartRateZones.zone3) return { zone: 'Fat Burn', color: '#00E096' };
    if (hr < heartRateZones.zone4) return { zone: 'Cardio', color: '#FFAA00' };
    return { zone: 'Peak', color: '#FF3D71' };
  };
  
  const currentHRZone = getHeartRateZone(heartRate);
  
  // Calculate SpO2 status
  const getOxygenStatus = (spo2) => {
    if (spo2 >= 95) return { status: 'Excellent', color: '#00E096' };
    if (spo2 >= 90) return { status: 'Normal', color: '#0095FF' };
    return { status: 'Low', color: '#FF3D71' };
  };
  
  const oxygenStatus = getOxygenStatus(oxygenLevel);
  
  // Time labels for x-axis
  const timeLabels = Array(12).fill(0).map((_, i) => {
    const hour = i * 2;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // Calculate points for chart lines
  const getLinePoints = (data, chartWidth, chartHeight, yOffset = 0, yScale = 1) => {
    if (!data || data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (chartWidth - 40);
      // Normalize value to fit within chart height
      const y = chartHeight - ((value - yOffset) * yScale);
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    });
    
    return points.join(' ');
  };
  
  // Calculate Y-axis labels for charts
  const getYAxisLabels = (min, max, steps = 4) => {
    const range = max - min;
    const step = range / steps;
    return Array(steps + 1).fill(0).map((_, i) => {
      const value = Math.round((min + (step * (steps - i))) * 10) / 10;
      return { value, y: (i / steps) * 100 };
    });
  };
  
  // Heart rate chart config
  const hrYAxis = getYAxisLabels(60, 100);
  const hrPoints = getLinePoints(heartRateData, width - 40, 100, 60, 2.5);
  
  // Blood pressure chart config
  const bpYAxis = getYAxisLabels(60, 140);
  const bpSystolicPoints = getLinePoints(bloodPressureData.systolic, width - 40, 100, 60, 1.25);
  const bpDiastolicPoints = getLinePoints(bloodPressureData.diastolic, width - 40, 100, 60, 1.25);
  
  // Oxygen chart config
  const oxyYAxis = getYAxisLabels(90, 100);
  const oxyPoints = getLinePoints(oxygenData, width - 40, 100, 90, 10);

  // Toggle monitoring
  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
  };

  // Format time in MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Simulate health data changes
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        // Update heart rate with more realistic variations
        setHeartRate(prev => {
          // Simulate different heart rate patterns
          const pattern = Math.random();
          let variation;
          
          if (pattern > 0.9) {
            // Occasional high variation (like after activity)
            variation = Math.floor(Math.random() * 10) - 2;
            setEcgStatus('ELEVATED');
            setEcgStatusColor('#FFAA00');
          } else if (pattern < 0.1) {
            // Occasional low variation (like during rest)
            variation = Math.floor(Math.random() * 3) - 1;
            setEcgStatus('NORMAL');
            setEcgStatusColor('#00E096');
          } else {
            // Normal variation
            variation = Math.floor(Math.random() * 5) - 2;
            setEcgStatus('NORMAL');
            setEcgStatusColor('#00E096');
          }
          
          return Math.max(50, Math.min(180, prev + variation));
        });
        
        // Update blood pressure with correlated changes
        setBloodPressure(prev => {
          // Blood pressure changes are generally more stable than heart rate
          const sysVariation = (Math.random() * 3 - 1.5);
          const diaVariation = (Math.random() * 2 - 1);
          
          // Keep pulse pressure (difference between systolic and diastolic) in a reasonable range
          const newSystolic = prev.systolic + sysVariation;
          const newDiastolic = Math.min(
            newSystolic - 30, // Minimum pulse pressure of 30
            Math.max(prev.diastolic + diaVariation, 60) // Keep diastolic above 60
          );
          
          return {
            systolic: Math.max(90, Math.min(180, newSystolic)),
            diastolic: Math.max(60, Math.min(120, newDiastolic))
          };
        });
        
        // Update oxygen level with occasional drops
        setOxygenLevel(prev => {
          // 5% chance of a significant drop (like during sleep apnea)
          if (Math.random() > 0.95) {
            return Math.max(85, prev - (Math.random() * 5 + 5));
          }
          // Otherwise small variations
          const variation = (Math.random() * 0.5 - 0.25);
          return Math.max(85, Math.min(100, prev + variation));
        });
        
        // Update respiratory rate (slightly correlated with heart rate)
        setRespiratoryRate(prev => {
          const baseRate = 12 + (heartRate - 60) * 0.1; // Base rate increases with HR
          const variation = (Math.random() * 2 - 1);
          return Math.max(8, Math.min(30, baseRate + variation));
        });
        
      }, 3000); // Update every 3 seconds for more responsive feel
      
      return () => clearInterval(interval);
    }
  }, [isMonitoring, heartRate]);
  
  // Render a single chart with enhanced features
  const renderChart = (title, data, yAxis, linePoints, lineColor, unit = '', additionalInfo = null) => {
    // Calculate min/max for the data range
    const dataMin = Math.min(...data);
    const dataMax = Math.max(...data);
    const dataRange = dataMax - dataMin;
    
    // Calculate trend (up/down/stable)
    const trend = data.length > 1 
      ? data[data.length - 1] > data[data.length - 2] ? 'up' 
        : data[data.length - 1] < data[data.length - 2] ? 'down' : 'stable'
      : 'stable';
    
    // Format current value with trend indicator
    const currentValue = data[data.length - 1];
    const formattedValue = `${currentValue.toFixed(unit === '%' ? 1 : 0)}${unit}`;
    
    return (
      <View style={[styles.chartContainer, additionalInfo && styles.chartWithInfo]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>{title}</Text>
            {additionalInfo && (
              <Text style={styles.chartSubtitle}>{additionalInfo}</Text>
            )}
          </View>
          <View style={styles.chartValueContainer}>
            <View style={styles.trendIndicator}>
              {trend === 'up' && <Ionicons name="arrow-up" size={16} color="#FF3D71" />}
              {trend === 'down' && <Ionicons name="arrow-down" size={16} color="#00E096" />}
              {trend === 'stable' && <Ionicons name="remove" size={16} color="#8F9BB3" />}
            </View>
            <Text style={[styles.chartValue, { color: lineColor }]}>
              {formattedValue}
            </Text>
          </View>
        </View>
        
        <View style={styles.chartWrapper}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            {yAxis.map((item, index) => (
              <Text key={index} style={styles.yAxisLabel}>
                {item.value}
              </Text>
            ))}
          </View>
          
          {/* Chart area */}
          <View style={styles.chart}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width - 80} 120`}>
              {/* Gradient background for the chart area */}
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={`${lineColor}10`} />
                  <stop offset="100%" stopColor="#1E1E1E00" />
                </linearGradient>
              </defs>
              
              {/* Fill area under the line */}
              <path 
                d={`${linePoints} L ${width-80},120 L 0,120 Z`} 
                fill="url(#chartGradient)"
                fillOpacity="0.3"
              />
              
              {/* Grid lines */}
              {yAxis.map((item, index) => (
                <line 
                  key={`grid-${index}`}
                  x1="0" 
                  y1={item.y} 
                  x2="100%" 
                  y2={item.y} 
                  stroke="#2D2D2D" 
                  strokeWidth="1"
                />
              ))}
              
              {/* Data line with glow effect */}
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              <path 
                d={linePoints} 
                fill="none" 
                stroke={lineColor} 
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
              
              {/* Current value indicator */}
              <circle 
                cx="100%" 
                cy={120 - ((currentValue - yAxis[yAxis.length-1].value) * (100 / (yAxis[0].value - yAxis[yAxis.length-1].value)))} 
                r="5" 
                fill="#FFFFFF"
                stroke={lineColor}
                strokeWidth="2"
              />
              
              {/* Average line */}
              <line 
                x1="0" 
                y1={120 - ((data.reduce((a, b) => a + b, 0) / data.length - yAxis[yAxis.length-1].value) * (100 / (yAxis[0].value - yAxis[yAxis.length-1].value)))} 
                x2="100%" 
                y2={120 - ((data.reduce((a, b) => a + b, 0) / data.length - yAxis[yAxis.length-1].value) * (100 / (yAxis[0].value - yAxis[yAxis.length-1].value)))} 
                stroke="#8F9BB3" 
                strokeWidth="1"
                strokeDasharray="4 2"
              />
            </svg>
            
            {/* X-axis labels */}
            <View style={styles.xAxis}>
              {timeLabels.map((label, index) => (
                <Text key={index} style={styles.xAxisLabel}>
                  {index % 2 === 0 ? label : ''}
                </Text>
              ))}
            </View>
            
            {/* Min/Max indicators */}
            <View style={styles.chartMinMax}>
              <Text style={styles.minMaxText}>Min: {dataMin.toFixed(1)}</Text>
              <Text style={styles.minMaxText}>Max: {dataMax.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Health Monitor</Text>
            <Text style={styles.headerSubtitle}>Real Time Monitoring</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={20} color="#8F9BB3" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.timerContainer}>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={16} color="#8F9BB3" />
            <Text style={styles.timerText}>{timeElapsed}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="pulse" size={14} color="#FF3D71" />
              <Text style={[styles.statText, { color: '#FF3D71' }]}>{heartRate} BPM</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={14} color="#00E5FF" />
              <Text style={[styles.statText, { color: '#00E5FF' }]}>
                {bloodPressure.systolic}/{bloodPressure.diastolic}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="water" size={14} color="#00E5FF" />
              <Text style={[styles.statText, { color: '#00E5FF' }]}>{oxygenLevel}%</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Time Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              timeFilter === 'day' && styles.activeFilter
            ]}
            onPress={() => setTimeFilter('day')}
          >
            <Text style={[
              styles.filterButtonText,
              timeFilter === 'day' && styles.activeFilterText
            ]}>
              Day
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              timeFilter === 'week' && styles.activeFilter
            ]}
            onPress={() => setTimeFilter('week')}
          >
            <Text style={[
              styles.filterButtonText,
              timeFilter === 'week' && styles.activeFilterText
            ]}>
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              timeFilter === 'month' && styles.activeFilter
            ]}
            onPress={() => setTimeFilter('month')}
          >
            <Text style={[
              styles.filterButtonText,
              timeFilter === 'month' && styles.activeFilterText
            ]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* ECG Graph */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ECG</Text>
            <View style={styles.sectionActions}>
              <TouchableOpacity style={styles.sectionActionButton}>
                <Ionicons name="expand" size={18} color="#8F9BB3" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sectionActionButton}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#8F9BB3" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.ecgGraph}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} 120`}>
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2D2D2D" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="#1E1E1E" />
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* ECG Line */}
              <path 
                d={getLinePoints(ecgData, width, 100, 0, 40)} 
                fill="none" 
                stroke="#00E5FF" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Red line at the end */}
              <line 
                x1={width-40} 
                y1="0" 
                x2={width-40} 
                y2="120" 
                stroke="#FF3D71" 
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
          </View>
          
          <View style={styles.ecgInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>HEART RATE</Text>
              <Text style={styles.infoValue}>{heartRate} <Text style={styles.infoUnit}>BPM</Text></Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>STATUS</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>NORMAL RHYTHM</Text>
              </View>
            </View>
          </View>
        </View>
        

       
        
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.primaryButton]}
            onPress={toggleMonitoring}
          >
            <Ionicons 
              name={isMonitoring ? 'pause' : 'play'} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.controlButtonText}>
              {isMonitoring ? 'PAUSE MONITORING' : 'START MONITORING'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="stop" size={20} color="#8F9BB3" />
              <Text style={styles.secondaryButtonText}>STOP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="refresh" size={20} color="#8F9BB3" />
              <Text style={styles.secondaryButtonText}>RESET</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="share-social" size={20} color="#8F9BB3" />
              <Text style={styles.secondaryButtonText}>SHARE</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper component for rendering chart axis labels
const AxisLabel = ({ x, y, value, color = '#8F9BB3' }) => (
  <Text style={[styles.axisLabel, { left: x, top: y, color }]}>{value}</Text>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#4B5563',
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#d1d1d1',
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d1d1',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilter: {
    backgroundColor: '#3366FF',
    shadowColor: 'rgba(51, 102, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    color: '#030303',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  activeTimeFilterText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionActions: {
    flexDirection: 'row',
  },
  sectionActionButton: {
    marginLeft: 8,
    padding: 4,
  },
  ecgContainer: {
    marginBottom: 0,
  },
  ecgGraph: {
    height: 150,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  ecgInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  infoItem: {
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 12,
    color: '#8F9BB3',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoUnit: {
    fontSize: 16,
    color: '#8F9BB3',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 201, 167, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5FF',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#00E5FF',
    fontWeight: '600',
  },
  // Chart styles
  chartContainer: {
    backgroundColor: '#ebeff3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 12,
    color: '#030405',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#8F9BB3',
    textAlign: 'right',
  },
  chart: {
    flex: 1,
    height: '100%',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#8F9BB3',
    width: 40,
    textAlign: 'center',
    marginLeft: -20,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#8F9BB3',
  },
  // Controls
  controls: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3366FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3366FF',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  secondaryButtonText: {
    color: '#8F9BB3',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  spacer: {
    height: 24,
  },
});

export default MonitorHealthScreen;
