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
  Modal,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authStyles } from './styles/AuthStyles';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual password reset logic here
      console.log('Password reset request for:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowSuccessModal(true);
      setEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
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
        {/* Back Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            left: -13,
            zIndex: 1,
            padding: 10,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {/* Header */}
        <View style={authStyles.header}>
          <Text style={authStyles.title}>Forgot Password?</Text>
          <Text style={[authStyles.subtitle, { textAlign: 'left', marginHorizontal: 20 }]}>
            Don't worry! Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        {/* Email Input Form */}
        <View style={authStyles.form}>
          <View style={authStyles.inputContainer}>
            <Text style={authStyles.label}>Email Address</Text>
            <TextInput
              style={[
                authStyles.input,
                emailFocused && authStyles.inputFocused
              ]}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity
          style={authStyles.primaryButton}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={authStyles.primaryButtonText}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>
            Remember your password?{' '}
            <Text 
              style={authStyles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              Sign In
            </Text>
          </Text>
        </View>

        {/* Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSuccessModal}
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={[styles.modalIcon, { backgroundColor: '#28a745' }]}>
                <Ionicons name="checkmark" size={40} color="#fff" />
              </View>
              <Text style={styles.modalTitle}>Check Your Email</Text>
              <Text style={styles.modalText}>
                We've sent a password reset link to {email}. Please check your email and follow the instructions to reset your password.
              </Text>
              <TouchableOpacity
                style={[authStyles.primaryButton, { marginTop: 20, width: '100%' }]}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={authStyles.primaryButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
});

export default ForgotPasswordScreen;
