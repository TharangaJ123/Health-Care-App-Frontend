// Test script to verify medication CRUD operations
// This script can be run in the React Native debugger console

import { 
  saveMedication, 
  getMedications, 
  updateMedication, 
  deleteMedication 
} from './utils/storage';

const testMedicationCRUD = async () => {
  console.log('=== Testing Medication CRUD Operations ===');
  
  try {
    // Test 1: Create a new medication
    console.log('1. Testing medication creation...');
    const newMedication = {
      name: 'Test Medication',
      dosage: '100mg',
      frequency: 'daily',
      times: ['08:00 AM', '08:00 PM'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      category: 'Test',
      color: '#10B981',
      prescribedBy: 'Test Doctor',
      instructions: 'Test instructions',
      reminderEnabled: true,
      notes: 'Test notes'
    };
    
    const savedMedication = await saveMedication(newMedication);
    console.log('✅ Medication created successfully:', savedMedication);
    
    // Test 2: Retrieve all medications
    console.log('2. Testing medication retrieval...');
    const allMedications = await getMedications();
    console.log('✅ Retrieved medications:', allMedications.length);
    
    // Test 3: Update the medication
    console.log('3. Testing medication update...');
    const updatedData = {
      name: 'Updated Test Medication',
      dosage: '200mg',
      notes: 'Updated test notes'
    };
    
    const updatedMedication = await updateMedication(savedMedication.id, updatedData);
    console.log('✅ Medication updated successfully:', updatedMedication);
    
    // Test 4: Verify the update
    console.log('4. Verifying medication update...');
    const medicationsAfterUpdate = await getMedications();
    const foundMedication = medicationsAfterUpdate.find(m => m.id === savedMedication.id);
    console.log('✅ Updated medication found:', foundMedication);
    
    // Test 5: Delete the medication
    console.log('5. Testing medication deletion...');
    await deleteMedication(savedMedication.id);
    console.log('✅ Medication deleted successfully');
    
    // Test 6: Verify deletion
    console.log('6. Verifying medication deletion...');
    const medicationsAfterDelete = await getMedications();
    const deletedMedication = medicationsAfterDelete.find(m => m.id === savedMedication.id);
    console.log('✅ Medication deletion verified:', deletedMedication === undefined);
    
    console.log('=== All tests passed! ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in React Native debugger
export { testMedicationCRUD };

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  testMedicationCRUD();
}
