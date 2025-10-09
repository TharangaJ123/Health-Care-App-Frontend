import * as React from 'react';
import MainNavigator from './component/navigation/MainNavigator';
import { UserProvider } from './context/UserContext';
import { HealthDataProvider } from './context/HealthDataContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <HealthDataProvider>
        <UserProvider>
          <MainNavigator />
        </UserProvider>
      </HealthDataProvider>
    </AuthProvider>
  );
}
