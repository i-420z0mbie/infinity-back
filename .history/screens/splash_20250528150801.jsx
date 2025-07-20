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

const { width, height } = Dimensions.get('window');

export default function Splash() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textPosition = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create staggered animations
    Animated.sequence([
      // Logo animation (fade + scale + glow)
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
          useNativeDriver: false,
        }),
      ]),
      
      // Text animation (fade + position)
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
        })
      ])
    ]).start();
  }, []);

  // Calculate responsive sizes
  const logoSize = Math.min(width * 0.35, 180);
  const titleSize = Math.min(width * 0.08, 36);
  const isSmallScreen = height < 700;

  return (
    <View style={styles.container}>
      {/* Animated Glow Effect */}
      <Animated.View style={[
        styles.glow, 
        {
          opacity: glowAnim,
          transform: [{ scale: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.2]
          })}]
        }
      ]} />
      
      {/* Logo with animations */}
      <Animated.View style={[
        styles.logoContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          marginBottom: isSmallScreen ? 15 : 25
        }
      ]}>
        <Image
          source={require('../assets/images/casaz-logo.png')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Animated text */}
      <Animated.Text style={[
        styles.title, 
        { 
          opacity: textFade,
          transform: [{ translateY: textPosition }],
          fontSize: titleSize,
          marginBottom: isSmallScreen ? 20 : 35
        }
      ]}>
        Find Your Perfect Home
      </Animated.Text>

      {/* Activity indicator */}
      <ActivityIndicator
        size={isSmallScreen ? "large" : "large"}
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
  logo: {
    // Size is set dynamically
  },
  title: {
    color: '#FFD700', // Brighter gold
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