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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../services/ApiService';
import { useUser } from '../../context/UserContext';
import { authStyles } from './styles/AuthStyles';
import { validateField } from './validationUtils';

const LoginScreen = ({ navigation, onLogin }) => {
  const { login: setUserContext } = useUser();
  const [userType, setUserType] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [loginError, setLoginError] = useState('');

  const validateSingleField = (fieldName, value) => {
    const result = validateField(fieldName, value);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: result.message
    }));
    return result.isValid;
  };

  const handleFieldChange = (fieldName, value) => {
    // Update field value
    if (fieldName === 'email') setEmail(value);
    else if (fieldName === 'password') setPassword(value);

    // Clear validation error if field is being edited and has content
    if (value && validationErrors[fieldName]) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleFieldBlur = (fieldName) => {
    if (fieldName === 'email') setEmailFocused(false);
    else if (fieldName === 'password') setPasswordFocused(false);

    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate field when blurred if it has content
    const value = fieldName === 'email' ? email : password;
    if (value) {
      validateSingleField(fieldName, value);
    }
  };

  const handleLogin = async () => {
    // Mark all fields as touched
    setTouchedFields({ email: true, password: true });

    // Validate all fields
    const emailValid = validateSingleField('email', email);
    const passwordValid = validateSingleField('password', password);

    if (!emailValid || !passwordValid) {
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting login with backend...');
      console.log('📧 Email:', email);
      console.log('👤 User Type:', userType);
      console.log('🔗 Backend URL: http://localhost:5000/api/auth/login');

      // Call ApiService to authenticate with Firebase backend
      const response = await ApiService.login({ email, password, userType });

      if (response.success) {
        console.log('✅ Login successful with Firebase backend');
        console.log('👤 User:', response.user.email);

        // Hydrate UserContext so downstream screens can access user immediately
        try {
          if (response.user && setUserContext) {
            await setUserContext(response.user);
          }
        } catch {}

        // Call the onLogin prop to handle successful login (for navigation)
        if (onLogin) {
          await onLogin(email, password, navigation);
        }

        setLoginError(''); // Clear any previous error
      } else {
        console.log('❌ Login failed');
        setLoginError('Invalid email or password. Please check your credentials and try again.');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Check for specific error types
      if (error.message.includes('registered as a')) {
        // User type mismatch error
        setLoginError(error.message);
      } else if (error.message.includes('403')) {
        setLoginError('Email not verified. Please check your email and verify your account before logging in.');
      } else {
        setLoginError(error.message || 'Login failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Implement Google login
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

        {/* Login Error Message */}
        {loginError ? (
          <View style={authStyles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#dc3545" style={{ marginRight: 8 }} />
            <Text style={authStyles.loginErrorText}>{loginError}</Text>
          </View>
        ) : null}

        {/* Login Form */}
        <View style={authStyles.form}>
          {/* Email Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Email</Text>
            <TextInput
              style={[
                authStyles.input,
                emailFocused && authStyles.inputFocused,
                validationErrors.email && touchedFields.email ? authStyles.inputError :
                (email && !validationErrors.email && touchedFields.email) ? authStyles.inputSuccess : authStyles.inputNeutral
              ]}
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => handleFieldChange('email', value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => handleFieldBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email && (
              <View style={authStyles.validationIcon}>
                <Ionicons
                  name={validationErrors.email && touchedFields.email ? 'close-circle' : 'checkmark-circle'}
                  size={20}
                  color={validationErrors.email && touchedFields.email ? '#dc3545' : '#28a745'}
                />
              </View>
            )}
            {validationErrors.email && touchedFields.email && (
              <Text style={authStyles.errorText}>{validationErrors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  authStyles.input,
                  passwordFocused && authStyles.inputFocused,
                  validationErrors.password && touchedFields.password ? authStyles.inputError :
                  (password && !validationErrors.password && touchedFields.password) ? authStyles.inputSuccess : authStyles.inputNeutral,
                  { paddingRight: 50 }
                ]}
                placeholder="Enter your password"
                value={password}
                onChangeText={(value) => handleFieldChange('password', value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => handleFieldBlur('password')}
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
            {password && (
              <View style={[authStyles.validationIcon, { right: 15 }]}>
                <Ionicons
                  name={validationErrors.password && touchedFields.password ? 'close-circle' : 'checkmark-circle'}
                  size={20}
                  color={validationErrors.password && touchedFields.password ? '#dc3545' : '#28a745'}
                />
              </View>
            )}
            {validationErrors.password && touchedFields.password && (
              <Text style={authStyles.errorText}>{validationErrors.password}</Text>
            )}
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
          <Image
            source={{ uri: 'https://accounts.google.com/favicon.ico' }}
            style={{ width: 24, height: 24, marginRight: 12 }}
            resizeMode="contain"
          />
          <Text style={authStyles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

       
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
