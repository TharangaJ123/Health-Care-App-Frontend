import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import { addResponse } from './database/store';

export default function MedicineRequests({ requests = [], selectedGroupId = '', onChanged }) {
  const [search, setSearch] = useState('');
  const [responseText, setResponseText] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const base = selectedGroupId ? requests.filter(r => r.groupId === selectedGroupId) : requests;
    if (!s) return base;
    return base.filter(r =>
      r.medicineName?.toLowerCase().includes(s) ||
      r.details?.toLowerCase().includes(s)
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
      <Text style={cStyles.title}>Requests</Text>
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
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: '#212121' }}>{req.medicineName}</Text>
            {req.urgent && <Text style={[cStyles.chip, cStyles.dangerChip]}>URGENT</Text>}
          </View>
          <Text style={cStyles.smallText}>{req.groupName} • {new Date(req.createdAt).toLocaleString()}</Text>
          <Text style={{ color: '#424242', marginTop: 6 }}>{req.details}</Text>
          {req.verified && (
            <Text style={[cStyles.chip]}>{'Verified by moderator'}</Text>
          )}

          <View style={{ height: 10 }} />
          <Text style={cStyles.label}>Community Responses</Text>
          {req.responses.length === 0 && (
            <Text style={cStyles.smallText}>No responses yet</Text>
          )}
          {req.responses.map(r => (
            <View key={r.id} style={{ marginTop: 6 }}>
              <Text style={{ color: '#0D47A1', fontWeight: '600' }}>{r.from || 'member'}</Text>
              <Text style={{ color: '#424242' }}>{r.text}</Text>
              <Text style={cStyles.smallText}>{new Date(r.createdAt).toLocaleString()}</Text>
            </View>
          ))}

          {/* Quick reply */}
          <View style={{ height: 8 }} />
          {selectedRequest?.id === req.id ? (
            <>
              <TextInput
                style={cStyles.input}
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Pharmacy name, stock status, alternatives, advice"
              />
              <TouchableOpacity style={cStyles.button} onPress={submitResponse}>
                <Text style={cStyles.buttonText}>Send Response</Text>
              </TouchableOpacity>
              <TouchableOpacity style={cStyles.buttonSecondary} onPress={() => setSelectedRequest(null)}>
                <Text style={cStyles.buttonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={cStyles.buttonSecondary} onPress={() => setSelectedRequest(req)}>
              <Text style={cStyles.buttonSecondaryText}>Respond</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}
