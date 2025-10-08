import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  MEDICATIONS: 'medications',
  MEDICATION_LOGS: 'medication_logs',
  REMINDERS: 'reminders',
  USER_PREFERENCES: 'user_preferences',
};

class StorageService {
  // Medications
  async saveMedications(medications) {
    try {
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(medications));
    } catch (error) {
      console.error('Error saving medications:', error);
    }
  }

  async getMedications() {
    try {
      const medications = await AsyncStorage.getItem(KEYS.MEDICATIONS);
      return medications ? JSON.parse(medications) : [];
    } catch (error) {
      console.error('Error getting medications:', error);
      return [];
    }
  }

  async addMedication(medication) {
    try {
      const medications = await this.getMedications();
      const newMedication = {
        ...medication,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      medications.push(newMedication);
      await this.saveMedications(medications);
      return newMedication;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  }

  async updateMedication(id, updates) {
    try {
      const medications = await this.getMedications();
      const index = medications.findIndex(med => med.id === id);
      if (index !== -1) {
        medications[index] = { ...medications[index], ...updates };
        await this.saveMedications(medications);
        return medications[index];
      }
      throw new Error('Medication not found');
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  async deleteMedication(id) {
    try {
      const medications = await this.getMedications();
      const filteredMedications = medications.filter(med => med.id !== id);
      await this.saveMedications(filteredMedications);
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  // Medication Logs
  async saveMedicationLogs(logs) {
    try {
      await AsyncStorage.setItem(KEYS.MEDICATION_LOGS, JSON.stringify(logs));
    } catch (error) {
      console.error('Error saving medication logs:', error);
    }
  }

  async getMedicationLogs() {
    try {
      const logs = await AsyncStorage.getItem(KEYS.MEDICATION_LOGS);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error getting medication logs:', error);
      return [];
    }
  }

  async addMedicationLog(log) {
    try {
      const logs = await this.getMedicationLogs();
      const newLog = {
        ...log,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      logs.push(newLog);
      await this.saveMedicationLogs(logs);
      return newLog;
    } catch (error) {
      console.error('Error adding medication log:', error);
      throw error;
    }
  }

  async getMedicationLogsByDate(date) {
    try {
      const logs = await this.getMedicationLogs();
      const targetDate = new Date(date).toDateString();
      return logs.filter(log => 
        new Date(log.timestamp).toDateString() === targetDate
      );
    } catch (error) {
      console.error('Error getting logs by date:', error);
      return [];
    }
  }

  async getMedicationLogsByDateRange(startDate, endDate) {
    try {
      const logs = await this.getMedicationLogs();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      return logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
    } catch (error) {
      console.error('Error getting logs by date range:', error);
      return [];
    }
  }

  // Reminders
  async saveReminders(reminders) {
    try {
      await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }

  async getReminders() {
    try {
      const reminders = await AsyncStorage.getItem(KEYS.REMINDERS);
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  async addReminder(reminder) {
    try {
      const reminders = await this.getReminders();
      const newReminder = {
        ...reminder,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      reminders.push(newReminder);
      await this.saveReminders(reminders);
      return newReminder;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  async updateReminder(id, updates) {
    try {
      const reminders = await this.getReminders();
      const index = reminders.findIndex(reminder => reminder.id === id);
      if (index !== -1) {
        reminders[index] = { ...reminders[index], ...updates };
        await this.saveReminders(reminders);
        return reminders[index];
      }
      throw new Error('Reminder not found');
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteReminder(id) {
    try {
      const reminders = await this.getReminders();
      const filteredReminders = reminders.filter(reminder => reminder.id !== id);
      await this.saveReminders(filteredReminders);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  // User Preferences
  async saveUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  async getUserPreferences() {
    try {
      const preferences = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
      return preferences ? JSON.parse(preferences) : {
        notifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
        reminderAdvanceTime: 15, // minutes
        theme: 'light',
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        notifications: true,
        soundEnabled: true,
        vibrationEnabled: true,
        reminderAdvanceTime: 15,
        theme: 'light',
      };
    }
  }

  // Analytics helpers
  async getAdherenceStats(startDate, endDate) {
    try {
      const logs = await this.getMedicationLogsByDateRange(startDate, endDate);
      const stats = logs.reduce(
        (acc, log) => {
          acc.total++;
          if (log.status === 'taken') acc.taken++;
          else if (log.status === 'missed') acc.missed++;
          else if (log.status === 'skipped') acc.skipped++;
          return acc;
        },
        { total: 0, taken: 0, missed: 0, skipped: 0 }
      );
      
      stats.adherencePercentage = stats.total > 0 
        ? Math.round((stats.taken / stats.total) * 100) 
        : 0;
      
      return stats;
    } catch (error) {
      console.error('Error getting adherence stats:', error);
      return { total: 0, taken: 0, missed: 0, skipped: 0, adherencePercentage: 0 };
    }
  }

  // Clear all data (for testing or reset)
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        KEYS.MEDICATIONS,
        KEYS.MEDICATION_LOGS,
        KEYS.REMINDERS,
        KEYS.USER_PREFERENCES,
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }
}

export default new StorageService();