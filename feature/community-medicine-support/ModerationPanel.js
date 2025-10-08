import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import { toggleVerify, removeRequest } from './database/store';

export default function ModerationPanel({ requests = [], onChanged }) {
  const handleVerify = async (id) => {
    await toggleVerify(id);
    onChanged?.();
  };

  const handleRemove = async (id) => {
    await removeRequest(id);
    onChanged?.();
  };

  return (
    <View style={cStyles.content}>
      <Text style={cStyles.title}>Moderation</Text>
      {requests.length === 0 && (
        <Text style={cStyles.smallText}>No requests</Text>
      )}
      {requests.map(req => (
        <View key={req.id} style={cStyles.card}>
          <Text style={{ fontWeight: '600', color: '#212121' }}>{req.medicineName}</Text>
          <Text style={cStyles.smallText}>{req.groupName} • {new Date(req.createdAt).toLocaleString()}</Text>
          <Text style={{ color: '#424242', marginTop: 6 }}>{req.details}</Text>
          <View style={{ height: 10 }} />
          <View style={cStyles.row}>
            <TouchableOpacity style={cStyles.buttonSecondary} onPress={() => handleVerify(req.id)}>
              <Text style={cStyles.buttonSecondaryText}>{req.verified ? 'Unverify' : 'Verify'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cStyles.buttonSecondary, { borderColor: '#F44336' }]} onPress={() => handleRemove(req.id)}>
              <Text style={[cStyles.buttonSecondaryText, { color: '#F44336' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
