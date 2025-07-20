// components/FavoriteCard.jsx
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 120;
const IMAGE_WIDTH = 140;

export default function FavoriteCard({ property, onUnfavorite, loading, onPress }) {
  const [currentImage, setCurrentImage] = useState(0);
  const scrollRef = useRef();

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
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
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
            {property.images.map((img, i) => (
              <Image
                key={i}
                source={{ uri: img.images }}
                style={styles.image}
              />
            ))}
          </ScrollView>
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']}
            style={styles.overlay}
          />
          <TouchableOpacity
            style={styles.unfavBtn}
            onPress={() => onUnfavorite(property.id, property.favId)}
            disabled={loading}
          >
            {loading ? (
              <Ionicons name="hourglass" size={20} color="#E0245E" />
            ) : (
              <Ionicons name="heart-dislike" size={22} color="#E0245E" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>GH₵{Number(property.price).toLocaleString()}</Text>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.info} numberOfLines={1}>
            {property.number_of_bedrooms}bd • {property.number_of_bathrooms}ba • {property.property_type}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: CARD_HEIGHT,
  },
  left: {
    width: IMAGE_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
  },
  image: {
    width: IMAGE_WIDTH,
    height: CARD_HEIGHT,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT * 0.3,
  },
  unfavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 4,
    borderRadius: 16,
  },
  right: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  info: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
});
