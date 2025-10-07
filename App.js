import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import { requestNotificationPermissions, handleNotificationResponse, clearNonMedicationNotifications } from './services/NotificationService';

// Import screens
import SplashScreen from './component/Medicine-Treatment-management/SplashScreen';
import OnboardingScreen from './component/Medicine-Treatment-management/OnboardingScreen';
// Import HomeScreen component using default import
import HomeScreen from './component/Medicine-Treatment-management/HomeScreen';
import AddMedicationScreen from './component/Medicine-Treatment-management/AddMedicationScreen';
import EditMedicationScreen from './component/Medicine-Treatment-management/EditMedicationScreen';
import RemindersScreen from './component/Medicine-Treatment-management/RemindersScreen';
import ReportsScreen from './component/Medicine-Treatment-management/ReportsScreen';
import ProfileScreen from './component/Medicine-Treatment-management/ProfileScreen';
import SettingsScreen from './component/Medicine-Treatment-management/SettingsScreen';
import TrackerScreen from './component/Medicine-Treatment-management/TrackerScreen';

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
  useEffect(() => {
    // Request notification permissions and set response handler
    requestNotificationPermissions();
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Clean up non-medication notifications on app start
    clearNonMedicationNotifications();

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen key="splash" name="Splash" component={SplashScreen} />
        <Stack.Screen key="onboarding" name="Onboarding" component={OnboardingScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({});

export default App;
