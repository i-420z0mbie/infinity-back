// screens/Register.jsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api';

const { width } = Dimensions.get('window');
const INPUT_HEIGHT = 56;
const BUTTON_HEIGHT = 52;

export default function Register({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    accountType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inputFocus, setInputFocus] = useState({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
    password: false,
    phoneNumber: false,
    accountType: false
  });
  
  const animValues = {
    firstName: useRef(new Animated.Value(0)).current,
    lastName: useRef(new Animated.Value(0)).current,
    username: useRef(new Animated.Value(0)).current,
    email: useRef(new Animated.Value(0)).current,
    password: useRef(new Animated.Value(0)).current,
    phoneNumber: useRef(new Animated.Value(0)).current,
    accountType: useRef(new Animated.Value(0)).current,
    buttonScale: useRef(new Animated.Value(1)).current
  };

  const animateInput = (inputName, toValue) => {
    Animated.timing(animValues[inputName], {
      toValue,
      duration: 150,
      easing: Easing.ease,
      useNativeDriver: false
    }).start();
  };

  const handleFocus = (inputName) => {
    setInputFocus({ ...inputFocus, [inputName]: true });
    animateInput(inputName, 1);
  };

  const handleBlur = (inputName) => {
    setInputFocus({ ...inputFocus, [inputName]: false });
    if (!formData[inputName]) {
      animateInput(inputName, 0);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(animValues.buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(animValues.buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleRegister = async () => {
    animateButton();
    
    // Validate required fields
    const requiredFields = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phoneNumber: formData.phoneNumber,
      accountType: formData.accountType
    };

    if (Object.values(requiredFields).some(value => !value.trim())) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }

    // Validate password length
    if (!validatePassword(formData.password)) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('core/user/create/', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phoneNumber,
        account_type: formData.accountType
      });
      console.log('Sending phone number:', formData.phoneNumber);

      Alert.alert(
        '🎉 Registration Successful!',
        `Welcome ${formData.username}!\n\nPlease login with your credentials.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Login')
          }
        ]
      );
      
      // Clear form after successful registration
      setFormData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        phoneNumber: '',
        accountType: ''
      });

    } catch (err) {
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (err.response?.data) {
        // Handle email duplication error
        if (err.response.data.email) {
          errorMessage = err.response.data.email[0];
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        } else {
          errorMessage = Object.values(err.response.data)
            .flat()
            .join('\n');
        }
      }
      
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <LinearGradient
        colors={['#1a1a1d', '#2d2d32']}
        locations={[0.2, 0.8]}
        style={StyleSheet.absoluteFill}
      />

      {/* Dismiss keyboard when tapping outside or dragging */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Animated.View style={[styles.form, { transform: [{ scale: animValues.buttonScale }] }]}>
            <Text style={styles.header}>Create Account</Text>

            <View style={styles.inputsContainer}>
              {/* First Name Input */}
              <Animated.View style={[
                  styles.inputWrapper,
                  getAnimatedInputStyle('firstName')
                ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={inputFocus.firstName ? '#FFD700' : '#c1c1c4'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  placeholderTextColor="#666"
                  value={formData.firstName}
                  onChangeText={text => setFormData({ ...formData, firstName: text })}
                  onFocus={() => handleFocus('firstName')}
                  onBlur={() => handleBlur('firstName')}
                  accessibilityLabel="First name input"
                />
              </Animated.View>

              {/* Last Name Input */}
              <Animated.View style={[
                  styles.inputWrapper,
                  getAnimatedInputStyle('lastName')
                ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={inputFocus.lastName ? '#FFD700' : '#c1c1c4'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  placeholderTextColor="#666"
                  value={formData.lastName}
                  onChangeText={text => setFormData({ ...formData, lastName: text })}
                  onFocus={() => handleFocus('lastName')}
                  onBlur={() => handleBlur('lastName')}
                  accessibilityLabel="Last name input"
                />
              </Animated.View>

              {/* Username Input */}
              <Animated.View style={[
                  styles.inputWrapper,
                  getAnimatedInputStyle('username')
                ]}>
                <Ionicons 
                  name="at-outline" 
                  size={20} 
                  color={inputFocus.username ? '#FFD700' : '#c1c1c4'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  value={formData.username}
                  onChangeText={text => setFormData({ ...formData, username: text })}
                  onFocus={() => handleFocus('username')}
                  onBlur={() => handleBlur('username')}
                  accessibilityLabel="Username input"
                />
              </Animated.View>

              {/* Email Input */}
              <Animated.View style={[
                  styles.inputWrapper,
                  getAnimatedInputStyle('email')
                ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={inputFocus.email ? '#FFD700' : '#c1c1c4'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={text => setFormData({ ...formData, email: text })}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  accessibilityLabel="Email input"
                />
              </Animated.View>

              {/* Phone Input */}
              <Animated.View style={[
                  styles.inputWrapper,
                  getAnimatedInputStyle('phoneNumber')
                ]}>
                <Ionicons 
                  name="call-outline" 
                  size={20} 
                  color={inputFocus.phoneNumber ? '#FFD700' : '#c1c1c4'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                  value={formData.phoneNumber}
                  onChangeText={text => setFormData({ ...formData, phoneNumber: text.replace(/[^0-9]/g, '') })}
                  onFocus={() => handleFocus('phoneNumber')}
                  onBlur={() => handleBlur('phoneNumber')}
                  accessibilityLabel="Phone input"
                />
              </Animated.View>

              {/* Password Input */}
              <Animated.View style={[
                  styles.inputWrapper,
                  getAnimatedInputStyle('password')
                ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={inputFocus.password ? '#FFD700' : '#c1c1c4'} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={formData.password}
                  onChangeText={text => setFormData({ ...formData, password: text })}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  accessibilityLabel="Password input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#c1c1c4" 
                  />
                </TouchableOpacity>
              </Animated.View>
              <Text style={[
                  styles.helperText,
                  formData.password.length > 0 && !validatePassword(formData.password) 
                    ? styles.helperTextError 
                    : styles.helperTextValid
                ]}>
                {formData.password.length > 0 && !validatePassword(formData.password)
                  ? 'Password must be at least 8 characters'
                  : 'Minimum 8 characters'}
              </Text>

              {/* Account Type Picker */}
              <Animated.View style={[
                  styles.pickerWrapper,
                  { 
                    borderColor: animValues.accountType.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#3a3a3c', '#FFD700']
                    }),
                    shadowOpacity: animValues.accountType.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.2]
                    })
                  }
                ]}>
                <Picker
                  selectedValue={formData.accountType}
                  onValueChange={value => {
                    setFormData({ ...formData, accountType: value });
                    if (value) handleFocus('accountType');
                    else handleBlur('accountType');
                  }}
                  style={styles.picker}
                  dropdownIconColor="#FFD700"
                >
                  <Picker.Item label="Select Account Type..." value="" />
                  <Picker.Item label="Regular" value="regular" />
                  <Picker.Item label="Agent" value="agent" />
                  <Picker.Item label="Landlord" value="landlord" />
                </Picker>
              </Animated.View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FFD700', '#FFC400']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#1c1c1e" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.linkText}>Login here</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

  function getAnimatedInputStyle(fieldName) {
    return {
      borderColor: animValues[fieldName].interpolate({
        inputRange: [0, 1],
        outputRange: ['#3a3a3c', '#FFD700']
      }),
      shadowOpacity: animValues[fieldName].interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.2]
      })
    };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c1e',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    backgroundColor: '#2c2c2e',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#f5f5f7',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  inputsContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3c',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: INPUT_HEIGHT,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#FFD700',
    shadowRadius: 10,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#f5f5f7',
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  pickerWrapper: {
    backgroundColor: '#3a3a3c',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#f5f5f7',
    height: INPUT_HEIGHT,
  },
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#1c1c1e',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerText: {
    color: '#c1c1c4',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  linkText: {
    color: '#FFD700',
    fontFamily: 'Inter_600SemiBold',
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 48,
    marginBottom: 8,
    fontFamily: 'Inter_400Regular'
  },
  helperTextError: {
    color: '#ff4444'
  },
  helperTextValid: {
    color: '#00C851'
  },
});
