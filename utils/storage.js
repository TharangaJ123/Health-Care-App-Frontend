import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  MEDICATIONS: '@medications',
  MEDICATION_SCHEDULE: '@medication_schedule',
  LAST_ID: '@last_id',
};

// Helper function to generate unique IDs
const generateId = async () => {
  try {
    const lastId = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ID);
    const newId = lastId ? parseInt(lastId) + 1 : 1;
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ID, newId.toString());
    return newId;
  } catch (error) {
    console.error('Error generating ID:', error);
    return Date.now(); // Fallback to timestamp
  }
};

// Medication CRUD operations
export const saveMedication = async (medication) => {
  try {
    const medications = await getMedications();
    const id = await generateId();
    const newMedication = {
      id,
      ...medication,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    medications.push(newMedication);
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    
    // Generate schedule entries for this medication
    await generateScheduleEntries(newMedication);
    
    return newMedication;
  } catch (error) {
    console.error('Error saving medication:', error);
    throw error;
  }
};

export const getMedications = async () => {
  try {
    const medicationsJson = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATIONS);
    const medications = medicationsJson ? JSON.parse(medicationsJson) : [];
    // Ensure all IDs are numbers for consistency
    return medications.map(med => ({
      ...med,
      id: typeof med.id === 'string' ? parseInt(med.id, 10) : med.id
    }));
  } catch (error) {
    console.error('Error getting medications:', error);
    return [];
  }
};

export const getMedicationById = async (id) => {
  try {
    const medications = await getMedications();
    return medications.find(med => med.id === id);
  } catch (error) {
    console.error('Error getting medication by ID:', error);
    return null;
  }
};

export const updateMedication = async (id, updates) => {
  try {
    // Ensure ID is a number
    const medId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    const medications = await getMedications();
    const index = medications.findIndex(med => med.id === medId);
    
    if (index === -1) {
      throw new Error(`Medication with ID ${medId} not found`);
    }
    
    const updatedMedication = {
      ...medications[index],
      ...updates,
      id: medId, // Ensure ID remains consistent
      updatedAt: new Date().toISOString(),
    };
    
    medications[index] = updatedMedication;
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medications));
    
    // Regenerate schedule entries for updated medication
    await generateScheduleEntries(updatedMedication);
    
    return updatedMedication;
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

