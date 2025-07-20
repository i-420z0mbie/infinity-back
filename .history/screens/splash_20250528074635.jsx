import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, Platform, Dimensions } from 'react-native';

// Replace these with your actual image paths
const HOUSING_IMAGES = [
  require('../assets/images/house1.jpg'),
  require('./assets/images/house2.jpg'),
  require('./assets/images/house3.jpg'),
  require('./assets/images/house4.jpg'),
  // Add more images as needed
];

const { width, height } = Dimensions.get('window');
const IMAGE_SIZE = width * 0.4;
const GRID_SPACING = 2;

export default function Splash() {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  
  // Create animated grid of images
  const renderImageGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {HOUSING_IMAGES.map((image, index) => (
          <Animated.Image
            key={`img-${index}`}
            source={image}
            style={[
              styles.gridImage,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, index === activeIndex ? 1 : 0.4]
                }),
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, index === activeIndex ? 1 : 0.9]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
    );
  };

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.spring(fadeAnim, {
        toValue: 1,
        tension: 20,
        friction: 10,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 10,
        useNativeDriver: true
      })
    ]).start();

    // Cycle through images
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % HOUSING_IMAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.backgroundOverlay} />
      {renderImageGrid()}
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.title}>z0mbie Real Estate</Text>
        <Text style={styles.subtitle}>Finding your dream home</Text>
        <ActivityIndicator size="large" color="#fff" style={styles.indicator} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.9,
    position: 'absolute',
  },
  gridImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: GRID_SPACING,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  content: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: Platform.OS === 'ios' ? '800' : 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    letterSpacing: 1.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 24,
    letterSpacing: 1.2,
  },
  indicator: {
    marginTop: 20,
  },
});