import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';
import LoginScreen from './feature/auth/LoginScreen';
import SignupScreen from './feature/auth/SignupScreen';
import ForgotPasswordScreen from './feature/auth/ForgotPasswordScreen';
import DashboardScreen from './feature/healthmonitoring/DashboardScreen';
import HealthDataInputScreen from './feature/healthmonitoring/HealthDataInputScreen';
import HealthDataHistoryScreen from './feature/healthmonitoring/HealthDataHistoryScreen';
import MonitorHealthScreen from './feature/healthmonitoring/MonitorHealthScreen';
import { HealthDataProvider } from './context/HealthDataContext';
import ApiService from './services/ApiService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Health Stack Navigator
function HealthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddHealthData" component={HealthDataInputScreen} />
      <Stack.Screen name="ViewDashboard" component={HealthDataHistoryScreen} />
      <Stack.Screen name="MonitorHealth" component={MonitorHealthScreen} />
    </Stack.Navigator>
  );
}

// Auth Stack
function AuthStack({ onLogin, onSignupSuccess }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => <LoginScreen navigation={navigation} onLogin={(email, password) => onLogin(email, password, navigation)} />}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {({ navigation }) => <SignupScreen navigation={navigation} onSignupSuccess={onSignupSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [registeredUsers, setRegisteredUsers] = React.useState([]);

  const handleLogin = async (email, password, navigation) => {
    try {
      console.log('🔐 Attempting login with Firebase backend...');
      console.log('📧 Email:', email);

      // Call the actual Firebase backend API
      const response = await ApiService.login({ email, password });

      if (response.success) {
        console.log('✅ Login successful!');
        console.log('👤 User:', response.user.email);

        // Set authentication state - this will trigger navigation to HealthApp
        setIsAuthenticated(true);

        // Store user data for the app to use
        console.log('🔄 Authentication state updated, navigation will switch to HealthApp');

        return true;
      } else {
        console.log('❌ Login failed:', response.error);

        // Show error message
        Alert.alert(
          'Login Failed',
          response.error || 'Invalid email or password. Please check your credentials and try again.',
          [{ text: 'OK' }]
        );

        return false;
      }

    } catch (error) {
      console.error('❌ Login error:', error);

      // Show error message
      Alert.alert(
        'Login Error',
        error.message || 'Failed to login. Please check your connection and try again.',
        [{ text: 'OK' }]
      );

      return false;
    }
  };

  const handleSignupSuccess = (userData) => {
    // Store the new user data for login validation
    if (userData) {
      setRegisteredUsers(prev => [...prev, userData]);
    }
    console.log('Signup successful - user data stored for login');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <HealthDataProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {isAuthenticated ? (
            <Stack.Screen name="HealthApp" component={HealthStack} />
          ) : (
            <Stack.Screen name="Auth">
              {() => <AuthStack onLogin={handleLogin} onSignupSuccess={handleSignupSuccess} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </HealthDataProvider>
  );
}
