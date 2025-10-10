import React from 'react';
import { View, Text } from 'react-native';

let CustomCalendar;

// Try to import the Calendar component
try {
  const Calendar = require('react-native-calendars').default || require('react-native-calendars');
  
  // If we get here, the import was successful
  CustomCalendar = (props) => {
    try {
      return <Calendar {...props} />;
    } catch (error) {
      console.error('Error rendering Calendar:', error);
      return (
        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Text>Error rendering calendar</Text>
        </View>
      );
    }
  };
  
} catch (error) {
  console.error('Error loading Calendar component:', error);
  
  // Fallback component if Calendar can't be loaded
  CustomCalendar = () => (
    <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
      <Text>Calendar component could not be loaded</Text>
    </View>
  );
}

export default CustomCalendar;