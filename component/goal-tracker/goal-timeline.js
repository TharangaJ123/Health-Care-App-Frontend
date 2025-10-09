import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Utility formatters
const fmt = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return String(iso);
  }
};

const daysBetween = (a, b) => {
  try {
    const d1 = new Date(a);
    const d2 = new Date(b);
    return Math.max(0, Math.round((d2 - d1) / (24 * 3600 * 1000)));
  } catch {
    return 0;
  }
};

// Vertical timeline per step with date badges and connector lines
const GoalTimeline = ({ steps = [], startDate, onToggleStep }) => {
  const anySchedule = Array.isArray(steps) && steps.some(s => s.startDate || s.dueDate || typeof s.dayOffset === 'number');
  if (!anySchedule) {
    // Graceful fallback: show compact ordered list without dates
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Roadmap</Text>
        {steps.sort((a,b)=>(a.order||0)-(b.order||0)).map((s, idx) => (
          <View key={String(s.id || idx)} style={styles.fallbackItem}>
            <Ionicons name={s.completed ? 'checkmark-circle' : 'radio-button-off'} size={18} color={s.completed ? '#34C759' : '#C7C7CC'} />
            <Text style={[styles.fallbackText, s.completed && { textDecorationLine: 'line-through', color: '#8E8E93' }]}>
              {s.title}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  const base = startDate || (steps[0] && steps[0].startDate) || new Date().toISOString().split('T')[0];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Goal Roadmap</Text>
      <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
        {steps
          .slice()
          .sort((a,b)=>(a.order||0)-(b.order||0))
          .map((s, idx, arr) => {
            const start = s.startDate || base;
            const due = s.dueDate || s.startDate || base;
            const duration = daysBetween(start, due) + 1;
            const locked = arr.slice(0, idx).some(p => !p.completed);
            return (
              <View key={String(s.id || idx)} style={styles.row}>
                {/* LEFT: timeline rail */}
                <View style={styles.railCol}>
                  {/* connector above */}
                  {idx !== 0 ? <View style={styles.connector} /> : <View style={{ height: 10 }} />}
                  {/* bullet */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={locked}
                    onPress={() => onToggleStep && onToggleStep(s.id)}
                    style={[styles.bullet, s.completed && styles.bulletDone, locked && styles.bulletLocked]}
                  >
                    <Ionicons name={s.completed ? 'checkmark' : 'ellipse-outline'} size={12} color={s.completed ? '#fff' : locked ? '#C7CAD1' : '#6B7280'} />
                  </TouchableOpacity>
                  {/* connector below */}
                  {idx !== arr.length - 1 ? <View style={styles.connector} /> : <View style={{ height: 10 }} />}
                </View>

                {/* RIGHT: card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={locked}
                  onPress={() => onToggleStep && onToggleStep(s.id)}
                  style={[styles.card, s.completed && styles.cardDone, locked && styles.cardLocked]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeDate}>
                      <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                      <Text style={styles.badgeDateText}>{fmt(start)} → {fmt(due)}</Text>
                    </View>
                    <View style={styles.badgeDur}>
                      <Ionicons name="time-outline" size={14} color="#0EA5E9" />
                      <Text style={styles.badgeDurText}>{duration} day{duration>1?'s':''}</Text>
                    </View>
                  </View>
                  <Text style={[styles.stepTitle, s.completed && styles.stepTitleDone]}>{s.title}</Text>
                  {!!s.description && (
                    <Text style={[styles.stepDesc, s.completed && styles.stepDescDone]}>{s.description}</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  railCol: {
    width: 28,
    alignItems: 'center',
  },
  connector: {
    width: 2,
    backgroundColor: '#E5E7EB',
    flexGrow: 1,
    minHeight: 16,
  },
  bullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  bulletLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  card: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  cardDone: {
    opacity: 0.85,
    borderLeftColor: '#34C759',
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeDate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeDateText: {
    marginLeft: 6,
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDurText: {
    marginLeft: 6,
    color: '#0EA5E9',
    fontSize: 12,
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  stepTitleDone: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  stepDesc: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  stepDescDone: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  fallback: {
    padding: 8,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  fallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fallbackText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
});

export default GoalTimeline;
