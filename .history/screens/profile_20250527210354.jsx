// screens/Profile.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../src/constant';
import api from "../src/api";


export default function Profile() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthAndFetchData = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const response = await api.get('core/user/me/');
      setUserData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        Alert.alert('Error', 'Failed to fetch user data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      checkAuthAndFetchData();
    }
  }, [isFocused]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      Alert.alert('Logout Error', 'Something went wrong while logging out.');
    }
  };

  const MenuItem = ({ icon, name, screen }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => navigation.navigate(screen)}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color="#5e7cff" />
        </View>
        <Text style={styles.menuText}>{name}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cecece" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e7cff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={48} color="#ff3b30" />
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkAuthAndFetchData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
    <StatusBar style="dark" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={72} color="#5e7cff" />
          </View>
          <Text style={styles.userName}>{userData?.username || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{userData?.email || 'guest@example.com'}</Text>
        </View>


        <View style={styles.menuContainer}>
          <MenuItem icon="person-outline" name="Account Settings" screen="Account" />
          <View style={styles.separator} />
          <MenuItem icon="home-outline" name="My Properties" screen="My Properties" />
          <View style={styles.separator} />
          <MenuItem icon="heart-outline" name="Favorites" screen="Favorites" />
          <View style={styles.separator} />
          <MenuItem icon="notifications-outline" name="Notifications" screen="Notifications" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 2.4.8</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafcff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafcff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafcff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#2d2d2d',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#5e7cff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
    shadowColor: '#5e7cff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    backgroundColor: '#f0f4ff',
    borderRadius: 50,
    padding: 8,
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#7a7a7a',
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#2d2d2d',
    fontFamily: ''
    letterSpacing: 0.2,
  },
  separator: {
    height: 1,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 24,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#5e7cff',
    padding: 18,
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#5e7cff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center',
    color: '#a0a0a0',
    fontSize: 12,
    marginTop: 32,
    marginBottom: 16,
  },
});