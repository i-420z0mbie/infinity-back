import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image } from 'react-native';

export default function Splash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        {/* Replace with your actual logo file in assets */}
        <Image
          source={require('../assets/images/casaz-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        CasaZ
      </Animated.Text>

      <ActivityIndicator
        size="large"
        color="#D4AF37"
        style={styles.indicator}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',         // Jet black background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: '#D4AF37',            // Gold tint for PNG icon
  },
  title: {
    color: '#D4AF37',                // Gold text
    fontSize: 36,
    fontWeight: '700',               // Bold sans-serif weight
    letterSpacing: 2,
    marginBottom: 30,
  },
  indicator: {
    marginTop: 10,
  },
});
