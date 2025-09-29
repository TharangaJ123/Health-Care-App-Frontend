import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authStyles } from './styles/AuthStyles';

const LoginScreen = ({ navigation, onLogin }) => {
  const [userType, setUserType] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the onLogin prop to update the authentication state
      if (onLogin) {
        onLogin();
      }
      
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // TODO: Implement Google login
      console.log('Google login attempt for:', userType);
      Alert.alert('Info', 'Google login will be implemented with proper configuration');
    } catch (error) {
      Alert.alert('Error', 'Google login failed');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView 
      style={authStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={authStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={authStyles.header}>
          
          <Text style={authStyles.title}>Login</Text>
          <Text style={authStyles.subtitle}>Sign in to your account</Text>
        </View>

        {/* User Type Toggle */}
        <View style={authStyles.toggleContainer}>
          <TouchableOpacity
            style={[
              authStyles.toggleButton,
              userType === 'patient' ? authStyles.toggleButtonActive : authStyles.toggleButtonInactive,
              { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }
            ]}
            onPress={() => setUserType('patient')}
          >
            <Ionicons 
              name="person-outline" 
              size={20} 
              color={userType === 'patient' ? '#fff' : '#666'} 
              style={{ marginRight: 8 }}
            />
            <Text style={[
              authStyles.toggleText,
              userType === 'patient' ? authStyles.toggleTextActive : authStyles.toggleTextInactive
            ]}>
              Patient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              authStyles.toggleButton,
              userType === 'doctor' ? authStyles.toggleButtonActive : authStyles.toggleButtonInactive,
              { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }
            ]}
            onPress={() => setUserType('doctor')}
          >
            <Ionicons 
              name="medkit-outline" 
              size={20} 
              color={userType === 'doctor' ? '#fff' : '#666'}
              style={{ marginRight: 8 }}
            />
            <Text style={[
              authStyles.toggleText,
              userType === 'doctor' ? authStyles.toggleTextActive : authStyles.toggleTextInactive
            ]}>
              Doctor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        <View style={authStyles.form}>
          {/* Email Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Email</Text>
            <TextInput
              style={[
                authStyles.input,
                emailFocused && authStyles.inputFocused
              ]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  authStyles.input,
                  passwordFocused && authStyles.inputFocused,
                  { paddingRight: 50 }
                ]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 14,
                }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity 
            style={authStyles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={authStyles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={authStyles.primaryButtonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={authStyles.divider}>
          <View style={authStyles.dividerLine} />
          <Text style={authStyles.dividerText}>or</Text>
          <View style={authStyles.dividerLine} />
        </View>

        {/* Google Login Button */}
        <TouchableOpacity
          style={[authStyles.googleButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={handleGoogleLogin}
        >
          <View style={{ position: 'relative', width: 24, height: 24, marginRight: 12 }}>
            <Ionicons 
              name="logo-google" 
              size={24} 
              color="#EA4335" 
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
            <Ionicons 
              name="logo-google" 
              size={24} 
              color="#FBBC05" 
              style={{ position: 'absolute', top: 0, left: 0, opacity: 0.8 }}
            />
            <Ionicons 
              name="logo-google" 
              size={24} 
              color="#34A853" 
              style={{ position: 'absolute', top: 0, left: 0, opacity: 0.8 }}
            />
            <Ionicons 
              name="logo-google" 
              size={24} 
              color="#4285F4" 
              style={{ position: 'absolute', top: 0, left: 0, opacity: 0.8 }}
            />
          </View>
          <Text style={authStyles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>
            Don't have an account?{' '}
            <Text 
              style={authStyles.footerLink}
              onPress={() => navigation.navigate('Signup')}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
