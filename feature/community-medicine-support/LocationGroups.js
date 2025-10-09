import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cStyles } from './styles/CommunityStyles';

export default function LocationGroups({ groups = [], selectedGroupId = '', onSelect }) {
  const levelAccent = (level = '') => {
    const key = String(level).toUpperCase();
    switch (key) {
      case 'RADIUS':
        return '#90CAF9'; // light blue
      case 'DISTRICT':
        return '#64B5F6';
      case 'PROVINCE':
        return '#42A5F5';
      case 'FACILITY':
        return '#2196F3';
      case 'POSTAL':
        return '#1E88E5';
      case 'LOCALITY':
        return '#1976D2';
      case 'CORRIDOR':
        return '#1565C0';
      case 'SERVICE':
        return '#0D47A1';
      case 'RISK':
        return '#5E92F3';
      default:
        return '#90CAF9';
    }
  };
  return (
    <View style={cStyles.content}>
      <Text style={cStyles.title}>Location-Based Groups</Text>
      {groups.map(g => (
        <TouchableOpacity
          key={g.id}
          onPress={() => onSelect?.(g)}
          style={[
            cStyles.card,
            selectedGroupId === g.id && { borderLeftColor: '#0D47A1', backgroundColor: '#E3F2FD' },
          ]}
        >
          {/* Accent bar */}
          <View style={{ height: 6, backgroundColor: levelAccent(g.level), borderRadius: 6, marginBottom: 10 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={cStyles.smallText}>{g.level?.toUpperCase()}</Text>
            {selectedGroupId === g.id && <Text style={cStyles.chip}>Selected</Text>}
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#0D47A1', marginTop: 4 }}>{g.name}</Text>
        </TouchableOpacity>
      ))}
      {groups.length === 0 && (
        <Text style={cStyles.smallText}>No groups available</Text>
      )}
    </View>
  );
}
