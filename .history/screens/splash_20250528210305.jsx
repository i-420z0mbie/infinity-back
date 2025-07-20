// app/Splash.js
import React, { useEffect, useRef, useContext } from 'react';
import {
  View,
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';
import DataContext from '../app/DataContext';

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

  // Play animations
  useEffect(() => {
    // Initial animation sequence
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
      // Start continuous pulse animation after initial sequence
      Animated.loop(
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

  return (
    <View style={styles.container}>
      {/* Background gradient layer */}
      <View style={styles.gradientBackground} />
      
      {/* Enhanced glow effect */}
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
      
      {/* Animated particles */}
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
      
      {/* Logo with pulse animation */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { 
                rotate: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: ['0deg', '-3deg']
                }) 
              }
            ],
            marginBottom: isSmall ? 15 : 25,
          },
        ]}
      >
        <Image
          source={require('../assets/images/casaz-logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </Animated.View>
      
      {/* Animated title text */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: textFade,
            transform: [
              { translateY: textPos },
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [1, 1.02]
                })
              }
            ],
            fontSize: titleSize,
            marginBottom: isSmall ? 20 : 35,
          },
        ]}
      >
        Find Your Perfect Home
      </Animated.Text>
      
      {/* Enhanced loading indicator */}
      <Animated.View style={[styles.indicatorContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator 
          size="large" 
          color="#FFD700" 
          style={styles.indicator}
        />
        <Animated.View 
          style={[
            styles.indicatorGlow,
            { 
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.6, 0.9]
              })
            }
          ]} 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1A1A1A',  // Brighter dark background
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'grey',
    backgroundImage: 'linear-gradient(to bottom, #2A2A2A, #1A1A1A)'
  },
  glow: {
    position: 'absolute',
    width: '80%',
    aspectRatio: 1,
    borderRadius: 300,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',  // More vibrant gold
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9, 
        shadowRadius: 50  // Larger glow radius
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
        shadowRadius: 10 
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
        shadowRadius: 20  // Enhanced shadow
      },
      android: { 
        elevation: 25,
        overflow: 'hidden',
        borderRadius: 5 
      },
    }),
  },
  title: {
    color: '#FFD700',
    fontFamily: 'LeckerliOne-Regular',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.7)',  // More visible text shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,  // Increased shadow radius
    paddingHorizontal: 20,
    includeFontPadding: false,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: height * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    zIndex: 2,
  },
  indicatorGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7, 
        shadowRadius: 15 
      },
      android: { elevation: 20 },
    }),
  },
});