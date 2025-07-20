import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [data, setData] = useState({
    properties: [],
    explore: [],
    typeTabs: [],
    username: '',
    favoritesMap: {},
  });

  // Load fonts and fetch initial data
  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await Font.loadAsync({
          'LeckerliOne-Regular': require('../assets/fonts/LeckerliOne-Regular.ttf'),
          'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
        });

        // Fetch API data
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

  // Hide splash when layout renders after assets are ready
  const onLayoutRootView = useCallback(async () => {
    if (assetsReady) {
      await SplashScreen.hideAsync();
    }
  }, [assetsReady]);

  // Once JS splash (Lottie) animation is done, transition to main navigator
  const handleAnimationFinish = () => {
    setAnimationDone(true);
  };

  // If assets not ready, keep native splash
  if (!assetsReady) {
    return null;
  }

  // After assets ready, show Lottie fancy animation
  if (!animationDone) {
    return (
      <View style={styles.animationContainer} onLayout={onLayoutRootView}>
        <LottieView
          source={require('../assets/animations/loading.json')}
          autoPlay
          loop={false}
          onAnimationFinish={handleAnimationFinish}
          style={styles.lottie}
        />
      </View>
    );
  }

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
  },
  lottie: {
    width: width * 0.6,
    height: width * 0.6,
  },
});
