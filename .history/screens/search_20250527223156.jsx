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

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 120;
const CARD_MARGIN = 10;
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
    setQuery('');
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
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => navigation.navigate('Details', { id: item.id })}
    >
      <Image
        source={{ uri: item.images[0]?.images }}
        style={styles.thumbnail}
      />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          {item.is_featured && (
            <Ionicons name="star" size={18} color="#FFD700" />
          )}
          {item.is_verified && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#4CAF50"
              style={styles.verifiedIcon}
            />
          )}
        </View>
        <Text style={styles.price}>
          GH₵ {Number(item.price).toLocaleString()}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.property_type} · {item.number_of_bedrooms}bd ·{' '}
          {item.number_of_bathrooms}ba
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderPrevious = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        fetchResults(item, filters);
        setQuery('');
      }}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style="light" translucent />
      <LinearGradient
        colors={['#5A8DEE', '#3158C4']}
        style={styles.headerGradient}
      >
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
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="filter" size={24} color="#FFF" style={{ marginLeft: 12 }} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        {query === '' && (
          previousSearches.length ? (
            <FlatList
              data={previousSearches}
              keyExtractor={(item, idx) => `${item}-${idx}`}
              renderItem={renderPrevious}
              style={styles.suggestionList}
            />
          ) : (
            <Text style={styles.noPrevious}>No previous searches</Text>
          )
        )}

        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => {
                  fetchResults(item.title, filters);
                  setSuggestions([]);
                  setQuery('');
                }}
              >
                <Text style={styles.suggestionText}>{item.title}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}

        <Modal visible={showFilters} transparent animationType="slide">
          <BlurView intensity={80} style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filters</Text>
              <ScrollView>
                {/**— City */}
                <Text style={styles.label}>City</Text>
                <Picker
                  selectedValue={filters.city}
                  onValueChange={val => setFilters(f => ({ ...f, city: val }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Any" value="" />
                  {cities.map(c => (
                    <Picker.Item
                      key={c.id}
                      label={c.city}
                      value={c.id.toString()}
                    />
                  ))}
                </Picker>

                {/**— Type */}
                <Text style={styles.label}>Type</Text>
                <Picker
                  selectedValue={filters.type}
                  onValueChange={val => setFilters(f => ({ ...f, type: val }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Any" value="" />
                  <Picker.Item label="Rental" value="rental" />
                  <Picker.Item label="Sale" value="sale" />
                </Picker>

                {/**— Property Type */}
                <Text style={styles.label}>Property Type</Text>
                <Picker
                  selectedValue={filters.propertyType}
                  onValueChange={val =>
                    setFilters(f => ({ ...f, propertyType: val }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Any" value="" />
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
                </Picker>

                {/**— Price */}
                <Text style={styles.label}>Price Min</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChangeText={val =>
                    setFilters(f => ({ ...f, minPrice: val }))
                  }
                />
                <Text style={styles.label}>Price Max</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChangeText={val =>
                    setFilters(f => ({ ...f, maxPrice: val }))
                  }
                />

                {/**— Ordering */}
                <Text style={styles.label}>Order By</Text>
                <Picker
                  selectedValue={filters.ordering}
                  onValueChange={val =>
                    setFilters(f => ({ ...f, ordering: val }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="None" value="" />
                  <Picker.Item label="Price: Low to High" value="price" />
                  <Picker.Item label="Price: High to Low" value="-price" />
                  <Picker.Item label="Date: Newest" value="-date_posted" />
                  <Picker.Item label="Date: Oldest" value="date_posted" />
                </Picker>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {loadingResults ? (
          <ActivityIndicator
            style={styles.resultsLoader}
            size="large"
            color="#3158C4"
          />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderCard}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
    padding: CARD_MARGIN,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    marginHorizontal: 8,
  },
  suggestionList: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    maxHeight: 200,
    marginVertical: 8,
    elevation: 2,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  suggestionText: {
    fontSize: 15,
    color: '#333',
  },
  noPrevious: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  resultsLoader: {
    marginTop: 50,
  },
  resultsList: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginVertical: CARD_MARGIN / 2,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  thumbnail: {
    width: CARD_HEIGHT,
    height: CARD_HEIGHT,
  },
  info: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3158C4',
    marginTop: 6,
  },
  meta: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  picker: {
    marginTop: 6,
    borderRadius: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#EEE',
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  clearText: {
    color: '#555',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#3158C4',
    padding: 14,
    borderRadius: 12,
    marginLeft: 12,
    alignItems: 'center',
  },
  applyText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
