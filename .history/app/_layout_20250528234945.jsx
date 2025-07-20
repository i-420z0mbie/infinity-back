import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';

import DataContext from './DataContext';
import TabNavigator from '../components/TabNavigator';
import Login from '../screens/login';
import Register from '../screens/register';
import Details from '../screens/details';
import SmallCard from '../components/SmallCard';
import AddImages from '../screens/AddImages';
import Notifications from '../screens/Notifications';
import Account from '../screens/Account';
import MyProperties from '../screens/MyProperties';
import EditProperty from '../screens/EditProperty';
import Chat from '../screens/Chat';
import Favorites from '../screens/favorites';
import PostAd from '../screens/postAd';
import Home from '../screens/home';

import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const { width } = Dimensions.get('window');
const Stack = createStackNavigator();

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const [data, setData] = useState({ properties: [], explore: [], typeTabs: [], username: '', favoritesMap: {} });

  // Ref for continuous rotation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Load fonts and fetch data
  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'LeckerliOne-Regular': require('../assets/fonts/LeckerliOne-Regular.ttf'),
          'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
        });

        let username = '';
        const favoritesMap = {};
        const token = await AsyncStorage.getItem(ACCESS_TOKEN);

        if (token) {
          const { data: u } = await api.get('core/user/me/');
          username = u.username;
        }

        const { data: props } = await api.get('main/properties/');
        const verified = props.filter(p => p.is_verified);
        const explore = verified.sort(() => Math.random() - 0.5);
        const typeTabs = Array.from(new Set(verified.flatMap(p => [p.type, p.property_type])));

        if (token) {
          await Promise.all(
            verified.map(async p => {
              try {
                const { data: favs } = await api.get(`main/properties/${p.id}/favorites/`);
                favoritesMap[p.id] = { liked: favs.length > 0, favId: favs[0]?.id || null };
              } catch {
                favoritesMap[p.id] = { liked: false, favId: null };
              }
            })
          );
        }

        setData({ properties: verified, explore, typeTabs, username, favoritesMap });
      } catch (e) {
        console.warn('Error preparing app:', e);
        setData({ properties: [], explore: [], typeTabs: [], username: '', favoritesMap: {} });
      } finally {
        setAssetsReady(true);
      }
    }
    prepare();
  }, []);

  // Once assets ready, hide native splash and start rotation
  const onLayoutRootView = useCallback(async () => {
    if (assetsReady && !animationStarted) {
      await SplashScreen.hideAsync();
      // start infinite rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ).start();
      setAnimationStarted(true);
      // after 2s of rotation, stop and proceed
      setTimeout(() => setAnimationStarted(false), 2000);
    }
  }, [assetsReady, animationStarted]);

  // Show nothing until assets loaded
  if (!assetsReady) return null;

  // Show arrow spinner under default look
  if (animationStarted) {
    const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
      <View style={styles.animationContainer} onLayout={onLayoutRootView}>
        <Animated.View style={{ transform: [{ rotate }], marginTop: 20 }}>
          <AntDesign name="arrowright" size={48} color="#FFD700" />
        </Animated.View>
      </View>
    );
  }

  // Main app after spinner
  return (
    <DataContext.Provider value={{ data, setData }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Details" component={Details} />
          <Stack.Screen name="SmallCard" component={SmallCard} />
          <Stack.Screen name="AddImages" component={AddImages} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="Account" component={Account} />
          <Stack.Screen name="MyProperties" component={MyProperties} />
          <Stack.Screen name="EditProperty" component={EditProperty} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="PostAd" component={PostAd} />
          <Stack.Screen name="Favorites" component={Favorites} />
        </Stack.Navigator>
      </NavigationContainer>
    </DataContext.Provider>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: 50,
  },
});
