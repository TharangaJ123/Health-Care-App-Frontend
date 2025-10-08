import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import { addRequest, getGroups } from './database/store';

export default function PostRequest({ onPosted, selectedGroupId }) {
  const [medicineName, setMedicineName] = useState('');
  const [details, setDetails] = useState('');
  const [groupId, setGroupId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getGroups().then((gs) => {
      setGroups(gs);
    });
  }, []);

  // Preselect incoming group id if provided
  useEffect(() => {
    if (groups.length && selectedGroupId) {
      const sel = groups.find(g => g.id === selectedGroupId);
      if (sel) {
        setGroupId(sel.id);
        setGroupName(sel.name);
      }
    }
  }, [groups, selectedGroupId]);

  const submit = async () => {
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Medicine name is required');
      return;
    }
    const sel = groups.find(g => g.id === groupId) || groups[0];
    const req = await addRequest({
      medicineName: medicineName.trim(),
      details: details.trim(),
      groupId: sel?.id,
      groupName: sel?.name,
      urgent,
    });
    Alert.alert('Success', 'Request posted');
    setMedicineName('');
    setDetails('');
    setGroupId('');
    setGroupName('');
    setUrgent(false);
    onPosted?.(req);
  };

  return (
    <View style={cStyles.content}>
      <Text style={cStyles.title}>Post a Medicine Request</Text>

      <Text style={cStyles.label}>Medicine Name *</Text>
      <TextInput
        style={cStyles.input}
        value={medicineName}
        onChangeText={setMedicineName}
        placeholder="e.g., Metformin 500mg"
      />

      <Text style={cStyles.label}>Details</Text>
      <TextInput
        style={[cStyles.input, cStyles.textarea]}
        value={details}
        onChangeText={setDetails}
        placeholder="Extra info (preferred brand, qty, patient condition, etc.)"
        multiline
      />

      <Text style={cStyles.label}>Select Group</Text>
      <View style={{ backgroundColor: '#F8F9FA', borderColor: '#E0E0E0', borderWidth: 1, borderRadius: 8 }}>
        {groups.map(g => (
          <TouchableOpacity key={g.id} style={{ padding: 12 }} onPress={() => { setGroupId(g.id); setGroupName(g.name); }}>
            <Text style={{ color: groupId === g.id ? '#1976D2' : '#212121', fontWeight: groupId === g.id ? '700' : '400' }}>{g.name}</Text>
          </TouchableOpacity>
        ))}
        {groups.length === 0 && (
          <View style={{ padding: 12 }}>
            <Text style={{ color: '#757575' }}>No groups available</Text>
          </View>
        )}
      </View>

      <View style={[cStyles.row, { marginTop: 12 }]}>
        <Text style={cStyles.label}>Mark as Emergency</Text>
        <Switch value={urgent} onValueChange={setUrgent} trackColor={{ true: '#90CAF9' }} thumbColor={urgent ? '#2196F3' : '#f4f3f4'} />
      </View>

      <TouchableOpacity style={cStyles.button} onPress={submit}>
        <Text style={cStyles.buttonText}>Post Request</Text>
      </TouchableOpacity>
    </View>
  );
}
