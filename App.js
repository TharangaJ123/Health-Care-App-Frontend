import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestNotificationPermissions, handleNotificationResponse, clearNonMedicationNotifications } from './services/NotificationService';
import { UserContext } from './context/UserContext';

// Import screens
import SplashScreen from './feature/Medicine-treatment-management/SplashScreen';
import OnboardingScreen from './feature/Medicine-treatment-management/OnboardingScreen';
import LoginScreen from './feature/auth/LoginScreen';
import SignupScreen from './feature/auth/SignupScreen';
// Import HomeScreen component using default import
import HomeScreen from './feature/Medicine-treatment-management/HomeScreen';
import AddMedicationScreen from './feature/Medicine-treatment-management/AddMedicationScreen';
import EditMedicationScreen from './feature/Medicine-treatment-management/EditMedicationScreen';
import RemindersScreen from './feature/Medicine-treatment-management/RemindersScreen';
import ReportsScreen from './feature/Medicine-treatment-management/ReportsScreen';
import ProfileScreen from './feature/Medicine-treatment-management/ProfileScreen';
import SettingsScreen from './feature/Medicine-treatment-management/SettingsScreen';
import TrackerScreen from './feature/Medicine-treatment-management/TrackerScreen';
import DashboardScreen from './feature/healthmonitoring/DashboardScreen';

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

// Root App component with navigation container and stacks
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Request notification permissions and set response handler
    requestNotificationPermissions();
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Clean up non-medication notifications on app start
    clearNonMedicationNotifications();

    // Check for stored user data
    checkStoredUser();

    return () => subscription.remove();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking stored user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen key="splash" name="Splash" component={SplashScreen} />
          <Stack.Screen key="onboarding" name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen key="login" name="Login" component={LoginScreen} />
          <Stack.Screen key="signup" name="Signup" component={SignupScreen} />
          <Stack.Screen key="home" name="Home" component={HomeScreen} />
          <Stack.Screen key="appointments" name="Appointments" component={AppointmentsScreen} />
          <Stack.Screen key="health" name="Health" component={HealthScreen} />
          <Stack.Screen key="profile" name="Profile" component={ProfileScreen} />
          <Stack.Screen key="more" name="More" component={MoreScreen} />
          <Stack.Screen key="addMedication" name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen key="editMedication" name="EditMedication" component={EditMedicationScreen} />
          <Stack.Screen key="reminders" name="Reminders" component={RemindersScreen} />
          <Stack.Screen key="reports" name="Reports" component={ReportsScreen} />
          <Stack.Screen key="settings" name="Settings" component={SettingsScreen} />
          <Stack.Screen key="tracker" name="Tracker" component={TrackerScreen} />
          <Stack.Screen key="dashboard" name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserContext.Provider>
  );
};

const styles = StyleSheet.create({});

export default App;