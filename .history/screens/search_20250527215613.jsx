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

export default function SearchScreen({ navigation }) => {
  // ... [Keep all your existing state variables] ...

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

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

  // Modified applyFilters function
  const applyFilters = () => {
    animateModalOut();
    fetchResults(query, filters);
  };

  // Enhanced renderCard with animations
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

  // Enhanced Filter Modal
  const FilterModal = () => (
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
              {/* Keep existing Picker components but add style enhancements */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Location</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={filters.city}
                    onValueChange={val => setFilters(f => ({ ...f, city: val }))}
                    style={styles.picker}
                    dropdownIconColor="#5A8DEE"
                  >
                    <Picker.Item label="All Cities" value="" />
                    {cities.map(c => (
                      <Picker.Item 
                        key={c.id} 
                        label={c.city} 
                        value={c.id.toString()} 
                        fontFamily="Inter-Medium"
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Add similar enhanced sections for other filters */}

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
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#F8FBFF', '#E6F0FA']}
        style={styles.background}
      >
        {/* Enhanced Search Bar */}
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

        {/* Enhanced Suggestions List */}
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

        <FilterModal />

        {/* Enhanced Results List */}
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
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Medium',
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
    fontFamily: 'Inter-SemiBold',
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
    fontFamily: 'Inter-Bold',
    color: '#1A1A1A',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#444',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  // ... [Add other enhanced styles as needed] ...
});