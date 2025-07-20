import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Animated, 
  Dimensions, 
  Easing,
  ImageBackground,
  Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function Splash() {
  const pulseValue = new Animated.Value(1);
  const fadeValue = new Animated.Value(0);
  const moveValue = new Animated.Value(height * 0.1);
  const logoSpin = new Animated.Value(0);

  useEffect(() => {
    // Pulse animation for title
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Fade-in + slide-up animation
    Animated.parallel([
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(moveValue, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(logoSpin, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const spin = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <ImageBackground 
      source={require('../assets/images/house1.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Dark Overlay */}
      <View style={styles.overlay} />
      
      {/* Floating Buildings */}
      <Image 
        source={require('../assets/images/house2.jpg')}
        style={styles.buildings}
        resizeMode="contain"
      />
      
      {/* Content Container */}
      <Animated.View style={[
        styles.contentContainer, 
        { 
          opacity: fadeValue,
          transform: [{ translateY: moveValue }] 
        }
      ]}>
        {/* Animated Logo */}
        <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
          <Image 
            source={require('../assets/images/house1.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.Text style={[
          styles.title, 
          { transform: [{ scale: pulseValue }] }
        ]}>
          z0mbie Real Estate
        </Animated.Text>
        
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>FIND YOUR DREAM PROPERTY</Text>
          <View style={styles.divider} />
        </View>
        
        <ActivityIndicator 
          size={width < 400 ? 'small' : 'large'} 
          color="#fff" 
          style={styles.indicator} 
        />
      </Animated.View>
      
      {/* Property Type Indicators */}
      <View style={styles.propertyTypes}>
        <View style={styles.propertyBadge}>
          <Image 
            source={require('../assets/images/house1.jpg')} 
            style={styles.propertyIcon}
          />
          <Text style={styles.propertyText}>Homes</Text>
        </View>
        <View style={styles.propertyBadge}>
          <Image 
            source={require('../assets/images/house1.jpg')} 
            style={styles.propertyIcon}
          />
          <Text style={styles.propertyText}>Apartments</Text>
        </View>
        <View style={styles.propertyBadge}>
          <Image 
            source={require('../assets/images/villa_icon.png')} 
            style={styles.propertyIcon}
          />
          <Text style={styles.propertyText}>Villas</Text>
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>PREMIUM PROPERTIES WORLDWIDE</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 47, 0.85)',
  },
  buildings: {
    position: 'absolute',
    bottom: 0,
    width: width * 1.2,
    height: height * 0.25,
    opacity: 0.7,
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: height * 0.1,
  },
  logoContainer: {
    marginBottom: 20,
    shadowColor: '#64FFDA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
  },
  title: {
    color: '#fff',
    fontSize: width < 400 ? 26 : 36,
    fontWeight: '700',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(100, 255, 218, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 12,
    fontFamily: 'HelveticaNeue-Bold',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  subtitle: {
    color: '#64FFDA',
    fontSize: width < 400 ? 12 : 14,
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: 10,
  },
  divider: {
    height: 2,
    width: width * 0.4,
    backgroundColor: '#64FFDA',
  },
  indicator: {
    marginTop: 20,
    transform: [{ scale: width < 400 ? 0.9 : 1.2 }],
  },
  propertyTypes: {
    position: 'absolute',
    bottom: height * 0.15,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  propertyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 255, 218, 0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  propertyIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#64FFDA',
  },
  propertyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: height * 0.05,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '500',
  },
});