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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Play animations
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(particlesAnim, { 
          toValue: 1, 
          duration: 1000, 
          easing: Easing.out(Easing.quad),
          useNativeDriver: true 
        }),
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

  // Create animated particles
  const renderParticles = () => {
    return [...Array(25)].map((_, i) => {
      const size = Math.random() * 8 + 4;
      const opacity = particlesAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.5 + Math.random() * 0.5]
      });
      
      return (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity: opacity,
              transform: [
                { 
                  translateX: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [width/2, Math.random() * width]
                  }) 
                },
                { 
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height/2, Math.random() * height]
                  }) 
                },
                { 
                  scale: particlesAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 1]
                  }) 
                }
              ]
            }
          ]}
        />
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Dark Background */}
      <View style={styles.background} />
      
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

      {/* Floating Particles */}
      {renderParticles()}

      {/* Logo Container with Glow */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { rotate: rotateInterpolate }
            ],
            marginBottom: isSmall ? 15 : 25,
          },
        ]}
      >
        <Icon name="home-sharp" size={logoSize} color="#FFD700" />
      </Animated.View>

      {/* Animated Title */}
      <Animated.View style={{ 
        opacity: textFade, 
        transform: [{ translateY: textPos }],
        marginTop: 10
      }}>
        <View style={styles.titleRow}>
          <Icon name="search-outline" size={titleSize} color="#FFD700" style={{ marginRight: 8 }} />
          <Text style={[styles.title, { fontSize: titleSize }]}>Find Your Perfect Home</Text>
        </View>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View style={[styles.indicatorContainer, { opacity: fadeAnim }]}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }, { scale: pulseAnim }],
          }}
        >
          <Icon name="sync" size={40} color="#FFD700" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading dream homes...</Text>
      </Animated.View>

      {/* Decorative Bottom Elements */}
      <View style={styles.bottomContainer}>
        <View style={styles.wave} />
        <View style={[styles.wave, styles.waveSecondary]} />
      </View>
      
      {/* Subtle Branding */}
      <View style={styles.brandContainer}>
        <Text style={styles.brandText}>PREMIUM ESTATES</Text>
      </View>
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
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#FFD700',
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6, 
        shadowRadius: 3,
      },
      android: { elevation: 8 },
    }),
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD700', 
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, 
        shadowRadius: 20,
      },
      android: { elevation: 25 },
    }),
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
    bottom: height * 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFD700',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 100,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: '-10%',
    right: 0,
    height: 80,
    backgroundColor: '#FFD700',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    opacity: 0.1,
  },
  waveSecondary: {
    backgroundColor: '#000',
    height: 60,
    opacity: 0.15,
    transform: [{ scaleX: 1.3 }],
  },
  brandContainer: {
    position: 'absolute',
    bottom: 20,
  },
  brandText: {
    color: 'rgba(255, 215, 0, 0.3)',
    fontFamily: 'Poppins-Light',
    fontSize: 12,
    letterSpacing: 4,
  },
});