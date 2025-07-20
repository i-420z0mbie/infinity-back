import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
// Replace these with the actual filenames in your assets/images folder
const images = [
  require('../assets/images/house1.jpg'),
  require('../assets/images/house2.jpg'),
  // require('../assets/images/house3.jpg'),
  // ...add as many as you like
];

export default function Splash() {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = setInterval(() => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(loop);
  }, [images.length, opacity]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={images[index]}
        style={[styles.backgroundImage, { opacity }]}
      />
      <View style={styles.overlay} />

      <View style={styles.content}>
        <Text style={styles.title}>z0mbie Real Estate</Text>
        <ActivityIndicator
          size="large"
          color="#FFD700"
          style={styles.indicator}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFD700',
    fontSize: 36,
    fontFamily: 'LeckerliOne-Regular', // ensure this custom font is linked
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  indicator: {
    marginTop: 10,
  },
});