export const deleteMedication = async (id) => {
  try {
    if (id === undefined || id === null) {
      throw new Error('Cannot delete medication: ID is undefined or null');
    }
    
    console.log('Deleting medication with ID:', id, 'Type:', typeof id);
    const medications = await getMedications();
    
    // Convert ID to number if it's a string
    const idToCompare = typeof id === 'string' ? parseInt(id, 10) : id;
    
    // Filter out the medication to delete
    const filteredMedications = medications.filter(med => {
      // Get the medication ID, handling both string and number types
      const medId = med.id;
      
      // Compare as both numbers and strings to handle type mismatches
      return (
        medId !== id && 
        medId !== idToCompare &&
        String(medId) !== String(id) &&
        String(medId) !== String(idToCompare) &&
        (isNaN(medId) || medId != id) // Loose comparison for number-like strings
      );
    });
    
    // If no medication was removed
    if (filteredMedications.length === medications.length) {
      console.log('Medication not found. ID:', id, 'Type:', typeof id);
      console.log('Available medication IDs:', medications.map(m => `${m.id} (${typeof m.id})`));
      throw new Error(`Medication with ID ${id} not found in database`);
    }
    
    console.log(`Deleting medication. Before: ${medications.length}, After: ${filteredMedications.length}`);
    
    // Save the updated medications list
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(filteredMedications));
    
    // Remove all schedule entries for this medication
    console.log('Removing schedule entries for medication ID:', id);
    await removeScheduleEntriesForMedication(id);
    
    // If ID was a string, also try with the numeric version
    if (typeof id === 'string' && !isNaN(parseInt(id, 10))) {
      console.log('Also checking for numeric ID:', idToCompare);
      await removeScheduleEntriesForMedication(idToCompare);
    }
    
    console.log('Successfully deleted medication with ID:', id);
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

// Schedule management
export const generateScheduleEntries = async (medication) => {
  try {
    const schedule = await getSchedule();
    
    // Remove existing entries for this medication
    const filteredSchedule = schedule.filter(entry => entry.medicationId !== medication.id);
    
    const startDate = new Date(medication.startDate);
    const endDate = medication.endDate ? new Date(medication.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default 1 year
    
    const newEntries = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      // Generate entries based on frequency
      if (shouldTakeMedicationOnDate(medication, currentDate)) {
        for (const time of medication.times) {
          const entryId = await generateId();
          newEntries.push({
            id: entryId,
            medicationId: medication.id,
            date: currentDate.toISOString().split('T')[0],
            time: time,
            status: 'pending',
            createdAt: new Date().toISOString(),
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const updatedSchedule = [...filteredSchedule, ...newEntries];
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(updatedSchedule));
    
    return newEntries;
  } catch (error) {
    console.error('Error generating schedule entries:', error);
    throw error;
  }
};

const shouldTakeMedicationOnDate = (medication, date) => {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  switch (medication.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      // If daysOfWeek not specified, default to every day to avoid generating no entries
      if (!medication.daysOfWeek || medication.daysOfWeek.length === 0) {
        return true;
      }
      return medication.daysOfWeek.includes(dayOfWeek);
    case 'monthly':
      return date.getDate() === new Date(medication.startDate).getDate();
    case 'as-needed':
      return false; // Manual entries only
    default:
      return true;
  }
};

export const getSchedule = async () => {
  try {
    const scheduleJson = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_SCHEDULE);
    return scheduleJson ? JSON.parse(scheduleJson) : [];
  } catch (error) {
    console.error('Error getting schedule:', error);
    return [];
  }
};

export const getMedicationsForDate = async (date) => {
  try {
    const schedule = await getSchedule();
    return schedule.filter(entry => entry.date === date);
  } catch (error) {
    console.error('Error getting medications for date:', error);
    return [];
  }
};

export const updateStatus = async (scheduleId, status) => {
  try {
    const schedule = await getSchedule();
    const index = schedule.findIndex(entry => entry.id === scheduleId);
    
    if (index === -1) {
      throw new Error('Schedule entry not found');
    }
    
    schedule[index] = {
      ...schedule[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(schedule));
    
    return schedule[index];
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};

export const removeScheduleEntriesForMedication = async (medicationId) => {
  try {
    if (medicationId === undefined || medicationId === null) {
      console.warn('Attempted to remove schedule entries with undefined/null medicationId');
      return false;
    }
    
    const schedule = await getSchedule();
    const filteredSchedule = schedule.filter(entry => {
      // Compare both as numbers and strings to ensure we catch all cases
      const entryMedId = entry.medicationId;
      return entryMedId !== medicationId && 
             String(entryMedId) !== String(medicationId);
    });
    
    if (schedule.length !== filteredSchedule.length) {
      console.log(`Removed ${schedule.length - filteredSchedule.length} schedule entries for medication ID:`, medicationId);
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(filteredSchedule));
      return true;
    }
    
    console.log('No schedule entries found for medication ID:', medicationId);
    return false;
  } catch (error) {
    console.error('Error removing schedule entries:', error);
    throw error;
  }
};

// Statistics and analytics
export const getAdherenceStats = async (startDate, endDate) => {
  try {
    const schedule = await getSchedule();
    const filteredEntries = schedule.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
    });
    
    const stats = {
      total: filteredEntries.length,
      taken: filteredEntries.filter(entry => entry.status === 'taken').length,
      missed: filteredEntries.filter(entry => entry.status === 'missed').length,
      skipped: filteredEntries.filter(entry => entry.status === 'skipped').length,
      pending: filteredEntries.filter(entry => entry.status === 'pending').length,
    };
    
    stats.adherenceRate = stats.total > 0 ? (stats.taken / (stats.total - stats.pending)) * 100 : 0;
    
    return stats;
  } catch (error) {
    console.error('Error getting adherence stats:', error);
    return {
      total: 0,
      taken: 0,
      missed: 0,
      skipped: 0,
      pending: 0,
      adherenceRate: 0,
    };
  }
};

export const getWeeklyAdherence = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    return await getAdherenceStats(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error getting weekly adherence:', error);
    return null;
  }
};

export const getMonthlyAdherence = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    return await getAdherenceStats(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error getting monthly adherence:', error);
    return null;
  }
};

// Utility functions
export const cleanupOrphanedSchedules = async () => {
  try {
    const medications = await getMedications();
    const schedule = await getSchedule();
    
    const medicationIds = new Set(medications.map(med => med.id));
    const validSchedule = schedule.filter(entry => medicationIds.has(entry.medicationId));
    
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(validSchedule));
    
    return schedule.length - validSchedule.length; // Return number of cleaned entries
  } catch (error) {
    console.error('Error cleaning up orphaned schedules:', error);
    throw error;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.MEDICATIONS,
      STORAGE_KEYS.MEDICATION_SCHEDULE,
      STORAGE_KEYS.LAST_ID,
    ]);
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

export const clearSomeMedications = async () => {
  try {
    const medications = await getMedications();
    // Keep only the first 2 medications, remove the rest
    const medicationsToKeep = medications.slice(0, 2);
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(medicationsToKeep));
    
    // Clean up orphaned schedule entries
    await cleanupOrphanedSchedules();
    
    console.log(`Cleared ${medications.length - medicationsToKeep.length} medications, kept ${medicationsToKeep.length}`);
    return true;
  } catch (error) {
    console.error('Error clearing some medications:', error);
    throw error;
  }
};

export const exportData = async () => {
  try {
    const medications = await getMedications();
    const schedule = await getSchedule();
    
    return {
      medications,
      schedule,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

export const importData = async (data) => {
  try {
    if (data.medications) {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(data.medications));
    }
    
    if (data.schedule) {
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(data.schedule));
    }
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};

// Add manual medication entry (for as-needed medications)
export const addManualMedicationEntry = async (medicationId, date, time, status = 'taken') => {
  try {
    const schedule = await getSchedule();
    const entryId = await generateId();
    
    const newEntry = {
      id: entryId,
      medicationId,
      date,
      time,
      status,
      manual: true,
      createdAt: new Date().toISOString(),
    };
    
    schedule.push(newEntry);
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(schedule));
    
    return newEntry;
  } catch (error) {
    console.error('Error adding manual medication entry:', error);
    throw error;
  }
};
