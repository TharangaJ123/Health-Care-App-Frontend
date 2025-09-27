import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';

const CalendarGoalsScreen = ({ onNavigateToAddGoal, onNavigateToGoalDetail }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [goals, setGoals] = useState([]);
  const [markedDates, setMarkedDates] = useState({});

  // Sample goals data
  const sampleGoals = [
    {
      id: '1',
      title: 'Morning Meditation',
      description: '15 minutes of mindfulness meditation',
      type: 'mental',
      date: new Date().toISOString().split('T')[0], // Today's date
      completed: true,
      time: '07:00 AM',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Gym Workout',
      description: 'Strength training session - Chest and Triceps',
      type: 'physical',
      date: new Date().toISOString().split('T')[0], // Today's date
      completed: false,
      time: '06:00 PM',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'Read Book',
      description: 'Read 30 pages of "Atomic Habits"',
      type: 'mental',
      date: '2024-01-21',
      completed: false,
      time: '09:00 PM',
      priority: 'low'
    },
    {
      id: '4',
      title: 'Meal Prep',
      description: 'Prepare healthy meals for the week',
      type: 'nutrition',
      date: '2024-01-22',
      completed: false,
      time: '10:00 AM',
      priority: 'high'
    },
    {
      id: '5',
      title: 'Yoga Session',
      description: '30 minutes of yoga for flexibility',
      type: 'physical',
      date: '2024-01-22',
      completed: false,
      time: '08:00 AM',
      priority: 'medium'
    },
    {
      id: '6',
      title: 'Journal Writing',
      description: 'Write daily reflections and gratitude',
      type: 'mental',
      date: '2024-01-23',
      completed: false,
      time: '08:30 PM',
      priority: 'low'
    },
    {
      id: '7',
      title: 'Cardio Exercise',
      description: '30 minutes of running or cycling',
      type: 'physical',
      date: '2024-01-24',
      completed: false,
      time: '07:00 AM',
      priority: 'high'
    },
  ];

  useEffect(() => {
    // Initialize with sample data
    setGoals(sampleGoals);
    updateMarkedDates(sampleGoals);
  }, []);

  const updateMarkedDates = (goalsList) => {
    const marks = {};
    
    // Mark dates that have goals
    goalsList.forEach(goal => {
      if (!marks[goal.date]) {
        marks[goal.date] = {
          marked: true,
          dotColor: getPriorityColor(goal.priority),
        };
      }
    });
    
    // Always mark selected date
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
      case 'mental': return 'brain-outline';
      case 'nutrition': return 'nutrition-outline';
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
          
          <Text style={styles.goalDescription}>{item.description}</Text>
          
          <View style={styles.goalMeta}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>
        
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={28} 
          color={item.completed ? "#4CD964" : "#C7C7CC"} 
        />
      </View>
    </TouchableOpacity>
  );

  const selectedDateGoals = getGoalsForSelectedDate();
  const completionStats = getCompletionStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals Calendar</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => onNavigateToAddGoal()}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

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
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.goalsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={80} color="#E5E7EB" />
              <Text style={styles.emptyStateTitle}>No goals for this date</Text>
              <Text style={styles.emptyStateText}>
                {selectedDate === new Date().toISOString().split('T')[0] 
                  ? "Add some goals for today to get started!" 
                  : "No goals scheduled for this date."
                }
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={onNavigateToAddGoal}
              >
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerButton: {
    padding: 4,
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