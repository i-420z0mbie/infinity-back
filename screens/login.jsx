import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../src/constant';

const { width } = Dimensions.get('window');
const INPUT_HEIGHT = 56;
const BUTTON_HEIGHT = 52;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 6;

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputFocus, setInputFocus] = useState({ username: false, password: false });
  const animValues = {
    username: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    buttonScale: useRef(new Animated.Value(1)).current,
  };

  useEffect(() => {
    AsyncStorage.getItem(ACCESS_TOKEN).then(token => {
      if (token) navigation.replace('Main');
    });
  }, []);

  const validateField = (name, value) => {
    let message = '';
    if (name === 'username') {
      if (!value.trim()) message = 'Username is required.';
      else if (!USERNAME_REGEX.test(value)) message = '3-20 chars; letters, numbers, underscore only.';
    }
    if (name === 'password') {
      if (!value.trim()) message = 'Password is required.';
      else if (value.length < MIN_PASSWORD_LENGTH) message = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    setErrors(prev => ({ ...prev, [name]: message }));
    return !message;
  };

  const animateInput = (inputName, toValue) => Animated.timing(animValues[inputName], {
    toValue,
    duration: 150,
    easing: Easing.ease,
    useNativeDriver: false
  }).start();

  const handleFocus = (inputName) => {
    setInputFocus(prev => ({ ...prev, [inputName]: true }));
    animateInput(inputName, 1);
  };

  const handleBlur = (inputName) => {
    setInputFocus(prev => ({ ...prev, [inputName]: false }));
    const value = inputName === 'username' ? username : password;
    animateInput(inputName, value ? 1 : 0);
    validateField(inputName, value);
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(animValues.buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(animValues.buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    animateButton();
    setServerError('');
    const validUsername = validateField('username', username);
    const validPassword = validateField('password', password);
    if (!validUsername || !validPassword) return;

    setIsLoading(true);
    try {
      const res = await api.post('core/user/login/', { username: username.trim(), password });
      const { access, refresh } = res.data;
      await AsyncStorage.multiSet([
        [ACCESS_TOKEN, access],
        [REFRESH_TOKEN, refresh]
      ]);
      navigation.replace('Main');
    } catch (err) {
      // Distinguish between HTTP errors and network issues
      if (err?.response) {
        if (err.response.status === 401) {
          setServerError('Incorrect username or password.');
        } else {
          const detail = err.response.data?.detail;
          setServerError(detail || 'Login failed. Please try again later.');
        }
      } else {
        setServerError('Login failed. Check connection or Invalid credentials!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username && password && !errors.username && !errors.password;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#1a1a1d', '#2d2d32']} locations={[0.2, 0.8]} style={styles.background} />
      <View style={styles.formContainer}>
        <Animated.View style={[styles.form, { transform: [{ scale: animValues.buttonScale }] }]}>  
          <Text style={styles.header}>Welcome Back</Text>

          <View style={styles.inputsContainer}>
            <Animated.View style={[
              styles.inputWrapper,
              (inputFocus.username || username) && styles.inputActive,
              errors.username && styles.inputError
            ]}>
              <Ionicons name="person-outline" size={20} color={inputFocus.username ? '#FFD700' : '#c1c1c4'} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#666"
                autoCapitalize="none"
                value={username}
                onChangeText={text => { setUsername(text); if (errors.username) validateField('username', text); }}
                onFocus={() => handleFocus('username')}
                onBlur={() => handleBlur('username')}
              />
            </Animated.View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

            <Animated.View style={[
              styles.inputWrapper,
              (inputFocus.password || password) && styles.inputActive,
              errors.password && styles.inputError
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={inputFocus.password ? '#FFD700' : '#c1c1c4'} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={text => { setPassword(text); if (errors.password) validateField('password', text); }}
                onFocus={() => handleFocus('password')}
                onBlur={() => handleBlur('password')}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#c1c1c4" />
              </TouchableOpacity>
            </Animated.View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {serverError && <Text style={styles.serverError}>{serverError}</Text>}

          <Animated.View style={{ transform: [{ scale: animValues.buttonScale }] }}>
            <TouchableOpacity
              style={[styles.button, (!isFormValid || !!serverError) && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading || !isFormValid}
              activeOpacity={0.9}
            >
              <LinearGradient colors={['#FFD700', '#FFC400']} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? <ActivityIndicator size="small" color="#1c1c1e" /> : <Text style={styles.buttonText}>Login</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.footer}>
            <Text style={styles.linkText}> Continue as guest</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.replace('Register')} style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? <Text style={styles.linkText}>Sign Up here</Text></Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c1e' },
  background: { ...StyleSheet.absoluteFillObject },
  formContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  form: { backgroundColor: '#2c2c2e', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 },
  header: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#f5f5f7', marginBottom: 32, textAlign: 'center', letterSpacing: -0.5 },
  inputsContainer: { marginBottom: 24 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3a3a3c', borderRadius: 14, paddingHorizontal: 16, height: INPUT_HEIGHT, marginBottom: 4, borderWidth: 1, borderColor: '#3a3a3c' },
  inputActive: { borderColor: '#FFD700', shadowColor: '#FFD700', shadowOpacity: 0.2, shadowRadius: 10 },
  inputError: { borderColor: '#FF4D4D' },
  input: { flex: 1, marginLeft: 12, color: '#f5f5f7', fontSize: 16, fontFamily: 'Inter_400Regular', height: '100%' },
  eyeIcon: { padding: 8, marginLeft: 8 },
  errorText: { color: '#FF4D4D', fontSize: 12, marginBottom: 8, marginLeft: 4 },
  serverError: { color: '#FF4D4D', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  button: { height: BUTTON_HEIGHT, borderRadius: 14, overflow: 'hidden' },
  buttonDisabled: { opacity: 0.6 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#1c1c1e', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { color: '#c1c1c4', fontSize: 14, fontFamily: 'Inter_400Regular' },
  linkText: { color: '#FFD700', fontFamily: 'Inter_600SemiBold' }
});
