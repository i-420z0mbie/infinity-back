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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../src/api";
import { ACCESS_TOKEN, WS_BASE_URL } from "../src/constant";
import DataContext from '../app/DataContext';

const { width } = Dimensions.get("window");

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
  const avgRating = property.reviews.length
    ? property.reviews.reduce((s, r) => s + r.rating, 0) /
      property.reviews.length
    : 0;
  const cardStyle = fullWidth ? styles.cardFull : styles.cardSmall;

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
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
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{avgRating.toFixed(1)}</Text>
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
          <Text style={styles.cardPrice}>GH₵ {Number(property.price).toLocaleString()}</Text>
          <Text style={styles.cardDetails}>
          {property.bedrooms} bd • {property.bathrooms} ba • {property.property_type}
        </Text>
          {fullWidth && (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
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
  const [favoritesMap, setFavoritesMap] = useState(
    Object.fromEntries(
      Object.entries(data.favoritesMap).map(([id, { liked, favId }]) => [
        id,
        { liked, favId, loading: false },
      ])
    )
  );

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
      setTypeTabs(Array.from(new Set(verified.flatMap((p) => [p.type, p.property_type]))));

      // 3) rebuild favoritesMap
      const map = {};
      if (token) {
        await Promise.all(
          verified.map(async (p) => {
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
  const recs = activeType
    ? properties.filter(p => p.type === activeType || p.property_type === activeType)
    : properties;

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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Properties</Text>
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
              <Text style={styles.sectionTitle}>Top Recommendations</Text>
            </View>
            <ScrollView
              horizontal
              contentContainerStyle={styles.tabsContainer}
              showsHorizontalScrollIndicator={false}
            >
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
            <FlatList
              data={recs}
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
            </View>
          </View>
        )}
        data={explore}
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
    height: 90
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
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20,  fontFamily: 'Poppins-ExtraBold', color: "#1e293b",  },
  listHorizontal: { paddingHorizontal: 20, paddingBottom: 8 },
  listVertical: { paddingBottom: 40, paddingHorizontal: 8 },
  tabsContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: "#cbd5e1" },
  tabButtonActive: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  tabText: { color: "#64748b", fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  cardSmall: { width: width * 0.7, marginRight: 16, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", elevation: 2 },
  cardFull: { width: width * 0.45, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff", elevation: 2 },
  cardImageWrap: { position: "relative", marginBottom: 8 },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.2)" },
  cardContent: { padding: 8 },
  cardTitle: { color: "#1e293b", fontSize: 16, fontFamily: 'Poppins-ExtraBold', marginBottom: 4 },
  cardPrice: { color: "#1e3a8a", fontSize: 16, fontFamily: 'Poppins-Regular', },
  cardDesc: { color: "#64748b", fontSize: 14, marginTop: 4 },
  ratingPill: { position: "absolute", bottom: 12, left: 12, flexDirection: "row", backgroundColor: "rgba(255,255,255,0.9)", padding: 6, borderRadius: 12, alignItems: "center" },
  ratingText: { color: "#1e293b", marginLeft: 4, fontSize: 12, fontWeight: "600" },
  heartSmall: { position: "absolute", bottom: 12, right: 12, backgroundColor: "rgba(255,255,255,0.9)", padding: 6, borderRadius: 16 },
});
