import React, { createContext, useContext, useState } from 'react';

const HealthDataContext = createContext();

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};

export const HealthDataProvider = ({ children }) => {
  const [latestHealthData, setLatestHealthData] = useState(null);

  const [healthHistory, setHealthHistory] = useState([]);

  const getStatus = (metric, value) => {
    if (metric === 'heartRate') {
      if (value < 60) return 'low';
      if (value > 100) return 'high';
      return 'normal';
    } else if (metric === 'systolicBP') {
      if (value < 90) return 'low';
      if (value > 120) return 'high';
      return 'normal';
    } else if (metric === 'diastolicBP') {
      if (value < 60) return 'low';
      if (value > 80) return 'high';
      return 'normal';
    } else if (metric === 'spo2') {
      if (value < 91) return 'low';
      if (value < 95) return 'warning';
      return 'normal';
    } else if (metric === 'bloodGlucose') {
      if (value < 70) return 'low';
      if (value > 140) return 'high';
      return 'normal';
    }
    return 'normal';
  };

  const addHealthData = (newData) => {
    const timestamp = new Date().toISOString();
    const healthRecord = {
      id: Date.now().toString(),
      date: timestamp,
      heartRate: parseInt(newData.heartRate) || 0,
      systolicBP: parseInt(newData.systolicBP) || 0,
      diastolicBP: parseInt(newData.diastolicBP) || 0,
      spo2: parseInt(newData.spo2) || 0,
      bloodGlucose: parseInt(newData.bloodGlucose) || 0,
      notes: newData.notes || '',
    };

    // Add to history
    setHealthHistory(prev => [healthRecord, ...prev]);

    // Update latest data for dashboard
    const updatedLatest = {};
    
    if (newData.heartRate) {
      updatedLatest.heartRate = {
        value: parseInt(newData.heartRate),
        unit: 'bpm',
        status: getStatus('heartRate', parseInt(newData.heartRate)),
        lastUpdated: 'Just now'
      };
    }

    if (newData.systolicBP && newData.diastolicBP) {
      const systolicStatus = getStatus('systolicBP', parseInt(newData.systolicBP));
      const diastolicStatus = getStatus('diastolicBP', parseInt(newData.diastolicBP));
      
      // Determine overall status - prioritize 'low' or 'high' over 'normal'
      let overallStatus = 'normal';
      if (systolicStatus === 'low' || diastolicStatus === 'low') {
        overallStatus = 'low';
      } else if (systolicStatus === 'high' || diastolicStatus === 'high') {
        overallStatus = 'high';
      }
      
      updatedLatest.bloodPressure = {
        value: `${newData.systolicBP}/${newData.diastolicBP}`,
        unit: 'mmHg',
        status: overallStatus,
        lastUpdated: 'Just now',
        details: {
          systolic: { value: parseInt(newData.systolicBP), status: systolicStatus },
          diastolic: { value: parseInt(newData.diastolicBP), status: diastolicStatus }
        }
      };
    }

    if (newData.spo2) {
      updatedLatest.oxygenLevel = {
        value: parseInt(newData.spo2),
        unit: '%',
        status: getStatus('spo2', parseInt(newData.spo2)),
        lastUpdated: 'Just now'
      };
    }

    if (newData.bloodGlucose) {
      updatedLatest.bloodGlucose = {
        value: parseInt(newData.bloodGlucose),
        unit: 'mg/dL',
        status: getStatus('bloodGlucose', parseInt(newData.bloodGlucose)),
        lastUpdated: 'Just now'
      };
    }

    setLatestHealthData(prev => ({ ...prev, ...updatedLatest }));
  };

  const value = {
    latestHealthData,
    healthHistory,
    addHealthData,
    setLatestHealthData,
    setHealthHistory,
  };

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
};