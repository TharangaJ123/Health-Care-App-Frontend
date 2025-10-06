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

  const handleLogin = (email, password, navigation) => {
    // Validate credentials
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // For demo purposes, check against registered users or use basic validation
    const userExists = registeredUsers.some(user => user.email === email && user.password === password);

    if (userExists || (email === 'demo@example.com' && password === 'password123')) {
      setIsAuthenticated(true);
      return true;
    } else {
      // Show enhanced alert with navigation option
      Alert.alert(
        'Invalid Credentials',
        'The email or password you entered is not valid. Please check your credentials and try again, or create a new account if you don\'t have one.',
        [
          {
            text: 'Try Again',
            style: 'cancel',
          },
          {
            text: 'Create Account',
            onPress: () => {
              if (navigation) {
                navigation.navigate('Signup');
              }
            }
          }
        ]
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
