import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';

const AppHeader = ({
  title,
  subtitle,
  onBack,
  rightIconName,
  onRightPress,
  rightIconColor = '#007AFF',
  style,
  showBorder = true,
}) => {
  return (
    <View style={[styles.header, showBorder ? styles.withBorder : null, style]}>
      <View style={styles.leftSection}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="chevron-back" size={24} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : null}
        <View>
          {!!title && <Text style={styles.headerTitle}>{title}</Text>}
          {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.actions}>
        {rightIconName ? (
          <TouchableOpacity style={styles.headerButton} onPress={onRightPress} activeOpacity={0.8}>
            <Icon name={rightIconName} size={28} color={rightIconColor} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginTop: 25,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4A90E2',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 50,
    padding: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
