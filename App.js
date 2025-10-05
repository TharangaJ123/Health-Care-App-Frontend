import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import { requestNotificationPermissions, handleNotificationResponse } from './services/NotificationService';

// Import screens
import SplashScreen from './screens/Medicine-Treatment-management/SplashScreen';
import OnboardingScreen from './screens/Medicine-Treatment-management/OnboardingScreen';
// Import HomeScreen component using default import
import HomeScreen from './screens/Medicine-Treatment-management/HomeScreen';
import AddMedicationScreen from './screens/Medicine-Treatment-management/AddMedicationScreen';
import EditMedicationScreen from './screens/Medicine-Treatment-management/EditMedicationScreen';
import RemindersScreen from './screens/Medicine-Treatment-management/RemindersScreen';
import ReportsScreen from './screens/Medicine-Treatment-management/ReportsScreen';
import ProfileScreen from './screens/Medicine-Treatment-management/ProfileScreen';
import SettingsScreen from './screens/Medicine-Treatment-management/SettingsScreen';
import TrackerScreen from './screens/Medicine-Treatment-management/TrackerScreen';

// Create placeholder components for missing screens
const AppointmentsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Appointments Screen</Text>
  </View>
);

const HealthScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Health Screen</Text>
  </View>
);

const MoreScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>More Screen</Text>
  </View>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tabs Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Home') {
            return (
              <View style={styles.tabIconContainer}>
                <Ionicons 
                  name={focused ? 'home' : 'home-outline'} 
                  size={24} 
                  color={focused ? '#4A6CF7' : '#94A3B8'} 
                />
                {focused && <View style={styles.activeTabIndicator} />}
              </View>
            );
          } else if (route.name === 'Appointments') {
            return (
              <View style={styles.tabIconContainer}>
                <MaterialIcons 
                  name="event-note" 
                  size={24} 
                  color={focused ? '#4A6CF7' : '#94A3B8'} 
                />
                {focused && <View style={styles.activeTabIndicator} />}
              </View>
            );
          } else if (route.name === 'Health') {
            return (
              <View style={styles.tabIconContainer}>
                <FontAwesome5 
                  name="heartbeat" 
                  size={24} 
                  color={focused ? '#4A6CF7' : '#94A3B8'} 
                />
                {focused && <View style={styles.activeTabIndicator} />}
              </View>
            );
          } else if (route.name === 'Profile') {
            return (
              <View style={styles.tabIconContainer}>
                <Ionicons 
                  name={focused ? 'person' : 'person-outline'} 
                  size={24} 
                  color={focused ? '#4A6CF7' : '#94A3B8'} 
                />
                {focused && <View style={styles.activeTabIndicator} />}
              </View>
            );
          } else if (route.name === 'More') {
            return (
              <View style={styles.tabIconContainer}>
                <MaterialCommunityIcons 
                  name="dots-horizontal" 
                  size={28} 
                  color={focused ? '#4A6CF7' : '#94A3B8'} 
                />
                {focused && <View style={styles.activeTabIndicator} />}
              </View>
            );
          }
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: '#FFFFFF',
        },
        tabBarStyle: {
          height: 60,
          paddingTop: 5,
          paddingBottom: 5,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsScreen} 
        options={{
          title: 'Appointments',
        }}
      />
      <Tab.Screen 
        name="Health" 
        component={HealthScreen} 
        options={{
          title: 'Health',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile',
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen} 
        options={{
          title: 'More',
        }}
      />
    </Tab.Navigator>
  );
};

// Root App component with navigation container and stacks
const App = () => {
  useEffect(() => {
    // Request notification permissions and set response handler
    requestNotificationPermissions();
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );
    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
        <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Tracker" component={TrackerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A6CF7'
  }
});

export default App;
