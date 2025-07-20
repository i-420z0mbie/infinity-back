// app/Splash.js
import React, { useEffect, useRef, useContext } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
  Easing,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';
import DataContext from '../app/DataContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const shuffleArray = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function Splash() {
  const navigation = useNavigation();
  const { setData } = useContext(DataContext);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textPos = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Play animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(textPos, { toValue: 0, speed: 12, bounciness: 8, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // Continuous pulse & rotation animations
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    });
  }, []);

  // Load data & then navigate
  useEffect(() => {
    (async () => {
      let username = '';
      const favoritesMap = {};

      try {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN);
        if (token) {
          const { data: u } = await api.get('core/user/me/');
          username = u.username;
        }
        const { data: props } = await api.get('main/properties/');
        const verified = props.filter(p => p.is_verified);
        const explore = shuffleArray(verified);
        const typeTabs = Array.from(new Set(verified.flatMap(p => [p.type, p.property_type])));

        if (token) {
          await Promise.all(
            verified.map(async p => {
              try {
                const { data: favs } = await api.get(`main/properties/${p.id}/favorites/`);
                const liked = favs.length > 0;
                favoritesMap[p.id] = { liked, favId: liked ? favs[0].id : null };
              } catch {
                favoritesMap[p.id] = { liked: false, favId: null };
              }
            })
          );
        }

        setData({ properties: verified, explore, typeTabs, username, favoritesMap });
      } catch (e) {
        console.warn('Splash loadData error', e);
        setData({ properties: [], explore: [], typeTabs: [], username: '', favoritesMap: {} });
      } finally {
        navigation.replace('Main');
      }
    })();
  }, [navigation, setData]);

  const logoSize = Math.min(width * 0.35, 180);
  const titleSize = Math.min(width * 0.08, 36);
  const isSmall = height < 700;

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#2A2A2A', '#1A1A1A']}
        style={styles.gradientBackground}
      />

      {/* Glow Effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowAnim,
            transform: [
              { scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }
            ],
          },
        ]}
      />

      {/* Particles */}
      {[...Array(15)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: Math.random() * width - 20 },
                { translateY: Math.random() * height - 20 },
              ],
              opacity: fadeAnim,
            },
          ]}
        />
      ))}

      {/* Logo with Pulse */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
            ],
            marginBottom: isSmall ? 15 : 25,
          },
        ]}
      >
        <Icon name="home-sharp" size={logoSize} color="#FFD700" />
      </Animated.View>

      {/* Animated Title */}
      <Animated.View style={{ opacity: textFade, transform: [{ translateY: textPos }] }}>
        <View style={styles.titleRow}>
          <Icon name="search-outline" size={titleSize} color="#FFD700" style={{ marginRight: 8 }} />
          <Text style={[styles.title, { fontSize: titleSize }]}>Find Your Perfect Home</Text>
        </View>
      </Animated.View>

      {/* Loading Icon */}
      <Animated.View style={[styles.indicatorContainer, { opacity: fadeAnim }]}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }, { scale: pulseAnim }],
          }}
        >
          <Icon name="sync" size={50} color="#FFD700" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1A1A1A',
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glow: {
    position: 'absolute',
    width: '80%',
    aspectRatio: 1,
    borderRadius: 300,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9, 
        shadowRadius: 50,
      },
      android: { elevation: 40 },
    }),
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, 
        shadowRadius: 10,
      },
      android: { elevation: 15 },
    }),
  },
  logoContainer: {
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, 
        shadowRadius: 20,
      },
      android: { elevation: 25 },
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#FFD700',
    fontFamily: 'LeckerliOne-Regular',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    includeFontPadding: false,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: height * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
