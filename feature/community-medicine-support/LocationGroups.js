import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cStyles } from './styles/CommunityStyles';

export default function LocationGroups({ groups = [], selectedGroupId = '', onSelect }) {
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={cStyles.smallText}>{g.level?.toUpperCase()}</Text>
            {selectedGroupId === g.id && <Text style={cStyles.chip}>Selected</Text>}
          </View>
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#212121' }}>{g.name}</Text>
        </TouchableOpacity>
      ))}
      {groups.length === 0 && (
        <Text style={cStyles.smallText}>No groups available</Text>
      )}
    </View>
  );
}
