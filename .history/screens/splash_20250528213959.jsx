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
  const particlesAnim = useRef(new Animated.Value(0)).current;

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
      {/* Subtle Gradient Background */}
      <LinearGradient
        colors={['#FFFFFF', '#F9F9F9']}
        style={styles.gradientBackground}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />

      {/* Floating Particles */}
      {renderParticles()}

      {/* Logo Container with Elegant Shadow */}
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
        <Icon name="home-sharp" size={logoSize} color="#FF6B6B" />
        <View style={styles.logoGlow} />
      </Animated.View>

      {/* Animated Title */}
      <Animated.View style={{ 
        opacity: textFade, 
        transform: [{ translateY: textPos }],
        marginTop: 10
      }}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: titleSize }]}>Find Your</Text>
        </View>
        <View style={[styles.titleRow, { marginTop: -5 }]}>
          <Text style={[styles.titleHighlight, { fontSize: titleSize + 4 }]}>Perfect Home</Text>
        </View>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View style={[styles.indicatorContainer, { opacity: fadeAnim }]}>
        <Animated.View
          style={{
            transform: [{ rotate: rotateInterpolate }, { scale: pulseAnim }],
          }}
        >
          <Icon name="sync" size={40} color="#FF6B6B" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading dream homes...</Text>
      </Animated.View>

      {/* Decorative Bottom Wave */}
      <View style={styles.waveContainer}>
        <View style={styles.wave} />
        <View style={[styles.wave, styles.waveSecondary]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#FFD166',
    ...Platform.select({
      ios: { 
        shadowColor: '#FFD166', 
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
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, 
        shadowRadius: 20,
      },
      android: { 
        elevation: 15,
        shadowColor: '#000',
      },
    }),
  },
  logoGlow: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    zIndex: -1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  titleHighlight: {
    color: '#FF6B6B',
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
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
    color: '#888',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  waveContainer: {
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
    backgroundColor: '#FF6B6B',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    opacity: 0.1,
  },
  waveSecondary: {
    backgroundColor: '#FFD166',
    height: 60,
    opacity: 0.15,
    transform: [{ scaleX: 1.3 }],
  },
});