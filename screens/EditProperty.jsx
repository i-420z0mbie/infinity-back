// screens/EditProperty.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
  ScrollView as RNScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

export default function EditProperty() {
  const navigation = useNavigation();
  const route = useRoute();
  const { property } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state prefilled (all strings for dropdown values)
  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);
  const [type, setType] = useState(property.type); // string
  const [price, setPrice] = useState(String(property.price));
  const [bedrooms, setBedrooms] = useState(String(property.number_of_bedrooms));
  const [bathrooms, setBathrooms] = useState(String(property.number_of_bathrooms));
  const [propertyType, setPropertyType] = useState(property.property_type); // string
  const [status, setStatus] = useState(property.status); // string
  const [region, setRegion] = useState(String(property.city.region.id)); // string
  const [city, setCity] = useState(String(property.city.id)); // string
  const [featuresList, setFeaturesList] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState(
    property.features.map(f => f.id)
  );

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [images, setImages] = useState(property.images);
  const [newImages, setNewImages] = useState([]); // For images to be uploaded

  const TYPE_CHOICES = [
    { value: 'rental', label: 'rental' },
    { value: 'sale', label: 'sale' },
  ];
  const PROPERTY_TYPE_CHOICES = property.property_type_choices || [
    'single room',
    'self contained',
    'chamber & hall',
    'apartment',
    'serviced appartment',
    'duplex',
    'hostel',
    'air-bnb',
    'guest house',
    'commercial',
  ];
  const STATUS_CHOICES = ['available', 'rented', 'sold'];

  // Modal visibility state
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPropertyTypeModal, setShowPropertyTypeModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          navigation.replace('Login');
          return;
        }
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
        Alert.alert('Error', 'Could not load lookup data');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter cities by selected region (compare as strings)
  const citiesForRegion = cities.filter(
    c => String(c.region.id) === region
  );

  // Get display labels
  const selectedTypeLabel =
    TYPE_CHOICES.find(c => c.value === type)?.label || 'Select listing type...';
  const selectedPropertyTypeLabel =
    PROPERTY_TYPE_CHOICES.find(pt => pt === propertyType) || 'Select property type...';
  const selectedRegionLabel =
    regions.find(r => String(r.id) === region)?.name || 'Select region...';
  const selectedCityLabel = region
    ? citiesForRegion.find(c => String(c.id) === city)?.city || 'Select city...'
    : 'Choose region first';
  const selectedStatusLabel =
    STATUS_CHOICES.find(s => s === status) || 'Select status...';

  const handleSave = async () => {
    if (!title || !description || !price || !region || !city) {
      Alert.alert('Missing fields', 'Please fill all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        type,
        price,
        number_of_bedrooms: parseInt(bedrooms, 10),
        number_of_bathrooms: parseInt(bathrooms, 10),
        property_type: propertyType,
        city, // string ID
        detailed_address: description,
        status,
        features: selectedFeatures,
      };
      await api.patch(`main/properties/${property.id}/`, payload);
      Alert.alert('Success', 'Property updated');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imgId) => {
    Alert.alert(
      'Delete Image',
      'Delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(
                `main/properties/${property.id}/images/${imgId}/`
              );
              setImages(imgs => imgs.filter(i => i.id !== imgId));
            } catch {
              Alert.alert('Error', 'Could not delete image');
            }
          },
        },
      ]
    );
  };

  const handleRemoveNewImage = (index) => {
    const newImagesCopy = [...newImages];
    newImagesCopy.splice(index, 1);
    setNewImages(newImagesCopy);
  };

  const handleAddImages = async () => {
    // Check if we can add more images
    if (images.length + newImages.length >= 4) {
      Alert.alert('Maximum images', 'You can only have up to 4 images');
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos to add images');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4 - (images.length + newImages.length),
    });

    if (!result.canceled) {
      const validImages = [];
      const oversizedImages = [];

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        // Check file size (500KB limit)
        if (asset.fileSize > 500 * 1024) {
          const name = asset.fileName || `Image ${i + 1}`;
          oversizedImages.push(name);
        } else {
          validImages.push({
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}_${i}.jpg`,
            type: 'image/jpeg',
          });
        }
      }

      // Show alert if any images were oversized
      if (oversizedImages.length > 0) {
        Alert.alert(
          'Image too large',
          `The following images exceed 500KB and were skipped: ${oversizedImages.join(', ')}`
        );
      }

      // Add valid images to newImages array
      if (validImages.length > 0) {
        setNewImages(prev => [...prev, ...validImages]);
      }
    }
  };

  const uploadNewImages = async () => {
    if (!newImages.length) return;
    setUploading(true);

    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      const url = `${api.defaults.baseURL}main/properties/${property.id}/add_images/`;

      const formData = new FormData();
      newImages.forEach(img =>
        formData.append('images', {
          uri: img.uri,
          name: img.name,
          type: img.type,
        })
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // note: no Content-Type here—fetch will set the correct multipart boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Upload failed:', response.status, text);
        throw new Error('Upload failed');
      }

      const newOnes = await response.json();   // your view returns an array of images
      setImages(prev => [...prev, ...newOnes]);
      setNewImages([]);
    } catch (err) {
      console.error(err);
      Alert.alert('Upload failed', 'Could not upload your images.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5e7cff" />
      </View>
    );
  }

  const totalImages = images.length + newImages.length;

  return (
    <>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Edit Property</Text>

          <Text style={styles.sectionTitle}>Images ({totalImages}/4)</Text>
          <View style={styles.imagesRow}>
            {/* Existing images from server */}
            {images.map(img => (
              <View key={img.id} style={styles.imageWrapper}>
                <Image source={{ uri: img.images }} style={styles.image} />
                <TouchableOpacity
                  style={styles.delIcon}
                  onPress={() => handleDeleteImage(img.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* New images to be uploaded */}
            {newImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri: img.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.delIcon}
                  onPress={() => handleRemoveNewImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add Image Button */}
            {totalImages < 4 && (
              <TouchableOpacity
                style={styles.addImageBtn}
                onPress={handleAddImages}
                disabled={uploading}
              >
                <Ionicons name="add-circle" size={36} color="#5e7cff" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Upload Images Button */}
          {newImages.length > 0 && (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={uploadNewImages}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.uploadText}>
                  Upload {newImages.length} Image{newImages.length > 1 ? 's' : ''}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.formContainer}>
            {/* Title */}
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Type & Price */}
            <View style={styles.row}>
              <View style={styles.halfGroup}>
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
                        {TYPE_CHOICES.map(c => (
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
              <View style={styles.halfGroup}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Bedrooms & Bathrooms */}
            <View style={styles.row}>
              <View style={styles.halfGroup}>
                <Text style={styles.label}>Bedrooms</Text>
                <TextInput
                  style={styles.input}
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfGroup}>
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
                    {PROPERTY_TYPE_CHOICES.map(pt => (
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

            {/* Features */}
            <Text style={styles.label}>Amenities & Features</Text>
            <View style={styles.featuresContainer}>
              {featuresList.map(f => {
                const sel = selectedFeatures.includes(f.id);
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
                      sel && styles.featurePillActive,
                    ]}
                    onPress={() => {
                      setSelectedFeatures(prev =>
                        sel ? prev.filter(x => x !== f.id) : [...prev, f.id]
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.featureText,
                        sel && styles.featureTextActive,
                      ]}
                    >
                      {sel ? '✓ ' : ''}
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Location: Region */}
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
                    {regions.map(r => (
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

            {/* Location: City */}
            <Text style={styles.label}>City</Text>
            <TouchableOpacity
              style={[
                styles.dropdownContainer,
                !region && styles.dropdownDisabled,
              ]}
              onPress={() => region && setShowCityModal(true)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !region && styles.textDisabled,
                ]}
              >
                {selectedCityLabel}
              </Text>
            </TouchableOpacity>
            <Modal visible={showCityModal} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Select City</Text>
                  <RNScrollView>
                    {citiesForRegion.map(c => (
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

            {/* Status */}
            <Text style={styles.label}>Status</Text>
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
                    {STATUS_CHOICES.map(s => (
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

            {/* Save */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={saving || uploading}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fafcff' },
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 25,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  imageWrapper: { position: 'relative', marginRight: 12, marginBottom: 12 },
  image: { width: 80, height: 80, borderRadius: 8 },
  delIcon: { position: 'absolute', top: -6, right: -6 },
  addImageBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  formContainer: {},
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfGroup: { flex: 1 },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    marginBottom: 16,
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
    marginBottom: 16,
  },
  featurePill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8,
    marginBottom: 8,
  },
  featurePillActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  featureText: { fontSize: 14, color: '#64748b' },
  featureTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#5e7cff',
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 20,
    marginBottom: 70,
  },
  saveText: { color: '#fff', fontWeight: '600' },
  uploadBtn: {
    backgroundColor: '#10b981',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadText: { color: '#fff', fontWeight: '600' },
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