import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import GoalTrackerIndex from '../goal-tracker/index';
import AddGoal from '../goal-tracker/AddGoal';
import GoalDetail from '../goal-tracker/goal-detail';

import BlogIndex from '../blog/index';
import BlogDetailScreen from '../blog/BlogDetailScreen';

import BottomNav from './BottomNav';

import { Home } from 'lucide-react';

const MainNavigator = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedBlogPost, setSelectedBlogPost] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const handleNavigateToAddGoal = () => {
    setCurrentScreen('addGoal');
  };

  const handleGoBackFromAddGoal = () => {
    setCurrentScreen('home');
  };

  const handleNavigateToBlogDetail = (post) => {
    setSelectedBlogPost(post);
    setCurrentScreen('blogDetail');
  };

  const handleGoBackFromBlogDetail = () => {
    setSelectedBlogPost(null);
    setCurrentScreen('blog');
  };

  const handleNavigateToGoalDetail = (goal) => {
    setSelectedGoal(goal);
    setCurrentScreen('goalDetail');
  };

  const handleGoBackFromGoalDetail = () => {
    setSelectedGoal(null);
    setCurrentScreen('goal');
  };

  const handleAddGoal = (newGoal) => {
    console.log('New goal added:', newGoal);
    setCurrentScreen('home');
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'blog') {
      setCurrentScreen('blog');
    } else {
      setCurrentScreen(tab);
    }
  };

  const renderScreen = () => {
    console.log('Current screen:', currentScreen); // Debug log
    
    switch (currentScreen) {
      case 'addGoal':
        return (
          <AddGoal 
            onGoBack={handleGoBackFromAddGoal}
            onAddGoal={handleAddGoal}
          />
        );
      case 'blogDetail':
        return (
          <BlogDetailScreen 
            post={selectedBlogPost} // This should be defined
            onGoBack={handleGoBackFromBlogDetail}
          />
        );
      case 'goalDetail':
        return (
          <GoalDetail 
            goal={selectedGoal}
            onGoBack={handleGoBackFromGoalDetail}
          />
        );
      default:
        break;
    }

    // Handle regular tab screens
    switch (activeTab) {
      case 'home':
        return <Home/>;
      case 'goal':
        return (
          <GoalTrackerIndex 
            onNavigateToAddGoal={handleNavigateToAddGoal}
            onNavigateToGoalDetail={handleNavigateToGoalDetail}
          />
        );
      case 'blog':
        return (
          <BlogIndex 
            onNavigateToBlogDetail={handleNavigateToBlogDetail} 
          />
        );
      default:
        return <Home/>;
    }
  };

  const shouldShowBottomNav = !['addGoal', 'blogDetail', 'goalDetail'].includes(currentScreen);

  return (
    <View style={styles.container}>
      {renderScreen()}
      {shouldShowBottomNav && (
        <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  profileText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default MainNavigator;