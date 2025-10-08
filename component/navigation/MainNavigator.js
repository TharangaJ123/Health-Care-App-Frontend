import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../../feature/Medicine-treatment-management/SplashScreen';
import OnboardingScreen from '../../feature/Medicine-treatment-management/OnboardingScreen';
import LoginScreen from '../../feature/auth/LoginScreen';
import SignupScreen from '../../feature/auth/SignupScreen';
import HomeScreen from '../../feature/Medicine-treatment-management/HomeScreen';
import AddMedicationScreen from '../../feature/Medicine-treatment-management/AddMedicationScreen';
import EditMedicationScreen from '../../feature/Medicine-treatment-management/EditMedicationScreen';
import RemindersScreen from '../../feature/Medicine-treatment-management/RemindersScreen';
import ReportsScreen from '../../feature/Medicine-treatment-management/ReportsScreen';
import ProfileScreen from '../../feature/Medicine-treatment-management/ProfileScreen';
import SettingsScreen from '../../feature/Medicine-treatment-management/SettingsScreen';
import TrackerScreen from '../../feature/Medicine-treatment-management/TrackerScreen';
import DashboardScreen from '../../feature/healthmonitoring/DashboardScreen';
import HealthDataInputScreen from '../../feature/healthmonitoring/HealthDataInputScreen';
import MonitorHealthScreen from '../../feature/healthmonitoring/MonitorHealthScreen';

import DoctorAppointmentScreen from '../../feature/doctor-appointment/DoctorAppointmentScreen';
import MyAppointmentsScreen from '../../feature/doctor-appointment/MyAppointmentsScreen';
import CommunityScreen from '../../feature/community-medicine-support/CommunityScreen';
import DoctorProfileScreen from '../../feature/doctor-appointment/DoctorProfileScreen';
import DoctorDetailScreen from '../../feature/doctor-appointment/DoctorDetailScreen';
import EditDoctorScreen from '../../feature/doctor-appointment/EditDoctorScreen';
import SuccessScreen from '../../feature/doctor-appointment/SuccessScreen';
import IntroAnimationScreen from '../../feature/doctor-appointment/IntroAnimationScreen';

import MainContent from './MainContent';
import BottomNav from './BottomNav';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  const navRef = useNavigationContainerRef();
  const [activeTab, setActiveTab] = React.useState('home');
  const [currentRouteName, setCurrentRouteName] = React.useState(null);

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    switch (tabId) {
      case 'home':
        navRef.navigate('Home');
        break;
      case 'goal':
        navRef.navigate('Main', { tab: 'goal' });
        break;
      case 'blog':
        navRef.navigate('Main', { tab: 'blog' });
        break;
      case 'add':
        navRef.navigate('Dashboard');
        break;
      case 'profile':
        navRef.navigate('Profile');
        break;
      default:
        break;
    }
  };

  const syncActiveFromRoute = () => {
    const route = navRef.getCurrentRoute?.();
    const name = route?.name;
    if (!name) return;
    setCurrentRouteName(name);
    if (name === 'Home') setActiveTab('home');
    else if (name === 'Dashboard') setActiveTab('add');
    else if (name === 'Profile') setActiveTab('profile');
    // When on Main, keep last chosen tab
  };

  const shouldShowBottomNav = React.useMemo(() => {
    if (!currentRouteName) return false;
    const hiddenRoutes = new Set(['Splash', 'Onboarding', 'Login', 'Signup']);
    return !hiddenRoutes.has(currentRouteName);
  }, [currentRouteName]);

  return (
    <View style={styles.root}>
      <NavigationContainer
        ref={navRef}
        onReady={syncActiveFromRoute}
        onStateChange={syncActiveFromRoute}
      >
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            contentStyle: { paddingBottom: shouldShowBottomNav ? 110 : 0 },
          }}
        >
          {/* Entry & Auth */}
          <Stack.Screen name="Splash" component={SplashScreen}  />
          <Stack.Screen name="Onboarding" component={OnboardingScreen}  />
          <Stack.Screen name="Login" component={LoginScreen}  />
          <Stack.Screen name="Signup" component={SignupScreen}  />

          {/* Main container with bottom tabs-like content */}
          <Stack.Screen name="Main" component={MainContent}  />

          {/* Core app screens */}
          
          <Stack.Screen name="AddMedication" component={AddMedicationScreen} />
          <Stack.Screen name="EditMedication" component={EditMedicationScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Tracker" component={TrackerScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AddHealthData" component={HealthDataInputScreen} />
          <Stack.Screen name="MonitorHealth" component={MonitorHealthScreen} />

          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Healthcare' }} />
          <Stack.Screen
            name="IntroAnimation"
            component={IntroAnimationScreen}
          />
          <Stack.Screen
            name="DoctorAppointment"
            component={DoctorAppointmentScreen}
            options={{ title: 'Book Appointment' }}
          />
          <Stack.Screen
            name="MyAppointments"
            component={MyAppointmentsScreen}
            options={{ title: 'My Appointments' }}
          />
          <Stack.Screen
            name="Community"
            component={CommunityScreen}
            options={{ title: 'Community Support' }}
          />
          <Stack.Screen
            name="DoctorProfile"
            component={DoctorProfileScreen}
            options={{ title: 'Doctor Profile' }}
          />
          <Stack.Screen
            name="DoctorDetail"
            component={DoctorDetailScreen}
            options={{ title: 'Doctor Details' }}
          />
          <Stack.Screen
            name="EditDoctor"
            component={EditDoctorScreen}
            options={{ title: 'Edit Doctor' }}
          />
          <Stack.Screen
            name="Success"
            component={SuccessScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Global bottom nav overlay (hidden on auth/onboarding screens) */}
      {shouldShowBottomNav && (
        <BottomNav activeTab={activeTab} onTabPress={handleTabPress} />
      )}
    </View>
  );
};

export default MainNavigator;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});