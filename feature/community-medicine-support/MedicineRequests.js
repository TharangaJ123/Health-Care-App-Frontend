import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import { addResponse } from './database/store';
import Icon from '../../component/common/Icon';

export default function MedicineRequests({ requests = [], selectedGroupId = '', onChanged }) {
  const [search, setSearch] = useState('');
  const [responseText, setResponseText] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = selectedGroupId ? requests.filter(r => r.groupId === selectedGroupId) : requests;
    if (!s) return base;
    return base.filter(r =>
      (r.medicineName || '').toLowerCase().includes(s) ||
      (r.details || '').toLowerCase().includes(s)
    );
  }, [requests, search, selectedGroupId]);

  const submitResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return;
    await addResponse(selectedRequest.id, {
      text: responseText.trim(),
      from: 'community',
    });
    setResponseText('');
    setSelectedRequest(null);
    onChanged?.();
  };

  return (
    <View style={cStyles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="analytics-outline" size={18} color="#0D47A1" />
        <Text style={cStyles.title}>Requests</Text>
      </View>
      {!!selectedGroupId && (
        <Text style={cStyles.smallText}>Filtered by selected group</Text>
      )}

      <Text style={cStyles.label}>Search</Text>
      <TextInput
        style={cStyles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Search medicine (e.g., Metformin 500mg)"
      />

      {filtered.map(req => (
        <View key={req.id} style={cStyles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="pill" size={18} color="#1976D2" />
              <Text style={{ fontWeight: '600', color: '#212121' }}>{req.medicineName}</Text>
            </View>
            {req.urgent && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="warning-outline" size={16} color="#B71C1C" />
                <Text style={[cStyles.chip, cStyles.dangerChip]}>URGENT</Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="calendar-outline" size={14} color="#616161" />
            <Text style={cStyles.smallText}>{req.groupName} • {new Date(req.createdAt).toLocaleString()}</Text>
          </View>

          <Text style={{ color: '#424242', marginTop: 6 }}>{req.details}</Text>

          {req.verified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
              <Icon name="checkmark-circle" size={16} color="#0D47A1" />
              <Text style={[cStyles.chip]}>Verified by moderator</Text>
            </View>
          )}

          <View style={{ height: 10 }} />
          <Text style={cStyles.label}>Community Responses</Text>
          {req.responses?.length === 0 && (
            <Text style={cStyles.smallText}>No responses yet</Text>
          )}
          {(req.responses || []).map(r => (
            <View key={r.id} style={{ marginTop: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="chatbubbles-outline" size={18} color="#0D47A1" />
                <Text style={{ color: '#0D47A1', fontWeight: '600' }}>{r.from || 'member'}</Text>
              </View>
              <Text style={{ color: '#424242' }}>{r.text}</Text>
              <Text style={cStyles.smallText}>{new Date(r.createdAt).toLocaleString()}</Text>
            </View>
          ))}

          <View style={{ height: 8 }} />
          {selectedRequest?.id === req.id ? (
            <>
              <TextInput
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Pharmacy name, stock status, alternatives, advice"
              />
              <TouchableOpacity style={cStyles.button} onPress={submitResponse}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="create-outline" size={18} color="#FFFFFF" />
                  <Text style={cStyles.buttonText}>Send Response</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={cStyles.buttonSecondary} onPress={() => setSelectedRequest(null)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="close" size={18} color="#2196F3" />
                  <Text style={cStyles.buttonSecondaryText}>Cancel</Text>
                </View>
              </TouchableOpacity>
              
            </>
          ) : (
            <TouchableOpacity style={cStyles.buttonSecondary} onPress={() => setSelectedRequest(req)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="chatbubbles-outline" size={18} color="#2196F3" />
                <Text style={cStyles.buttonSecondaryText}>Respond</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}
