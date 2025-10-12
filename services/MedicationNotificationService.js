import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configure notification channel for Android
async function configureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medication-reminders', {
      name: 'Medication Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }
}

// Initialize notifications
let isInitialized = false;
export async function initializeNotifications() {
  if (isInitialized) return;
  
  try {
    await configureNotificationChannel();
    await requestNotificationPermissions();
    isInitialized = true;
    console.log('Notifications initialized successfully');
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
  }
}

// Request notification permissions
async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications for medication reminders to work properly.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Convert time string (HH:MM AM/PM) to 24-hour format
function convertTo24Hour(time12h) {
  const [time, period] = time12h.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return { hours, minutes };
}

export const scheduleMedicationReminder = async (medication) => {
  try {
    if (!isInitialized) {
      await initializeNotifications();
    }

    // Cancel any existing notifications for this medication
    await cancelScheduledReminder(medication.id);

    // Use times array from medication data
    const reminderTimes = medication.times || [];
    
    if (reminderTimes.length === 0) {
      console.log('No reminder times specified for medication:', medication.name);
      return;
    }

    console.log(`Scheduling ${reminderTimes.length} reminders for ${medication.name}`);
    
    // Schedule each reminder time
    for (const timeStr of reminderTimes) {
      try {
        const { hours, minutes } = convertTo24Hour(timeStr);
        const now = new Date();
        const scheduledTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          0
        );

        // If the time has already passed today, schedule for tomorrow
        if (scheduledTime < now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 ${medication.name}`,
            body: `Time to take ${medication.dosage || 'your medication'}`,
            data: { 
              type: 'medication-reminder',
              medicationId: medication.id,
              medicationName: medication.name,
              time: timeStr
            },
            sound: 'default',
            priority: 'high',
          },
          trigger: {
            hour: scheduledTime.getHours(),
            minute: scheduledTime.getMinutes(),
            repeats: true,
          },
        });

        console.log(`Scheduled notification ${notificationId} for ${medication.name} at ${timeStr}`);
      } catch (error) {
        console.error(`Error scheduling notification for ${timeStr}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in scheduleMedicationReminder:', error);
    throw error;
  }
};

// Cancel all scheduled notifications for a specific medication
export const cancelScheduledReminder = async (medicationId) => {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notificationsToCancel = allNotifications.filter(
      notification => notification.content.data.medicationId === medicationId
    );
    
    for (const notification of notificationsToCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    
    console.log(`Cancelled ${notificationsToCancel.length} notifications for medication ${medicationId}`);
  } catch (error) {
    console.error('Error cancelling scheduled notifications:', error);
  }
};

// Initialize notifications when this module is imported
initializeNotifications().catch(console.error);

// Export for testing
export { convertTo24Hour };
