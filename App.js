import * as React from 'react';
import MainNavigator from './component/navigation/MainNavigator';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import { HealthDataProvider } from './context/HealthDataContext';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) return null;

  return (
    <HealthDataProvider>
      <AuthProvider>
        <UserProvider>
          <MainNavigator />
        </UserProvider>
      </AuthProvider>
    </HealthDataProvider>
  );
}
