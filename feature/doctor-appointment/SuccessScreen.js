import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function SuccessScreen({ navigation, route }) {
  const { title = 'Success!', message = 'Operation completed successfully!', nextScreen = 'Home', nextScreenParams } = route.params;

  useEffect(() => {
    // Auto-navigate after 2 seconds
    const timer = setTimeout(() => {
      if (nextScreenParams) {
        navigation.navigate(nextScreen, nextScreenParams);
      } else {
        navigation.navigate(nextScreen);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation, nextScreen, nextScreenParams]);

  const handleContinue = () => {
    if (nextScreenParams) {
      navigation.navigate(nextScreen, nextScreenParams);
    } else {
      navigation.navigate(nextScreen);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <Text style={styles.autoText}>Auto-redirecting in 2 seconds...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 300,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  autoText: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
});
