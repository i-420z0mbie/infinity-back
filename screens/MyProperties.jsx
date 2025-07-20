// screens/MyProperties.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCESS_TOKEN } from '../src/constant';
import api from '../src/api';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 180;
const IMAGE_WIDTH = 160;

function PropertyCard({ property, onPress, onEdit, onDelete }) {
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
        <View style={styles.card}>
          {/* Property content - clickable for details */}
          <TouchableOpacity 
            style={styles.cardContent} 
            onPress={onPress} 
            activeOpacity={0.9}
          >
            <View style={styles.left}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e =>
                  setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH))
                }
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
              <Text style={styles.price}>
                GH₵{Number(property.price).toLocaleString()}
              </Text>
              <Text style={styles.title} numberOfLines={1}>
                {property.title}
              </Text>
              <Text style={styles.info} numberOfLines={1}>
                {property.number_of_bedrooms}bd • {property.number_of_bathrooms}ba • {property.property_type}
              </Text>
              
              {/* Verification Status */}
              <View style={[
                styles.statusContainer,
                { backgroundColor: property.is_verified ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)' }
              ]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: property.is_verified ? '#4CAF50' : '#FFC107' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {property.is_verified ? 'Verified' : 'In Review'}
                </Text>
              </View>
              
              {/* Publication Status */}
              <View style={[
                styles.statusContainer,
                { marginTop: 4, backgroundColor: 'rgba(94, 124, 255, 0.1)' }
              ]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: property.is_published ? '#4CAF50' : '#FFC107' },
                  ]}
                />
                <Text style={styles.statusText}>
                  {property.is_published ? 'Published' : 'Draft'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Ionicons name="create-outline" size={22} color="#5e7cff" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={[styles.actionButton, styles.deleteBtn]}>
              <Ionicons name="trash-outline" size={22} color="#ff3b30" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

export default function MyProperties() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  // Fetch properties; if isRefresh, only toggle refreshing state
  const fetchProperties = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      const res = await api.get('main/properties/my-properties/');
      if (isMounted.current) {
        setProperties(res.data);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        Alert.alert('Error', 'Failed to load your properties.');
      }
    } finally {
      if (isMounted.current) {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProperties();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isFocused) {
      // Refresh when screen comes back into focus
      fetchProperties();
    }
  }, [isFocused]);

  const handleRefresh = () => {
    fetchProperties(true);
  };

  const handleDelete = (property) => () => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`main/properties/${property.id}/`);
              setProperties(prev => prev.filter(item => item.id !== property.id));
            } catch {
              Alert.alert('Error', 'Could not delete property.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (property) => () => {
    if (!property.is_verified) {
      Alert.alert('Cannot Edit', 'Property is still in review.');
    } else {
      navigation.navigate('EditProperty', { property });
    }
  };

  const handleViewProperty = (property) => {
    // Fixed: Use 'id' as the parameter name to match Home.jsx
    navigation.navigate('Details', { id: property.id });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f8f9ff', '#ffffff']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5e7cff" />
        <Text style={styles.loadingText}>Loading your properties...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#f8f9ff', '#ffffff']} style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff4444" />
        <Text style={styles.errorText}>Failed to load properties</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchProperties()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <FlatList
        data={properties}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => handleViewProperty(item)}
            onEdit={handleEdit(item)}
            onDelete={handleDelete(item)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#5e7cff"
            colors={['#5e7cff']}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Ionicons name="home" size={20} color="#fff" />
              <Text style={styles.homeButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color="#5e7cff" />
            <Text style={styles.emptyTitle}>No Properties Found</Text>
            <Text style={styles.emptyText}>Start by adding your first property</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('PostAd')}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 30 },
  wrapper: { marginHorizontal: 16, marginVertical: 12 },
  cardGradient: {
    borderRadius: 20,
    padding: 2,
    shadowColor: '#5e7cff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    height: CARD_HEIGHT,
  },
  cardContent: {
    flexDirection: 'row',
    height: CARD_HEIGHT - 50, // Reserve space for action buttons
  },
  left: { 
    width: IMAGE_WIDTH, 
    height: '100%', 
    position: 'relative' 
  },
  image: { 
    width: IMAGE_WIDTH, 
    height: '100%', 
    resizeMode: 'cover' 
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
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
  right: { 
    flex: 1, 
    padding: 16, 
    justifyContent: 'center' 
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#2d2d2d',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#444',
    marginTop: 4,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    height: 50,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteBtn: {
    borderLeftWidth: 1,
    borderLeftColor: '#f0f0f0',
  },
  actionText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#5e7cff',
  },
  deleteText: {
    color: '#ff3b30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#2d2d2d',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#5e7cff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#2d2d2d',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Inter_500Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#5e7cff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: '#5e7cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
    // backgroundColor: '#fff',
    // borderBottomWidth: 1,
    // borderBottomColor: '#f0f0f0',
  },
  // headerTitle: {
  //   fontSize: 26,
  //   fontFamily: 'Inter_700Bold',
  //   color: '#2d2d2d',
  // },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5e7cff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#5e7cff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  homeButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});