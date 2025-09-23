import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Constants } from 'react-native';
import { getAdherenceStats, getWeeklyAdherence, getMedications } from './storage';
// Format date to 'Month Day, Year' format (e.g., 'September 4, 2023')
const formatDate = (date) => {
  try {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    return `${month} ${day}, ${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date Error';
  }
};

// Format time to 'h:mm AM/PM' format (e.g., '2:30 PM')
const formatTime = (date) => {
  try {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Time';
    
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)
    
    // Ensure two digits for minutes
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Time Error';
  }
};

// Format date and time for the report
const formatDateTime = (date) => {
  try {
    if (!date) return 'Date not available';
    return `${formatDate(date)} at ${formatTime(date)}`;
  } catch (error) {
    console.error('Error formatting date/time:', error);
    return 'Date/Time Error';
  }
};

export const generateAdherenceReport = async () => {
  try {
    // Get adherence data
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    
    const [stats, weeklyData, medications] = await Promise.all([
      getAdherenceStats(weekAgo, today),
      getWeeklyAdherence(),
      getMedications()
    ]);

    // Prepare HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Medication Adherence Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .report-title { color: #2c3e50; font-size: 24px; margin-bottom: 5px; }
          .date { color: #7f8c8d; margin-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section-title { 
            color: #3498db; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 5px; 
            margin-bottom: 10px; 
          }
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 15px; 
            margin-bottom: 20px;
          }
          .stat-card { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 8px; 
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stat-value { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2c3e50;
            margin: 5px 0;
          }
          .stat-label { 
            color: #7f8c8d; 
            font-size: 14px;
          }
          .medication-list { width: 100%; border-collapse: collapse; }
          .medication-list th, .medication-list td { 
            padding: 8px; 
            text-align: left; 
            border-bottom: 1px solid #ddd;
          }
          .medication-list th { 
            background-color: #f2f2f2; 
            color: #2c3e50;
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            color: #7f8c8d; 
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="report-title">Medication Adherence Report</h1>
          <div class="date">${format(today, 'MMMM d, yyyy')}</div>
        </div>

        <div class="section">
          <h2 class="section-title">Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${Math.round(stats.adherenceRate)}%</div>
              <div class="stat-label">Adherence Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.takenCount}</div>
              <div class="stat-label">Doses Taken</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.missedCount}</div>
              <div class="stat-label">Doses Missed</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${medications.length}</div>
              <div class="stat-label">Active Medications</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Weekly Adherence</h2>
          <table class="medication-list">
            <tr>
              <th>Day</th>
              <th>Adherence Rate</th>
              <th>Doses Taken</th>
            </tr>
            ${Object.entries(weeklyData)
              .map(([day, data]) => `
                <tr>
                  <td>${day}</td>
                  <td>${Math.round(data.rate)}%</td>
                  <td>${data.taken}/${data.total}</td>
                </tr>
              `)
              .join('')}
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">Medication List</h2>
          <table class="medication-list">
            <tr>
              <th>Name</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Next Dose</th>
            </tr>
            ${medications
              .map(med => `
                <tr>
                  <td>${med.name}</td>
                  <td>${med.dosage || 'N/A'}</td>
                  <td>${med.frequency || 'Daily'}</td>
                  <td>${med.nextDose ? formatTime(med.nextDose) : 'N/A'}</td>
                </tr>
              `)
              .join('')}
          </table>
        </div>

        <div class="footer">
          <p>Generated by MediCare App on ${formatDateTime(today)}</p>
        </div>
      </body>
      </html>
    `;

    // Generate PDF
    try {
      // Create PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,  // 8.5in in points (72 dpi)
        height: 792,  // 11in in points (72 dpi)
      });

      // Generate a filename with timestamp
      const filename = `MediCare_Report_${format(today, 'yyyyMMdd_HHmmss')}.pdf`;
      
      // Create a new path in the app's document directory
      const newPath = `${FileSystem.documentDirectory}${filename}`;
      
      // Move the file to the new location
      await FileSystem.moveAsync({
        from: uri,
        to: newPath
      });

      return {
        filePath: newPath,
        success: true
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check if running in Expo Go
const isExpoGo = () => {
  return Constants.appOwnership === 'expo' && !Constants.expoVersion;
};

export const shareReport = async (filePath) => {
  try {
    // In Expo Go, we'll handle sharing differently
    if (isExpoGo()) {
      // Create a temporary file that can be shared
      const tempDir = FileSystem.cacheDirectory + 'temp/';
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      
      const tempFile = tempDir + 'Medication_Report_' + new Date().getTime() + '.pdf';
      await FileSystem.copyAsync({
        from: filePath,
        to: tempFile
      });
      
      await Sharing.shareAsync(tempFile, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Medication Report',
        UTI: 'com.adobe.pdf'
      });
      
      // Clean up after a delay
      setTimeout(() => {
        FileSystem.deleteAsync(tempFile, { idempotent: true });
      }, 10000);
      
      return { success: true, isExpoGo: true };
    }
    
    // For development builds or bare workflow
    if (!(await Sharing.isAvailableAsync())) {
      return {
        success: false,
        error: 'Sharing is not available on this device'
      };
    }

    // Share the file
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Medication Report',
      UTI: 'com.adobe.pdf'
    });

    return { success: true, isExpoGo: false };
  } catch (error) {
    console.error('Error sharing report:', error);
    return {
      success: false,
      error: error.message,
      isExpoGo: isExpoGo()
    };
  }
};
