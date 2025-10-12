import * as Notifications from 'expo-notifications';
import { scheduleMedicationReminder } from '../services/NotificationService';

// Test function to verify notifications work
export const testMedicationNotification = async () => {
  try {
    // Get current time plus 10 seconds for testing
    const testTime = new Date(Date.now() + 10000);
    const hours = testTime.getHours();
    const minutes = testTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeString = `${formattedHours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    console.log(`Testing notification for ${timeString}`);

    await scheduleMedicationReminder({
      id: 'test-med-' + Date.now(),
      name: 'Test Medication',
      dosage: '1 pill',
      times: [timeString]
    });

    return { success: true, message: `Test notification scheduled for ${timeString}` };
  } catch (error) {
    console.error('Test notification failed:', error);
    return { success: false, message: error.message };
  }
};

// Function to check scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Function to cancel all notifications (for testing)
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { success: true, message: 'All notifications cancelled' };
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    return { success: false, message: error.message };
  }
};
