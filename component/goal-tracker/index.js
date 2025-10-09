import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { apiFetch } from '../../config/api';
import { useUser } from '../../context/UserContext';
import AppHeader from '../common/AppHeader';

const CalendarGoalsScreen = ({ onNavigateToAddGoal, onNavigateToGoalDetail, refreshSignal }) => {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [goals, setGoals] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [actionsVisible, setActionsVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    loadGoals();
  }, [user]);

  useEffect(() => {
    if (typeof refreshSignal !== 'undefined') {
      loadGoals();
    }
  }, [refreshSignal]);

  const normalizeGoal = (g, idx) => ({
    id: g.id?.toString?.() || `${idx}`,
    title: g.title || g.name || 'Untitled Goal',
    description: g.description || '',
    type: g.type || 'other',
    date: g.date || g.startDate || new Date().toISOString().split('T')[0],
    completed: Boolean(g.completed || false),
    priority: g.priority || 'medium',
    reminders: Array.isArray(g.reminders) ? g.reminders : [],
    notificationIds: Array.isArray(g.notificationIds) ? g.notificationIds : [],
  });

  const loadGoals = async () => {
    try {
      if (!user) {
        console.warn('[Goals] No user in context; skipping fetch');
        setGoals([]);
        updateMarkedDates([]);
        return;
      }
      const userId = user.uid || user.email || user.id;
      const q = `?userId=${encodeURIComponent(userId)}`;
      const path = `/api/goals${q}`;
      const data = await apiFetch(path);
      console.log('[Goals] Fetched data:', data);
      const mapped = Array.isArray(data) ? data.map((g, i) => normalizeGoal(g, i)) : [];
      setGoals(mapped);
      updateMarkedDates(mapped);
    } catch (e) {
      console.error('[Goals] Fetch failed:', e?.message || e);
      setGoals([]);
      updateMarkedDates([]);
    }
  };
  const openActions = (goal) => {
    setSelectedGoal(goal);
    setActionsVisible(true);
  };
  const closeActions = () => {
    setActionsVisible(false);
    setSelectedGoal(null);
  };
  const confirmDeleteGoal = async () => {
    if (!selectedGoal) return;
    const goalId = selectedGoal.id;
    try {
      await apiFetch(`/api/goals/${encodeURIComponent(goalId)}`, { method: 'DELETE' });
    } catch {}
    setGoals((prev) => {
      const next = prev.filter(g => g.id !== goalId);
      updateMarkedDates(next);
      return next;
    });
    closeActions();
  };

  const updateMarkedDates = (goalsList) => {
    const marks = {};
    
    goalsList.forEach(goal => {
      if (!marks[goal.date]) {
        marks[goal.date] = {
          marked: true,
          dotColor: getPriorityColor(goal.priority),
        };
      }
    });
    
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: '#007AFF',
    };
    
    setMarkedDates(marks);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#4CD964';
      default: return '#007AFF';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'physical': return 'fitness-outline';
      case 'mental': return 'happy-outline';
      case 'nutrition': return 'restaurant-outline';
      default: return 'flag-outline';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'physical': return '#FF3B30';
      case 'mental': return '#5856D6';
      case 'nutrition': return '#34C759';
      default: return '#007AFF';
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
    updateMarkedDates(goals);
  };

  const toggleGoalCompletion = (goalId) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  const getGoalsForSelectedDate = () => {
    return goals.filter(goal => goal.date === selectedDate);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (dateString === today) {
      return 'Today';
    } else if (dateString === tomorrow) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getCompletionStats = () => {
    const dateGoals = getGoalsForSelectedDate();
    const completed = dateGoals.filter(goal => goal.completed).length;
    const total = dateGoals.length;
    return { completed, total };
  };

  const renderGoalItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.goalCard,
        item.completed && styles.completedGoalCard
      ]}
      onPress={() => onNavigateToGoalDetail && onNavigateToGoalDetail(item)}
    >
      <View style={styles.goalHeader}>
        <View style={[
          styles.typeIndicator,
          { backgroundColor: getTypeColor(item.type) }
        ]}>
          <Ionicons 
            name={getTypeIcon(item.type)} 
            size={20} 
            color="#fff" 
          />
        </View>
        
        <View style={styles.goalContent}>
          <View style={styles.goalTitleRow}>
            <Text style={[
              styles.goalTitle,
              item.completed && styles.completedGoalTitle
            ]}>
              {item.title}
            </Text>
            <View style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(item.priority) }
            ]}>
              <Text style={styles.priorityText}>
                {item.priority.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          
          <View style={styles.goalMeta}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.actionIcons}>
          <Ionicons 
            name={item.completed ? 'checkmark-circle' : 'ellipse-outline'} 
            size={28} 
            color={item.completed ? '#4CD964' : '#C7C7CC'} 
          />
          <TouchableOpacity
            style={styles.moreButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={(e) => {
              e.stopPropagation?.();
              openActions(item);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const selectedDateGoals = getGoalsForSelectedDate();
  const completionStats = getCompletionStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Actions Modal */}
      <Modal visible={actionsVisible} transparent animationType="slide" onRequestClose={closeActions}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.modalTitle}>{selectedGoal?.title || 'Goal options'}</Text>
              <Text style={styles.modalSubtitle}>Choose an action</Text>
            </View>
            <TouchableOpacity style={[styles.modalButton, styles.modalDelete]} onPress={confirmDeleteGoal}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.modalDeleteText}>Delete Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={closeActions}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Header */}
      <AppHeader
        title="AI TrackIt"
        subtitle="Dream • Plan • Conquer"
        rightIconName="add-circle-outline"
        onRightPress={() => onNavigateToAddGoal()}
        rightIconColor="#fff"
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#666',
              selectedDayBackgroundColor: '#007AFF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#007AFF',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#007AFF',
              selectedDotColor: '#ffffff',
              arrowColor: '#007AFF',
              monthTextColor: '#1a1a1a',
              textDayFontWeight: '400',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
            style={styles.calendar}
          />
        </View>

        {/* Selected Date Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.dateTitle}>{formatDate(selectedDate)}</Text>
              <Text style={styles.goalsSummary}>
                {completionStats.completed} of {completionStats.total} goals completed
              </Text>
            </View>
            <View style={styles.statsChip}>
              <Text style={styles.statsText}>
                {completionStats.total} goal{completionStats.total !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          {completionStats.total > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(completionStats.completed / completionStats.total) * 100}%`,
                      backgroundColor: completionStats.completed === completionStats.total ? '#4CD964' : '#007AFF'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((completionStats.completed / completionStats.total) * 100)}% Complete
              </Text>
            </View>
          )}
          
          {/* Goals List */}
          {selectedDateGoals.length > 0 ? (
            <FlatList
              data={selectedDateGoals}
              renderItem={renderGoalItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.goalsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={80} color="#E5E7EB" />
              <Text style={styles.emptyStateTitle}>No goals for this date</Text>
              <Text style={styles.emptyStateText}>
                {selectedDate === new Date().toISOString().split('T')[0]
                  ? 'Add some goals for today to get started!'
                  : 'No goals scheduled for this date.'}
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={onNavigateToAddGoal}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4A90E2',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  headerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  calendarSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  goalsSection: {
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
    marginBottom: 20,
    minHeight: 300,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  goalsSummary: {
    fontSize: 14,
    color: '#666',
  },
  statsChip: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  goalsList: {
    paddingBottom: 8,
  },
  goalCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  completedGoalCard: {
    backgroundColor: '#f0fff4',
    opacity: 0.9,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    padding: 6,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  modalDelete: {
    backgroundColor: '#175caaff',
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalCancelText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  typeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  completedGoalTitle: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  goalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  typeText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CalendarGoalsScreen;