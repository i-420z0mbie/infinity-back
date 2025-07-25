import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

export default function Chat() {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const userId = route.params.userId.toString();
  const username = route.params.username;
  const currentUserId = route.params.currentUserId.toString();
  const initialMessage = route.params.initialMessage || '';

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(true);
  const pollIntervalRef = useRef(null);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      const res = await api.get(
        `main/messages/?user_id=${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res?.data || {};
      const fetched = Array.isArray(data.messages) ? data.messages.reverse() : [];
      setMessages(fetched);
      markMessagesAsRead(fetched);
    } catch (err) {
      // Handle server errors gracefully
      console.error('Fetch error:', err);
      if (!messages.length) {
        // Only alert if no previous messages
        Alert.alert(
          'Error',
          err.response?.status === 500
            ? 'Server error while loading messages.'
            : 'Could not load messages.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (msgs) => {
    const unread = msgs.filter(
      (m) => m.sender?.toString() === userId && !m.is_read
    );
    if (!unread.length) return;
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      await api.patch(
        `main/messages/mark_read/?user_id=${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.sender?.toString() === userId ? { ...m, is_read: true } : m
        )
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchMessages();
      pollIntervalRef.current = setInterval(fetchMessages, 45000);
    }
    return () => {
      clearInterval(pollIntervalRef.current);
    };
  }, [isFocused, userId]);

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    const tempId = Date.now().toString();
    const now = new Date().toISOString();
    const placeholder = {
      id: tempId,
      sender: currentUserId,
      recipient: userId,
      content: text,
      timestamp: now,
      is_read: false,
      sender_username: 'You',
    };
    setMessages((prev) => [placeholder, ...prev]);
    setNewMessage('');
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      await api.post(
        `main/messages/?user_id=${userId}`,
        { content: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages();
    } catch (err) {
      console.error('Send error:', err);
      Alert.alert('Send Failed', err.message || 'Unable to send message.');
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender?.toString() === currentUserId;
    const time = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    return (
      <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
          <Image
            source={{ uri: item.avatar_url || 'https://www.gravatar.com/avatar/?d=mp&s=200' }}
            style={styles.avatar}
          />
        )}
        <LinearGradient
          colors={isMe ? ['#667eea', '#764ba2'] : ['#e2e8f0', '#cbd5e1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}
        >
          <Text style={[styles.text, isMe ? styles.textLight : styles.textDark]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.time, isMe ? styles.timeLight : styles.timeDark]}> {time} </Text>
            {isMe && (
              <Icon
                name={item.is_read ? 'check-all' : 'check'}
                size={12}
                style={styles.statusIcon}
                color={item.is_read ? '#d6bcfa' : '#e2e8f0'}
              />
            )}
          </View>
        </LinearGradient>
        {isMe && (
          <Image
            source={{ uri: item.avatar_url || 'https://example.com/default-avatar.png' }}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#764ba2" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{username}</Text>
          <View style={styles.status}>
            <Icon name="circle" size={14} color="#48bb78" />
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          inverted
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0 })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Say something..."
            placeholderTextColor="#94a3b8"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#667eea',
  },
  backBtn: { paddingTop: 15, marginTop: 7 },
  title: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 20, marginTop: 18 },
  status: { width: 24, alignItems: 'flex-end' },
  messages: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 6 },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10, position: 'relative' },
  bubbleLeft: { borderTopLeftRadius: 0 },
  bubbleRight: { borderTopRightRadius: 0 },
  text: { fontSize: 16, lineHeight: 20 },
  textDark: { color: '#1f2937' },
  textLight: { color: '#f8fafc' },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: { fontSize: 10, marginRight: 4 },
  timeDark: { color: '#475569' },
  timeLight: { color: '#e2e8f0' },
  statusIcon: { marginLeft: 'auto' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    maxHeight: 100,
    color: '#1f2937',
  },
  sendBtn: {
    backgroundColor: '#667eea',
    padding: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
