import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN } from '../src/constant';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.8;

const propertyTypeIcons = {
  'single room': 'bed-outline',
  'self contained': 'home-outline',
  'chamber & hall': 'grid-outline',
  apartment: 'business-outline',
  'serviced apartment': 'sparkles-outline',
  duplex: 'duplicate-outline',
  hostel: 'people-outline',
  'guest house': 'cafe-outline',
  commercial: 'briefcase-outline',
  default: 'map-outline',
};

const getPropertyTypeIcon = (type) => {
  return propertyTypeIcons[type.toLowerCase()] || propertyTypeIcons.default;
};

const formatPropertyType = (type) => {
  const formatted = type
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
  return formatted.replace(/ & /g, ' & ');
};

export default function Details({ route }) {
  const navigation = useNavigation();
  const { id } = route.params;

  const [property, setProperty] = useState(null);
  const [creatorData, setCreatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const scrollRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN);
        if (token) {
          const me = await api.get('core/user/me/');
          setCurrentUserId(String(me.data.id));
        }

        const propRes = await api.get(`main/properties/${id}/`);
        const prop = propRes.data;
        setProperty(prop);
        prop.reviews = (prop.reviews || []).filter((r) => r.is_verified);

        const usersRes = await api.get('core/users/all/');
        const all = usersRes.data || [];
        const creator = all.find((u) => u.id === prop.creator) || {};
        setCreatorData(creator);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !property || !creatorData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const { username, phone_number, account_type, id: creatorId } = creatorData;
  const phone = phone_number || 'Not available';

  // —— NEW: build the initial chat message template ——
  const handleMessageOwner = () => {
    const formattedPrice = Number(property.price).toLocaleString();
    const propTypeLabel = formatPropertyType(property.property_type);
    const template = `Hello, I’m interested in your property "${property.title}" priced at GH₵${formattedPrice}, which is a ${property.type} (${propTypeLabel}).`;
    navigation.navigate('Chat', {
      userId: String(creatorId),
      username,
      currentUserId,
      initialMessage: template,
    });
  };

  const handleImagePress = (idx) => setFullscreenImageIndex(idx);
  const closeFullscreen = () => setFullscreenImageIndex(null);

  const nextImage = () => {
    const nxt = (currentImage + 1) % property.images.length;
    scrollRef.current.scrollToIndex({ index: nxt, animated: true });
    setCurrentImage(nxt);
  };
  const prevImage = () => {
    const prev = (currentImage - 1 + property.images.length) % property.images.length;
    scrollRef.current.scrollToIndex({ index: prev, animated: true });
    setCurrentImage(prev);
  };

  return (
    <View style={styles.container}>
      {/* Fullscreen Image Modal */}
      <Modal visible={fullscreenImageIndex !== null} transparent animationType="fade">
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity onPress={closeFullscreen} style={styles.closeButton}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <FlatList
            data={property.images}
            horizontal
            pagingEnabled
            keyExtractor={(_, i) => i.toString()}
            initialScrollIndex={fullscreenImageIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.images }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          />
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            ref={scrollRef}
            data={property.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) =>
              setCurrentImage(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            scrollEventThrottle={16}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => handleImagePress(index)} activeOpacity={0.9}>
                <Image source={{ uri: item.images }} style={styles.carouselImage} />
              </TouchableOpacity>
            )}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.2)']}
            style={styles.gradientOverlay}
          />
          <View style={styles.pagination}>
            {property.images.map((_, idx) => (
              <View
                key={idx}
                style={[styles.paginationDot, currentImage === idx && styles.activeDot]}
              />
            ))}
          </View>
          {property.images.length > 1 && (
            <>
              <TouchableOpacity style={styles.arrowLeft} onPress={prevImage}>
                <View style={styles.arrowBox}>
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowRight} onPress={nextImage}>
                <View style={styles.arrowBox}>
                  <Ionicons name="chevron-forward" size={24} color="#FFF" />
                </View>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          {/* Title & Price */}
          <View style={styles.header}>
            <Text style={styles.title}>{property.title}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                GH₵ {Number(property.price).toLocaleString()}
              </Text>
              <View style={[styles.typeBadge, { backgroundColor: typeColors[property.type] }]}>
                <Text style={styles.typeText}>{property.type.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="bed-outline" size={22} color="#6C63FF" />
              <Text style={styles.statText}>{property.number_of_bedrooms}</Text>
              <Text style={styles.statLabel}>Bedrooms</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={22} color="#6C63FF" />
              <Text style={styles.statText}>{property.number_of_bathrooms}</Text>
              <Text style={styles.statLabel}>Baths</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name={property.type === 'rental' ? 'receipt-outline' : 'pricetag-outline'}
                size={22}
                color="#6C63FF"
              />
              <Text style={styles.statText}>
                {property.type === 'rental' ? 'For Rent' : 'For Sale'}
              </Text>
              <Text style={styles.statLabel}>Type</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons
                name={getPropertyTypeIcon(property.property_type)}
                size={22}
                color="#6C63FF"
              />
              <Text style={styles.statText}>
                {formatPropertyType(property.property_type)}
              </Text>
              <Text style={styles.statLabel}>Property</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.featuresGrid}>
              {(property.features || []).map((feat, i) => (
                <View key={i} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#6C63FF" />
                  <Text style={styles.featureText}>
                    {typeof feat === 'string' ? feat : feat.name}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons name="location-sharp" size={24} color="#FFF" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.city}>
                  {property.city?.region?.name || 'Unknown Region'},{' '}
                  {property.city?.city || 'Unknown City'}
                </Text>
                <Text style={styles.address}>{property.detailed_address}</Text>
              </View>
            </View>
          </View>

          {/* Owner Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Owner</Text>
            <LinearGradient
              colors={['#6C63FF', '#8B85FF']}
              style={styles.ownerCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.ownerAvatar}>
                <Ionicons name="person" size={28} color="#FFF" />
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{username}</Text>
                <View style={styles.ownerMeta}>
                  <Ionicons name="call-outline" size={16} color="#FFF" />
                  <Text style={styles.ownerDetail}>{phone}</Text>
                </View>
                <View style={styles.ownerMeta}>
                  <Ionicons name="person-circle-outline" size={16} color="#FFF" />
                  <Text style={styles.ownerDetail}>{account_type} Account</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Verified Reviews ({property.reviews.length})
            </Text>
            {property.reviews.length > 0 ? (
              property.reviews.map((rev, i) => (
                <View key={i} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewerInfo}>
                      <Ionicons name="person-circle" size={32} color="#6C63FF" />
                      <Text style={styles.reviewerName}>
                        {rev.user?.username || 'Anonymous'}
                      </Text>
                    </View>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.ratingText}>{rev.rating}/5</Text>
                      <View style={styles.ratingStars}>
                        {[...Array(5)].map((_, j) => (
                          <Ionicons
                            key={j}
                            name={j < rev.rating ? 'star' : 'star-outline'}
                            size={16}
                            color="#FFD700"
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewContent}>{rev.review || rev.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(rev.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noReviews}>
                <Ionicons name="chatbox-ellipses-outline" size={40} color="#E0E0E0" />
                <Text style={styles.noReviewsText}>No Verified Reviews Yet</Text>
                <Text style={styles.noReviewsHint}>
                  Your review could be featured here after verification
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer gradient and button */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', '#FFFFFF']}
        style={styles.footerGradient}
        pointerEvents="none"
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={handleMessageOwner}
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#FFF" />
          <Text style={styles.contactText}>Message Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const typeColors = {
  rent: '#FFB74D',
  sale: '#4CAF50',
  lease: '#64B5F6',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FF' },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  fullscreenImage: { width, height: height * 0.8, alignSelf: 'center' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 2, padding: 10 },
  scrollContainer: { paddingBottom: 90 },
  carouselContainer: { height: IMAGE_HEIGHT, overflow: 'hidden' },
  carouselImage: { width, height: IMAGE_HEIGHT },
  gradientOverlay: { ...StyleSheet.absoluteFillObject, height: IMAGE_HEIGHT },
  pagination: { position: 'absolute', bottom: 20, flexDirection: 'row', alignSelf: 'center' },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    margin: 4,
  },
  activeDot: { backgroundColor: '#6C63FF', width: 20 },
  arrowLeft: { position: 'absolute', top: '50%', left: 10 },
  arrowRight: { position: 'absolute', top: '50%', right: 10 },
  arrowBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },

  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontFamily: 'Poppins-ExtraBold', color: '#2A2A2A', marginBottom: 8 },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 24, fontFamily: 'Poppins-Regular', color: '#6C63FF' },
  typeBadge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  typeText: { fontSize: 12, fontWeight: '700', color: 'red' },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  statItem: { alignItems: 'center' },
  statText: { fontSize: 18, fontWeight: '700', color: '#2A2A2A', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  section: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  description: { fontSize: 15, lineHeight: 24, color: '#555' },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: { marginLeft: 8, fontSize: 14, color: '#444' },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    padding: 16,
  },
  locationIcon: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
  },
  addressInfo: { flex: 1 },
  city: { fontSize: 16, fontWeight: '600', color: '#2A2A2A' },
  address: { fontSize: 14, color: '#666', marginTop: 4 },

  ownerCard: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center' },
  ownerAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  ownerMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ownerDetail: { fontSize: 14, color: '#EEE', marginLeft: 8 },

  reviewCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center' },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#444', marginLeft: 8 },
  ratingContainer: { alignItems: 'flex-end' },
  ratingText: { fontSize: 14, color: '#888', marginBottom: 4 },
  ratingStars: { flexDirection: 'row' },
  reviewContent: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 8 },
  reviewDate: { fontSize: 12, color: '#888', textAlign: 'right' },

  noReviews: { alignItems: 'center', paddingVertical: 32 },
  noReviewsText: { fontSize: 16, color: '#888', marginTop: 16, fontWeight: '500' },
  noReviewsHint: { fontSize: 13, color: '#AAA', marginTop: 4, textAlign: 'center' },

  footerGradient: { position: 'absolute', bottom: 80, left: 0, right: 0, height: 40 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  contactButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});
