import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = `https://sample-production-6d27.up.railway.app/api`;

class ApiService {
  // Email verification
  static async verifyEmail(uid) {
    try {
      const response = await this.makeRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ uid }),
      });

      if (response.success) {
        console.log('✅ Email verified successfully');
        return response;
      } else {
        throw new Error(response.error || 'Email verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  // Check email verification status
  static async checkEmailVerification(email) {
    try {
      const response = await this.makeRequest(`/auth/verify-email/${encodeURIComponent(email)}`, {
        method: 'GET',
      });

      if (response.success) {
        console.log('✅ Email verification status checked');
        return response;
      } else {
        throw new Error(response.error || 'Failed to check email verification status');
      }
    } catch (error) {
      console.error('Check email verification error:', error);
      throw error;
    }
  }

  // Helper function to get auth token
  static async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Helper function to make API requests with auth
  static async makeRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        // Throw error with the message from the server
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User registration
  static async register(userData) {
    try {
      const response = await this.makeRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success) {
        // Registration saves to Firebase backend only
        // No AsyncStorage storage during registration
        return response;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // User login
  static async login(credentials) {
    try {
      const response = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.success) {
        // Store auth token for future requests
        if (response.token) {
          await AsyncStorage.setItem('authToken', response.token);
          console.log('✅ Auth token stored in AsyncStorage');
        }

        // Store user data for immediate use
        if (response.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.user));
          // Also store under 'user' so UserContext can hydrate and goal API gets a userId
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
          console.log('✅ User data stored in AsyncStorage');
        }

        return response;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide specific error message for 403
      if (error.message.includes('403')) {
        throw new Error('Email not verified. Please check your email and verify your account before logging in.');
      }
      
      throw error;
    }
  }

  // Logout
  static async logout(currentUserData = null) {
    try {
      // Clear all authentication and user data
      await AsyncStorage.multiRemove(['authToken', 'userData', 'user']);

      // Clear all user-specific storage data from different storage systems
      let userId = null;

      // If currentUserData is provided, use it to get user ID
      if (currentUserData) {
        userId = currentUserData?.id || currentUserData?.uid || currentUserData?.email || currentUserData?.userId;
      } else {
        // Fallback: try to get user data before it's cleared
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          userId = user?.id || user?.uid || user?.email || user?.userId;
        }
      }

      if (userId && userId !== 'guest') {
        // Clear storage.js data (medication data)
        const storageKeys = [
          `@medications:${userId}`,
          `@medication_schedule:${userId}`,
          `@last_id:${userId}`
        ];
        await AsyncStorage.multiRemove(storageKeys);

        // Clear StorageService.js data
        const storageServiceKeys = [
          `medications:${userId}`,
          `medication_logs:${userId}`,
          `reminders:${userId}`,
          `user_preferences:${userId}`
        ];
        await AsyncStorage.multiRemove(storageServiceKeys);
      }

      console.log('✅ All authentication and user data cleared from AsyncStorage');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  static async isAuthenticated() {
    try {
      const token = await this.getAuthToken();
      return !!token;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }
}

export default ApiService;
