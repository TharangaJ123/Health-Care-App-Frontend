# MediCare - Medication & Treatment Management App

A comprehensive React Native application for medication tracking, reminders, and adherence monitoring.

## Features

### 🏠 **Splash Screen & Onboarding**
- Beautiful animated splash screen with app branding
- 3 interactive onboarding screens with engaging visuals
- Smooth transitions and user-friendly introduction

### 💊 **Medication Intake Tracker**
- Mark medicines as "Taken," "Missed," or "Skipped" with one tap
- Real-time adherence tracking and statistics
- Color-coded status indicators for easy recognition
- Daily progress monitoring with percentage calculations

### ⏰ **Smart Reminders & Scheduler**
- Custom reminders (daily, weekly, multiple times per day)
- Flexible scheduling with personalized time slots
- Push notifications even when app is closed
- Dosage details and medication information
- Snooze and reschedule options

### 📊 **Adherence Reports & Analytics**
- Daily/weekly adherence reports with visual charts
- Color-coded adherence history (green = good, red = poor)
- Trend analysis with line charts and pie charts
- Medication-specific performance tracking
- Exportable reports for doctors and caregivers

### 🔔 **Advanced Notification System**
- Customizable notification settings
- Sound and vibration controls
- Test notification functionality
- Reminder advance time configuration

### 👤 **User Profile & Settings**
- Comprehensive user profile management
- Medical information and emergency contacts
- Personal health data storage
- Privacy and security settings

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 7
- **Storage**: AsyncStorage for local data persistence
- **Charts**: React Native Chart Kit for data visualization
- **UI Components**: React Native Vector Icons, Expo Linear Gradient
- **Notifications**: Expo Notifications

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Health-Care-App-Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   ```

## Project Structure

```
Health-Care-App-Frontend/
├── screens/
│   ├── SplashScreen.js          # App splash screen
│   ├── OnboardingScreen.js      # 3-screen onboarding flow
│   ├── HomeScreen.js            # Main dashboard
│   ├── AddMedicationScreen.js   # Add new medications
│   ├── RemindersScreen.js       # Manage reminders
│   ├── ReportsScreen.js         # Adherence analytics
│   ├── ProfileScreen.js         # User profile
│   └── SettingsScreen.js        # App settings
├── services/
│   └── StorageService.js        # Local storage management
├── assets/                      # Images and icons
├── App.js                       # Main app component
└── package.json                 # Dependencies
```

## Key Features Implementation

### Medication Tracking
- **Status Options**: Taken (green), Missed (red), Skipped (orange)
- **Real-time Stats**: Automatic calculation of adherence percentages
- **Visual Feedback**: Color-coded cards and progress indicators

### Data Visualization
- **Line Charts**: Adherence trends over time
- **Pie Charts**: Status distribution visualization
- **Progress Bars**: Individual medication performance
- **Color Coding**: Instant visual feedback system

### Local Storage
- **Medications**: Complete medication database
- **Logs**: Detailed intake history with timestamps
- **Reminders**: Notification schedules and preferences
- **User Data**: Profile and settings persistence

### UX Enhancements
- **One-Tap Logging**: Quick status updates
- **Visual Feedback**: Immediate color-coded responses
- **Progress Tracking**: Motivational adherence scores
- **Accessibility**: Clear icons and readable fonts

## Usage

### Adding Medications
1. Navigate to Home screen
2. Tap the "+" button
3. Fill in medication details (name, dosage, frequency)
4. Set reminder times
5. Save medication

### Tracking Intake
1. View today's medications on Home screen
2. Tap "Taken," "Missed," or "Skipped" for each medication
3. View real-time adherence statistics
4. Check progress in the stats card

### Setting Reminders
1. Go to Reminders screen
2. Toggle reminders for each medication
3. Customize notification settings
4. Test notifications

### Viewing Reports
1. Access Reports screen
2. Select time period (week/month/quarter)
3. View adherence trends and charts
4. Export reports for sharing

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Implement proper error handling
- Use TypeScript for type safety (future enhancement)

### UI/UX Principles
- Material Design inspired interface
- Consistent color scheme and typography
- Accessibility considerations
- Smooth animations and transitions

### Data Management
- Local-first approach with AsyncStorage
- Structured data models
- Proper error handling and validation
- Future cloud sync preparation

## Future Enhancements

- **Cloud Sync**: Backup and sync across devices
- **Caregiver Access**: Share data with family/doctors
- **Voice Reminders**: Audio notifications
- **Smart Watch Integration**: Wearable device support
- **AI Insights**: Personalized recommendations
- **Medication Scanner**: Barcode/OCR functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.