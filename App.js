import * as React from 'react';
import MainNavigator from './component/navigation/MainNavigator';
import { UserProvider } from './context/UserContext';
import { HealthDataProvider } from './context/HealthDataContext';

export default function App() {
  return (
    <HealthDataProvider>
      <UserProvider>
        <MainNavigator />
      </UserProvider>
    </HealthDataProvider>
  );
}
