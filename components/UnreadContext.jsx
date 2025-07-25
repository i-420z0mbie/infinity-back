import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';


export const UnreadContext = createContext({
  unreadCount: 0,
  refresh: () => {},
});


export function UnreadProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) return;

      
      const res = await api.get('main/messages/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentUser = String(res.data.current_user);
      const messages = Array.isArray(res.data.messages) ? res.data.messages : [];
      const count = messages.filter(
        (m) => String(m.recipient) === currentUser && !m.is_read
      ).length;
      setUnreadCount(count);
    } catch (err) {
      // console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    fetchCount();
    const iv = setInterval(fetchCount, 25000);
    return () => clearInterval(iv);
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadCount, refresh: fetchCount }}>
      {children}
    </UnreadContext.Provider>
  );
}
