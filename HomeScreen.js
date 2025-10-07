import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Healthcare App</Text>
      <Text style={styles.subtitle}>Choose an option below</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DoctorAppointment')}
      >
        <Text style={styles.buttonText}>Book Appointment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('MyAppointments')}
      >
        <Text style={styles.buttonSecondaryText}>My Appointments</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('Community')}
      >
        <Text style={styles.buttonSecondaryText}>Community Support</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('IntroAnimation')}
      >
        <Text style={styles.buttonSecondaryText}>Doctor Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    marginBottom: 16,
  },
  buttonSecondaryText: {
    color: '#2196F3',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default HomeScreen;
