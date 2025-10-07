import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './HomeScreen';
import DoctorAppointmentScreen from './feature/doctor-appointment/DoctorAppointmentScreen';
import MyAppointmentsScreen from './feature/doctor-appointment/MyAppointmentsScreen';
import CommunityScreen from './feature/community-medicine-support/CommunityScreen';
import DoctorProfileScreen from './feature/doctor-appointment/DoctorProfileScreen';
import DoctorDetailScreen from './feature/doctor-appointment/DoctorDetailScreen';
import EditDoctorScreen from './feature/doctor-appointment/EditDoctorScreen';
import SuccessScreen from './feature/doctor-appointment/SuccessScreen';
import IntroAnimationScreen from './feature/doctor-appointment/IntroAnimationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '500',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Healthcare' }}
        />
        <Stack.Screen 
          name="IntroAnimation" 
          component={IntroAnimationScreen}
          options={{ headerShown: false }}
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
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
