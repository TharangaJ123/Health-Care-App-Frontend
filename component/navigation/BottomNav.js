import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { House, Flag, Plus, Newspaper, User as UserIcon,PersonArmsSpread } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

const BottomNav = ({ activeTab, onTabPress }) => {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: House,
    },
    {
      id: 'goal',
      label: 'Goals',
      icon: Flag,
    },
    {
      id: 'add',
      label: 'Dashboard',
      icon: PersonArmsSpread,
      isCenter: true,
    },
    {
      id: 'blog',
      label: 'Blog',
      icon: Newspaper,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
    },
  ];

  const renderIcon = (tab) => {
    const IconComponent = tab.icon;
    const isActive = activeTab === tab.id;
    const color = isActive ? '#FFD166' : '#FFFFFF';
    const size = tab.isCenter ? 28 : 24;

    return (
      <IconComponent size={size} color={color} weight={isActive ? 'fill' : 'regular'} />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#357ABD', '#2E5C8A']}
        style={styles.navContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, tab.isCenter && styles.centerTabButton]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            {tab.isCenter ? (
              <View style={styles.centerButton}>
                <View style={styles.centerButtonCircle}>
                  <View style={styles.centerButtonInner}>
                    {renderIcon(tab)}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.regularTab}>
                {renderIcon(tab)}
                {tab.label !== '' && (
                  <Text style={[
                    styles.tabLabel,
                    activeTab === tab.id && { color: '#FFD166', fontWeight: '700' }
                  ]}>
                    {tab.label}
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
  },
  navContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
    marginTop:10,
    alignItems: 'center',
    height: 80,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  centerTabButton: {
    marginTop: -55,
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  centerButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regularTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 4,
  },
});

export default BottomNav;