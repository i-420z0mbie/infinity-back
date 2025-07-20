import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');
const STORAGE_KEY = 'previousSearches';
const MAX_SAVED = 10;

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    ordering: '',
  });
  const [cities, setCities] = useState([]);
  const [previousSearches, setPreviousSearches] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [promotedProperties, setPromotedProperties] = useState([]);
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const [verifiedProperties, setVerifiedProperties] = useState([]);
  const typingTimeout = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setPreviousSearches(JSON.parse(json));
      } catch (err) {
        console.error('Error loading previous searches:', err);
      }
    })();
    
    // Fetch special properties
    fetchSpecialProperties();
  }, []);

  const fetchSpecialProperties = async () => {
    try {
      // Fetch promoted properties
      const promotedRes = await api.get('/main/properties/?is_promoted=true');
      setPromotedProperties(promotedRes.data);

      
    } catch (err) {
      console.error('Error fetching special properties:', err);
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/main/cities/');
        setCities(res.data);
      } catch (err) {
        console.error('Error fetching cities:', err);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (query) {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (!query) {
      setSuggestions([]);
      return;
    }
    setTyping(true);
    typingTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(
          `/main/properties/?search=${encodeURIComponent(query)}`
        );
        setSuggestions(res.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setTyping(false);
      }
    }, 300);
  }, [query]);

  const buildQueryParams = (searchTerm = '', extraFilters = {}) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (extraFilters.city) params.append('city__id', extraFilters.city);
    if (extraFilters.type) params.append('type', extraFilters.type);
    if (extraFilters.propertyType)
      params.append('property_type', extraFilters.propertyType);
    if (extraFilters.minPrice) params.append('price__gte', extraFilters.minPrice);
    if (extraFilters.maxPrice) params.append('price__lte', extraFilters.maxPrice);
    if (extraFilters.ordering) params.append('ordering', extraFilters.ordering);
    return params.toString();
  };

  const fetchResults = async (searchTerm = query, appliedFilters = filters) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoadingResults(true);
    try {
      const qs = buildQueryParams(searchTerm, appliedFilters);
      const res = await api.get(`/main/properties/?${qs}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingResults(false);
    }
  };

  const refreshResults = async () => {
    setRefreshing(true);
    try {
      const qs = buildQueryParams(query, filters);
      const res = await api.get(`/main/properties/?${qs}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const saveSearch = async (term) => {
    if (!term) return;
    try {
      const updated = [term, ...previousSearches.filter(t => t !== term)].slice(
        0,
        MAX_SAVED
      );
      setPreviousSearches(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving search:', err);
    }
  };

  const onSubmit = () => {
    fetchResults();
    saveSearch(query);
    setSuggestions([]);
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchResults(query, filters);
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      type: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      ordering: '',
    });
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => navigation.navigate('Details', { id: item.id })}
    >
      <Image
        source={{ uri: item.images[0]?.images }}
        style={styles.thumbnail}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.imageOverlay}
      />
      
      <View style={styles.cardBadges}>
        {item.is_featured && (
          <View style={[styles.badge, styles.featuredBadge]}>
            <Ionicons name="star" size={14} color="#FFF" />
            <Text style={styles.badgeText}>Featured</Text>
          </View>
        )}
        {item.is_verified && (
          <View style={[styles.badge, styles.verifiedBadge]}>
            <Ionicons name="checkmark-circle" size={14} color="#FFF" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            GH₵ {Number(item.price).toLocaleString()}
          </Text>

        </View>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="bed" size={16} color="#FFF" />
            <Text style={styles.metaText}>{item.number_of_bedrooms} beds</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="water" size={16} color="#FFF" />
            <Text style={styles.metaText}>{item.number_of_bathrooms} baths</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="resize" size={16} color="#FFF" />
            <Text style={styles.metaText}>{item.area} sq.ft</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color="#FFC107" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPrevious = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setQuery(item);
        fetchResults(item, filters);
        setSuggestions([]);
      }}
    >
      <Ionicons name="time" size={20} color="#5A8DEE" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSpecialProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.specialCard}
      onPress={() => navigation.navigate('Details', { id: item.id })}
    >
      <Image
        source={{ uri: item.images[0]?.images }}
        style={styles.specialThumbnail}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.specialOverlay}
      />
      <View style={styles.specialContent}>
        <Text style={styles.specialTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.specialPrice}>GH₵ {Number(item.price).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = (title, description) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );

  return (
    <>
      <StatusBar style="light" translucent />
      <LinearGradient
        colors={['#5A8DEE', '#3158C4']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Find Your Dream Home</Text>
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={22} color="#FFF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties..."
              placeholderTextColor="rgba(255,255,255,0.8)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={onSubmit}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            {typing && <ActivityIndicator color="#FFF" style={{ marginLeft: 8 }} />}
            <TouchableOpacity 
              onPress={() => setShowFilters(true)}
              style={styles.filterButton}
            >
              <Ionicons name="filter" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {query === '' && results.length === 0 && suggestions.length === 0 ? (
          <>
            {previousSearches.length > 0 && (
              <>
                {renderSectionHeader("Recent Searches", "Your recent property searches")}
                <FlatList
                  data={previousSearches}
                  keyExtractor={(item, idx) => `${item}-${idx}`}
                  renderItem={renderPrevious}
                  scrollEnabled={false}
                />
              </>
            )}
            
            {promotedProperties.length > 0 && (
              <>
                {renderSectionHeader("Promoted Properties", "Premium listings with special offers")}
                <FlatList
                  horizontal
                  data={promotedProperties}
                  keyExtractor={item => item.id}
                  renderItem={renderSpecialProperty}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </>
            )}
            
            {recommendedProperties.length > 0 && (
              <>
                {renderSectionHeader("Recommended For You", "Properties matching your preferences")}
                <FlatList
                  horizontal
                  data={recommendedProperties}
                  keyExtractor={item => item.id}
                  renderItem={renderSpecialProperty}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </>
            )}
            
            {verifiedProperties.length > 0 && (
              <>
                {renderSectionHeader("Verified Properties", "Trusted listings with verified information")}
                <FlatList
                  horizontal
                  data={verifiedProperties}
                  keyExtractor={item => item.id}
                  renderItem={renderSpecialProperty}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                />
              </>
            )}
          </>
        ) : null}

        {suggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setQuery(item.title);
                    fetchResults(item.title, filters);
                    setSuggestions([]);
                  }}
                >
                  <Ionicons name="search" size={18} color="#5A8DEE" />
                  <Text style={styles.suggestionText}>{item.title}</Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </View>
        )}

        {(query !== '' || results.length > 0) && suggestions.length === 0 && (
          <View style={styles.resultsContainer}>
            {results.length > 0 ? (
              <FlatList
                data={results}
                keyExtractor={item => item.id}
                renderItem={renderCard}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refreshResults}
                    colors={['#3158C4']}
                    tintColor="#3158C4"
                  />
                }
              />
            ) : loadingResults ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#3158C4" />
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="home" size={60} color="#C5C5D1" />
                <Text style={styles.noResultsText}>No properties found</Text>
                <Text style={styles.noResultsSubText}>Try adjusting your search or filters</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={showFilters} transparent animationType="slide">
        <BlurView intensity={80} style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.filterScroll}>
              <Text style={styles.filterSectionTitle}>Location & Type</Text>
              
              <Text style={styles.label}>City</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.city}
                  onValueChange={val => setFilters(f => ({ ...f, city: val }))}
                >
                  <Picker.Item label="Any City" value="" />
                  {cities.map(c => (
                    <Picker.Item
                      key={c.id}
                      label={c.city}
                      value={c.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.type}
                  onValueChange={val => setFilters(f => ({ ...f, type: val }))}
                >
                  <Picker.Item label="Any Type" value="" />
                  <Picker.Item label="Rental" value="rental" />
                  <Picker.Item label="Sale" value="sale" />
                </Picker>
              </View>

              <Text style={styles.label}>Property Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.propertyType}
                  onValueChange={val =>
                    setFilters(f => ({ ...f, propertyType: val }))
                  }
                >
                  <Picker.Item label="Any Property" value="" />
                  <Picker.Item label="Single Room" value="single room" />
                  <Picker.Item label="Self Contained" value="self contained" />
                  <Picker.Item label="Chamber & Hall" value="chamber & hall" />
                  <Picker.Item label="Apartment" value="apartment" />
                  <Picker.Item
                    label="Serviced Apartment"
                    value="serviced apartment"
                  />
                  <Picker.Item label="Duplex" value="duplex" />
                  <Picker.Item label="Hostel" value="hostel" />
                  <Picker.Item label="Guest House" value="guest house" />
                  <Picker.Item label="Commercial" value="commercial" />
                  <Picker.Item label="Air-bnb" value="air-bnb" />
                </Picker>
              </View>

              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceInputContainer}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min Price</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    value={filters.minPrice}
                    onChangeText={val =>
                      setFilters(f => ({ ...f, minPrice: val }))
                    }
                  />
                </View>
                
                <View style={styles.priceSeparator} />
                
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max Price</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Any"
                    value={filters.maxPrice}
                    onChangeText={val =>
                      setFilters(f => ({ ...f, maxPrice: val }))
                    }
                  />
                </View>
              </View>

              <Text style={styles.filterSectionTitle}>Sorting</Text>
              <Text style={styles.label}>Order By</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filters.ordering}
                  onValueChange={val =>
                    setFilters(f => ({ ...f, ordering: val }))
                  }
                >
                  <Picker.Item label="Default" value="" />
                  <Picker.Item label="Price: Low to High" value="price" />
                  <Picker.Item label="Price: High to Low" value="-price" />
                  <Picker.Item label="Date: Newest" value="-date_posted" />
                  <Picker.Item label="Date: Oldest" value="date_posted" />
                </Picker>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#3158C4',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerContent: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    marginHorizontal: 10,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 5,
    marginLeft: 10,
  },
  suggestionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    margin: 20,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  noPrevious: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginVertical: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#5A8DEE',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardBadges: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  featuredBadge: {
    backgroundColor: '#FF6B6B',
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  perMonth: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 5,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  horizontalList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  specialCard: {
    width: width * 0.65,
    height: 180,
    borderRadius: 20,
    marginRight: 15,
    overflow: 'hidden',
    elevation: 2,
  },
  specialThumbnail: {
    width: '100%',
    height: '100%',
  },
  specialOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  specialContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  specialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  specialPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  filterModal: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 25,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    color: '#555',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  priceInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priceInput: {
    width: '48%',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F8FAFF',
  },
  priceSeparator: {
    width: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  clearButton: {
    backgroundColor: '#F8FAFF',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearText: {
    color: '#5A8DEE',
    fontWeight: '700',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#5A8DEE',
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
    elevation: 3,
    shadowColor: '#5A8DEE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  applyText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  loaderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  noResultsText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#555',
    marginTop: 20,
    textAlign: 'center',
  },
  noResultsSubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});