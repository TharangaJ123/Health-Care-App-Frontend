import React, { useState, useEffect,useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import Icon from '../common/Icon';
import { apiFetch } from '../../config/api';

import GoalTimeline from './goal-timeline';

const GoalDetailScreen = ({ route, navigation, goal, onGoBack, onGoalUpdate }) => {
  
  const [currentGoal, setCurrentGoal] = useState(goal || {
    id: '1',
    title: 'Morning Meditation',
    description: '15 minutes of mindfulness meditation to start the day with clarity and focus. This practice helps reduce stress and improve mental well-being.',
    type: 'mental',
    date: '2024-01-20',
    time: '07:00 AM',
    priority: 'high',
    completed: false,
    createdAt: '2024-01-15',
    reminders: ['10 minutes before'],
    notes: 'Use the calm app for guided meditation',
    steps: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        if (goal?.id) {
          const fresh = await apiFetch(`/api/goals/${encodeURIComponent(goal.id)}`);
          if (fresh && typeof fresh === 'object') {
            setCurrentGoal((prev) => ({ ...prev, ...fresh }));
          }
        }
      } catch {}
    };
    load();
  }, [goal?.id]);

  const stepsTotal = Array.isArray(currentGoal.steps) ? currentGoal.steps.length : 0;
  const stepsDone = Array.isArray(currentGoal.steps) ? currentGoal.steps.filter(s => s.completed).length : 0;
  const progressPct = stepsTotal > 0 ? Math.round((stepsDone / stepsTotal) * 100) : 0;
  const [recommendations, setRecommendations] = useState('');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#4CD964';
      default: return '#007AFF';
    }
  };

  const handleGenerateSteps = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/goals/${encodeURIComponent(currentGoal.id)}/generate-steps`, { method: 'POST' });
      const steps = Array.isArray(res?.steps) ? res.steps : [];
      if (JSON.stringify(steps) !== JSON.stringify(currentGoal.steps)) {
        const updated = { ...currentGoal, steps };
        setCurrentGoal(updated);
        onGoalUpdate?.(updated);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate steps.');
    }
  }, [currentGoal, setCurrentGoal, onGoalUpdate]);


  const toggleStep = async (stepId) => {
    try {
      if (!currentGoal.id) return;
      const res = await apiFetch(`/api/goals/${encodeURIComponent(currentGoal.id)}/steps/${encodeURIComponent(stepId)}/toggle`, { method: 'PATCH' });
      const updated = {
        ...currentGoal,
        steps: Array.isArray(res?.steps) ? res.steps : currentGoal.steps,
        completed: typeof res?.completed === 'boolean' ? res.completed : currentGoal.completed,
        completedAt: res?.completedAt || currentGoal.completedAt,
      };

      if (updated.completed && Array.isArray(updated.notificationIds) && updated.notificationIds.length) {
        try { await cancelScheduledNotifications(updated.notificationIds); } catch {}
        updated.notificationIds = [];
      }
      setCurrentGoal(updated);
      onGoalUpdate && onGoalUpdate(updated);

      if (updated.completed) {
        try {
          const rec = await apiFetch(`/api/goals/${encodeURIComponent(updated.id)}/recommendations`);
          setRecommendations(typeof rec?.recommendations === 'string' ? rec.recommendations : '');
        } catch {}
      }
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('PREREQUISITE_INCOMPLETE') || msg.includes('previous steps')) {
        Alert.alert('Finish previous steps', 'Please complete the earlier step(s) before this one.');
      } else {
        Alert.alert('Error', 'Failed to update step.');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'physical': return 'fitness-outline';
      case 'mental': return 'brain-outline';
      case 'nutrition': return 'nutrition-outline';
      case 'sleep': return 'moon-outline';
      case 'social': return 'people-outline';
      default: return 'flag-outline';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'physical': return '#FF3B30';
      case 'mental': return '#5856D6';
      case 'nutrition': return '#34C759';
      case 'sleep': return '#007AFF';
      case 'social': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'physical': return 'Physical Health';
      case 'mental': return 'Mental Wellness';
      case 'nutrition': return 'Nutrition';
      case 'sleep': return 'Sleep';
      case 'social': return 'Social';
      default: return 'Other';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    
    if (dateString === today) {
      return 'Today';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (Array.isArray(currentGoal.notificationIds) && currentGoal.notificationIds.length) {
                await cancelScheduledNotifications(currentGoal.notificationIds);
              }
              if (currentGoal.id) {
                await apiFetch(`/api/goals/${currentGoal.id}`, { method: 'DELETE' });
              }
              onGoalUpdate && onGoalUpdate(currentGoal.id, 'delete');
              onGoBack();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete goal.');
            }
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my goal: ${currentGoal.title}\n\n${currentGoal.description}\n\nScheduled for: ${formatDate(currentGoal.date)} at ${currentGoal.time}`,
        title: 'My Health Goal'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share goal');
    }
  };

  const ProgressCircle = ({ completed, size = 100 }) => {
    return (
      <View style={[styles.progressCircle, { width: size, height: size }]}>
        <Icon 
          name={completed ? "checkmark-circle" : "ellipse-outline"} 
          size={size - 20} 
          color={completed ? "#4CD964" : "#E5E7EB"} 
        />
        <Text style={styles.progressText}>
          {completed ? 'Completed' : 'In Progress'}
        </Text>
      </View>
    );
  };

  const InfoCard = ({ icon, title, value, color = '#007AFF' }) => (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onGoBack}
        >
          <Icon name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Icon name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Goal Header Section */}
        <View style={styles.headerSection}>
          <ProgressCircle completed={currentGoal.completed} />
          
          <View style={styles.goalHeader}>
            <View style={styles.typeBadge}>
              <Icon 
                name={getTypeIcon(currentGoal.type)} 
                size={16} 
                color={getTypeColor(currentGoal.type)} 
              />
              <Text style={[styles.typeText, { color: getTypeColor(currentGoal.type) }]}>
                {getTypeLabel(currentGoal.type)}
              </Text>
            </View>
            
            <Text style={styles.goalTitle}>{currentGoal.title}</Text>
            <Text style={styles.goalDescription}>{currentGoal.description}</Text>
          </View>
        </View>

        {/* Priority Indicator */}
        <View style={styles.prioritySection}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(currentGoal.priority) }]}>
            <Icon name="flag-outline" size={16} color="#fff" />
            <Text style={styles.priorityText}>
              {currentGoal.priority.charAt(0).toUpperCase() + currentGoal.priority.slice(1)} Priority
            </Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <InfoCard 
            icon="calendar-outline" 
            title="Scheduled Date" 
            value={formatDate(currentGoal.date)}
            color="#007AFF"
          />
          <InfoCard 
            icon="time-outline" 
            title="Time" 
            value={currentGoal.time}
            color="#FF9500"
          />
          <InfoCard 
            icon="rocket-outline" 
            title="Status" 
            value={currentGoal.completed ? 'Completed' : 'Pending'}
            color={currentGoal.completed ? "#4CD964" : "#FF3B30"}
          />
          <InfoCard 
            icon="create-outline" 
            title="Created" 
            value={new Date(currentGoal.createdAt).toLocaleDateString()}
            color="#8E8E93"
          />
        </View>

        {/* Action Plan (Steps) */}
        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Action Plan</Text>
                <Icon name="sparkles-outline" size={22} color="#7C3AED" />
          </View>

          <View>
            {currentGoal.steps && currentGoal.steps.length > 0 ? (
              currentGoal.steps
                .slice()
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((s) => (
                  <View
                    key={String(s.id)}
                    style={[styles.stepItem, s.completed && styles.stepItemDone]}
                    >
                    <View style={[styles.stepCheck, s.completed && styles.stepCheckDone]}>
                      <Ionicons
                        name={s.completed ? 'checkmark' : 'ellipse-outline'}
                        size={18}
                        color={s.completed ? '#fff' : '#666'}
                      />
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={[styles.stepTitle, s.completed && styles.stepTitleDone]}>
                        {s.title}
                      </Text>
                      {s.description ? (
                        <Text style={[styles.stepDesc, s.completed && styles.stepDescDone]}>
                          {s.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))
            ) : (
              <Text style={styles.noStepsText}>No steps yet.</Text>
            )}
          </View>

        </View> */}

        {/* Roadmap & Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Roadmap & Schedule</Text>
            <Icon name="sparkles-outline" size={22} color="#7C3AED" />
          </View>
          <GoalTimeline steps={Array.isArray(currentGoal.steps) ? currentGoal.steps : []} startDate={currentGoal.date} onToggleStep={toggleStep} />
        </View>
        
        {/* Insights (visible when completed) */}
        {currentGoal.completed ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Insights</Text>
            </View>
            <View style={styles.insightProgress}>
              <View style={styles.progressBarBig}>
                <View style={[styles.progressFillBig, { width: `${progressPct}%`, backgroundColor: '#34C759' }]} />
              </View>
              <Text style={styles.progressLabel}>{stepsDone}/{stepsTotal} steps  {progressPct}%</Text>
            </View>
            {recommendations ? (
              <View style={styles.recoCard}>
                <Text style={styles.recoTitle}>AI Recommendations</Text>
                <Text style={styles.recoText}>{recommendations}</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.generateRecoBtn} onPress={async () => {
                try {
                  const rec = await apiFetch(`/api/goals/${encodeURIComponent(currentGoal.id)}/recommendations`);
                  setRecommendations(typeof rec?.recommendations === 'string' ? rec.recommendations : '');
                } catch {
                  Alert.alert('Error', 'Failed to load recommendations.');
                }
              }}>
                <Icon name="sparkles-outline" size={18} color="#fff" />
                <Text style={styles.generateRecoText}>Get AI Recommendations</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  stepItemDone: {
    opacity: 0.7,
  },
  stepCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  stepCheckDone: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  stepTitleDone: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  stepDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  stepDescDone: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop:25
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  goalHeader: {
    alignItems: 'center',
    width: '100%',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 30,
  },
  goalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  prioritySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
   insightProgress: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressBarBig: {
    height: 12,
    backgroundColor: '#F1F1F1',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFillBig: {
    height: '100%',
    borderRadius: 6,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A4A4A',
    textAlign: 'center',
  },

  recoCard: {
    backgroundColor: '#F8FAFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 16,
  },
  recoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  recoText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4A4A4A',
  },

  generateRecoBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateRecoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 8,
  },

});

export default GoalDetailScreen;
