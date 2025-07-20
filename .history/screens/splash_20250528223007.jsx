import React, { useEffect, useRef, useContext } from 'react';
import {
  View,
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Dimensions,
  Easing,
  Text,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Combine intro and pulse animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(textPos, { toValue: 0, speed: 12, bounciness: 8, useNativeDriver: true }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
                favoritesMap[p.id] = { liked: favs.length > 0, favId: favs[0]?.id || null };
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

  const logoSize = Math.min(width * 0.35, 200);
  const titleSize = Math.min(width * 0.08, 38);
  const isSmall = height < 700;

  return (
    <LinearGradient
      colors={['#1F1F1F', '#141414']}
      style={styles.container}
    >
      {/* Pure JS particles */}
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

      {/* Logo & Title */}
      <Animated.View style={[styles.logoWrap, { opacity: fadeAnim, transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }]}> 
        <Image
          source={require('../assets/images/casaz-logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: textFade,
            transform: [{ translateY: textPos }],
            fontSize: titleSize,
            marginVertical: isSmall ? 15 : 30,
          },
        ]}
      >
        Find Your Perfect Home
      </Animated.Text>

      {/* Loading Indicator */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  logoWrap: {
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
      },
      android: {
        elevation: 25,
      },
    }),
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
});
