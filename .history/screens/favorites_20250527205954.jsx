// screens/Favorites.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import api from '../src/api';
import FavoriteCard from '../components/FavoriteCard';

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);
const { width } = Dimensions.get('window');

export default function Favorites({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unfavoritingIds, setUnfavoritingIds] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isMounted = useRef(true);

  // Fetch favorites from API
  const fetchFavorites = async () => {
    if (!refreshing) setLoading(true);
    try {
      const { data: props } = await api.get('main/properties/');
      const checks = await Promise.all(
        props.map(async (property) => {
          try {
            const { data } = await api.get(
              `main/properties/${property.id}/favorites/`
            );
            if (data.length > 0) return { ...property, favId: data[0].id };
          } catch {
            // ignore individual errors
          }
          return null;
        })
      );
      if (isMounted.current) {
        setFavorites(checks.filter(x => x !== null));
      }
    } catch {
      if (isMounted.current) {
        Alert.alert('🚨 Error', 'Could not load your favorites.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchFavorites();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Pulse animation when empty
  useEffect(() => {
    if (!loading && favorites.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [loading, favorites]);

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFavorites();
  };

  // Unfavorite handler
  const handleUnfavorite = async (propertyId, favId) => {
    setUnfavoritingIds(prev => [...prev, favId]);
    try {
      await api.delete(`main/properties/${propertyId}/favorites/${favId}/`);
      setFavorites(favs => favs.filter(p => p.favId !== favId));
    } catch {
      Alert.alert('🚨 Error', 'Could not remove favorite.');
    } finally {
      setUnfavoritingIds(prev => prev.filter(id => id !== favId));
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.header}>Your Favorites</Text>

          {loading && !refreshing ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading your treasures...</Text>
            </View>
          ) : favorites.length > 0 ? (
            <FlatList
              data={favorites}
              keyExtractor={item => item.favId.toString()}
              renderItem={({ item }) => (
                <FavoriteCard
                  property={item}
                  loading={unfavoritingIds.includes(item.favId)}
                  onUnfavorite={handleUnfavorite}
                  onPress={() => navigation.navigate('Details', { id: item.id })}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor="#FF6B6B"
                />
              }
            />
          ) : (
            <View style={styles.center}>
              <AnimatedIcon
                name="heart"
                size={120}
                color="#FF6B6B"
                style={[styles.pulseIcon, { transform: [{ scale: pulseAnim }] }]}
              />
              <Text style={styles.emptyText}>
                No favorites yet!{'\n'}
                <Text style={styles.emptySubtext}>
                  Tap the ❤️ on properties to save them here!
                </Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  content: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    fontSize: 36,
    color: '#4A4A4A',
    marginHorizontal: 20,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'LeckerliOne-Regular',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  list: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#6B6B6B',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  emptyText: {
    color: '#6B6B6B',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 32,
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9B9B9B',
    fontWeight: '400',
    fontFamily: 'System',
  },
  pulseIcon: {
    shadowColor: 'rgba(255,107,107,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
