import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

const GoalDetailScreen = ({ route, navigation, goal, onGoBack, onGoalUpdate }) => {
  // If using navigation params (comment out if using direct props)
  // const { goal } = route.params;
  
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
    notes: 'Use the calm app for guided meditation'
  });

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

  const toggleCompletion = () => {
    const updatedGoal = {
      ...currentGoal,
      completed: !currentGoal.completed,
      completedAt: !currentGoal.completed ? new Date().toISOString() : null
    };
    
    setCurrentGoal(updatedGoal);
    
    if (onGoalUpdate) {
      onGoalUpdate(updatedGoal);
    }
    
    Alert.alert(
      currentGoal.completed ? 'Goal Reactivated' : 'Goal Completed!',
      currentGoal.completed ? 'Goal marked as incomplete' : 'Congratulations on completing your goal!',
      [{ text: 'OK' }]
    );
  };

  const handleEdit = () => {
    Alert.alert('Edit Goal', 'Edit functionality would open here');
    // navigation.navigate('EditGoal', { goal: currentGoal });
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
          onPress: () => {
            if (onGoalUpdate) {
              onGoalUpdate(currentGoal.id, 'delete');
            }
            onGoBack();
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

  const handleAddNote = () => {
    Alert.prompt(
      'Add Note',
      'Enter your note:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save', 
          onPress: (note) => {
            if (note) {
              const updatedGoal = {
                ...currentGoal,
                notes: note
              };
              setCurrentGoal(updatedGoal);
              if (onGoalUpdate) {
                onGoalUpdate(updatedGoal);
              }
            }
          }
        }
      ],
      'plain-text',
      currentGoal.notes || ''
    );
  };

  const ProgressCircle = ({ completed, size = 100 }) => {
    return (
      <View style={[styles.progressCircle, { width: size, height: size }]}>
        <Ionicons 
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
        <Ionicons name={icon} size={20} color={color} />
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
          <Ionicons name="chevron-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={22} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Goal Header Section */}
        <View style={styles.headerSection}>
          <ProgressCircle completed={currentGoal.completed} />
          
          <View style={styles.goalHeader}>
            <View style={styles.typeBadge}>
              <Ionicons 
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
            <Ionicons name="flag-outline" size={16} color="#fff" />
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

        {/* Notes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <TouchableOpacity onPress={handleAddNote}>
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {currentGoal.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{currentGoal.notes}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.addNotesButton} onPress={handleAddNote}>
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addNotesText}>Add notes to this goal</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders</Text>
          <View style={styles.remindersList}>
            {currentGoal.reminders ? (
              currentGoal.reminders.map((reminder, index) => (
                <View key={index} style={styles.reminderItem}>
                  <Ionicons name="notifications-outline" size={16} color="#007AFF" />
                  <Text style={styles.reminderText}>{reminder}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noRemindersText}>No reminders set</Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              currentGoal.completed ? styles.completeButtonActive : styles.completeButton
            ]}
            onPress={toggleCompletion}
          >
            <Ionicons 
              name={currentGoal.completed ? "refresh" : "checkmark"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {currentGoal.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
            </Text>
          </TouchableOpacity>
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
  notesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addNotesText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  remindersList: {
    marginTop: 8,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reminderText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  noRemindersText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  actionSection: {
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completeButton: {
    backgroundColor: '#007AFF',
  },
  completeButtonActive: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});

export default GoalDetailScreen;