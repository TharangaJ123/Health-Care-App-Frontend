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
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { authStyles } from './styles/AuthStyles';

const SignupScreen = ({ navigation, onSignupSuccess }) => {
  const [userType, setUserType] = useState('patient');
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    occupation: '', // For doctors
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [loading, setLoading] = useState(false);

  const doctorOccupations = [
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Neurologist',
    'Pediatrician',
    'Psychiatrist',
    'Orthopedic Surgeon',
    'Gynecologist',
    'Ophthalmologist',
    'ENT Specialist',
    'Radiologist',
    'Anesthesiologist',
    'Emergency Medicine',
    'Internal Medicine',
    'Other',
  ];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { firstName, email, password, confirmPassword, phoneNumber, occupation } = formData;

    if (!firstName || !email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (userType === 'doctor' && !occupation) {
      Alert.alert('Error', 'Please select your medical occupation');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the onSignupSuccess prop to update the authentication state
      if (onSignupSuccess) {
        onSignupSuccess();
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      // TODO: Implement Google signup
      console.log('Google signup attempt for:', userType);
      Alert.alert('Info', 'Google signup will be implemented with proper configuration');
    } catch (error) {
      Alert.alert('Error', 'Google signup failed');
    }
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
          <Text style={authStyles.title}>Create Account</Text>
          <Text style={authStyles.subtitle}>Join our healthcare community</Text>
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

        {/* Signup Form */}
        <View style={authStyles.form}>
          {/* First Name Field */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Full Name</Text>
            <TextInput
              style={[
                authStyles.input,
                focusedField === 'firstName' && authStyles.inputFocused
              ]}
              placeholder="Your full name"
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField('')}
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Email</Text>
            <TextInput
              style={[
                authStyles.input,
                focusedField === 'email' && authStyles.inputFocused
              ]}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Phone Number</Text>
            <TextInput
              style={[
                authStyles.input,
                focusedField === 'phoneNumber' && authStyles.inputFocused
              ]}
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => updateFormData('phoneNumber', value)}
              onFocus={() => setFocusedField('phoneNumber')}
              onBlur={() => setFocusedField('')}
              keyboardType="phone-pad"
            />
          </View>

          {/* Doctor Occupation Field */}
          {userType === 'doctor' && (
            <View style={authStyles.inputContainer}>
              <Text style={authStyles.label}>Medical Occupation</Text>
              <View style={authStyles.picker}>
                <Picker
                  selectedValue={formData.occupation}
                  onValueChange={(value) => updateFormData('occupation', value)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Select your specialization" value="" />
                  {doctorOccupations.map((occupation, index) => (
                    <Picker.Item key={index} label={occupation} value={occupation} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* Password Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  authStyles.input,
                  focusedField === 'password' && authStyles.inputFocused,
                  { paddingRight: 50 }
                ]}
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
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

          {/* Confirm Password Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Confirm Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  authStyles.input,
                  focusedField === 'confirmPassword' && authStyles.inputFocused,
                  { paddingRight: 50 }
                ]}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField('')}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 14,
                }}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Signup Button */}
        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={authStyles.primaryButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={authStyles.divider}>
          <View style={authStyles.dividerLine} />
          <Text style={authStyles.dividerText}>or</Text>
          <View style={authStyles.dividerLine} />
        </View>

        {/* Google Signup Button */}
        <TouchableOpacity
          style={authStyles.googleButton}
          onPress={handleGoogleSignup}
        >
          <Ionicons name="logo-google" size={24} color="#4285f4" />
          <Text style={authStyles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>
            Already have an account?{' '}
            <Text 
              style={authStyles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;
