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
  Animated,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 120;
const CARD_MARGIN = 10;
const STORAGE_KEY = 'previousSearches';
const MAX_SAVED = 10;
const ANIMATION_DURATION = 300;

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
  const typingTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setPreviousSearches(JSON.parse(json));
      } catch (err) {
        console.error('Error loading previous searches:', err);
      }
    })();
  }, []);

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
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (!query) {
      setSuggestions([]);
      return;
    }
    setTyping(true);
    typingTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/main/properties/?search=${encodeURIComponent(query)}`);
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
    if (extraFilters.propertyType) params.append('property_type', extraFilters.propertyType);
    if (extraFilters.minPrice) params.append('price__gte', extraFilters.minPrice);
    if (extraFilters.maxPrice) params.append('price__lte', extraFilters.maxPrice);
    if (extraFilters.ordering) params.append('ordering', extraFilters.ordering);
    return params.toString();
  };

  const fetchResults = async (searchTerm = query, appliedFilters = filters) => {
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

  const saveSearch = async (term) => {
    if (!term) return;
    try {
      const updated = [term, ...previousSearches.filter(t => t !== term)].slice(0, MAX_SAVED);
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
    setQuery('');
  };

  const animateModalIn = () => {
    Animated.timing(modalY, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.back(2)),
      useNativeDriver: true,
    }).start();
  };

  const animateModalOut = () => {
    Animated.timing(modalY, {
      toValue: height,
      duration: ANIMATION_DURATION,
      easing: Easing.in(Easing.back(2)),
      useNativeDriver: true,
    }).start(() => setShowFilters(false));
  };

  const applyFilters = () => {
    animateModalOut();
    fetchResults(query, filters);
  };

  const clearFilters = () => {
    setFilters({ city: '', type: '', propertyType: '', minPrice: '', maxPrice: '', ordering: '' });
  };

  const renderCard = ({ item, index }) => {
    const translateY = fadeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50 * (index + 1), 0],
    });

    return (
      <Animated.View style={{ transform: [{ translateY }], opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Details', { id: item.id })}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
            style={styles.gradientOverlay}
          />
          <Image 
            source={{ uri: item.images[0]?.images || 'https://via.placeholder.com/150' }} 
            style={styles.thumbnail} 
          />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
              {item.is_featured && (
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={14} color="#FFF" />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>
            <Text style={styles.price}>GH₵ {Number(item.price).toLocaleString()}</Text>
            <View style={styles.metaContainer}>
              <Text style={styles.meta}>{item.property_type}</Text>
              <View style={styles.divider} />
              <Text style={styles.meta}>{item.number_of_bedrooms}bd</Text>
              <View style={styles.divider} />
              <Text style={styles.meta}>{item.number_of_bathrooms}ba</Text>
              {item.is_verified && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color="#4CAF50" 
                  style={styles.verifiedIcon} 
                />
              )}
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#5A8DEE" />
              <Text style={styles.locationText}>{item.city}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPrevious = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        fetchResults(item, filters);
        setQuery('');
      }}
    >
      <Ionicons name="time" size={16} color="#5A8DEE" />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#F8FBFF', '#E6F0FA']}
        style={styles.background}
      >
        <View style={styles.searchBarContainer}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FBFF']}
            style={styles.searchBarGradient}
          >
            <Ionicons name="search" size={22} color="#5A8DEE" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties..."
              placeholderTextColor="#7A9BBE"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={onSubmit}
            />
            {typing && <ActivityIndicator color="#5A8DEE" />}
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(true)}
            >
              <LinearGradient
                colors={['#5A8DEE', '#3B6CDE']}
                style={styles.filterGradient}
              >
                <Ionicons name="options" size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {query === '' && previousSearches.length > 0 && (
          <FlatList
            data={previousSearches}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            renderItem={renderPrevious}
            style={styles.suggestionList}
            ListHeaderComponent={<Text style={styles.suggestionTitle}>Recent Searches</Text>}
          />
        )}

        {suggestions.length > 0 && (
          <Animated.View style={[styles.suggestionContainer, { opacity: fadeAnim }]}>
            <Text style={styles.suggestionTitle}>Popular Suggestions</Text>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => {
                  fetchResults(item.title, filters);
                  setSuggestions([]);
                  setQuery('');
                }}
              >
                <Ionicons name="location-sharp" size={16} color="#5A8DEE" />
                <Text style={styles.suggestionText}>{item.title}</Text>
                <View style={styles.suggestionBadge}>
                  <Text style={styles.badgeText}>{item.property_type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        <Modal visible={showFilters} transparent onShow={animateModalIn}>
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={animateModalOut}
          >
            <Animated.View style={[styles.filterModal, { transform: [{ translateY: modalY }] }]}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FBFF']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Advanced Filters</Text>
                  <TouchableOpacity onPress={animateModalOut}>
                    <Ionicons name="close" size={24} color="#5A8DEE" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  contentContainerStyle={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Location</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.city}
                        onValueChange={val => setFilters(f => ({ ...f, city: val }))}
                        dropdownIconColor="#5A8DEE"
                      >
                        <Picker.Item label="All Cities" value="" />
                        {cities.map(c => (
                          <Picker.Item key={c.id} label={c.city} value={c.id.toString()} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Type</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.type}
                        onValueChange={val => setFilters(f => ({ ...f, type: val }))}
                        dropdownIconColor="#5A8DEE"
                      >
                        <Picker.Item label="Any" value="" />
                        <Picker.Item label="Rental" value="rental" />
                        <Picker.Item label="Sale" value="sale" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Property Type</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.propertyType}
                        onValueChange={val => setFilters(f => ({ ...f, propertyType: val }))}
                        dropdownIconColor="#5A8DEE"
                      >
                        <Picker.Item label="Any" value="" />
                        <Picker.Item label="Single Room" value="single room" />
                        <Picker.Item label="Self Contained" value="self contained" />
                        <Picker.Item label="Chamber & Hall" value="chamber & hall" />
                        <Picker.Item label="Apartment" value="apartment" />
                        <Picker.Item label="Serviced Apartment" value="serviced apartment" />
                        <Picker.Item label="Duplex" value="duplex" />
                        <Picker.Item label="Hostel" value="hostel" />
                        <Picker.Item label="Guest House" value="guest house" />
                        <Picker.Item label="Commercial" value="commercial" />
                      </Picker>
                    </View>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Price Range</Text>
                    <View style={styles.priceInputContainer}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Min Price"
                        keyboardType="numeric"
                        value={filters.minPrice}
                        onChangeText={val => setFilters(f => ({ ...f, minPrice: val }))}
                      />
                      <Text style={styles.priceSeparator}>-</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Max Price"
                        keyboardType="numeric"
                        value={filters.maxPrice}
                        onChangeText={val => setFilters(f => ({ ...f, maxPrice: val }))}
                      />
                    </View>
                  </View>

                  <View style={styles.filterSection}>
                    <Text style={styles.filterLabel}>Sort By</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={filters.ordering}
                        onValueChange={val => setFilters(f => ({ ...f, ordering: val }))}
                        dropdownIconColor="#5A8DEE"
                      >
                        <Picker.Item label="None" value="" />
                        <Picker.Item label="Price: Low to High" value="price" />
                        <Picker.Item label="Price: High to Low" value="-price" />
                        <Picker.Item label="Date: Newest" value="-date_posted" />
                        <Picker.Item label="Date: Oldest" value="date_posted" />
                      </Picker>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={clearFilters}
                  >
                    <Text style={styles.clearText}>Reset Filters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyFilters}
                  >
                    <LinearGradient
                      colors={['#5A8DEE', '#3B6CDE']}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.applyText}>Show {results.length} Properties</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Modal>

        {loadingResults ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5A8DEE" />
            <Text style={styles.loadingText}>Finding Perfect Matches...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="home" size={60} color="#5A8DEE" />
                <Text style={styles.emptyText}>No properties found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
              </View>
            }
          />
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F0FA',
  },
  background: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  searchBarContainer: {
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#3B6CDE',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    marginHorizontal: 12,
    fontFamily: 'Inter-SemiBold',
  },
  filterButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  filterGradient: {
    padding: 10,
    borderRadius: 14,
  },
  suggestionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A8DEE',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FBFF',
    marginVertical: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  suggestionBadge: {
    backgroundColor: 'rgba(90,141,238,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#5A8DEE',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginVertical: 8,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbnail: {
    width: CARD_HEIGHT * 1.2,
    height: CARD_HEIGHT,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    zIndex: 1,
  },
  info: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A8DEE',
    marginTop: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  meta: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginHorizontal: 8,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90,141,238,0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  featuredText: {
    color: '#5A8DEE',
    fontSize: 12,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  locationText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    height: height * 0.85,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#FFF',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  priceSeparator: {
    color: '#666',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#F0F4FE',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  clearText: {
    color: '#5A8DEE',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
  },
  applyText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#5A8DEE',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});