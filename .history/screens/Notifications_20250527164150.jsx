// Notifications.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../src/api';
import { ACCESS_TOKEN, WS_BASE_URL } from '../src/constant';

export default function Notifications() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // since api.defaults.baseURL already ends with '/main/',
  // just use 'notifications/' here:
  const LIST_URL = 'main/notifications/';

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      console.log('GET', api.defaults.baseURL + LIST_URL);
      const res = await api.get(LIST_URL);
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = async () => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!token) return;
    wsRef.current?.close();

    const ws = new WebSocket(
      `${WS_BASE_URL.replace(/^http/, 'ws')}/ws/notifications/?token=${token}`
    );
    ws.onopen = () => console.log('🚀 WS connected');
    ws.onerror = e => console.error('WS error:', e.message);
    ws.onclose = () => console.log('⚡ WS closed');
    ws.onmessage = ({ data }) => {
      try {
        const notif = JSON.parse(data);
        if (!notif.id) return;
        setNotifications(prev =>
          prev.some(n => n.id === notif.id) ? prev : [notif, ...prev]
        );
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };
    wsRef.current = ws;
  };

  useEffect(() => {
    if (isFocused) {
      fetchNotifications();
      setupWebSocket();
      pollRef.current = setInterval(fetchNotifications, 5000);
    }
    return () => {
      wsRef.current?.close();
      clearInterval(pollRef.current);
    };
  }, [isFocused]);

  const renderItem = ({ item }) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });
    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.unreadCard]}
        onPress={async () => {
          try {
            // patch the detail URL with just notifications/{id}/
            await api.patch(`notifications/${item.id}/`, { is_read: true });
            setNotifications(prev =>
              prev.map(n => n.id === item.id ? { ...n, is_read: true } : n)
            );
          } catch (e) {
            console.warn('Mark read error:', e);
          }
        }}
      >
        <View style={styles.iconContainer}>
          <Icon
            name={item.notif_type === 'verified'
              ? 'check-circle-outline' : 'heart-outline'}
            size={32}
            color={item.notif_type === 'verified'
              ? '#10b981' : '#ef4444'}
          />
          {!item.is_read && <View style={styles.unreadBadge} />}
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.is_read && styles.unreadText]}>
              {item.notif_type === 'verified'
                ? 'Your Property is Verified 🚀'
                : 'Added to Favorites'}
            </Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <Text style={[styles.subtitle, !item.is_read && styles.unreadText]}>
            {item.object_data.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: '#1e293b',
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 30,
    backgroundColor: '#fff', borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  unreadCard: { backgroundColor: '#f0fdf4' },
  iconContainer: { marginRight: 16, position: 'relative' },
  unreadBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#10b981', borderWidth: 2,
    borderColor: '#fff',
  },
  content: { flex: 1 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4
  },
  title: {
    fontSize: 16, fontWeight: '600', color: '#475569', maxWidth: '70%'
  },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  time: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  unreadText: { fontWeight: '700', color: '#1e293b' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff'
  },
});
