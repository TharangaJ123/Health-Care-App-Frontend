import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { schedulePushNotification } from '../utils/notifications';

// Configure how notifications should be displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // Only show notifications for medication reminders
    if (data && data.type === 'medication-reminder') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    } else {
      // Don't show notifications for other types
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }
  },
  handleNotificationResponse: async (response) => {
    const { notification } = response;
    const data = notification.request.content.data;

    // Only handle medication reminder notifications
    if (data && data.type === 'medication-reminder') {
      console.log('Handling medication reminder notification response:', data);
      // The app will handle navigation based on the medicationId in the data
    } else {
      console.log('Ignoring non-medication notification:', data?.type);
    }
  },
});

export const scheduleMedicationReminder = async (medication) => {
  // Cancel any existing notifications for this medication
  await cancelScheduledReminder(medication.id);

  // Use times array from medication data, fallback to reminderTimes for backward compatibility
  const reminderTimes = medication.times || medication.reminderTimes || [];
  
  if (reminderTimes.length === 0) {
    console.log('No reminder times specified for medication:', medication.name);
    return;
  }

  // Helper: compute 15-minute pre-reminder slot, adjusting day if needed
  const PRE_REMINDER_MINUTES = 15; // configurable lead time
  const subtractMinutes = (hour, minute, minutesToSubtract) => {
    let total = hour * 60 + minute - minutesToSubtract;
    let dayOffset = 0;
    if (total < 0) {
      total = (24 * 60) + total; // wrap backwards
      dayOffset = -1; // previous day
    }
    const newHour = Math.floor(total / 60);
    const newMinute = total % 60;
    return { hour: newHour, minute: newMinute, dayOffset };
  };

  // Schedule new notifications for each reminder time
  for (const time of reminderTimes) {
    // Parse time string (e.g., "08:00 AM" or "08:00")
    let hours, minutes;
    if (time.includes('AM') || time.includes('PM')) {
      // Handle 12-hour format
      const [timePart, period] = time.split(' ');
      const [h, m] = timePart.split(':').map(Number);
      hours = period === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
      minutes = m;
    } else {
      // Handle 24-hour format
      [hours, minutes] = time.split(':').map(Number);
    }
    
    // Create notifications for each day of the week that the medication is scheduled
    const daysOfWeek = medication.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]; // Default to all days
    for (const day of daysOfWeek) {
      // On-time reminder
      const onTimeId = await schedulePushNotification(
        `med-${medication.id}-${day}-${time}-ontime`,
        {
          title: '💊 Time for Medication',
          body: `It's time to take ${medication.name}${medication.dosage ? ` (${medication.dosage})` : ''}`,
          data: { medicationId: medication.id, type: 'medication-reminder' },
        },
        {
          hour: hours,
          minute: minutes,
          weekday: day + 1, // 1-7, where 1 is Sunday
          repeats: true,
        }
      );

      // Pre-reminder (e.g., 15 minutes before). Adjust weekday if crosses previous day
      const pre = subtractMinutes(hours, minutes, PRE_REMINDER_MINUTES);
      const preWeekday = ((day + (pre.dayOffset === -1 ? -1 : 0)) + 7) % 7; // normalize 0-6
      const preId = await schedulePushNotification(
        `med-${medication.id}-${preWeekday}-${time}-pre${PRE_REMINDER_MINUTES}`,
        {
          title: '⏰ Upcoming Medication',
          body: `${medication.name}${medication.dosage ? ` (${medication.dosage})` : ''} in ${PRE_REMINDER_MINUTES} minutes`,
          data: { medicationId: medication.id, type: 'medication-reminder' },
        },
        {
          hour: pre.hour,
          minute: pre.minute,
          weekday: preWeekday + 1,
          repeats: true,
        }
      );

      console.log(`Scheduled on-time ${onTimeId} at ${hours}:${String(minutes).padStart(2,'0')} and pre-reminder ${preId} at ${pre.hour}:${String(pre.minute).padStart(2,'0')} for ${medication.name} on day ${day}`);
    }
  }
};

export const cancelScheduledReminder = async (medicationId) => {
  try {
    if (Platform.OS === 'web') {
      console.log('Skipping notification cancellation on web platform');
      return;
    }
    
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const notificationsToCancel = allNotifications.filter(
      notification => notification.content.data.medicationId === medicationId
    );
    
    for (const notification of notificationsToCancel) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    console.log(`Cancelled ${notificationsToCancel.length} notifications for medication ${medicationId}`);
  } catch (error) {
    console.warn('Error cancelling notifications:', error.message);
    // Continue with the update even if notification cancellation fails
  }
};

export const requestNotificationPermissions = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
};

export const clearNonMedicationNotifications = async () => {
  try {
    if (Platform.OS === 'web') {
      console.log('Skipping notification cleanup on web platform');
      return;
    }

    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const nonMedicationNotifications = allNotifications.filter(
      notification => !notification.content.data?.type || notification.content.data.type !== 'medication-reminder'
    );

    for (const notification of nonMedicationNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }

    console.log(`Cleared ${nonMedicationNotifications.length} non-medication notifications`);
    return nonMedicationNotifications.length;
  } catch (error) {
    console.warn('Error clearing non-medication notifications:', error.message);
    return 0;
  }
};