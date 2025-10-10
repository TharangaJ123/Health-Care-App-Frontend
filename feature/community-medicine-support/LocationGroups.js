import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import Icon from '../../component/common/Icon';

export default function LocationGroups({ groups = [], selectedGroupId = '', onSelect }) {
  return (
    <View style={cStyles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="people-outline" size={18} color="#0D47A1" />
        <Text style={cStyles.title}>Location-Based Groups</Text>
      </View>
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
            {selectedGroupId === g.id ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="checkmark-circle" size={16} color="#0D47A1" />
                <Text style={cStyles.chip}>Selected</Text>
              </View>
            ) : (
              <Icon name="chevron-forward" size={16} color="#90CAF9" />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Icon name="target" size={18} color="#1976D2" />
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#212121' }}>{g.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
      {groups.length === 0 && (
        <Text style={cStyles.smallText}>No groups available</Text>
      )}
    </View>
  );
}
