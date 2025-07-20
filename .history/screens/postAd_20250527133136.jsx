// screens/PostAd.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

export default function PostAd({ navigation }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('rental');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [propertyType, setPropertyType] = useState('apartment');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('available');
  const [featuresList, setFeaturesList] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  // Dropdown data
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);

  // Choice lists
  const TYPE_CHOICES = [
    { value: 'rental', label: 'rental' },
    { value: 'short rental', label: 'short_rental' },
    { value: 'sale',   label: 'sale'   },
  ];
  const PROPERTY_TYPE_CHOICES = [
    'single room','self contained','chamber & hall',
    'apartment','serviced apartment','duplex',
    'hostel','guest house','commercial'
  ];
  const STATUS_CHOICES = ['available','rented','sold'];

  // 1️⃣ Auth check
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token && mounted) navigation.replace('Login');
      else if (mounted) setCheckingAuth(false);
    })();
    return () => { mounted = false };
  }, [navigation]);

  // 2️⃣ Load regions, cities & features
  useEffect(() => {
    let mounted = true;
    const loadLookups = async () => {
      try {
        const [rRes,cRes,fRes] = await Promise.all([
          api.get('main/regions/'),
          api.get('main/cities/'),
          api.get('main/property_features/'),
        ]);
        if (!mounted) return;
        setRegions(rRes.data);
        setCities(cRes.data);
        setFeaturesList(fRes.data);
      } catch {
        Alert.alert('Error','Could not load lookup data.');
      }
    };
    loadLookups();
    return () => { mounted = false };
  }, []);

  // Filter cities by region (coerce to string)
  const citiesForRegion = cities.filter(
    c => String(c.region?.id) === String(region)
  );

  // 3️⃣ Submit handler
  const handleSubmit = async () => {
    if (!title||!description||!price||!region||!city) {
      Alert.alert('Missing fields','Please fill out all required fields.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        title,
        description,
        type,
        price,
        number_of_bedrooms: parseInt(bedrooms,10),
        number_of_bathrooms: parseInt(bathrooms,10),
        property_type: propertyType,
        city,
        detailed_address: description, // or separate address input
        status,
        features: selectedFeatures,
      };
      const res = await api.post('main/properties/', payload);
      const newId = res.data.id;
      // Navigate to AddImages
      navigation.replace('AddImages', { propertyId: newId });
    } catch(err) {
      Alert.alert('Error', err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF"/>
      </View>
    );
  }

  return (
    <>
    <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>List Your Property</Text>
            <Text style={styles.subHeader}>Fill in the details to get started</Text>
          </View>

          <View style={styles.formContainer}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Spacious 2BR House"
                placeholderTextColor="#94a3b8"
                maxLength={50}
              />
            </View>


            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe amenities, location, and unique features..."
                placeholderTextColor="#94a3b8"
                multiline
              />
            </View>


            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Listing Type</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={type}
                    onValueChange={setType}
                    dropdownIconColor="#64748b"
                  >
                    {TYPE_CHOICES.map((c) => (
                      <Picker.Item key={c.value} label={c.label} value={c.value} />
                    ))}
                  </Picker>
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Price (GHC)</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholder="1500.00"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>


            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputGroup, styles.half]}>
                <Text style={styles.label}>Bathrooms</Text>
                <TextInput
                  style={styles.input}
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Property Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={propertyType}
                  onValueChange={setPropertyType}
                  dropdownIconColor="#64748b"
                >
                  {PROPERTY_TYPE_CHOICES.map((pt) => (
                    <Picker.Item key={pt} label={pt} value={pt} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Features */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amenities & Features</Text>
              <View style={styles.featuresContainer}>
                {featuresList.map((f) => {
                  const selected = selectedFeatures.includes(f.id);
                  const label = typeof f.name === 'string'
                    ? f.name
                    : typeof f.name === 'object' && f.name !== null
                    ? f.name.name || ''
                    : '';
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.featurePill,
                        selected && styles.featurePillActive,
                      ]}
                      onPress={() => {
                        setSelectedFeatures((sel) =>
                          sel.includes(f.id)
                            ? sel.filter((x) => x !== f.id)
                            : [...sel, f.id]
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.featureText,
                          selected && styles.featureTextActive,
                        ]}
                      >
                        {selected ? '✓ ' : ''}
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.half]}>
                  <Text style={styles.subLabel}>Region</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={region}
                      onValueChange={setRegion}
                      dropdownIconColor="#64748b"
                    >
                      <Picker.Item label="Select region..." value="" />
                      {regions.map((r) => (
                        <Picker.Item key={r.id} label={r.name} value={r.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={[styles.inputGroup, styles.half]}>
                  <Text style={styles.subLabel}>City</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={city}
                      onValueChange={setCity}
                      enabled={!!region}
                      dropdownIconColor="#64748b"
                    >
                      <Picker.Item
                        label={region ? "Select city..." : "Choose region first"}
                        value=""
                      />
                      {citiesForRegion.map((c) => (
                        <Picker.Item key={c.id} label={c.city} value={c.id} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Availability Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={status}
                  onValueChange={setStatus}
                  dropdownIconColor="#64748b"
                >
                  {STATUS_CHOICES.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Add Images</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingBottom: 40 },
  headerContainer: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#5e7cff',
    shadowColor: '#5e7cff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    elevation: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  half: {
    flex: 1,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featurePill: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  featurePillActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  featureText: {
    color: '#64748b',
    fontSize: 14,
  },
  featureTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
