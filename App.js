import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

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

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
        <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
        <Stack.Screen name="Reminders" component={RemindersScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Tracker" component={TrackerScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
