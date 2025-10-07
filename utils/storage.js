import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  MEDICATIONS: '@medications',
  MEDICATION_SCHEDULE: '@medication_schedule',
  LAST_ID: '@last_id',
};

let lastId = 0;
const generateId = async () => {
  try {
    const storedId = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ID);
    lastId = storedId ? parseInt(storedId, 10) : 0;
    const newId = lastId + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ID, newId.toString());
    return newId;
  } catch (error) {
    return Date.now(); // Fallback to timestamp
  }
};

const saveMedication = async (medication) => {
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

const getMedications = async () => {
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

const getMedicationById = async (id) => {
  try {
    if (id === undefined || id === null) {
      console.error('Error: ID is undefined or null');
      return null;
    }
    
    const medications = await getMedications();
    // Convert both IDs to strings for comparison to avoid type issues
    const medication = medications.find(med => String(med.id) === String(id));
    
    if (!medication) {
      console.log(`No medication found with ID: ${id} (type: ${typeof id})`);
      console.log('Available medication IDs:', medications.map(m => ({ id: m.id, type: typeof m.id })));
    }
    
    return medication || null;
  } catch (error) {
    console.error('Error getting medication by ID:', error);
    return null;
  }
};

const updateMedication = async (id, updates) => {
  try {
    if (id === undefined || id === null) {
      throw new Error('Cannot update medication: ID is undefined or null');
    }
    
    const medications = await getMedications();
    
    // Find the medication by comparing string representations of IDs
    const index = medications.findIndex(med => String(med.id) === String(id));
    
    if (index === -1) {
      console.error(`Medication with ID ${id} (type: ${typeof id}) not found`);
      console.log('Available medication IDs:', medications.map(m => ({ id: m.id, type: typeof m.id })));
      throw new Error(`Medication with ID ${id} not found`);
    }
    
    const updatedMedication = {
      ...medications[index],
      ...updates,
      id: medications[index].id, // Keep the original ID to maintain consistency
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

const deleteMedication = async (id) => {
  try {
    if (id === undefined || id === null) {
      throw new Error('Cannot delete medication: ID is undefined or null');
    }
    
    const medications = await getMedications();
    const index = medications.findIndex(med => String(med.id) === String(id));
    
    if (index === -1) {
      console.log('Medication not found. ID:', id, 'Type:', typeof id);
      console.log('Available medication IDs:', medications.map(m => `${m.id} (${typeof m.id})`));
      throw new Error(`Medication with ID ${id} not found in database`);
    }
    
    // Create new array without the medication to delete
    const updatedMedications = [...medications];
    updatedMedications.splice(index, 1);
    
    // Save the updated medications list
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(updatedMedications));
    
    // Remove all schedule entries for this medication
    await removeScheduleEntriesForMedication(id);
    
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

const generateScheduleEntries = async (medication) => {
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

const getSchedule = async () => {
  try {
    const scheduleJson = await AsyncStorage.getItem(STORAGE_KEYS.MEDICATION_SCHEDULE);
    return scheduleJson ? JSON.parse(scheduleJson) : [];
  } catch (error) {
    console.error('Error getting schedule:', error);
    return [];
  }
};

const getMedicationsForDate = async (date) => {
  try {
    const [schedule, allMedications] = await Promise.all([
      getSchedule(),
      getMedications()
    ]);
    
    const filteredEntries = schedule.filter(entry => {
      const matches = entry.date === date;
      return matches;
    });
    
    const result = filteredEntries.map(entry => {
      const medication = allMedications.find(m => m.id === entry.medicationId);
      const resultEntry = {
        ...entry,
        name: medication ? medication.name : 'Unknown Medication',
        dosage: medication ? medication.dosage : null,
        instructions: medication ? medication.instructions : null
      };
      return resultEntry;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting medications for date:', error);
    return [];
  }
};

const updateStatus = async (scheduleId, status) => {
  try {
    const schedule = await getSchedule();
    
    const index = schedule.findIndex(entry => {
      const match = entry.id === scheduleId;
      return match;
    });
    
    if (index === -1) {
      console.error(`Schedule entry not found with ID: ${scheduleId}`);
      throw new Error(`Schedule entry not found with ID: ${scheduleId}`);
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

const removeScheduleEntriesForMedication = async (medicationId) => {
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
      await AsyncStorage.setItem(STORAGE_KEYS.MEDICATION_SCHEDULE, JSON.stringify(filteredSchedule));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error removing schedule entries:', error);
    throw error;
  }
};

const getAdherenceStats = async (startDate, endDate) => {
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

const getWeeklyAdherence = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    return await getAdherenceStats(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error getting weekly adherence:', error);
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

const getMonthlyAdherence = async () => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    
    return await getAdherenceStats(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]);
  } catch (error) {
    console.error('Error getting monthly adherence:', error);
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

const clearAllData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.MEDICATIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.MEDICATION_SCHEDULE);
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_ID);
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};

const clearSomeMedications = async () => {
  try {
    const medications = await getMedications();
    const keepMedications = medications.filter((_, index) => index % 2 === 0);
    await AsyncStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(keepMedications));
    return true;
  } catch (error) {
    console.error('Error clearing some medications:', error);
    return false;
  }
};

const exportData = async () => {
  try {
    const [medications, schedule] = await Promise.all([
      getMedications(),
      getSchedule()
    ]);
    
    return {
      medications,
      schedule,
      exportedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

const importData = async (data) => {
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

const addManualMedicationEntry = async (medicationId, date, time, status = 'taken') => {
  try {
    const schedule = await getSchedule();
    const entryId = await generateId();
    
    const newEntry = {
      id: entryId,
      medicationId,
      date,
      time,
      status,
      isManual: true,
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

export {
  // Medication CRUD
  saveMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  
  // Schedule management
  getSchedule,
  getMedicationsForDate,
  updateStatus,
  
  // Statistics
  getAdherenceStats,
  getWeeklyAdherence,
  getMonthlyAdherence,
  
  // Utility
  clearAllData,
  clearSomeMedications,
  exportData,
  importData,
  addManualMedicationEntry
};

export default {
  // Medication CRUD
  saveMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  
  // Schedule management
  getSchedule,
  getMedicationsForDate,
  updateStatus,
  
  // Statistics
  getAdherenceStats,
  getWeeklyAdherence,
  getMonthlyAdherence,
  
  // Utility
  clearAllData,
  clearSomeMedications,
  exportData,
  importData,
  addManualMedicationEntry
};
