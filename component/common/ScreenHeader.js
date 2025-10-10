import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';

export default function ScreenHeader({ title, onBack, rightIcon, rightAction }) {
  return (
    <View style={styles.header}>
      <View style={styles.leftGroup}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="chevron-back" size={24} color="#333" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 64 }} />
        )}

        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>

      <View style={styles.actions}>
        {rightIcon ? (
          <TouchableOpacity style={styles.actionButton} onPress={rightAction} disabled={!rightAction}>
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent:'center',
    textAlign:'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 25,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
    alignItems: 'center',
    alignContent:'center',
    textAlign:'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
