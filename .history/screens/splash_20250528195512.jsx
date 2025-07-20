// Splash.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Dimensions,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const { width, height } = Dimensions.get('window');

// Utility to shuffle an array
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Splash() {
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textPosition = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: false, // shadow can't use native driver
        }),
      ]),
      Animated.parallel([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(textPosition, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      loadData();
    });
  }, []);

  const loadData = async () => {
    let username = '';
    const favoritesMap = {};
    try {
      // 1) get token & user
      const token = await AsyncStorage.getItem(ACCESS_TOKEN);
      if (token) {
        const resUser = await api.get('core/user/me/');
        username = resUser.data.username;
      }

      // 2) properties
      const res = await api.get('main/properties/');
      const verified = res.data.filter(p => p.is_verified);

      // 3) explore & tabs
      const explore = shuffleArray(verified);
      const typeTabs = Array.from(new Set(
        verified.flatMap(p => [p.type, p.property_type])
      ));

      // 4) favorites map
      if (username) {
        await Promise.all(
          verified.map(async (p) => {
            try {
              const favRes = await api.get(`main/properties/${p.id}/favorites/`);
              const liked = favRes.data.length > 0;
              favoritesMap[p.id] = {
                liked,
                favId: liked ? favRes.data[0].id : null,
              };
            } catch {
              favoritesMap[p.id] = { liked: false, favId: null };
            }
          })
        );
      }

      // 5) go to Main (TabNavigator), passing everything
      navigation.replace('Main', {
        initialData: {
          properties: verified,
          explore,
          typeTabs,
          username,
          favoritesMap,
        },
      });
    } catch (e) {
      console.warn('Splash loadData error:', e);
      navigation.replace('Main', {
        initialData: {
          properties: [],
          explore: [],
          typeTabs: [],
          username: '',
          favoritesMap: {},
        },
      });
    }
  };

  const logoSize = Math.min(width * 0.35, 180);
  const titleSize = Math.min(width * 0.08, 36);
  const isSmallScreen = height < 700;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowAnim,
            transform: [{
              scale: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            marginBottom: isSmallScreen ? 15 : 25,
          },
        ]}
      >
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
            transform: [{ translateY: textPosition }],
            fontSize: titleSize,
            marginBottom: isSmallScreen ? 20 : 35,
          },
        ]}
      >
        Find Your Perfect Home
      </Animated.Text>

      <ActivityIndicator
        size="large"
        color="#FFD700"
        style={styles.indicator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glow: {
    position: 'absolute',
    width: '70%',
    aspectRatio: 1,
    borderRadius: 200,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 40,
      },
      android: {
        elevation: 30,
      },
    }),
  },
  logoContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 15,
      },
      android: {
        elevation: 20,
        overflow: 'hidden',
        borderRadius: 5,
      },
    }),
  },
  title: {
    color: '#FFD700',
    fontFamily: 'LeckerliOne-Regular',
    textAlign: 'center',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    paddingHorizontal: 20,
  },
  indicator: {
    position: 'absolute',
    bottom: height * 0.1,
  },
});
