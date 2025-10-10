import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

// User Context
const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkStoredUser();
  }, []);

  const login = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      // Update in-memory state so consumers see the user immediately
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      // Only clear UserContext state - AuthContext handles the main logout
      setUser(null);
      console.log('✅ UserContext logout completed successfully');
    } catch (error) {
      console.error('Error during UserContext logout:', error);
      // Even if logout fails, we should still clear local state
      setUser(null);
      throw error;
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      await AsyncStorage.setItem('user', JSON.stringify(newUserData));
      // Keep context state in sync
      setUser(newUserData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };
  const value = { user, login, logout, updateUser, isLoading };

  return (
    <UserContext.Provider value={value}>
      {isLoading ? null : children}
    </UserContext.Provider>
  );
};