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
import { Picker } from '@react-native-picker/picker';
import Icon from '../../component/common/Icon';
import { authStyles } from './styles/AuthStyles';
import { validateField, validateForm } from './validationUtils';
import ApiService from '../../services/ApiService';

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
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

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

    // Clear validation error if field is being edited and has content
    if (value && validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleFieldBlur = (fieldName) => {
    setFocusedField('');

    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [fieldName]: true
    }));

    // Validate field when blurred if it has content
    if (formData[fieldName]) {
      const result = validateField(fieldName, formData[fieldName], formData);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: result.message
      }));
    }
  };

  const handleSignup = async () => {
    // Mark all fields as touched
    setTouchedFields({
      firstName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phoneNumber: true,
      occupation: userType === 'doctor'
    });

    // Validate form using utility function
    const validation = validateForm(formData, userType);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    setLoading(true);

    try {
      // Prepare user data for Firebase backend
      const userData = {
        email: formData.email,
        password: formData.password,
        name: formData.firstName, // Use firstName as name in backend
        phoneNumber: formData.phoneNumber,
        userType: userType,
        occupation: formData.occupation
      };

      console.log('🚀 Sending registration data to Firebase backend...');
      console.log('📧 Email:', userData.email);
      console.log('🔗 Backend URL: http://localhost:5000/api/auth/register');

      // Call ApiService to register user in Firebase backend
      const response = await ApiService.register(userData);

      console.log('✅ Registration successful!');
      console.log('📦 Response:', response);

      if (response.success) {
        // Call the onSignupSuccess prop to notify parent component
        if (onSignupSuccess) {
          onSignupSuccess(userData);
        }

        console.log('✅ Registration successful! Email verification sent.');

        // Navigate to Login page immediately
        navigation.navigate('Login');

        // Show success message with email verification info
        Alert.alert(
          'Registration Successful!',
          'Account created successfully! Please check your email and click the verification link before logging in.'
        );
      }

    } catch (error) {
      console.error('❌ Registration error:', error);

      let errorMessage = 'Failed to create account. Please try again.';
      if (error.message.includes('Email is already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      Alert.alert('Registration Failed', errorMessage);
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
            <Icon name="person-outline" size={20} color={userType === 'patient' ? '#fff' : '#666'} style={{ marginRight: 8 }} />
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
            <Icon name="medkit-outline" size={20} color={userType === 'doctor' ? '#fff' : '#666'} style={{ marginRight: 8 }} />
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
                focusedField === 'firstName' && authStyles.inputFocused,
                validationErrors.firstName && touchedFields.firstName ? authStyles.inputError :
                (formData.firstName && !validationErrors.firstName && touchedFields.firstName) ? authStyles.inputSuccess : authStyles.inputNeutral
              ]}
              placeholder="Your full name"
              value={formData.firstName}
              onChangeText={(value) => updateFormData('firstName', value)}
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => handleFieldBlur('firstName')}
              autoCapitalize="words"
            />
            {formData.firstName && (
              <View style={authStyles.validationIcon}>
                <Icon name={validationErrors.firstName && touchedFields.firstName ? 'close-circle' : 'checkmark-circle'} size={20} color={validationErrors.firstName && touchedFields.firstName ? '#dc3545' : '#28a745'} />
              </View>
            )}
            {validationErrors.firstName && touchedFields.firstName && (
              <Text style={authStyles.errorText}>{validationErrors.firstName}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Email</Text>
            <TextInput
              style={[
                authStyles.input,
                focusedField === 'email' && authStyles.inputFocused,
                validationErrors.email && touchedFields.email ? authStyles.inputError :
                (formData.email && !validationErrors.email && touchedFields.email) ? authStyles.inputSuccess : authStyles.inputNeutral
              ]}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => handleFieldBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {formData.email && (
              <View style={authStyles.validationIcon}>
                <Icon name={validationErrors.email && touchedFields.email ? 'close-circle' : 'checkmark-circle'} size={20} color={validationErrors.email && touchedFields.email ? '#dc3545' : '#28a745'} />
              </View>
            )}
            {validationErrors.email && touchedFields.email && (
              <Text style={authStyles.errorText}>{validationErrors.email}</Text>
            )}
          </View>

          {/* Phone Number Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Phone Number</Text>
            <TextInput
              style={[
                authStyles.input,
                focusedField === 'phoneNumber' && authStyles.inputFocused,
                validationErrors.phoneNumber && touchedFields.phoneNumber ? authStyles.inputError :
                (formData.phoneNumber && !validationErrors.phoneNumber && touchedFields.phoneNumber) ? authStyles.inputSuccess : authStyles.inputNeutral
              ]}
              placeholder="Enter your phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => updateFormData('phoneNumber', value)}
              onFocus={() => setFocusedField('phoneNumber')}
              onBlur={() => handleFieldBlur('phoneNumber')}
              keyboardType="phone-pad"
            />
            {formData.phoneNumber && (
              <View style={authStyles.validationIcon}>
                <Icon name={validationErrors.phoneNumber && touchedFields.phoneNumber ? 'close-circle' : 'checkmark-circle'} size={20} color={validationErrors.phoneNumber && touchedFields.phoneNumber ? '#dc3545' : '#28a745'} />
              </View>
            )}
            {validationErrors.phoneNumber && touchedFields.phoneNumber && (
              <Text style={authStyles.errorText}>{validationErrors.phoneNumber}</Text>
            )}
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
                  validationErrors.password && touchedFields.password ? authStyles.inputError :
                  (formData.password && !validationErrors.password && touchedFields.password) ? authStyles.inputSuccess : authStyles.inputNeutral,
                  { paddingRight: 50 }
                ]}
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                onFocus={() => setFocusedField('password')}
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
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {formData.password && (
              <View style={[authStyles.validationIcon, { right: 15 }]}>
                <Icon name={validationErrors.password && touchedFields.password ? 'close-circle' : 'checkmark-circle'} size={20} color={validationErrors.password && touchedFields.password ? '#dc3545' : '#28a745'} />
              </View>
            )}
            {validationErrors.password && touchedFields.password && (
              <Text style={authStyles.errorText}>{validationErrors.password}</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Confirm Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={[
                  authStyles.input,
                  focusedField === 'confirmPassword' && authStyles.inputFocused,
                  validationErrors.confirmPassword && touchedFields.confirmPassword ? authStyles.inputError :
                  (formData.confirmPassword && !validationErrors.confirmPassword && touchedFields.confirmPassword) ? authStyles.inputSuccess : authStyles.inputNeutral,
                  { paddingRight: 50 }
                ]}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => handleFieldBlur('confirmPassword')}
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
                <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {formData.confirmPassword && (
              <View style={[authStyles.validationIcon, { right: 15 }]}>
                <Icon name={validationErrors.confirmPassword && touchedFields.confirmPassword ? 'close-circle' : 'checkmark-circle'} size={20} color={validationErrors.confirmPassword && touchedFields.confirmPassword ? '#dc3545' : '#28a745'} />
              </View>
            )}
            {validationErrors.confirmPassword && touchedFields.confirmPassword && (
              <Text style={authStyles.errorText}>{validationErrors.confirmPassword}</Text>
            )}
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
          style={[authStyles.googleButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={handleGoogleSignup}
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
