import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import StorageService from '../../services/StorageService';
import { getAdherenceStats as getAdherenceStatsSchedule, getMedications as getMedsFromSchedule, getSchedule } from '../../utils/storage';
import { generateAdherenceReport, shareReport } from '../../utils/reportGenerator';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Header from '../../components/Header';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Permissions from 'expo-permissions';
import { theme } from '../../utils/theme';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;

const ReportsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [adherenceData, setAdherenceData] = useState({
    total: 0,
    taken: 0,
    missed: 0,
    skipped: 0,
    adherencePercentage: 0,
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [medications, setMedications] = useState([]);
  const [insights, setInsights] = useState({
    bestWindow: '—',
    struggleWindow: '—',
    worstDay: '—',
    topMissMedication: '—',
    consistency: '—',
    streakDays: 0,
    recommendations: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const periods = [
    { key: 'day', label: 'Daily' },
    { key: 'week', label: 'Weekly' },
    { key: 'month', label: 'Monthly' },
  ];

  useEffect(() => {
    const loadData = async () => {
      await loadAdherenceData();
      await loadMedications();
      await computeInsights();
      await buildTrend();
      setIsLoading(false);
    };
    loadData();
  }, [selectedPeriod]);


  // Refresh on focus and poll every 3s while focused for near real-time
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      let intervalId;
      const refresh = async () => {
        if (!isActive) return;
        await loadAdherenceData();
        await loadMedications();
        await computeInsights();
        await buildTrend();
      };
      refresh();
      intervalId = setInterval(refresh, 3000);
      return () => {
        isActive = false;
        if (intervalId) clearInterval(intervalId);
      };
    }, [selectedPeriod])
  );

  const loadMedications = async () => {
    try {
      // Prefer schedule-backed meds for consistency across app
      const meds = await getMedsFromSchedule();
      setMedications(meds);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const loadAdherenceData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (selectedPeriod === 'day') {
        // single day
        startDate.setDate(endDate.getDate());
      } else if (selectedPeriod === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setDate(endDate.getDate() - 30);
      }
      
      const stats = await getAdherenceStatsSchedule(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setAdherenceData({
        total: stats.total,
        taken: stats.taken,
        missed: stats.missed,
        skipped: stats.skipped,
        adherencePercentage: Math.round(stats.adherenceRate || stats.adherencePercentage || 0),
      });
      
      // Reset series on period switch to avoid stale visuals
      setWeeklyData([]);
      setMonthlyData([]);

      // Build simple week/month arrays if needed elsewhere
      if (selectedPeriod === 'week') {
        const weekly = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStats = await getAdherenceStatsSchedule(
            date.toISOString().split('T')[0],
            date.toISOString().split('T')[0]
          );
          weekly.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            adherence: dayStats.adherenceRate || dayStats.adherencePercentage || 0,
          });
        }
        setWeeklyData(weekly);
      } else if (selectedPeriod === 'month') {
        const monthly = [];
        for (let i = 27; i >= 0; i -= 3) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const endPeriod = new Date(date);
          endPeriod.setDate(date.getDate() + 2);
          const periodStats = await getAdherenceStatsSchedule(
            date.toISOString().split('T')[0],
            endPeriod.toISOString().split('T')[0]
          );
          monthly.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            adherence: periodStats.adherenceRate || periodStats.adherencePercentage || 0,
          });
        }
        setMonthlyData(monthly);
      }
    } catch (error) {
      console.error('Error loading adherence data:', error);
    }
  };

  // Helpers for insights
  const timeToMinutes = (t) => {
    if (!t || typeof t !== 'string') return null;
    // Expect formats like "08:00 AM" or "20:30"
    const ampm = /am|pm/i.test(t) ? t.trim().toUpperCase() : null;
    const m = t.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (ampm) {
      if (ampm.includes('PM') && h !== 12) h += 12;
      if (ampm.includes('AM') && h === 12) h = 0;
    }
    return h * 60 + min;
  };

  const windows = [
    { start: 6 * 60, end: 9 * 60, label: '6–9 AM', cue: 'breakfast' },
    { start: 9 * 60, end: 12 * 60, label: '9–12 AM' },
    { start: 12 * 60, end: 15 * 60, label: '12–3 PM', cue: 'lunch' },
    { start: 15 * 60, end: 18 * 60, label: '3–6 PM' },
    { start: 18 * 60, end: 21 * 60, label: '6–9 PM', cue: 'dinner' },
    { start: 21 * 60, end: 24 * 60, label: '9 PM–12 AM', cue: 'night' },
  ];

  const computeInsights = async () => {
    try {
      const schedule = await getSchedule();
      if (!Array.isArray(schedule) || schedule.length === 0) {
        setInsights((prev) => ({ ...prev, recommendations: [] }));
        return;
      }

      // Lookback windows
      const today = new Date();
      const dayStr = (d) => d.toISOString().split('T')[0];
      const d30 = new Date(today); d30.setDate(today.getDate() - 30);
      const last30 = schedule.filter(e => new Date(e.date) >= d30 && new Date(e.date) <= today);

      // Day adherence map
      const byDate = new Map();
      for (const e of last30) {
        const k = e.date;
        if (!byDate.has(k)) byDate.set(k, []);
        byDate.get(k).push(e);
      }

      // Streak: consecutive days from today with 100% adherence (no missed/skipped among due)
      let streak = 0;
      for (let i = 0; i < 30; i++) {
        const d = new Date(); d.setDate(today.getDate() - i);
        const k = dayStr(d);
        const entries = byDate.get(k) || [];
        if (entries.length === 0) break; // no scheduled dose → streak stops
        const due = entries.filter(x => x.status !== 'pending');
        const missedAny = due.some(x => x.status === 'missed' || x.status === 'skipped');
        if (!missedAny && due.length > 0) streak += 1; else break;
      }

      // Time-of-day buckets
      const bucketStats = windows.map(w => ({ ...w, taken: 0, due: 0 }));
      for (const e of last30) {
        const mins = timeToMinutes(e.time);
        if (mins == null) continue;
        const w = bucketStats.find(b => mins >= b.start && mins < b.end);
        if (!w) continue;
        if (e.status !== 'pending') w.due += 1; else continue;
        if (e.status === 'taken') w.taken += 1;
      }
      const withRates = bucketStats.map(b => ({ ...b, rate: b.due > 0 ? (b.taken / b.due) * 100 : 0 }));
      const bestWindow = withRates.reduce((a, b) => (b.rate > a.rate ? b : a), withRates[0] || { rate: 0, label: '—' });
      const worstWindow = withRates.reduce((a, b) => (b.rate < a.rate ? b : a), withRates[0] || { rate: 0, label: '—' });

      // Day-of-week effects
      const dowStats = Array.from({ length: 7 }, (_, i) => ({ day: i, taken: 0, due: 0 }));
      for (const e of last30) {
        const dt = new Date(e.date);
        const idx = dt.getDay();
        if (e.status !== 'pending') dowStats[idx].due += 1; else continue;
        if (e.status === 'taken') dowStats[idx].taken += 1;
      }
      const dowRates = dowStats.map(d => ({ ...d, rate: d.due > 0 ? (d.taken / d.due) * 100 : 0 }));
      const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const worstDayObj = dowRates.reduce((a, b) => (b.rate < a.rate ? b : a), dowRates[0] || { rate: 0, day: 0 });
      const worstDay = labels[worstDayObj.day] || '—';

      // Medication-specific misses
      const medIndex = new Map(medications.map(m => [Number(m.id), m]));
      const medAgg = new Map();
      for (const e of last30) {
        if (!medAgg.has(e.medicationId)) medAgg.set(e.medicationId, { due: 0, missed: 0 });
        const agg = medAgg.get(e.medicationId);
        if (e.status !== 'pending') agg.due += 1; else continue;
        if (e.status === 'missed' || e.status === 'skipped') agg.missed += 1;
      }
      let topMissMedication = '—';
      let worstRate = -1;
      for (const [mid, agg] of medAgg.entries()) {
        if (agg.due === 0) continue;
        const rate = (agg.missed / agg.due) * 100;
        if (rate > worstRate) { worstRate = rate; topMissMedication = medIndex.get(Number(mid))?.name || `Medication ${mid}`; }
      }

      // Recommendations
      const rec = [];
      // Risk alert using 14-day trend delta if available
      if (trend14.length === 14) {
        const first7 = trend14.slice(0, 7).reduce((s, x) => s + x.pct, 0) / 7;
        const last7 = trend14.slice(7).reduce((s, x) => s + x.pct, 0) / 7;
        const delta = Math.round(last7 - first7);
        if (delta <= -10) rec.push(`Adherence dropped ${Math.abs(delta)}% vs last week — consider earlier reminders or simplifying evening routine.`);
        if (delta >= 10) rec.push(`Great momentum: +${delta}% vs last week — keep the current routine!`);
      }
      // Time-of-day optimization
      if (worstWindow && bestWindow && (bestWindow.rate - worstWindow.rate) >= 10 && worstWindow.due >= 3) {
        rec.push(`Shift doses in ${worstWindow.label} toward ${bestWindow.label} (historically +${Math.round(bestWindow.rate - worstWindow.rate)}% adherence).`);
      }
      // Habit cue
      if (bestWindow?.cue) rec.push(`Anchor a dose to ${bestWindow.cue} (${bestWindow.label}) — your best window.`);
      // Day-of-week support
      if (worstDayObj?.due >= 3 && worstDayObj.rate <= 80) rec.push(`${worstDay} has lower adherence — add a stronger reminder or caregiver check-in.`);
      // Med-specific nudge
      if (topMissMedication !== '—') rec.push(`Focus on ${topMissMedication} — most missed over the last 30 days.`);
      // Streak nudges
      if (streak >= 3 && streak < 7) rec.push(`Nice ${streak}-day streak — aim for 7 days to reach higher weekly adherence.`);
      if (streak >= 7) rec.push(`Strong streak of ${streak} days — excellent consistency!`);

      // Consistency score from variability (use trend14 variability proxy)
      const sd = stddev(trend14.map(x => x.pct));
      const consistency = sd < 10 ? 'High' : sd < 20 ? 'Medium' : 'Low';

      setInsights({
        bestWindow: `${bestWindow?.label || '—'} (${Math.round(bestWindow?.rate || 0)}%)`,
        struggleWindow: `${worstWindow?.label || '—'} (${Math.round(worstWindow?.rate || 0)}%)`,
        worstDay,
        topMissMedication,
        consistency,
        streakDays: streak,
        recommendations: rec.slice(0, 5),
      });
    } catch (e) {
      // fail soft
    }
  };

  const getAdherenceColor = (percentage) => {
    if (percentage >= 90) return '#4CAF50';
    if (percentage >= 70) return '#FF9800';
    return '#F44336';
  };

  const getBadgeMeta = (p) => {
    if (p >= 90) return { text: 'Excellent', bg: '#DCFCE7', fg: '#16A34A' };
    if (p >= 80) return { text: 'Good', bg: '#E0F2FE', fg: '#0284C7' };
    if (p >= 70) return { text: 'Fair', bg: '#FEF3C7', fg: '#D97706' };
    return { text: 'Needs Improvement', bg: '#FEE2E2', fg: '#DC2626' };
  };

  // 14-day trend for mini bars and delta
  const [trend14, setTrend14] = useState([]); // {label, pct}
  const [trendDelta, setTrendDelta] = useState(0);

  const buildTrend = React.useCallback(async () => {
    try {
      const arr = [];
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStats = await getAdherenceStatsSchedule(
          date.toISOString().split('T')[0],
          date.toISOString().split('T')[0]
        );
        arr.push({
          label: date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
          pct: dayStats.adherenceRate || dayStats.adherencePercentage || 0,
        });
      }
      setTrend14(arr);
      // Calculate trend delta (last 7 days vs first 7 days)
      if (arr.length >= 14) {
        const first7 = arr.slice(0, 7).reduce((s, x) => s + x.pct, 0) / 7;
        const last7 = arr.slice(7).reduce((s, x) => s + x.pct, 0) / 7;
        setTrendDelta(Math.round(last7 - first7));
      }
    } catch (error) {
      console.error('Error building trend:', error);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    buildTrend();
  }, [selectedPeriod, buildTrend]);

  const stddev = (values) => {
    if (!values.length) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const generateReport = async () => {
    try {
      // Refresh data right before generating for real-time accuracy
      await loadAdherenceData();
      await loadMedications();
      await computeInsights();
      await buildTrend();

      const generatedAt = new Date().toLocaleString();
      const recList = (insights.recommendations && insights.recommendations.length > 0)
        ? insights.recommendations
        : getRecommendations(adherenceData.adherencePercentage).split('\n').map(s => s.replace(/^•\s?/, ''));

      // Minimal HTML report printable to PDF
      const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
            .header { background: linear-gradient(90deg,#2196F3,#1976D2); color: #fff; padding: 20px; border-radius: 8px; }
            .title { margin: 0; font-size: 22px; }
            .meta { font-size: 12px; opacity: 0.9; }
            .section { margin-top: 18px; }
            .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
            h3 { margin: 0 0 10px 0; font-size: 16px; }
            .grid { display: flex; justify-content: space-between; }
            .stat { text-align: center; flex: 1; }
            .stat h4 { margin: 4px 0; font-size: 22px; }
            .stat small { color: #6b7280; }
            .badge { display:inline-block; padding: 4px 10px; border-radius:999px; font-size: 12px; font-weight:700; }
            .list li { margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
            td, th { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">MediCare Adherence Report</h1>
            <div class="meta">Generated: ${generatedAt} • Period: ${selectedPeriod.toUpperCase()}</div>
          </div>

          <div class="section card">
            <h3>Adherence Overview</h3>
            <div>
              <span class="badge" style="background:#eef2ff;color:#1e40af;">${getAdherenceRating(adherenceData.adherencePercentage)}</span>
            </div>
            <div class="grid" style="margin-top:10px;gap:8px;">
              <div class="stat"><small>Taken</small><h4>${adherenceData.taken}</h4></div>
              <div class="stat"><small>Missed</small><h4>${adherenceData.missed}</h4></div>
              <div class="stat"><small>Skipped</small><h4>${adherenceData.skipped}</h4></div>
              <div class="stat"><small>Total</small><h4>${adherenceData.total}</h4></div>
            </div>
            <div style="margin-top:8px;font-size:12px;color:#374151;">Adherence rate: <b>${adherenceData.adherencePercentage}%</b></div>
          </div>

          <div class="section card">
            <h3>Caregiver Insights</h3>
            <table>
              <tr><th>Best Window</th><td>${insights.bestWindow}</td></tr>
              <tr><th>Struggle Window</th><td>${insights.struggleWindow}</td></tr>
              <tr><th>Most Missed Medication</th><td>${insights.topMissMedication}</td></tr>
              <tr><th>Weekly Average</th><td>${adherenceData.adherencePercentage}%</td></tr>
              <tr><th>Consistency</th><td>${insights.consistency}</td></tr>
              <tr><th>Current Streak</th><td>${insights.streakDays} days</td></tr>
            </table>
          </div>

          <div class="section card">
            <h3>14-Day Trend</h3>
            <table>
              <tr><th>Half</th><th>Average</th></tr>
              <tr><td>Days 1–7</td><td>${trend14.length===14 ? Math.round(trend14.slice(0,7).reduce((s,x)=>s+x.pct,0)/7) : '-'}%</td></tr>
              <tr><td>Days 8–14</td><td>${trend14.length===14 ? Math.round(trend14.slice(7).reduce((s,x)=>s+x.pct,0)/7) : '-'}%</td></tr>
            </table>
            <div style="margin-top:6px;font-size:12px;color:${trendDelta>=0?'#16a34a':'#dc2626'};">Trend delta: ${trendDelta>=0?'+':''}${trendDelta}%</div>
          </div>

          <div class="section card">
            <h3>Recommendations</h3>
            <ul class="list">
              ${recList.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        </body>
      </html>`;

      // Web: open print dialog (user can save as PDF)
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });

      const fileName = `MediCare_Report_${new Date().toISOString().slice(0,10)}.pdf`;

      if (Platform.OS === 'android') {
        try {
          // Try to save to Downloads via SAF
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            Alert.alert('Saved', 'PDF saved to the selected folder.');
            return;
          }
        } catch (e) {
          // fall back to share
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Adherence Report', UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Report Ready', `PDF generated at: ${uri}`);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };


  const getAdherenceRating = (percentage) => {
    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 80) return 'GOOD';
    if (percentage >= 70) return 'FAIR';
    return 'NEEDS IMPROVEMENT';
  };
  
  const getRecommendations = (percentage) => {
    if (percentage >= 90) {
      return '• Keep up the excellent work!\n• Continue your current routine\n• Consider sharing your success with others';
    } else if (percentage >= 80) {
      return '• Good adherence overall\n• Try to identify missed dose patterns\n• Set additional reminders if needed';
    } else if (percentage >= 70) {
      return '• Room for improvement\n• Review your medication schedule\n• Consider using more reminder features';
    } else {
      return '• Significant improvement needed\n• Consult with your healthcare provider\n• Consider simplifying your medication routine\n• Use all available reminder features';
    }
  };

  const getChartData = () => {
    const data = selectedPeriod === 'week' ? weeklyData : monthlyData;
    return {
      labels: data.map(item => item.date),
      datasets: [
        {
          data: data.map(item => item.adherence),
          color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#7C3AED',
    },
  };

  const pieData = [
    {
      name: 'Taken',
      population: adherenceData.taken,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Missed',
      population: adherenceData.missed,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Skipped',
      population: adherenceData.skipped,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];

  return (
    <View style={styles.container}>
      <Header 
        title="Adherence Reports" 
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector: Daily / Weekly / Monthly */}
        <View style={styles.periodSelector}>
          {['day', 'week', 'month'].map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period === 'day' ? 'Daily' : period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Adherence Overview card with badge */}
        <View style={styles.section}>
          <View style={styles.overviewHeaderRow}>
            <Text style={styles.sectionTitle}>Adherence Overview</Text>
            {(() => { const b = getBadgeMeta(adherenceData.adherencePercentage); return (
              <View style={[styles.badge, { backgroundColor: b.bg }]}> 
                <Text style={[styles.badgeText, { color: b.fg }]}>{b.text}</Text>
              </View>
            ); })()}
          </View>
          <View style={styles.statsCard}>
            <View style={styles.mainStat}>
              <Text style={[styles.adherencePercentage, { color: getAdherenceColor(adherenceData.adherencePercentage) }]}>
                {adherenceData.adherencePercentage}%
              </Text>
              <Text style={styles.adherenceLabel}>Adherence Rate</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#E8F5E8' }]}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </View>
                <Text style={styles.statNumber}>{adherenceData.taken}</Text>
                <Text style={styles.statLabel}>Taken</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </View>
                <Text style={styles.statNumber}>{adherenceData.missed}</Text>
                <Text style={styles.statLabel}>Missed</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="remove" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statNumber}>{adherenceData.skipped}</Text>
                <Text style={styles.statLabel}>Skipped</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="analytics-outline" size={20} color="#475569" />
                </View>
                <Text style={styles.statNumber}>{adherenceData.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 14-Day Trend */}
        <View style={styles.section}>
          <View style={styles.trendHeaderRow}>
            <Text style={styles.sectionTitle}>14-Day Trend</Text>
            <Text style={styles.trendDelta}>
              {trendDelta >= 0 ? '▲' : '▼'} {Math.abs(trendDelta)}%
            </Text>
          </View>
          <View style={styles.cardBars}>
            <View style={styles.historyRow}>
              {trend14.map((d, i) => (
                <View key={i} style={styles.historyItem}>
                  <View style={styles.historyBarTrack}>
                    <View style={[styles.historyBarFill, { height: Math.max(6, (d.pct / 100) * 36) }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Distribution Chart */}
        {adherenceData.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication Status Distribution</Text>
            <View style={styles.chartCard}>
              <PieChart
                data={pieData}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {/* Caregiver Insights */}
        <View style={styles.section}>
          <View style={styles.insightCard}>
            <Text style={styles.insightSectionTitle}>Caregiver Insights</Text>
            <View style={styles.insightRow}><Text style={styles.insightKey}>Best Window</Text><Text style={styles.insightVal}>{insights.bestWindow}</Text></View>
            <View style={styles.insightRow}><Text style={styles.insightKey}>Struggle Window</Text><Text style={styles.insightVal}>{insights.struggleWindow}</Text></View>
            <View style={styles.insightRow}><Text style={styles.insightKey}>Most Missed Medication</Text><Text style={styles.insightVal}>{insights.topMissMedication}</Text></View>
            <View style={styles.insightRow}><Text style={styles.insightKey}>Weekly Average</Text><Text style={styles.insightVal}>{adherenceData.adherencePercentage}%</Text></View>
            <View style={styles.insightRow}><Text style={styles.insightKey}>Consistency Score</Text><Text style={styles.insightVal}>{insights.consistency}</Text></View>
            <View style={styles.insightRow}><Text style={styles.insightKey}>Current Streak</Text><Text style={styles.insightVal}>{insights.streakDays} days</Text></View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights & Recommendations</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="analytics" size={24} color="#2196F3" />
              <Text style={styles.insightTitle}>Adherence Rating</Text>
            </View>
            <Text style={styles.insightText}>
              {getAdherenceRating(adherenceData.adherencePercentage)} - {adherenceData.adherencePercentage}% adherence rate
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="bulb" size={24} color="#FF9800" />
              <Text style={styles.insightTitle}>Recommendations</Text>
            </View>
            <Text style={styles.insightText}>
              {insights.recommendations && insights.recommendations.length > 0
                ? `• ${insights.recommendations.join('\n• ')}`
                : getRecommendations(adherenceData.adherencePercentage)}
            </Text>
          </View>
          
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Ionicons name="stats-chart" size={24} color="#4CAF50" />
              <Text style={styles.insightTitle}>Statistics</Text>
            </View>
            <Text style={styles.insightText}>
              Total doses tracked: {adherenceData.total}{'\n'}
              Best day: {weeklyData.length > 0 ? weeklyData.reduce((max, day) => day.adherence > max.adherence ? day : max, weeklyData[0]).date : 'N/A'}{'\n'}
              Active medications: {medications.length}
            </Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: Platform.OS === 'android' ? StatusBar.currentHeight + 66 : 82,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  section: {
    padding: 20,
  },
  overviewHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: 20,
  },
  adherencePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  adherenceLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    width: '24%',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chart: { borderRadius: 16 },
  trendHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  trendDelta: { color: '#EF4444', fontWeight: '700' },
  cardBars: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginHorizontal: 20, ...Platform.select({ ios:{ shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.08, shadowRadius:8 }, android:{ elevation:2 }}) },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyItem: { alignItems: 'center', flex: 1 },
  historyBarTrack: { width: 12, height: 40, borderRadius: 6, backgroundColor: '#EEF2F7', justifyContent: 'flex-end', alignSelf: 'center' },
  historyBarFill: { width: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  medicationCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adherenceBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  adherenceBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  insightCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginHorizontal: 20, ...Platform.select({ ios:{ shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.08, shadowRadius:8 }, android:{ elevation:2 }}) },
  insightSectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  insightRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  insightKey: { color: '#6B7280' },
  insightVal: { color: '#111827', fontWeight: '700' },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exportText: {
    flex: 1,
    marginLeft: 15,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  exportDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  generateReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    justifyContent: 'center',
  },
  generateReportText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ReportsScreen;
