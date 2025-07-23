import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
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

const getTypeColor = (type) => {
  if (!type) return '#64B5F6'; // Default blue
  
  const lowerType = type.toLowerCase();
  switch (lowerType) {
    case 'rental': return '#FFB74D';  // Orange for rental
    case 'lease': 
    case 'short_rent': 
    case 'short rent': 
      return '#FF0000';               // Red for short rent
    case 'sale': return '#4CAF50';     // Green for sale
    default: return '#64B5F6';         // Blue for others
  }
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
  const [promotedProperties, setPromotedProperties] = useState([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [bannerImages] = useState([
    require('../assets/promo1.jpg'),
    require('../assets/promo2.jpg'),
    require('../assets/promo3.jpg'),
  ]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const scrollRef = useRef();
  const promoIntervalRef = useRef();
  const bannerIntervalRef = useRef();

  // Track property view
  useEffect(() => {
    const trackView = async () => {
      try {
        // make sure `id` is the UUID/string of the property
        await api.post(`main/properties/${id}/visit/`);
      } catch (error) {
        console.error('Error tracking property view:', error);
      }
    };

    trackView();
  }, [id]);

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
        
        // Fetch promoted properties
        const promotedRes = await api.get('main/properties/?is_promoted=true');
        const promoted = promotedRes.data.filter(p => p.is_verified && p.is_promoted && p.id !== id);
        setPromotedProperties(promoted);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Set up promo rotation interval
  useEffect(() => {
    if (promotedProperties.length > 1) {
      promoIntervalRef.current = setInterval(() => {
        setCurrentPromoIndex(prev => (prev + 1) % promotedProperties.length);
      }, 3000);
    }
    
    return () => clearInterval(promoIntervalRef.current);
  }, [promotedProperties]);

  // Set up banner rotation interval
  useEffect(() => {
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % bannerImages.length);
    }, 4000);
    
    return () => clearInterval(bannerIntervalRef.current);
  }, []);

  if (loading || !property || !creatorData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const { username, phone_number, account_type, id: creatorId } = creatorData;
  const phone = phone_number || 'Not available';

  const handleMessageOwner = () => {
    if (!currentUserId) {
      Alert.alert(
        'Login Required',
        'Please login to message the property owner',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }

    if (!creatorId) {
      Alert.alert('Error', 'Property owner information is not available');
      return;
    }

    const formattedPrice = Number(property.price).toLocaleString();
    const propTypeLabel = formatPropertyType(property.property_type);
    const template = `Hello, I'm interested in your property "${property.title}" priced at GH₵${formattedPrice}, which is a ${property.type} (${propTypeLabel}).`;
    
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

  const handlePromoPress = (promoId) => {
    navigation.replace('Details', { id: promoId });
  };

  const typeColor = getTypeColor(property.type);

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
        {/* Top Banner Carousel */}
        <View style={styles.bannerContainer}>
          <ImageBackground 
            source={bannerImages[currentBannerIndex]}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'transparent']}
              style={styles.bannerGradient}
            />
          </ImageBackground>
          <View style={styles.bannerIndicators}>
            {bannerImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerIndicator,
                  index === currentBannerIndex && styles.activeBannerIndicator
                ]}
              />
            ))}
          </View>
        </View>

        {/* Promoted Properties Banner */}
        {promotedProperties.length > 0 && (
          <View style={styles.promoBanner}>
            <TouchableOpacity 
              style={styles.promoContent}
              onPress={() => handlePromoPress(promotedProperties[currentPromoIndex].id)}
            >
              <ImageBackground 
                source={{ uri: promotedProperties[currentPromoIndex].images[0]?.images }}
                style={styles.promoBackground}
                imageStyle={styles.promoImageStyle}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.7)', 'transparent']}
                  style={styles.promoGradient}
                />
                
                <View style={styles.promoBadge}>
                  <Ionicons name="rocket" size={16} color="#fff" />
                  <Text style={styles.promoBadgeText}>PROMOTED</Text>
                </View>
                
                <View style={styles.promoTextContainer}>
                  <Text style={styles.promoTitle} numberOfLines={1}>
                    {promotedProperties[currentPromoIndex].title}
                  </Text>
                  <Text style={styles.promoPrice}>
                    GH₵ {Number(promotedProperties[currentPromoIndex].price).toLocaleString()}
                  </Text>
                </View>
              </ImageBackground>
            </TouchableOpacity>
            
            {/* Promo Indicators */}
            <View style={styles.promoIndicators}>
              {promotedProperties.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.promoIndicator,
                    index === currentPromoIndex && styles.activePromoIndicator
                  ]}
                />
              ))}
            </View>
          </View>
        )}

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
              <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                <Text style={styles.typeText}>{property.type.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Subscription Perks */}
          {(property.is_verified || property.is_featured || property.is_promoted || property.is_recommended) && (
            <View style={styles.perksContainer}>
              <Text style={styles.perksTitle}>Premium Perks:</Text>
              <View style={styles.perksRow}>
                {property.is_verified && (
                  <View style={[styles.perkBadge, { backgroundColor: '#4CAF50' }]}>
                    <Ionicons name="shield-checkmark" size={16} color="#fff" />
                    <Text style={styles.perkText}>Verified</Text>
                  </View>
                )}
                
                {property.is_featured && (
                  <View style={[styles.perkBadge, { backgroundColor: '#FF9800' }]}>
                    <Ionicons name="star" size={16} color="#fff" />
                    <Text style={styles.perkText}>Featured</Text>
                  </View>
                )}
                
                {property.is_promoted && (
                  <View style={[styles.perkBadge, { backgroundColor: '#9C27B0' }]}>
                    <Ionicons name="rocket" size={16} color="#fff" />
                    <Text style={styles.perkText}>Promoted</Text>
                  </View>
                )}
                
                {property.is_recommended && (
                  <View style={[styles.perkBadge, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="thumbs-up" size={16} color="#fff" />
                    <Text style={styles.perkText}>Recommended</Text>
                  </View>
                )}
              </View>
            </View>
          )}

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

          {/* Additional Property Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="resize-outline" size={20} color="#6C63FF" />
              <Text style={styles.detailText}>
                {property.square_meters ? `${property.square_meters} m²` : 'Size N/A'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="car-sport-outline" size={20} color="#6C63FF" />
              <Text style={styles.detailText}>
                {property.parking_spaces > 0 ? `${property.parking_spaces} Parking` : 'No Parking'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="construct-outline" size={20} color="#6C63FF" />
              <Text style={styles.detailText}>
                {property.condition === 'new' ? 'New' : 
                 property.condition === 'good' ? 'Good Condition' : 'Needs Renovation'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
              <Text style={styles.detailText}>
                {property.year_built ? `Built ${property.year_built}` : 'Year N/A'}
              </Text>
            </View>
            {property.floor_number && (
              <View style={styles.detailItem}>
                <Ionicons name="layers-outline" size={20} color="#6C63FF" />
                <Text style={styles.detailText}>
                  Floor {property.floor_number}
                </Text>
              </View>
            )}
            {property.elevator && (
              <View style={styles.detailItem}>
                <Ionicons name="arrow-up-circle-outline" size={20} color="#6C63FF" />
                <Text style={styles.detailText}>Elevator</Text>
              </View>
            )}
            {property.wheelchair_access && (
              <View style={styles.detailItem}>
                <Ionicons name="accessibility-outline" size={20} color="#6C63FF" />
                <Text style={styles.detailText}>Wheelchair Access</Text>
              </View>
            )}
            {property.secure_parking && (
              <View style={styles.detailItem}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#6C63FF" />
                <Text style={styles.detailText}>Secure Parking</Text>
              </View>
            )}
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
          {/* <View style={styles.section}>
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
          </View> */}
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
  
  // Top Banner Styles
  bannerContainer: {
    height: 110,
    backgroundColor: '#f0f0f0',
    marginTop: 35, 
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  bannerIndicators: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeBannerIndicator: {
    backgroundColor: '#6C63FF',
    width: 16,
  },
  
  // Promoted Properties Banner
  promoBanner: {
    height: 120,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promoContent: {
    flex: 1,
  },
  promoBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  promoImageStyle: {
    borderRadius: 12,
  },
  promoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  promoBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(156, 39, 176, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  promoBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  promoTextContainer: {
    padding: 15,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 3,
  },
  promoPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  promoIndicators: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
  },
  promoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  activePromoIndicator: {
    backgroundColor: '#FFF',
    width: 12,
  },
  
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
  title: { fontSize: 21, fontFamily: 'Poppins-ExtraBold', color: '#2A2A2A', marginBottom: 8 },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 18, fontFamily: 'Poppins-ExtraBold', color: '#6C63FF' },
  typeBadge: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  typeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  
  // Subscription Perks
  perksContainer: {
    marginBottom: 20,
  },
  perksTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#2A2A2A',
    marginBottom: 8,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  perkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  perkText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },

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
  statText: { fontSize: 12, fontWeight: '700', color: '#2A2A2A', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  // Additional Details Grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
  },

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
    fontSize: 18,
    fontFamily: 'Poppins-ExtraBold',
    color: '#2A2A2A',
    marginBottom: 16,
  },
  description: { fontSize: 12, fontFamily: 'Poppins-Regular', lineHeight: 24, color: '#555' },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  featureItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: { marginLeft: 8, fontSize: 12, color: '#444' },

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
  city: { fontSize: 14, fontWeight: '600', color: '#2A2A2A' },
  address: { fontSize: 12, color: '#666', marginTop: 4 },

  ownerCard: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
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
  ownerName: { fontSize: 13, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  ownerMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ownerDetail: { fontSize: 14, color: '#EEE', marginLeft: 8 },

  // reviewCard: {
  //   backgroundColor: '#FFF',
  //   borderRadius: 12,
  //   padding: 16,
  //   marginBottom: 30,
  //   borderWidth: 1,
  //   borderColor: '#EEE',
  // },
  // reviewHeader: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginBottom: 12,
  // },
  // reviewerInfo: { flexDirection: 'row', alignItems: 'center' },
  // reviewerName: { fontSize: 12, fontWeight: '600', color: '#444', marginLeft: 8 },
  // ratingContainer: { alignItems: 'flex-end' },
  // ratingText: { fontSize: 12, color: '#888', marginBottom: 4 },
  // ratingStars: { flexDirection: 'row' },
  // reviewContent: { fontSize: 12, color: '#555', lineHeight: 22, marginBottom: 8 },
  // reviewDate: { fontSize: 10, color: '#888', textAlign: 'right' },

  // noReviews: { alignItems: 'center', paddingVertical: 32 },
  // noReviewsText: { fontSize: 16, color: '#888', marginTop: 16, fontWeight: '500' },
  // noReviewsHint: { fontSize: 13, color: '#AAA', marginTop: 4, textAlign: 'center' },

  footerGradient: { position: 'absolute', bottom: 80, left: 0, right: 0, height: 40 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    marginTop: 50,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  contactButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 10 },
});