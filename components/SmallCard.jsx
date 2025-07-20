import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const IMAGE_HEIGHT = CARD_WIDTH * 0.6;

export default function SmallCard({ property, onPress }) {
  const scrollRef = useRef();
  const [currentImage, setCurrentImage] = useState(0);
  const [liked, setLiked] = useState(false);
  const [favId, setFavId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavoriteStatus(property.id);
    const interval = setInterval(() => {
      if (property.images?.length > 1) {
        const next = (currentImage + 1) % property.images.length;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        setCurrentImage(next);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentImage]);

  const checkFavoriteStatus = async (id) => {
    try {
      const res = await api.get(`main/properties/${id}/favorites/`);
      setLiked(res.data.length > 0);
      setFavId(res.data.length ? res.data[0].id : null);
    } catch (err) {
      console.log('Favorite check error:', err);
    }
  };

  const toggleFavorite = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!liked) {
        const res = await api.post(`main/properties/${property.id}/favorites/`);
        setFavId(res.data.id);
        setLiked(true);
      } else {
        await api.delete(`main/properties/${property.id}/favorites/${favId}/`);
        setFavId(null);
        setLiked(false);
      }
    } catch (err) {
      console.log('Fav error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.imageScroll}
      >
        {property.images.map((img, i) => (
          <Image
            key={i}
            source={{ uri: img.images }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.heartButton} onPress={toggleFavorite}>
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color="#FFF" />
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <Text style={styles.price}>GH₵ {Number(property.price).toLocaleString()}</Text>
        <View style={styles.row}>
          <Text style={styles.type}>{property.type}</Text>
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.round(property.average_rating || 0) ? 'star' : 'star-outline'}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    backgroundColor: '#222',
    marginHorizontal: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  imageScroll: {
    height: IMAGE_HEIGHT,
  },
  image: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  info: {
    padding: 12,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  price: {
    color: '#4A90E2',
    fontSize: 15,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  type: {
    color: '#ccc',
    fontSize: 13,
  },
  rating: {
    flexDirection: 'row',
  },
});
