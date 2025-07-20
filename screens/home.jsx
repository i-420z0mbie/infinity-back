// Home.js
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  RefreshControl,
  Animated,
  Easing
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../src/api";
import { ACCESS_TOKEN, WS_BASE_URL } from "../src/constant";
import DataContext from '../app/DataContext';

const { width, height } = Dimensions.get("window");

// Utility to shuffle an array
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function SmallCard({ property, liked, loading, onToggleFavorite, onPress, fullWidth }) {
  const [imgIdx, setImgIdx] = useState(0);
  const scrollRef = useRef();
  const swipeIntervals = [7700, 6200, 8500, 6400, 10000];
  const [swipeInterval] = useState(
    () => swipeIntervals[Math.floor(Math.random() * swipeIntervals.length)]
  );
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const handlePress = () => {
    // Create pulse animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        easing: Easing.easeOut,
        useNativeDriver: true
      })
    ]).start();
    
    onPress();
  };

  useEffect(() => {
    if (property.images?.length > 1) {
      const imgWidth = fullWidth ? width * 0.45 : width * 0.7;
      const intervalId = setInterval(() => {
        setImgIdx((prev) => {
          const next = (prev + 1) % property.images.length;
          scrollRef.current?.scrollTo({ x: next * imgWidth, animated: true });
          return next;
        });
      }, swipeInterval);
      return () => clearInterval(intervalId);
    }
  }, [property.images, fullWidth, swipeInterval]);

  const imgWidth = fullWidth ? width * 0.45 : width * 0.7;
  const cardStyle = fullWidth ? styles.cardFull : styles.cardSmall;

  // Subscription badge rotation animation
  useEffect(() => {
    if (property.is_verified || property.is_featured || property.is_promoted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      ).start();
    }
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 2],
    outputRange: ['0deg', '5deg']
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View>
          <View style={[styles.cardImageWrap, { width: imgWidth }]}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(e) =>
                setImgIdx(Math.round(e.nativeEvent.contentOffset.x / imgWidth))
              }
              scrollEventThrottle={16}
            >
              {property.images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: img.images }}
                  style={{ width: imgWidth, height: fullWidth ? 240 : 180, resizeMode: "cover" }}
                />
              ))}
            </ScrollView>
            <View style={styles.imageOverlay} />
            
            {/* Subscription Badges */}
            <View style={styles.badgeContainer}>
              {property.is_verified && (
                <Animated.View style={[styles.subscriptionBadge, { backgroundColor: '#4CAF50', transform: [{ rotate: rotateInterpolate }] }]}>
                  <Ionicons name="shield-checkmark" size={14} color="#fff" />
                  <Text style={styles.badgeText}>Verified</Text>
                </Animated.View>
              )}
              
              {property.is_featured && (
                <View style={[styles.subscriptionBadge, { backgroundColor: '#FF9800' }]}>
                  <Ionicons name="star" size={14} color="#fff" />
                  <Text style={styles.badgeText}>Featured</Text>
                </View>
              )}
              
              {property.is_promoted && (
                <View style={[styles.subscriptionBadge, { backgroundColor: '#9C27B0' }]}>
                  <Ionicons name="rocket" size={14} color="#fff" />
                  <Text style={styles.badgeText}>Promoted</Text>
                </View>
              )}
              
              {property.is_recommended && (
                <View style={[styles.subscriptionBadge, { backgroundColor: '#2196F3' }]}>
                  <Ionicons name="thumbs-up" size={14} color="#fff" />
                  <Text style={styles.badgeText}>Recommended</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.heartSmall}
              onPress={() => onToggleFavorite(property)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? "#FF375F" : "#fff"}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{property.title}</Text>
            <Text style={styles.cardDetails} numberOfLines={1}>
              {property.number_of_bedrooms}bd • {property.number_of_bathrooms}ba • {property.property_type}
            </Text>
            <Text style={styles.cardPrice}>GH₵ {Number(property.price).toLocaleString()}</Text>
            {fullWidth && (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Promo Carousel Component
function PromoCarousel() {
  // Using local images from assets directory
  const promoImages = [
    require('../assets/promo1.jpg'),
    require('../assets/promo2.jpg'),
    require('../assets/promo3.jpg'),
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promoImages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <View style={styles.promoContainer}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } }}],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentOffset={{ x: currentIndex * width, y: 0 }}
      >
        {promoImages.map((img, index) => (
          <Image 
            key={index} 
            source={img} 
            style={styles.promoImage} 
          />
        ))}
      </Animated.ScrollView>
      
      {/* Indicators */}
      <View style={styles.indicatorContainer}>
        {promoImages.map((_, index) => (
          <TouchableOpacity 
            key={index}
            onPress={() => setCurrentIndex(index)}
          >
            <View style={[
              styles.indicator, 
              index === currentIndex && styles.activeIndicator
            ]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SubscriptionBenefits() {
  const navigation = useNavigation();
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8]
  });

  return (
    <Animated.View style={[styles.subscriptionContainer, { transform: [{ translateY }] }]}>
      <View style={styles.subscriptionHeader}>
        <Ionicons name="sparkles" size={24} color="#FFD700" />
        <Text style={styles.subscriptionTitle}>Subscription Benefits</Text>
        <Ionicons name="sparkles" size={24} color="#FFD700" />
      </View>
      
      <View style={styles.benefitsGrid}>
        <View style={styles.benefitCard}>
          <View style={[styles.benefitIcon, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          </View>
          <Text style={styles.benefitTitle}>Verified Badge</Text>
          <Text style={styles.benefitDesc}>Build trust with renters</Text>
        </View>
        
        <View style={styles.benefitCard}>
          <View style={[styles.benefitIcon, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
            <Ionicons name="star" size={24} color="#FF9800" />
          </View>
          <Text style={styles.benefitTitle}>Featured Listing</Text>
          <Text style={styles.benefitDesc}>Top placement in searches</Text>
        </View>
        
        <View style={styles.benefitCard}>
          <View style={[styles.benefitIcon, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
            <Ionicons name="rocket" size={24} color="#9C27B0" />
          </View>
          <Text style={styles.benefitTitle}>Promoted Ads</Text>
          <Text style={styles.benefitDesc}>Reach more potential renters</Text>
        </View>
        
        <View style={styles.benefitCard}>
          <View style={[styles.benefitIcon, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
            <Ionicons name="thumbs-up" size={24} color="#2196F3" />
          </View>
          <Text style={styles.benefitTitle}>Recommended</Text>
          <Text style={styles.benefitDesc}>Priority in recommendations</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.subscribeButton}
        onPress={() => navigation.navigate('MySubscriptions')}
      >
        <Text style={styles.subscribeButtonText}>Upgrade Your Listings</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function Home() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { data } = useContext(DataContext);

  const [properties, setProperties] = useState(data.properties);
  const [explore, setExplore] = useState(data.explore);
  const [typeTabs, setTypeTabs] = useState(data.typeTabs);
  const [activeType, setActiveType] = useState(null);
  const [username, setUsername] = useState(data.username);
  const [recommendedProperties, setRecommendedProperties] = useState([]);
  const [favoritesMap, setFavoritesMap] = useState(
    Object.fromEntries(
      Object.entries(data.favoritesMap).map(([id, { liked, favId }]) => [
        id,
        { liked, favId, loading: false },
      ])
    )
  );
  const [promotedProperties, setPromotedProperties] = useState([]);
  const [verifiedProperties, setVerifiedProperties] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  const wsRef = useRef(null);
  const pollRef = useRef(null);

  // Pull-to-refresh reloads everything
  const loadData = async () => {
    setRefreshing(true);
    try {
      // 1) refetch user
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (token) {
        const resUser = await api.get("core/user/me/");
        setUsername(resUser.data.username);
      }

      // 2) refetch properties
      const res = await api.get("main/properties/");
      const verified = res.data.filter((p) => p.is_verified);
      setProperties(verified);
      setExplore(shuffleArray(verified));
      
      // Extract unique property types for filtering
      const uniqueTypes = Array.from(new Set(verified.map(p => p.property_type)));
      setTypeTabs(uniqueTypes);

      // 3) refetch recommended properties - FIXED: only get is_recommended=true AND is_verified
      const recRes = await api.get("main/properties/?is_recommended=true");
      const recommended = recRes.data.filter(p => p.is_verified && p.is_recommended);
      setRecommendedProperties(recommended);
      
      // 4) Fetch promoted properties
      const promotedRes = await api.get("main/properties/?is_promoted=true");
      const promoted = promotedRes.data.filter(p => p.is_verified && p.is_promoted);
      setPromotedProperties(promoted);
      
      // 5) Fetch verified properties
      const verifiedRes = await api.get("main/properties/?is_verified=true");
      setVerifiedProperties(verifiedRes.data);

      // 6) rebuild favoritesMap for all properties
      const map = {};
      if (token) {
        await Promise.all(
          [...verified, ...recommended, ...promoted].map(async (p) => {
            try {
              const favRes = await api.get(`main/properties/${p.id}/favorites/`);
              const liked = favRes.data.length > 0;
              map[p.id] = { liked, favId: liked ? favRes.data[0].id : null, loading: false };
            } catch {
              map[p.id] = { liked: false, favId: null, loading: false };
            }
          })
        );
      }
      setFavoritesMap(map);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial data load
    loadData();
    
    // Only run WebSocket & polling when screen is focused
    async function initNotifications() {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) return;

      // WebSocket for real-time updates
      const ws = new WebSocket(`${WS_BASE_URL.replace(/^http/, "ws")}/ws/notifications/?token=${token}`);
      ws.onmessage = ({ data }) => {
        const { notification } = JSON.parse(data);
        if (notification) setNotifCount(c => c + 1);
      };
      wsRef.current = ws;

      // Initial fetch + polling every 5s
      const fetchNotifCount = async () => {
        try {
          const res = await api.get("main/notifications/");
          const count = res.data.filter(n => !n.is_read).length;
          setNotifCount(count);
        } catch {}
      };
      await fetchNotifCount();
      pollRef.current = setInterval(fetchNotifCount, 5000);
    }

    if (isFocused) initNotifications();
    return () => {
      wsRef.current?.close();
      clearInterval(pollRef.current);
    };
  }, [isFocused]);

  const markNotificationsAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (!token) return;
      const res = await api.get("main/notifications/");
      const unread = res.data.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => api.patch(`main/notifications/${n.id}/`, { is_read: true }))
      );
    } catch {}
  };

  const handleToggleFavorite = async (p) => {
    const current = favoritesMap[p.id] || { liked: false, favId: null, loading: false };
    setFavoritesMap(prev => ({ ...prev, [p.id]: { ...current, loading: true } }));
    const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      Alert.alert("Login Required", "You need to sign in to save favorites", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]);
      return setFavoritesMap(prev => ({ ...prev, [p.id]: { ...current, loading: false } }));
    }
    try {
      if (!current.liked) {
        const res = await api.post(`main/properties/${p.id}/favorites/`);
        setFavoritesMap(prev => ({ ...prev, [p.id]: { liked: true, favId: res.data.id, loading: false } }));
      } else {
        await api.delete(`main/properties/${p.id}/favorites/${current.favId}/`);
        setFavoritesMap(prev => ({ ...prev, [p.id]: { liked: false, favId: null, loading: false } }));
      }
    } catch (err) {
      if (err.response?.status === 401) {
        await AsyncStorage.removeItem(ACCESS_TOKEN);
        Alert.alert("Session Expired", "Please sign in again");
      } else {
        Alert.alert("Error", "Couldn't update favorites.");
      }
      setFavoritesMap(prev => ({ ...prev, [p.id]: { ...current, loading: false } }));
    }
  };

  const featured = shuffleArray(properties.filter(p => p.is_featured));
  
  // Apply filters to Explore Properties
  const filteredExplore = activeType 
    ? explore.filter(p => p.property_type === activeType || p.type === activeType)
    : explore;

  return (
    <>
      <StatusBar style="dark" />
      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
        ListHeaderComponent={() => (
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Ionicons name="person-circle-outline" size={32} color="#1e3a8a" />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.greetingText}>Hi, {username || "there"}!</Text>
                <Text style={styles.welcomeText}>Find Your Perfect Home</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setNotifCount(0);
                  markNotificationsAsRead();
                  navigation.push("Notifications");
                }}
              >
                <View style={{ width: 28, height: 28 }}>
                  <Ionicons name="notifications-outline" size={28} color="#1e3a8a" />
                  {notifCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {notifCount > 99 ? "99+" : notifCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Promo Carousel Section */}
            <PromoCarousel />
            
            {/* Subscription Benefits Section */}
            <SubscriptionBenefits />


            <View style={styles.sectionHeader}>
              <Text style={styles.subSectionTitle}>Premium Properties</Text>
              <Ionicons name="diamond" size={20} color="#4A90E2" style={styles.sectionIcon} />
            </View>
            <View>
              <Text style={styles.sectionDescription}>Exclusive verified listings with premium features - only available to diamond subscribers.</Text>
            </View>
            <FlatList
              data={promotedProperties}
              horizontal
              keyExtractor={i => i.id}
              contentContainerStyle={styles.listHorizontal}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <SmallCard
                  property={item}
                  liked={favoritesMap[item.id]?.liked}
                  loading={favoritesMap[item.id]?.loading}
                  onToggleFavorite={handleToggleFavorite}
                  onPress={() => navigation.navigate("Details", { id: item.id })}
                />
              )}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.subSectionTitle}>Top Recommendations</Text>
            </View>
            <View>
              <Text style={styles.sectionDescription}>Curated picks based on your taste — discover properties we think you'll love, tailored to your preferences and lifestyle.</Text>
            </View>
            <FlatList
              data={recommendedProperties}
              horizontal
              keyExtractor={i => i.id}
              contentContainerStyle={styles.listHorizontal}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <SmallCard
                  property={item}
                  liked={favoritesMap[item.id]?.liked}
                  loading={favoritesMap[item.id]?.loading}
                  onToggleFavorite={handleToggleFavorite}
                  onPress={() => navigation.navigate("Details", { id: item.id })}
                />
              )}
            />
            
            <View style={styles.sectionHeader}>
              <Text style={styles.subSectionTitle}>Featured Properties</Text>
            </View>
            <View>
              <Text style={styles.sectionDescription}>Handpicked homes just for you — explore top-rated properties that offer the perfect blend of comfort, style, and value.</Text>
            </View>
            <FlatList
              data={featured}
              horizontal
              keyExtractor={i => i.id}
              contentContainerStyle={styles.listHorizontal}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <SmallCard
                  property={item}
                  liked={favoritesMap[item.id]?.liked}
                  loading={favoritesMap[item.id]?.loading}
                  onToggleFavorite={handleToggleFavorite}
                  onPress={() => navigation.navigate("Details", { id: item.id })}
                />
              )}
            />
            
            

            

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore Properties</Text>
              <Ionicons name="compass" size={20} color="#4A90E2" style={styles.sectionIcon} />
            </View>
            <View>
              <Text style={styles.sectionDescription}>Browse all available listings — find your next home, investment, or dream space with ease.</Text>
            </View>
            
            {/* Property Type Filters */}
            <ScrollView
              horizontal
              contentContainerStyle={styles.tabsContainer}
              showsHorizontalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[styles.tabButton, !activeType && styles.tabButtonActive]}
                onPress={() => setActiveType(null)}
              >
                <Text style={[
                  styles.tabText,
                  !activeType && styles.tabTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              {typeTabs.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, activeType === tab && styles.tabButtonActive]}
                  onPress={() => setActiveType(activeType === tab ? null : tab)}
                >
                  <Text style={[
                    styles.tabText,
                    activeType === tab && styles.tabTextActive
                  ]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        data={filteredExplore}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listVertical}
        renderItem={({ item }) => (
          <View style={{ margin: 8, marginTop: Math.random() * 40 }}>
            <SmallCard
              property={item}
              liked={favoritesMap[item.id]?.liked}
              loading={favoritesMap[item.id]?.loading}
              onToggleFavorite={handleToggleFavorite}
              onPress={() => navigation.navigate("Details", { id: item.id })}
              fullWidth
            />
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 30,
    backgroundColor: "#F0F0F0",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    height: 90,
    paddingHorizontal: 20
  },
  cardDetails: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
    fontFamily: "Poppins-Regular",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  greetingText: { fontSize: 18, fontWeight: "600", color: "#1e293b", fontFamily: 'LeckerliOne-Regular' },
  welcomeText: { fontSize: 14, color: "#64748b", marginTop: 2, },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 20, 
    marginTop: 24, 
    marginBottom: 5 
  },
  sectionTitle: { 
    fontSize: 22,  
    fontFamily: 'Poppins-ExtraBold', 
    color: "#1e293b", 
    marginRight: 8
  },
  subSectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-ExtraBold',
    color: "#1e293b"
  },
  sectionDescription: {
    fontFamily: 'Poppins-Regular',
    paddingTop: -30,
    marginBottom: 7,
    paddingRight: 0, 
    paddingLeft: 20,   
    fontSize: 14,
    color: '#64748b'
  },
  sectionIcon: {
    marginLeft: 5
  },
  listHorizontal: { paddingHorizontal: 20, paddingBottom: 8 },
  listVertical: { paddingBottom: 40, paddingHorizontal: 8 },
  tabsContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  tabButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    marginRight: 8, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: "#cbd5e1",
    backgroundColor: '#fff'
  },
  tabButtonActive: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  tabText: { color: "#64748b", fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  cardSmall: { 
    width: width * 0.7, 
    marginRight: 16, 
    borderRadius: 16, 
    overflow: "hidden", 
    backgroundColor: "#fff", 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardFull: { 
    width: width * 0.45, 
    borderRadius: 16, 
    overflow: "hidden", 
    backgroundColor: "#fff", 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImageWrap: { 
    position: "relative", 
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden'
  },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  cardContent: { padding: 12 },
  cardTitle: { 
    color: "#1e293b", 
    fontSize: 16, 
    fontFamily: 'Poppins-ExtraBold', 
    marginBottom: 4 
  },
  cardPrice: { 
    color: "#1e3a8a", 
    fontSize: 16, 
    fontFamily: 'Poppins-Regular',
    fontWeight: 'bold',
    marginTop: 4
  },
  cardDesc: { 
    color: "#64748b", 
    fontSize: 14, 
    marginTop: 4,
    fontFamily: 'Poppins-Regular'
  },
  heartSmall: { 
    position: "absolute", 
    bottom: 12, 
    right: 12, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    padding: 6, 
    borderRadius: 16 
  },
  
  // Promo Carousel Styles
  promoContainer: {
    height: 180,
    marginTop: 15,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
    backgroundColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  promoImage: {
    width: width - 40,
    height: '100%',
    resizeMode: 'cover',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 20,
    backgroundColor: '#1e3a8a',
  },
  
  // Subscription Benefits Section
  subscriptionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E7FF'
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15
  },
  subscriptionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#1e293b',
    marginHorizontal: 8,
    textAlign: 'center'
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  benefitCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7'
  },
  benefitIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  benefitTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4
  },
  benefitDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  },
  subscribeButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 16
  },
  
  // Subscription badges on property cards
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: '80%'
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins-SemiBold'
  }
});