import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { cStyles } from './styles/CommunityStyles';
import { initCommunityStore, getGroups, getRequests } from './database/store';
import LocationGroups from './LocationGroups';
import MedicineRequests from './MedicineRequests';
import PostRequest from './PostRequest';
import ModerationPanel from './ModerationPanel';
import ScreenHeader from '../../component/common/ScreenHeader';
import Icon from '../../component/common/Icon';
import { useAuth } from '../../context/AuthContext';

const tabIcons = {
  Groups: 'people-outline',
  Requests: 'analytics-outline',
  Post: 'create-outline',
  Moderation: 'warning-outline',
};

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState('Groups');
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const { user } = useAuth();
  const userTypeNormalized = ((user?.userType ?? user?.role ?? user?.type ?? '') + '').toLowerCase();
  const isDoctor = userTypeNormalized === 'doctor';

  const TABS = useMemo(() => (isDoctor ? ['Groups', 'Requests', 'Post', 'Moderation'] : ['Groups', 'Requests', 'Post']), [isDoctor]);

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
      <ScreenHeader
        title="Community Medicine Support"
        rightIcon={<Icon name="information-circle" size={22} color="#1976D2" />}
        rightAction={() =>
          Alert.alert(
            'About',
            'Find and respond to medicine availability requests in your community. Use tabs to browse groups, view requests, post, and moderate.'
          )
        }
      />

      <View style={cStyles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[cStyles.tab, activeTab === tab && cStyles.tabActive]}
            onPress={() => {
              if (tab === 'Moderation' && !isDoctor) {
                Alert.alert('Restricted', 'Only doctors can access Moderation');
                return;
              }
              setActiveTab(tab);
            }}
          >
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Icon name={tabIcons[tab]} size={18} color={activeTab === tab ? '#FFFFFF' : '#1976D2'} />
              <Text style={[cStyles.tabText, activeTab === tab && cStyles.tabTextActive]}>{tab}</Text>
            </View>
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
        {isDoctor && activeTab === 'Moderation' && (
          <ModerationPanel requests={requests} onChanged={reload} />
        )}
      </ScrollView>
    </View>
  );
}
