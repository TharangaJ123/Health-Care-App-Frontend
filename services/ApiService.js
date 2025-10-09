import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api';

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
  static async logout() {
    try {
      // Clear all authentication and user data
      await AsyncStorage.multiRemove(['authToken', 'userData', 'user']);

      console.log('✅ All authentication data cleared from AsyncStorage');
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
