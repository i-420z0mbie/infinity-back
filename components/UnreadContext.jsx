// UnreadContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN, WS_BASE_URL } from '../src/constant';

export const UnreadContext = createContext({
  unreadCount: 0,
  refresh: () => {},
});

export function UnreadProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef(null);

  const fetchCount = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) return;

      const res = await api.get('main/messages/');
      const currentUser = String(res.data.current_user);
      const messages = res.data.messages || [];
      const count = messages.filter(
        m => String(m.recipient) === currentUser && !m.is_read
      ).length;
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const setupWS = async () => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!token) return;

    if (wsRef.current) wsRef.current.close();
    const socket = new WebSocket(`${WS_BASE_URL}/ws/chat/?token=${token}`);

    socket.onopen = () => console.log('Unread WS open');
    socket.onerror = e => console.error('Unread WS error', e.message);
    socket.onclose = () => console.log('Unread WS closed');

    socket.onmessage = ({ data }) => {
      try {
        const { message } = JSON.parse(data);
        // if it's for me and unread, bump:
        if (!message.is_read) {
          setUnreadCount(c => c + 1);
        }
      } catch (err) {
        // console.error('Unread WS parse error', err);
      }
    };

    wsRef.current = socket;
  };

  useEffect(() => {
    fetchCount();
    setupWS();
    const iv = setInterval(fetchCount, 45000);
    return () => {
      clearInterval(iv);
      wsRef.current?.close();
    };
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadCount, refresh: fetchCount }}>
      {children}
    </UnreadContext.Provider>
  );
}
