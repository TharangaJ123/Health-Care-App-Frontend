import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import Icon from '../../component/common/Icon';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import StorageService from '../../services/StorageService';
import { getMedications, getWeeklyAdherence, getMonthlyAdherence } from '../../utils/storage';
import { theme } from '../../utils/theme';
import ScreenHeader from '../../component/common/ScreenHeader';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout: userLogout } = useUser();
  const { logout: authLogout } = useAuth();
  const { latestHealthData, healthHistory } = useHealthData();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    email: '',
    phone: '',
    emergencyContact: '',
    medicalConditions: '',
    allergies: '',
    doctor: '',
    pharmacy: '',
  });
  const [stats, setStats] = useState({
    medications: 0,
    daysActive: 0,
    adherence: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const loadProfile = async () => {
    try {
      // First try to get user data from context
      if (user) {
        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
        }));
      }

      // Then load additional profile data from storage
      const preferences = await StorageService.getUserPreferences();
      setProfile(prev => ({
        ...prev,
        ...preferences.profile,
        name: user?.name || preferences.profile?.name || '',
        email: user?.email || preferences.profile?.email || '',
      }));
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const groupLogsByDate = (logs) => {
    const map = new Map();
    (logs || []).forEach((log) => {
      const d = new Date(log?.timestamp || log?.date || Date.now()).toDateString();
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(log);
    });
    const days = Array.from(map.entries())
      .map(([date, entries]) => ({ date, entries }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return days;
  };

  const bundleToHtml = (bundle) => {
    const fmt = (v) => (typeof v === 'string' ? v : JSON.stringify(v));
    const medsRows = (bundle.medications || []).map((m, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${m.name || ''}</td>
        <td>${m.dosage || ''}</td>
        <td>${(m.times || []).join(', ')}</td>
        <td>${m.frequency || ''}</td>
      </tr>`).join('');
    const logsCount = (bundle.logs || []).length;
    const remindersCount = (bundle.reminders || []).length;

    const latest = bundle.latestHealthData || {};
    const latestRows = `
      <tr><td>Heart Rate</td><td>${fmt(latest.heartRate?.value ?? '--')} ${latest.heartRate?.unit || ''}</td><td>${fmt(latest.heartRate?.status || 'normal')}</td></tr>
      <tr><td>Blood Pressure</td><td>${fmt(latest.bloodPressure?.value ?? '--/--')} ${latest.bloodPressure?.unit || ''}</td><td>${fmt(latest.bloodPressure?.status || 'normal')}</td></tr>
      <tr><td>Oxygen Level</td><td>${fmt(latest.oxygenLevel?.value ?? '--')} ${latest.oxygenLevel?.unit || ''}</td><td>${fmt(latest.oxygenLevel?.status || 'normal')}</td></tr>
      <tr><td>Blood Glucose</td><td>${fmt(latest.bloodGlucose?.value ?? '--')} ${latest.bloodGlucose?.unit || ''}</td><td>${fmt(latest.bloodGlucose?.status || 'normal')}</td></tr>
    `;

    const histCount = (bundle.healthHistory || []).length;

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, Roboto, Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px; }
            h2 { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
            .meta { color: #555; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Health Data Export</h1>
          <div class="meta">Exported: ${bundle.exportedAt}</div>
          <div class="meta">User: ${fmt(bundle.user?.name)} (${fmt(bundle.user?.email)})</div>

          <h2>Quick Stats</h2>
          <div class="meta">Medications: ${bundle.stats?.medications || (bundle.medications || []).length}</div>
          <div class="meta">Logs: ${logsCount}</div>
          <div class="meta">Reminders: ${remindersCount}</div>
          <div class="meta">Adherence: ${bundle.stats?.adherence || 0}%</div>

          <h2>Latest Health Updates</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${latestRows}
            </tbody>
          </table>
          <div class="meta">History records: ${histCount}</div>

          <h2>Medications</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Dosage</th>
                <th>Times</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              ${medsRows || '<tr><td colspan="5">No medications</td></tr>'}
            </tbody>
          </table>

        </body>
      </html>`;
  };

  const exportHealthDataPdf = async () => {
    try {
      const bundle = await buildDataBundle();
      const html = bundleToHtml(bundle);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Health Data (PDF)' });
      } else {
        Alert.alert('PDF Ready', `File saved to: ${uri}`);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      Alert.alert('Export Failed', 'Could not export PDF.');
    }
  };

  const loadStats = async () => {
    try {
      // Get medication count
      const medications = await getMedications();
      const medicationCount = medications ? medications.length : 0;

      // Get adherence stats (use weekly for more recent data)
      let adherencePercentage = 0;
      try {
        const adherenceStats = await getWeeklyAdherence();
        adherencePercentage = Math.round(adherenceStats?.adherenceRate || 0);
      } catch (adherenceError) {
        console.warn('Could not load adherence stats:', adherenceError);
      }

      // Calculate days active (based on user registration or first medication)
      let daysActive = 0;
      if (medications && medications.length > 0) {
        const firstMedication = medications[0];
        if (firstMedication?.createdAt || firstMedication?.startDate) {
          const startDate = new Date(firstMedication.createdAt || firstMedication.startDate);
          const today = new Date();
          daysActive = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        }
      }

      setStats({
        medications: medicationCount,
        daysActive: Math.max(0, daysActive), // Ensure non-negative
        adherence: adherencePercentage,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default values on error
      setStats({
        medications: 0,
        daysActive: 0,
        adherence: 0,
      });
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      setLoading(true);
      try {
        await loadProfile();
        await loadStats(); // Load stats after profile is loaded
      } finally {
        setLoading(false);
      }
    };

    initializeProfile();
  }, []);

  const saveProfile = async () => {
    try {
      // Update user context with new profile data
      await updateUser({
        name: profile.name,
        email: profile.email,
      });

      // Save additional profile data to storage
      const preferences = await StorageService.getUserPreferences();
      await StorageService.saveUserPreferences({
        ...preferences,
        profile,
      });

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');

      // Refresh stats after profile update
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reload original profile data to cancel changes
    loadProfile();
  };

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (label, field, placeholder, multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={profile[field]}
          onChangeText={(text) => updateField(field, text)}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>
          {profile[field] || 'Not provided'}
        </Text>
      )}
    </View>
  );

  const buildDataBundle = async () => {
    const [medications, logs, reminders, preferences] = await Promise.all([
      getMedications(), // match Home data source
      StorageService.getMedicationLogs(),
      StorageService.getReminders(),
      StorageService.getUserPreferences(),
    ]);

    // Compute fresh quick stats to reflect the latest data (not relying on UI state)
    let adherencePercentage = 0;
    try {
      const adherence = await getWeeklyAdherence();
      adherencePercentage = Math.round(adherence?.adherenceRate || adherence?.adherencePercentage || 0);
    } catch {}

    const freshStats = {
      medications: medications?.length || 0,
      daysActive: stats?.daysActive || 0,
      adherence: adherencePercentage,
    };

    return {
      exportedAt: new Date().toISOString(),
      user: {
        name: profile.name,
        email: profile.email,
      },
      medications,
      logs,
      reminders,
      preferences,
      latestHealthData: latestHealthData || null,
      healthHistory: healthHistory || [],
      stats: freshStats,
    };
  };

  const exportHealthData = async () => {
    try {
      const bundle = await buildDataBundle();
      const json = JSON.stringify(bundle, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `health-data-${timestamp}.json`;
      const uri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Health Data' });
      } else {
        Alert.alert('Export Ready', `File saved to: ${uri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Could not export health data.');
    }
  };

  const backupHealthData = async () => {
    try {
      const bundle = await buildDataBundle();
      const json = JSON.stringify(bundle, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dir = `${FileSystem.documentDirectory}backups/`;
      const fileName = `backup-${timestamp}.json`;
      const uri = `${dir}${fileName}`;

      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
      Alert.alert('Backup Complete', `Backup saved:
${uri}`);
    } catch (error) {
      console.error('Backup failed:', error);
      Alert.alert('Backup Failed', 'Could not backup health data.');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Profile" 
        onBack={() => navigation.goBack()}
        rightIcon={
          isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEdit}
              >
                <Icon name="close" size={20} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveProfile}
              >
                <Icon name="checkmark" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Icon name="create" size={24} color="#333" />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Icon name="time-outline" size={24} color="#999" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Profile Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Icon name="person" size={24} color={theme.colors.accentPrimary} />
              </View>
              <Text style={styles.userName}>{profile.name || 'Your Name'}</Text>
              <Text style={styles.userEmail}>{profile.email || 'your.email@example.com'}</Text>
            </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            {renderField('Full Name', 'name', 'Enter your full name')}
            {renderField('Age', 'age', 'Enter your age')}
            {renderField('Email', 'email', 'Enter your email address')}
            {renderField('Phone', 'phone', 'Enter your phone number')}
            {renderField('Emergency Contact', 'emergencyContact', 'Enter emergency contact')}
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          <View style={styles.card}>
            {renderField('Medical Conditions', 'medicalConditions', 'List any medical conditions', true)}
            {renderField('Allergies', 'allergies', 'List any allergies or adverse reactions', true)}
            {renderField('Primary Doctor', 'doctor', 'Enter your doctor\'s name and contact')}
            {renderField('Pharmacy', 'pharmacy', 'Enter your pharmacy information')}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="medical" size={24} color={theme.colors.accentPrimary} />
              <Text style={styles.statNumber}>{stats.medications}</Text>
              <Text style={styles.statLabel}>Medications</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="calendar" size={24} color={theme.colors.accentPrimary} />
              <Text style={styles.statNumber}>{stats.daysActive}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="trophy" size={32} color={theme.colors.accentSecondary} />
              <Text style={styles.statNumber}>{stats.adherence}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={exportHealthData}>
            <Icon name="mail" size={24} color={theme.colors.accentPrimary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Export Health Data</Text>
              <Text style={styles.actionDescription}>Share your medication history</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={backupHealthData}>
            <Icon name="cloud-upload" size={24} color="#4CAF50" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Backup Data</Text>
              <Text style={styles.actionDescription}>Save your data to cloud</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={exportHealthDataPdf}>
            <Icon name="document" size={24} color={theme.colors.accentPrimary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Export as PDF</Text>
              <Text style={styles.actionDescription}>Generate a PDF report</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: '#FFEBEE' }]}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Logout', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        console.log('🚀 Starting logout process...');

                        // Call logout functions individually with error handling
                        try {
                          console.log('🔄 Calling authLogout...');
                          await authLogout();
                          console.log('✅ authLogout completed successfully');
                        } catch (authError) {
                          console.error('❌ authLogout failed:', authError);
                          Alert.alert('Logout Error', `Auth logout failed: ${authError.message}`);
                          return; // Don't continue if auth logout fails
                        }

                        try {
                          console.log('🔄 Calling userLogout...');
                          await userLogout();
                          console.log('✅ userLogout completed successfully');
                        } catch (userError) {
                          console.error('❌ userLogout failed:', userError);
                          // This is less critical, so we'll continue even if userLogout fails
                          console.warn('⚠️ User logout failed but continuing with navigation');
                        }

                        // Navigate to login screen after successful logout
                        console.log('🎯 Navigating to Login screen...');

                        try {
                          // Try navigate first (simpler and more reliable)
                          navigation.navigate('Login');
                          console.log('✅ Navigate to Login completed');
                        } catch (navError) {
                          console.error('❌ Navigate failed:', navError);
                          try {
                            // Fallback to reset
                            console.log('🔄 Trying navigation.reset...');
                            navigation.reset({
                              index: 0,
                              routes: [{ name: 'Login' }]
                            });
                            console.log('✅ Reset completed');
                          } catch (resetError) {
                            console.error('❌ Reset also failed:', resetError);
                            Alert.alert('Navigation Error', 'Failed to navigate to login screen');
                          }
                        }
                      } catch (error) {
                        console.error('💥 Unexpected logout error:', error);
                        Alert.alert('Error', 'Failed to logout. Please try again.');
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Icon name="log-out" size={24} color="#F44336" />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: '#F44336' }]}>Logout</Text>
              <Text style={styles.actionDescription}>Sign out of your account</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available in the next update')}
          >
            <Icon name="people" size={24} color={theme.colors.accentSecondary} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Share with Caregiver</Text>
              <Text style={styles.actionDescription}>Give access to family member</Text>
            </View>
            <Icon name="chevron-forward" size={24} color="#E0E0E0" />
          </TouchableOpacity>
        </View>
        </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 82,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  avatarSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 8,
  },
  fieldInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default ProfileScreen;
