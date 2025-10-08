import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import GoalTrackerIndex from '../goal-tracker/index';
import AddGoal from '../goal-tracker/AddGoal';
import GoalDetail from '../goal-tracker/goal-detail';

import BlogIndex from '../blog/index';
import BlogDetailScreen from '../blog/BlogDetailScreen';

import HomeScreen from '../../feature/Medicine-treatment-management/HomeScreen';

const MainContent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedBlogPost, setSelectedBlogPost] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goalsRefreshTick, setGoalsRefreshTick] = useState(0);

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
    setGoalsRefreshTick((t) => t + 1);
    setCurrentScreen('home');
  };

  const handleGoalUpdated = (updatedOrId, action) => {
    setGoalsRefreshTick((t) => t + 1);
    if (action === 'delete') {
      setCurrentScreen('goal');
    }
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'blog') {
      setCurrentScreen('blog');
    } else if (tab === 'add') {
      setCurrentScreen('addGoal');
    } else {
      setCurrentScreen(tab);
    }
  };

  // Sync from route params when navigating here from global bottom nav
  React.useEffect(() => {
    const desiredTab = route?.params?.tab;
    if (desiredTab) {
      setActiveTab(desiredTab);
      if (desiredTab === 'home') setCurrentScreen('home');
      else if (desiredTab === 'blog') setCurrentScreen('blog');
      else if (desiredTab === 'add') setCurrentScreen('addGoal');
      else setCurrentScreen(desiredTab);
    }
  }, [route?.params?.tab]);

  const renderScreen = () => {
    console.log('Current screen:', currentScreen);

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
            post={selectedBlogPost}
            onGoBack={handleGoBackFromBlogDetail}
          />
        );
      case 'goalDetail':
        return (
          <GoalDetail
            goal={selectedGoal}
            onGoBack={handleGoBackFromGoalDetail}
            onGoalUpdate={handleGoalUpdated}
          />
        );
      default:
        break;
    }

    switch (activeTab) {
      case 'home':
        return <HomeScreen/>;
      case 'goal':
        return (
          <GoalTrackerIndex
            onNavigateToAddGoal={handleNavigateToAddGoal}
            onNavigateToGoalDetail={handleNavigateToGoalDetail}
            refreshSignal={goalsRefreshTick}
          />
        );
      case 'blog':
        return <BlogIndex onNavigateToBlogDetail={handleNavigateToBlogDetail} />;
      default:
        return <HomeScreen/>;
    }
  };

  return (
    <View style={[styles.container]}>
      {renderScreen()}
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

export default MainContent;
