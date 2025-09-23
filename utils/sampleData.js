import { saveMedication, clearAllData } from './storage';

export const populateSampleData = async () => {
  try {
    // Clear existing data first
    await clearAllData();
    
    const sampleMedications = [
      {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'daily',
        times: ['9:00 AM', '9:00 PM'],
        startDate: new Date().toISOString().split('T')[0],
        endDate: null, // Ongoing
        instructions: 'Take with food',
        prescribedBy: 'Dr. Smith',
        category: 'Pain Relief',
        color: '#10B981',
        reminderEnabled: true,
        notes: 'For headaches and general pain relief',
      },
      {
        name: 'Vitamin D',
        dosage: '1000 IU',
        frequency: 'daily',
        times: ['6:00 PM'],
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        instructions: 'Take with largest meal',
        prescribedBy: 'Dr. Wilson',
        category: 'Vitamin',
        color: '#F59E0B',
        reminderEnabled: true,
        notes: 'Daily vitamin supplement',
      },
    ];

    // Save each medication
    for (const medication of sampleMedications) {
      await saveMedication(medication);
    }

    console.log('Sample data populated successfully');
    return true;
  } catch (error) {
    console.error('Error populating sample data:', error);
    throw error;
  }
};

export const getSampleMedicationCategories = () => {
  return [
    'Pain Relief',
    'Antibiotic',
    'Vitamin',
    'Supplement',
    'Diabetes',
    'Heart',
    'Blood Pressure',
    'Mental Health',
    'Allergy',
    'Other',
  ];
};

export const getSampleDoctors = () => {
  return [
    'Dr. Smith',
    'Dr. Johnson',
    'Dr. Wilson',
    'Dr. Brown',
    'Dr. Davis',
    'Dr. Miller',
    'Dr. Garcia',
    'Dr. Rodriguez',
    'Self',
  ];
};

export const getSampleFrequencies = () => {
  return [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'As Needed', value: 'as-needed' },
  ];
};

export const getSampleTimes = () => {
  return [
    '6:00 AM',
    '7:00 AM',
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
    '7:00 PM',
    '8:00 PM',
    '9:00 PM',
    '10:00 PM',
    '11:00 PM',
  ];
};

export const getMedicationColors = () => {
  return [
    '#10B981', // Green
    '#3B82F6', // Blue
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];
};
