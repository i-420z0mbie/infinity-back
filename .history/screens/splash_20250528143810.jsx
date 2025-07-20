import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Image, Platform } from 'react-native';

export default function Splash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
        <Image
          source={require('../assets/images/casaz-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Find Your Perfext
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
    backgroundColor: '#000',        
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
    // subtle glow/shadow rather than full tint
    ...Platform.select({
      ios: {
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  logo: {
    width: 120,
    height: 120,
    // remove tintColor so icon retains its gold detail on transparent bg
  },
  title: {
    color: '#D4AF37',               
    fontSize: 36,
    fontWeight: '700',              
    letterSpacing: 2,
    marginBottom: 30,
  },
  indicator: {
    marginTop: 10,
  },
});
