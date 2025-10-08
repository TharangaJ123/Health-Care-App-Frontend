import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load authentication state from AsyncStorage on app start
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const isAuth = await ApiService.isAuthenticated();
        if (isAuth) {
          // Get user data from storage or API
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            setUser(JSON.parse(userData));
          }
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Save user data to AsyncStorage
  const saveUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const login = async (email, password, navigation) => {
    try {
      // Validate credentials
      if (!email || !password) {
        alert('Please enter both email and password');
        return false;
      }

      if (!email.includes('@')) {
        alert('Please enter a valid email address');
        return false;
      }

      const response = await ApiService.login({ email, password });

      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
        await saveUserData(response.user);
        return true;
      } else {
        alert(response.error || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your connection and try again.');
      return false;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await ApiService.register(userData);

      if (response.success) {
        console.log('✅ Signup successful - user registered in Firebase backend');
        // Registration only saves to Firebase, doesn't authenticate the user
        // User needs to login after registration to get authenticated
        return response;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Registration failed. Please try again.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
      setIsAuthenticated(false);
      setUser(null);
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};