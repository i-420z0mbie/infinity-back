import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../src/constant';
import api from '../src/api';

export default function Account() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [fieldValues, setFieldValues] = useState({});
  const [accountTypeOptions] = useState([
    { label: "Regular", value: "regular" },
    { label: "Landlord", value: "landlord" },
    { label: "Agent", value: "agent" }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const res = await api.get('core/user/me/');
      setUserData(res.data);
      setFieldValues({
        username: res.data.username,
        email: res.data.email,
        password: '',
        account_type: res.data.account_type,
      });
      setError(null);
    } catch (err) {
      setError(err.message);
      if (err.response?.status === 401) {
        await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN]);
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        Alert.alert('Error', 'Failed to fetch account data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isFocused) fetchData(); }, [isFocused]);

  const handleSave = async () => {
    if (!editingField) return;
    const payload = editingField === 'password'
      ? { password: fieldValues.password }
      : { [editingField]: fieldValues[editingField] };
    try {
      setLoading(true);
      await api.patch('core/user/me/', payload);
      Alert.alert('Success', `${editingField} updated successfully.`);
      setEditingField(null);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, fieldKey, secure = false) => (
    <View style={styles.fieldRow}>
      <View style={styles.fieldIconContainer}>
        {fieldKey === 'username' && <Ionicons name="person-outline" size={20} color="#6366f1" />}
        {fieldKey === 'email' && <Ionicons name="mail-outline" size={20} color="#6366f1" />}
        {fieldKey === 'password' && <Ionicons name="lock-closed-outline" size={20} color="#6366f1" />}
        {fieldKey === 'account_type' && <Ionicons name="ribbon-outline" size={20} color="#6366f1" />}
      </View>
      
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {editingField === fieldKey ? (
          secure ? (
            <TextInput
              style={[styles.fieldInput, styles.activeInput]}
              placeholder={`Enter new ${label.toLowerCase()}`}
              placeholderTextColor="#94a3b8"
              value={fieldValues[fieldKey]}
              secureTextEntry
              onChangeText={text => setFieldValues({ ...fieldValues, [fieldKey]: text })}
            />
          ) : fieldKey === 'account_type' ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={fieldValues.account_type}
                onValueChange={val => setFieldValues({ ...fieldValues, account_type: val })}
                style={styles.picker}
                dropdownIconColor="#6366f1"
              >
                {accountTypeOptions.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
          ) : (
            <TextInput
              style={[styles.fieldInput, styles.activeInput]}
              placeholder={`Enter new ${label.toLowerCase()}`}
              placeholderTextColor="#94a3b8"
              value={fieldValues[fieldKey]}
              onChangeText={text => setFieldValues({ ...fieldValues, [fieldKey]: text })}
            />
          )
        ) : (
          <Text style={styles.fieldValue}>
            {fieldKey === 'password' ? '••••••••' : (
              fieldKey === 'account_type'
                ? accountTypeOptions.find(opt => opt.value === fieldValues.account_type)?.label
                : fieldValues[fieldKey]
            )}
          </Text>
        )}
        {editingField === fieldKey && (
          <Text style={styles.saveHint}>Press the save button to confirm changes →</Text>
        )}
      </View>

      <View style={styles.fieldActions}>
        {editingField === fieldKey ? (
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
            <LinearGradient
              colors={['#4f46e5', '#6366f1']}
              style={styles.saveBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => setEditingField(fieldKey)} 
            style={styles.editBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#6366f1" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  if (error) return (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={48} color="#ef4444" />
      <Text style={styles.errorText}>Failed to load account data</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
    <StatusBar style="light" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* <LinearGradient
          colors={['#6366f1', '#4f46e5']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="person-circle-outline" size={48} color="#fff" />
          <Text style={styles.title}>Account Settings</Text>
        </LinearGradient> */}

        <View style={styles.form}>
          {renderField('Username', 'username')}
          {renderField('Email', 'email')}
          {renderField('Password', 'password', true)}
          {renderField('Account Type', 'account_type')}
        </View>
      </ScrollView>
    </>  
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { 
    flex: 1, 
    marginBottom:,
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#f8fafc' 
  },
  errorText: { 
    fontSize: 18, 
    color: '#2d2d2d', 
    marginVertical: 16, 
    fontFamily: 'Inter-Medium' 
  },
  retryButton: { 
    backgroundColor: '#6366f1', 
    paddingVertical: 12, 
    paddingHorizontal: 32, 
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  retryText: { 
    color: '#fff', 
    fontSize: 16, 
    fontFamily: 'Inter-SemiBold' 
  },
  header: { 
    padding: 32,
    paddingTop: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'Poppins-Regular', 
    color: '#fff', 
    marginTop: 16 
  },
  form: { 
    marginHorizontal: 20, 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    paddingVertical: 8, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3
  },
  fieldRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  fieldIconContainer: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 8,
    marginRight: 16
  },
  fieldContent: {
    flex: 1
  },
  fieldLabel: { 
    fontSize: 14, 
    color: '#64748b', 
    fontFamily: 'Inter-Medium',
    marginBottom: 4 
  },
  fieldValue: { 
    fontSize: 16, 
    color: '#1e293b', 
    fontFamily: 'Inter-SemiBold' 
  },
  fieldInput: { 
    fontSize: 16, 
    color: '#1e293b', 
    fontFamily: 'Inter-SemiBold',
    paddingVertical: 6 
  },
  activeInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12
  },
  pickerContainer: { 
    marginTop: 8 
  },
  picker: {
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold'
  },
  fieldActions: { 
    marginLeft: 12 
  },
  saveBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  saveText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14
  },
  saveHint: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Inter-Italic'
  },
  editBtn: {
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    padding: 8
  }
});