import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../src/constant';

export default function ConfirmEmailScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleConfirm = async () => {
    if (!token.trim()) {
      setMessage('Please enter the confirmation code.');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const res = await api.post('users/confirm-email/', { token: token.trim() });

      navigation.replace('Main');
    } catch (err) {
      if (err.response) {
        const detail = err.response.data.detail;
        setMessage(detail || 'Invalid or expired code.');
      } else {
        setMessage('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      await api.post('users/resend-confirm/', { email: await AsyncStorage.getItem('USER_EMAIL') });
      setMessage('A new code has been sent to your email.');
    } catch (err) {
      setMessage('Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#1a1a1d', '#2d2d32']} style={StyleSheet.absoluteFill} />
      <View style={styles.box}>
        <Text style={styles.title}>Confirm Your Email</Text>
        <Text style={styles.subtitle}>
          Enter the confirmation code sent to your email.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Confirmation Code"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={token}
          onChangeText={setToken}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity
          style={styles.button}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirm</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleResend} style={styles.resend} disabled={isLoading}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#1c1c1e' },
  box: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 28, color: '#f5f5f7', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#c1c1c4', textAlign: 'center', marginBottom: 24 },
  input: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3a3a3c',
    color: '#f5f5f7',
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  message: { color: '#ff4d4d', fontSize: 12, marginBottom: 12, textAlign: 'center' },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonText: { color: '#1c1c1e', fontSize: 16, fontWeight: 'bold' },
  resend: { alignItems: 'center' },
  resendText: { color: '#FFD700', fontSize: 14 },
});
