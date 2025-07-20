import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../src/api';
import { useNavigation, CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = width * 0.45;

export default function AddImages({ route }) {
  const navigation = useNavigation();
  const { propertyId, paid, images: passedImages } = route.params;
  const [images, setImages] = useState(passedImages || Array(4).fill(null));
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const LISTING_FEE = 30; // GH₵30 per listing

  // Navigate back to "Main" after upload by popping to initial route
   function onUploadComplete() {
  // instead of resetting to MyProperties alone, navigate into the Profile tab
  navigation.navigate('Main', {
    screen: 'Profile',
    params: { screen: 'MyProperties' },
  });
}


  const pickImage = async (index) => {
    setSelectedIndex(index);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo access in settings.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        aspect: [4, 3]
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.fileSize > 500 * 1024) {
        Alert.alert(
          'Image too large',
          'Each image must be smaller than 500 KB. Please pick a smaller file.'
        );
        return;
      }

      const newImgs = [...images];
      newImgs[index] = asset.uri;
      setImages(newImgs);
    } catch (err) {
      console.error('Image picker error', err);
      Alert.alert('Error', 'Could not open image picker.');
    } finally {
      setSelectedIndex(null);
    }
  };

  // Auto-upload after payment
  useEffect(() => {
    if (paid) {
      Alert.alert('Payment successful', 'Uploading images now...');
      handleUpload();
    }
  }, [paid]);

  const checkSubscription = async () => {
    try {
      const res = await api.get('/main/user-subscriptions/current/');
      if (res.status === 204) {
        return { subscribed: false, hasFreeQuota: false, freeRemaining: 0 };
      }
      const { has_free_quota, free_listings_remaining } = res.data;
      return {
        subscribed: true,
        hasFreeQuota: has_free_quota,
        freeRemaining: free_listings_remaining,
      };
    } catch {
      return { subscribed: false, hasFreeQuota: false, freeRemaining: 0 };
    }
  };

  const handleUpload = async () => {
    const uris = images.filter(Boolean);
    if (uris.length === 0) {
      Alert.alert('Select at least one image');
      return;
    }
    setUploading(true);
    try {
      for (const uri of uris) {
        const form = new FormData();
        form.append('images', {
          uri,
          name: uri.split('/').pop(),
          type: 'image/jpeg',
        });
        await api.post(
          `main/properties/${propertyId}/images/`,
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }
      Alert.alert(
        'Success',
        'Your post is in review and will be published shortly!',
        [{ text: 'OK', onPress: onUploadComplete }]
      );
    } catch (err) {
      console.error('Upload error', err.response || err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePost = async () => {
    const { subscribed, hasFreeQuota, freeRemaining } = await checkSubscription();

    if (subscribed && hasFreeQuota) {
      return handleUpload();
    }

    const message = subscribed
      ? `You have ${freeRemaining} free listing(s) remaining. Pay GH₵${LISTING_FEE} for this one?`
      : `You need to subscribe or pay a one-time fee of GH₵${LISTING_FEE} to post this property.`;

    Alert.alert(
      'Post Property',
      message,
      [
        {
          text: `Pay GH₵${LISTING_FEE}`,
          onPress: () =>
            navigation.navigate('PaystackPayment', {
              amount: LISTING_FEE,
              propertyId,
              promoCode: null,
              returnScreen: 'AddImages',
              images,
            }),
        },
        {
          text: 'Subscribe',
          onPress: () =>
            navigation.navigate('SubscriptionPlans', {
              propertyId,
              returnScreen: 'AddImages',
              images,
            }),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Add Images</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Add at least 1 photo (500 KB max each)
        </Text>
        
        <View style={styles.grid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <TouchableOpacity 
                style={[
                  styles.imageSlot, 
                  uri && styles.filledSlot,
                  selectedIndex === index && styles.selectedSlot
                ]}
                onPress={() => pickImage(index)}
              >
                {uri ? (
                  <>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        const newImgs = [...images];
                        newImgs[index] = null;
                        setImages(newImgs);
                      }}
                    >
                      <MaterialIcons name="delete" size={20} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <MaterialIcons name="add-a-photo" size={32} color="#777" />
                )}
              </TouchableOpacity>
              <Text style={styles.imageLabel}>Photo {index + 1}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Photo Tips:</Text>
          <View style={styles.tipItem}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>Use high-quality, well-lit photos</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>Show different angles of the property</Text>
          </View>
          <View style={styles.tipItem}>
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.tipText}>Include both interior and exterior shots</Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, uploading && styles.disabledButton]}
          onPress={handlePost}
          disabled={uploading || !images.some(uri => uri)}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Post Property</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.footerNote}>
          {images.filter(Boolean).length} of 4 photos added
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  content: {
    padding: 16,
    paddingBottom: 100
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  imageContainer: {
    width: IMAGE_SIZE,
    marginBottom: 24
  },
  imageSlot: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    backgroundColor: '#EDEDED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  filledSlot: {
    backgroundColor: '#FFF',
    borderColor: '#6E9CE0'
  },
  selectedSlot: {
    borderWidth: 2,
    borderColor: '#3A7BFF'
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4
  },
  imageLabel: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666'
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  tipText: {
    marginLeft: 8,
    color: '#555'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  button: {
    backgroundColor: '#3A7BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#A0BDFF'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  footerNote: {
    textAlign: 'center',
    marginTop: 12,
    color: '#777'
  }
});
