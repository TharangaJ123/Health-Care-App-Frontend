import * as React from 'react';
import MainNavigator from './component/navigation/MainNavigator';
import { UserProvider } from './context/UserContext';
import { AuthProvider } from './context/AuthContext';
import { HealthDataProvider } from './context/HealthDataContext';

export default function App() {
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
