import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, StatusBar } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import { requestNotificationPermissions, handleNotificationResponse } from './services/NotificationService';

// Import screens
import SplashScreen from './screens/Medicine-Treatment-management/SplashScreen';
import OnboardingScreen from './screens/Medicine-Treatment-management/OnboardingScreen';
import HomeScreen from './screens/Medicine-Treatment-management/HomeScreen';
import AddMedicationScreen from './screens/Medicine-Treatment-management/AddMedicationScreen';
import EditMedicationScreen from './screens/Medicine-Treatment-management/EditMedicationScreen';
import RemindersScreen from './screens/Medicine-Treatment-management/RemindersScreen';
import ReportsScreen from './screens/Medicine-Treatment-management/ReportsScreen';
import ProfileScreen from './screens/Medicine-Treatment-management/ProfileScreen';
import SettingsScreen from './screens/Medicine-Treatment-management/SettingsScreen';
import TrackerScreen from './screens/Medicine-Treatment-management/TrackerScreen';

const Stack = createNativeStackNavigator();

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  })
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  // Configure status bar and notifications
  useEffect(() => {
    // Status bar configuration
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#F3F4F6');
      StatusBar.setTranslucent(false);
    }

    // Notification setup
    requestNotificationPermissions();

    // This listener is called when a notification is received while the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // This listener is called when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <>
      <StatusBar />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Tracker" component={TrackerScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
