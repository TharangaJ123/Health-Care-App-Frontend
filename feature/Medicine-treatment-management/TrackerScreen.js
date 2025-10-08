import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';
import { getSchedule, getWeeklyAdherence, getAdherenceStats } from '../../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../Header';

const todayISO = () => new Date().toISOString().split('T')[0];

const StatCard = ({ label, value, tint, iconName }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: `${tint}15`, borderColor: `${tint}40` }] }>
      <Ionicons name={iconName} size={18} color={tint} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={[styles.statUnderline, { backgroundColor: tint }]} />
  </View>
);

const MetricTile = ({ title, value, right }) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricTitle}>{title}</Text>
    <View style={styles.metricRight}>
      {right}
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  </View>
);

export default function TrackerScreen({ navigation }) {
  const [todayStats, setTodayStats] = useState({ taken: 0, missed: 0, adherence: 0, total: 0 });
  const [weekly, setWeekly] = useState({ adherenceRate: 0, total: 0, taken: 0 });
  const [weeklySeries, setWeeklySeries] = useState([]); // [{label:'Mon', pct: 0}]
  const [range, setRange] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  const load = useCallback(async () => {
      try {
        // Today stats
        const schedule = await getSchedule();
        const today = todayISO();
        const entries = schedule.filter(e => e.date === today);
        const taken = entries.filter(e => e.status === 'taken').length;
        const missed = entries.filter(e => e.status === 'missed').length;
        const total = entries.length;
        const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
        setTodayStats({ taken, missed, total, adherence });

        // Overall block adapts to selected range
        if (range === 'weekly') {
          const w = await getWeeklyAdherence();
          if (w) setWeekly({ adherenceRate: Math.round(w.adherenceRate || 0), total: w.total || 0, taken: w.taken || 0 });
        } else if (range === 'monthly') {
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - 30);
          const m = await getAdherenceStats(start.toISOString().split('T')[0], end.toISOString().split('T')[0]);
          if (m) setWeekly({ adherenceRate: Math.round(m.adherencePercentage || 0), total: m.total || 0, taken: m.taken || 0 });
        } else {
          // daily: mirror today's block into summary for consistency
          setWeekly({ adherenceRate: adherence, total, taken });
        }

        // Series adapts length and labels to range
        const windowDays = range === 'monthly' ? 30 : 7;
        const days = [];
        for (let i = windowDays - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const iso = d.toISOString().split('T')[0];
          const dayEntries = schedule.filter(e => e.date === iso);
          const dayTaken = dayEntries.filter(e => e.status === 'taken').length;
          const pct = dayEntries.length > 0 ? Math.round((dayTaken / dayEntries.length) * 100) : 0;
          const label = range === 'monthly'
            ? d.toLocaleDateString('en-US', { day: 'numeric' })
            : d.toLocaleDateString('en-US', { weekday: 'short' });
          days.push({ label, pct });
        }
        setWeeklySeries(days);
      } catch (e) {
        // ignore for now, UI will show zeros
      }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Medication Tracker" 
        onBack={() => navigation.goBack()}
        rightIcon={
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => navigation.navigate('Reports')}>
            <Ionicons name="stats-chart" size={16} color="#FFFFFF" />
            <Text style={styles.headerActionText}>View Reports</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Progress */}
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsRow}>
          <StatCard label="Taken" value={todayStats.taken} tint="#10B981" iconName="checkmark-circle" />
          <StatCard label="Missed" value={todayStats.missed} tint="#EF4444" iconName="close-circle" />
          <StatCard label="Adherence" value={`${todayStats.adherence}%`} tint="#EF4444" iconName="pulse" />
        </View>

        {/* Range Toggle */}
        <View style={styles.toggleRow}>
          {['daily','weekly','monthly'].map(key => (
            <TouchableOpacity key={key} style={[styles.toggleBtn, range === key && styles.toggleBtnActive]} onPress={() => setRange(key)}>
              <Text style={[styles.toggleText, range === key && styles.toggleTextActive]}>
                {key === 'daily' ? 'Daily' : key === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview */}
        <Text style={styles.sectionTitle}>{range === 'monthly' ? 'Monthly Overview' : range === 'weekly' ? 'Weekly Overview' : "Today's Overview"}</Text>
        <View style={styles.card}>
          <View style={styles.metricGrid}>
            <MetricTile title="Weekly Adherence" value={`${weekly.adherenceRate}%`} right={<Ionicons name="trending-up" size={16} color="#10B981" />} />
            <MetricTile title="Doses Taken" value={`${weekly.taken}/${weekly.total}`} right={<Ionicons name="medkit" size={16} color="#1E3A8A" />} />
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${weekly.adherenceRate}%` }]} />
          </View>
        </View>

        {/* Adherence History */}
        <Text style={styles.sectionTitle}>{range === 'monthly' ? '30-Day Adherence History' : '7-Day Adherence History'}</Text>
        <View style={styles.card}>
          <View style={styles.historyRow}>
            {weeklySeries.map((d, idx) => (
              <View key={idx} style={styles.historyItem}>
                <View style={styles.historyBarTrack}>
                  <View style={[styles.historyBarFill, { height: Math.max(6, (d.pct / 100) * 36) }]} />
                </View>
                <Text style={styles.historyLabel}>{d.label}</Text>
                <Text style={styles.historyPct}>{d.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  headerActionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: '#1E3A8A', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  headerActionText: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '700' 
  },

  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8, marginTop: 12 },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 8 },
  toggleBtn: { flex: 1, backgroundColor: '#EEF2FF', borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#1E3A8A' },
  toggleText: { color: '#1E3A8A', fontWeight: '700', fontSize: 12 },
  toggleTextActive: { color: '#FFFFFF' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, ...Platform.select({ ios:{ shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.08, shadowRadius:8 }, android:{ elevation:3 }}) },
  statIconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statUnderline: { height: 4, borderRadius: 4, marginTop: 10 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 8, ...Platform.select({ ios:{ shadowColor:'#000', shadowOffset:{width:0, height:2}, shadowOpacity:0.08, shadowRadius:8 }, android:{ elevation:3 }}) },
  metricGrid: { gap: 8 },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricTitle: { fontSize: 14, color: '#111827', fontWeight: '600' },
  metricRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricValue: { fontSize: 14, color: '#111827', fontWeight: '800' },

  progressTrack: { height: 10, borderRadius: 999, backgroundColor: '#F3F4F6', marginTop: 12 },
  progressBar: { height: 10, borderRadius: 999, backgroundColor: '#EF4444' },

  historyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyItem: { alignItems: 'center', flex: 1 },
  historyBarTrack: { width: 20, height: 40, borderRadius: 6, backgroundColor: '#F3F4F6', justifyContent: 'flex-end', alignItems: 'center', alignSelf: 'center' },
  historyBarFill: { width: 14, borderRadius: 4, backgroundColor: '#EF4444' },
  historyLabel: { marginTop: 6, fontSize: 10, color: '#6B7280' },
  historyPct: { fontSize: 10, color: '#6B7280' },
});