import { StyleSheet } from 'react-native';

export const cStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#E3F2FD',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#90CAF9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  tabText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  title: {
    fontSize: 18,
    color: '#0D47A1',
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    color: '#212121',
  },
  textarea: {
    height: 90,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
    marginTop: 10,
  },
  buttonSecondaryText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#BBDEFB',
    color: '#0D47A1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  dangerChip: {
    backgroundColor: '#FFCDD2',
    color: '#B71C1C',
  },
  smallText: {
    fontSize: 12,
    color: '#616161',
  },
});
