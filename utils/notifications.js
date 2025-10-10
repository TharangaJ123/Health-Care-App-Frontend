import * as Notifications from 'expo-notifications';

// Schedule a local notification
// identifier: A unique string to identify this notification
// notification: { title, body, data }
// trigger: When to show the notification (Date, number, or object for recurring)
export const schedulePushNotification = async (identifier, notification, trigger) => {
  try {
    // Cancel any existing notification with the same identifier
    await Notifications.cancelScheduledNotificationAsync(identifier);
    
    // Schedule the new notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: 'default',
        priority: 'high',
      },
      trigger,
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

// Handle notification response when user taps on it
export const handleNotificationResponse = (response) => {
  const { data } = response.notification.request.content;
  
  // Handle different notification types
  if (data.type === 'medication-reminder') {
    console.log('Medication reminder tapped:', data.medicationId);
    // You can navigate to the medication details screen here if needed
    // navigation.navigate('MedicationDetails', { medicationId: data.medicationId });
  }
};

// Get the Expo push token for the current device
export const getPushToken = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
};