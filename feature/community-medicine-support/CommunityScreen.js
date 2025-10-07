import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import { initCommunityStore, getGroups, getRequests } from './database/store';
import LocationGroups from './LocationGroups';
import MedicineRequests from './MedicineRequests';
import PostRequest from './PostRequest';
import ModerationPanel from './ModerationPanel';

const TABS = ['Groups', 'Requests', 'Post', 'Moderation'];

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('Groups');
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');

  const reload = async () => {
    const [g, r] = await Promise.all([getGroups(), getRequests()]);
    setGroups(g);
    setRequests(r);
  };

  useEffect(() => {
    initCommunityStore().then(reload);
  }, []);

  return (
    <View style={cStyles.container}>
      <View style={cStyles.header}>
        <Text style={cStyles.headerTitle}>Community Medicine Support</Text>
      </View>

      <View style={cStyles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[cStyles.tab, activeTab === tab && cStyles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[cStyles.tabText, activeTab === tab && cStyles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={cStyles.content}>
        {activeTab === 'Groups' && (
          <LocationGroups
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={(g) => {
              setSelectedGroupId(g?.id || '');
              setSelectedGroupName(g?.name || '');
              setActiveTab('Requests');
            }}
          />
        )}
        {activeTab === 'Requests' && (
          <MedicineRequests
            requests={requests}
            selectedGroupId={selectedGroupId}
            onChanged={reload}
          />
        )}
        {activeTab === 'Post' && (
          <PostRequest
            selectedGroupId={selectedGroupId}
            onPosted={(req) => {
              reload();
              setActiveTab('Requests');
              Alert.alert('Success', 'Request posted to ' + (req?.groupName || selectedGroupName || 'selected group'));
            }}
          />
        )}
        {activeTab === 'Moderation' && (
          <ModerationPanel requests={requests} onChanged={reload} />
        )}
      </ScrollView>
    </View>
  );
}
