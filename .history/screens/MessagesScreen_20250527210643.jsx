import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../src/api';
import { ACCESS_TOKEN, WS_BASE_URL } from '../src/constant';

export default function MessageListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const wsRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const res = await api.get('main/messages/');
      const { current_user, messages = [] } = res.data;

      if (!current_user) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const currentUserStr = String(current_user);
      setCurrentUserId(currentUserStr);

      const map = {};
      messages.forEach(msg => {
        const senderStr = String(msg.sender);
        const recipientStr = String(msg.recipient);
        const other = senderStr === recipientStr ? null : 
          senderStr === currentUserStr ? recipientStr : senderStr;
        const userId = other || recipientStr;
        const isSentByCurrentUser = senderStr === currentUserStr;

        if (!map[userId] || new Date(msg.timestamp) > new Date(map[userId].timestamp)) {
          map[userId] = {
            userId,
            username: isSentByCurrentUser ? msg.recipient_username : msg.sender_username,
            preview: msg.content,
            timestamp: msg.timestamp,
            unread: isSentByCurrentUser ? false : !msg.is_read,
            avatar: msg.avatar_url || null,
            isSentByCurrentUser,
            isReadByRecipient: isSentByCurrentUser ? msg.is_read : undefined,
          };
        }
      });

      const sortedThreads = Object.values(map).sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setThreads(sortedThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = async () => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!token) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const socket = new WebSocket(`${WS_BASE_URL}/ws/chat/?token=${token}`);

    socket.onopen = () => console.log('WebSocket connected');
    socket.onerror = e => console.error('WebSocket error:', e.message);
    socket.onclose = () => console.log('WebSocket closed');

    socket.onmessage = ({ data }) => {
      try {
        const { message } = JSON.parse(data);
        const senderStr = String(message.sender);
        const currentUserStr = String(currentUserId);
        const isSentByCurrentUser = senderStr === currentUserStr;

        setThreads(prev => {
          const idx = prev.findIndex(t => String(t.userId) === senderStr);
          const entry = {
            userId: senderStr,
            username: message.sender_username,
            preview: message.content,
            timestamp: message.timestamp,
            unread: isSentByCurrentUser ? false : !message.is_read,
            avatar: message.avatar_url || null,
            isSentByCurrentUser,
            isReadByRecipient: isSentByCurrentUser ? message.is_read : undefined,
          };

          let updated;
          if (idx >= 0) {
            updated = [...prev];
            updated.splice(idx, 1);
            updated.unshift(entry);
          } else {
            updated = [entry, ...prev];
          }

          return updated.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
        });
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    wsRef.current = socket;
  };

  useEffect(() => {
    if (isFocused) {
      // Initial fetch
      fetchThreads();
      
      // Setup WebSocket
      setupWebSocket();
      
      // Setup polling as fallback
      pollIntervalRef.current = setInterval(fetchThreads, 2000);
    }

    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isFocused]);

  const renderItem = ({ item }) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return (
      <TouchableOpacity
        style={[styles.card, item.unread && styles.unreadCard]}
        onPress={() => {
          navigation.navigate('Chat', {
            userId: item.userId,
            username: item.username,
            currentUserId,
          });
        }}
      >
        <View style={[styles.avatarContainer, item.unread && styles.unreadAvatar]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <Icon name="account-circle" size={48} color="#e0e0e0" />
          )}
          {item.unread && <View style={styles.unreadBadge} />}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={[styles.username, item.unread && styles.unreadText]}>
              {item.username}
            </Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text 
              style={[styles.preview, item.unread && styles.unreadText]}
              numberOfLines={2}
            >
              {item.preview}
            </Text>
            {item.isSentByCurrentUser && (
              <Icon
                name={item.isReadByRecipient ? "check-all" : "check"}
                size={16}
                color={item.isReadByRecipient ? "#6366f1" : "#94a3b8"}
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.loadingLogo}
        />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
    <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Messages</Text>
        <FlatList
          data={threads}
          keyExtractor={item => String(item.userId)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

// Keep the same styles as previous version
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#E6F0FA',
  },
  headerTitle: {
    fontSize: 28,
    // fontWeight: '800',
    color: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 30,
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadAvatar: {
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 28,
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#6366f1',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontFamily: ''.
    color: '#475569',
    maxWidth: '70%',
  },
  unreadText: {
    color: '#1e293b',
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    flexShrink: 1,
    marginRight: 8,
  },
  statusIcon: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingLogo: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
});