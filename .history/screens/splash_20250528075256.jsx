import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function Splash() {
  const pulseValue = new Animated.Value(1);
  const fadeValue = new Animated.Value(0);
  const moveValue = new Animated.Value(height * 0.1);

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
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <View style={styles.gradientLayer}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      
      {/* Animated Content */}
      <Animated.View style={[
        styles.contentContainer, 
        { 
          opacity: fadeValue,
          transform: [{ translateY: moveValue }] 
        }
      ]}>
        <Animated.Text style={[
          styles.title, 
          { transform: [{ scale: pulseValue }] }
        ]}>
          z0mbie Real Estate
        </Animated.Text>
        
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Find Your Dream Property</Text>
          <View style={styles.divider} />
        </View>
        
        <ActivityIndicator 
          size={width < 400 ? 'small' : 'large'} 
          color="#fff" 
          style={styles.indicator} 
        />
      </Animated.View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Premium Properties Worldwide</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    flex: 1,
    backgroundColor: '#1a3a5f',
  },
  gradientBottom: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: height * 0.1,
  },
  title: {
    color: '#fff',
    fontSize: width < 400 ? 28 : 36,
    fontWeight: '700',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: width < 400 ? 14 : 16,
    letterSpacing: 2.5,
    fontWeight: '300',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    width: width * 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  indicator: {
    marginTop: 20,
    transform: [{ scale: width < 400 ? 0.9 : 1.2 }],
  },
  footer: {
    position: 'absolute',
    bottom: height * 0.05,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    letterSpacing: 1.1,
    fontWeight: '300',
  },
});