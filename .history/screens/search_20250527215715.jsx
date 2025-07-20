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

export default function SearchScreen({ navigation })  {
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

  // Load saved searches
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

  // Fetch available cities for dropdown
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

  // Debounced fetch suggestions
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

  // Build query string with filters
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

  // Fetch results with current query and filters
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

  // Save a search term in AsyncStorage
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
    setQuery('');  // clear input after search
  };

  const applyFilters = () => {
    setShowFilters(false);
    fetchResults(query, filters);
  };

  const clearFilters = () => {
    setFilters({ city: '', type: '', propertyType: '', minPrice: '', maxPrice: '', ordering: '' });
  };

  // Render individual property card
  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Details', { id: item.id })}
    >
      <Image source={{ uri: item.images[0]?.images }} style={styles.thumbnail} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
          {item.is_featured && <Ionicons name="star" size={18} color="#FFD700" />}
          {item.is_verified && <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={styles.verifiedIcon} />}
        </View>
        <Text style={styles.price}>GH₵ {Number(item.price).toLocaleString()}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.property_type} · {item.number_of_bedrooms}bd · {item.number_of_bathrooms}ba
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render previous search item
  const renderPrevious = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        fetchResults(item, filters);
        setQuery('');  // clear input after re-running previous search
      }}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color="#5A8DEE" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor="#7A9BBE"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
          />
          {typing && <ActivityIndicator style={styles.loadingIndicator} />}
          <TouchableOpacity style={styles.filterIcon} onPress={() => setShowFilters(true)}>
            <Ionicons name="filter" size={24} color="#5A8DEE" />
          </TouchableOpacity>
        </View>

        {/* Previous searches (when query is empty) */}
        {query === '' && (
          previousSearches.length > 0 ? (
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

        {/* Suggestions */}
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
                  setQuery('');  // clear input after selecting suggestion
                }}
              >
                <Text style={styles.suggestionText}>{item.title}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}

        {/* Filter Modal */}
        <Modal visible={showFilters} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filters</Text>
              <ScrollView>
                <Text style={styles.label}>City</Text>
                <Picker
                  selectedValue={filters.city}
                  onValueChange={val => setFilters(f => ({ ...f, city: val }))}
                  style={styles.picker}
                >
                  <Picker.Item label="Any" value="" />
                  {cities.map(c => (
                    <Picker.Item key={c.id} label={c.city} value={c.id.toString()} />
                  ))}
                </Picker>

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

                <Text style={styles.label}>Property Type</Text>
                <Picker
                  selectedValue={filters.propertyType}
                  onValueChange={val => setFilters(f => ({ ...f, propertyType: val }))}
                  style={styles.picker}
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

                <Text style={styles.label}>Price Min</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChangeText={val => setFilters(f => ({ ...f, minPrice: val }))}
                />

                <Text style={styles.label}>Price Max</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChangeText={val => setFilters(f => ({ ...f, maxPrice: val }))}
                />

                <Text style={styles.label}>Order By</Text>
                <Picker
                  selectedValue={filters.ordering}
                  onValueChange={val => setFilters(f => ({ ...f, ordering: val }))}
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
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Results List */}
        {loadingResults ? (
          <ActivityIndicator style={styles.resultsLoader} size="large" color="#5A8DEE" />
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
  container: { flex: 1, backgroundColor: '#E6F0FA', padding: CARD_MARGIN },
  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6, marginTop: 25,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  loadingIndicator: { marginLeft: 8 },
  filterIcon: { marginLeft: 8 },
  suggestionList: { backgroundColor: '#FFFFFF', borderRadius: 8, maxHeight: 200, marginBottom: 8 },
  suggestionItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  suggestionText: { fontSize: 15, color: '#1A1A1A' },
  noPrevious: { textAlign: 'center', color: '#555', marginVertical: 10 },
  resultsLoader: { marginTop: 50 },
  resultsList: { paddingBottom: 20 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, marginVertical: CARD_MARGIN / 2, height: CARD_HEIGHT, overflow: 'hidden' },
  thumbnail: { width: CARD_HEIGHT, height: CARD_HEIGHT },
  info: { flex: 1, padding: 10, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },
  verifiedIcon: { marginLeft: 4 },
  price: { fontSize: 15, fontWeight: '500', color: '#5A8DEE', marginTop: 4 },
  meta: { fontSize: 13, color: '#555', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  filterModal: { width: width * 0.9, maxHeight: '80%', backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1A1A1A' },
  label: { fontSize: 14, fontWeight: '500', marginTop: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 8, marginTop: 4 },
  picker: { marginTop: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  clearButton: { flex: 1, backgroundColor: '#EEE', padding: 12, borderRadius: 8, marginRight: 8, alignItems: 'center' },
  clearText: { color: '#555', fontWeight: '500' },
  applyButton: { flex: 1, backgroundColor: '#5A8DEE', padding: 12, borderRadius: 8, marginLeft: 8, alignItems: 'center' },
  applyText: { color: '#FFF', fontWeight: '600' },
});
