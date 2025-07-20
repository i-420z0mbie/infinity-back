// screens/PostAd.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
  Modal,
  ScrollView as RNScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

export default function PostAd({ navigation }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form state (all strings)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('rental');               // listing type (string)
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [propertyType, setPropertyType] = useState('apartment');
  const [region, setRegion] = useState('');                 // region ID as string
  const [city, setCity] = useState('');                     // city ID as string
  const [status, setStatus] = useState('available');        // availability
  const [featuresList, setFeaturesList] = useState([]);     // array of { id: number, name: { name: string } }
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  // Dropdown data from API
  const [regions, setRegions] = useState([]); // e.g. [{ id: 1, name: "Greater Accra" }, ...]
  const [cities, setCities] = useState([]);   // e.g. [{ id: 5, city: "Accra", region: { id: 1 } }, ...]

  // Choice arrays (static)
  const TYPE_CHOICES = [
    { value: 'rental', label: 'rental' },
    { value: 'short rental', label: 'short rental' },
    { value: 'sale', label: 'sale' },
  ];
  const PROPERTY_TYPE_CHOICES = [
    'single room',
    'self contained',
    'chamber & hall',
    'apartment',
    'serviced apartment',
    'duplex',
    'hostel',
    'guest house',
    'commercial',
    'air-bnb'
  ];
  const STATUS_CHOICES = ['available', 'not available'];

  // Modal visibility state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // 1️⃣ Check for auth token on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token && mounted) {
        navigation.navigate('Login');
      } else if (mounted) {
        setCheckingAuth(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigation]);

  // 2️⃣ Load regions, cities & features from backend
  useEffect(() => {
    let mounted = true;
    const loadLookups = async () => {
      try {
        const [rRes, cRes, fRes] = await Promise.all([
          api.get('main/regions/'),
          api.get('main/cities/'),
          api.get('main/property_features/'),
        ]);
        if (!mounted) return;
        setRegions(rRes.data);
        setCities(cRes.data);
        setFeaturesList(fRes.data);
      } catch {
        Alert.alert('Error', 'Could not load lookup data.');
      }
    };
    loadLookups();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter cities array by selected region (both are strings)
  const citiesForRegion = cities.filter(
    (c) => String(c.region?.id) === region
  );

  // Get display labels
  const selectedTypeLabel = TYPE_CHOICES.find(c => c.value === type)?.label || 'Select type...';
  const selectedPropertyTypeLabel = propertyType || 'Select property type...';
  const selectedRegionLabel = regions.find(r => String(r.id) === region)?.name || 'Select region...';
  const selectedCityLabel = citiesForRegion.find(c => String(c.id) === city)?.city || (region ? 'Select city...' : 'Choose region first');
  const selectedStatusLabel = status || 'Select status...';

  // 3️⃣ Handle form submission
  const handleSubmit = async () => {
    if (!title || !description || !price || !region || !city) {
      Alert.alert('Missing fields', 'Please fill out all required fields.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        title,
        description,
        type,
        price,
        number_of_bedrooms: parseInt(bedrooms, 10),
        number_of_bathrooms: parseInt(bathrooms, 10),
        property_type: propertyType,
        city,                       // sending city ID (string); backend should accept either stringified or numeric
        detailed_address: description,
        status,
        features: selectedFeatures, // array of numeric IDs
      };
      const res = await api.post('main/properties/', payload);
      const newId = res.data.id;
      navigation.navigate('AddImages', { propertyId: newId });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
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
            <Text style={styles.subHeader}>
              Fill in the details to get started
            </Text>
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

            {/* Description */}
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

            {/* Row: Listing Type & Price */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Listing Type</Text>
                <TouchableOpacity
                  style={styles.dropdownContainer}
                  onPress={() => setShowTypeModal(true)}
                >
                  <Text style={styles.dropdownText}>{selectedTypeLabel}</Text>
                </TouchableOpacity>
                <Modal visible={showTypeModal} transparent animationType="fade">
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>Select Listing Type</Text>
                      <RNScrollView>
                        {TYPE_CHOICES.map((c) => (
                          <TouchableOpacity
                            key={c.value}
                            style={styles.modalItem}
                            onPress={() => {
                              setType(c.value);
                              setShowTypeModal(false);
                            }}
                          >
                            <Text style={styles.modalItemText}>{c.label}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.modalCloseBtn}
                          onPress={() => setShowTypeModal(false)}
                        >
                          <Text style={styles.modalCloseText}>Cancel</Text>
                        </TouchableOpacity>
                      </RNScrollView>
                    </View>
                  </View>
                </Modal>
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

            {/* Row: Bedrooms & Bathrooms */}
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
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowPropertyTypeModal(true)}
              >
                <Text style={styles.dropdownText}>{selectedPropertyTypeLabel}</Text>
              </TouchableOpacity>
              <Modal visible={showPropertyTypeModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Property Type</Text>
                    <RNScrollView>
                      {PROPERTY_TYPE_CHOICES.map((pt) => (
                        <TouchableOpacity
                          key={pt}
                          style={styles.modalItem}
                          onPress={() => {
                            setPropertyType(pt);
                            setShowPropertyTypeModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>{pt}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setShowPropertyTypeModal(false)}
                      >
                        <Text style={styles.modalCloseText}>Cancel</Text>
                      </TouchableOpacity>
                    </RNScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            {/* Features */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amenities & Features</Text>
              <View style={styles.featuresContainer}>
                {featuresList.map((f) => {
                  const selected = selectedFeatures.includes(f.id);
                  const label =
                    typeof f.name === 'string'
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
              <Text style={styles.label}>Region</Text>
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowRegionModal(true)}
              >
                <Text style={styles.dropdownText}>{selectedRegionLabel}</Text>
              </TouchableOpacity>
              <Modal visible={showRegionModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Region</Text>
                    <RNScrollView>
                      {regions.map((r) => (
                        <TouchableOpacity
                          key={r.id}
                          style={styles.modalItem}
                          onPress={() => {
                            setRegion(String(r.id));
                            setCity('');
                            setShowRegionModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>{r.name}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setShowRegionModal(false)}
                      >
                        <Text style={styles.modalCloseText}>Cancel</Text>
                      </TouchableOpacity>
                    </RNScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownContainer,
                  !region && styles.dropdownDisabled,
                ]}
                onPress={() => region && setShowCityModal(true)}
              >
                <Text style={[styles.dropdownText, !region && styles.textDisabled]}>
                  {selectedCityLabel}
                </Text>
              </TouchableOpacity>
              <Modal visible={showCityModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select City</Text>
                    <RNScrollView>
                      {citiesForRegion.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.modalItem}
                          onPress={() => {
                            setCity(String(c.id));
                            setShowCityModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>{c.city}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setShowCityModal(false)}
                      >
                        <Text style={styles.modalCloseText}>Cancel</Text>
                      </TouchableOpacity>
                    </RNScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Availability Status</Text>
              <TouchableOpacity
                style={styles.dropdownContainer}
                onPress={() => setShowStatusModal(true)}
              >
                <Text style={styles.dropdownText}>{selectedStatusLabel}</Text>
              </TouchableOpacity>
              <Modal visible={showStatusModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Select Status</Text>
                    <RNScrollView>
                      {STATUS_CHOICES.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={styles.modalItem}
                          onPress={() => {
                            setStatus(s);
                            setShowStatusModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setShowStatusModal(false)}
                      >
                        <Text style={styles.modalCloseText}>Cancel</Text>
                      </TouchableOpacity>
                    </RNScrollView>
                  </View>
                </View>
              </Modal>
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
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingBottom: 40, marginBottom: 35},
  headerContainer: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#5e7cff',
    shadowColor: '#5e7cff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 35,
  },
  header: {
    fontSize: 28,
    fontFamily: 'Poppins-ExtraBold',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  half: {
    flex: 1,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1e293b',
  },
  dropdownDisabled: {
    backgroundColor: '#f0f0f0',
  },
  textDisabled: {
    color: '#a1a1a1',
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
    marginBottom: 15,
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1e293b',
  },
  modalCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#1e3a8a',
  },
});
