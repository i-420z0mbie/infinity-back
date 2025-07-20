// screens/MyProperties.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Alert, ScrollView, Dimensions, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCESS_TOKEN } from '../src/constant';
import api from '../src/api';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 140;
const IMAGE_WIDTH = 160;

function PropertyCard({ property, onEdit, onDelete }) {
  const scrollRef = useRef();
  const [currentImage, setCurrentImage] = useState(0);

  const goPrev = () => {
    const prev = currentImage === 0 ? property.images.length - 1 : currentImage - 1;
    setCurrentImage(prev);
    scrollRef.current?.scrollTo({ x: prev * IMAGE_WIDTH, animated: true });
  };

  const goNext = () => {
    const next = (currentImage + 1) % property.images.length;
    setCurrentImage(next);
    scrollRef.current?.scrollTo({ x: next * IMAGE_WIDTH, animated: true });
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#ffffff', '#f8f9ff']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.cardGradient}
      >
        <TouchableOpacity style={styles.card} onPress={onEdit} activeOpacity={0.8}>
          <View style={styles.left}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH))}
            >
              {property.images.map((img, idx) => (
                <Image key={idx} source={{ uri: img.images }} style={styles.image} />
              ))}
            </ScrollView>
            {property.images.length > 1 && (
              <>
                <TouchableOpacity style={[styles.navButton, styles.leftButton]} onPress={goPrev}>
                  <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navButton, styles.rightButton]} onPress={goNext}>
                  <Ionicons name="chevron-forward" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.right}>
            <View style={styles.headerRow}>
              <Text style={styles.price}>GH₵{Number(property.price).toLocaleString()}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                  <Ionicons name="create-outline" size={22} color="#5e7cff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={[styles.actionButton, styles.deleteBtn]}>
                  <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
            <Text style={styles.info} numberOfLines={1}>
              {property.number_of_bedrooms}bd • {property.number_of_bathrooms}ba • {property.property_type}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: property.is_published ? '#4CAF50' : '#FFC107' }]} />
              <Text style={styles.statusText}>
                {property.is_published ? 'Published' : 'Draft'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default function MyProperties() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const res = await api.get('main/properties/my-properties/');
      setProperties(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to load your properties.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) fetchProperties();
  }, [isFocused]);

  const handleDelete = (property) => () => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`main/properties/${property.id}/`);
            setProperties(prev => prev.filter(item => item.id !== property.id));
          } catch {
            Alert.alert('Error', 'Could not delete property.');
          }
        }}
      ]
    );
  };

  const handleEdit = (property) => () => navigation.navigate('EditProperty', { property });

  if (loading) return (
    <LinearGradient colors={['#f8f9ff', '#ffffff']} style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#5e7cff" />
      <Text style={styles.loadingText}>Loading your properties...</Text>
    </LinearGradient>
  );

  if (error) return (
    <LinearGradient colors={['#f8f9ff', '#ffffff']} style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
      <Text style={styles.errorText}>Failed to load properties</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchProperties}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <>
      <StatusBar style="light" />
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onEdit={handleEdit(item)}
            onDelete={handleDelete(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <LinearGradient colors={['#5e7cff', '#4d6dfa']} style={styles.header}>
            <Text style={styles.headerTitle}>My Properties</Text>
          </LinearGradient>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color="#5e7cff" />
            <Text style={styles.emptyTitle}>No Properties Found</Text>
            <Text style={styles.emptyText}>Start by adding your first property</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('AddProperty')}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <TouchableOpacity>

              </TouchableOpacity>
              
            </TouchableOpacity>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 30 },
  wrapper: { marginHorizontal: 16, marginVertical: 8 },
  cardGradient: {
    borderRadius: 16,
    padding: 2,
    shadowColor: '#5e7cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    height: CARD_HEIGHT,
  },
  left: { width: IMAGE_WIDTH, height: CARD_HEIGHT, position: 'relative' },
  image: { width: IMAGE_WIDTH, height: CARD_HEIGHT, resizeMode: 'cover' },
  navButton: {
    position: 'absolute',
    top: CARD_HEIGHT / 2 - 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  leftButton: { left: 8 },
  rightButton: { right: 8 },
  right: { flex: 1, padding: 16, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#2d2d2d', flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(94, 124, 255, 0.1)'
  },
  deleteBtn: { backgroundColor: 'rgba(255, 59, 48, 0.1)' },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#444', marginTop: 4 },
  info: { fontSize: 13, color: '#666', marginTop: 2, fontFamily: 'Inter_500Medium' },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(94, 124, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#444'
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 28,
    paddingTop: 20,
    justifyContent: 'center',
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.5
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_500Medium'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#2d2d2d',
    marginVertical: 16
  },
  retryButton: {
    backgroundColor: '#5e7cff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#2d2d2d',
    marginTop: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
    textAlign: 'center'
  },
  addButton: {
    backgroundColor: '#5e7cff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16
  }
});