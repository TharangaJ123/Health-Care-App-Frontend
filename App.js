import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
function AuthStack({ onLogin }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login">
        {({ navigation }) => <LoginScreen navigation={navigation} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {({ navigation }) => <SignupScreen navigation={navigation} onSignupSuccess={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
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
              {() => <AuthStack onLogin={handleLogin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </HealthDataProvider>
  );
}
