// app/_layout.js
import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet } from 'react-native';

import Splash from '../screens/splash';
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

const Stack = createStackNavigator();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    Font.loadAsync({
      'LeckerliOne-Regular': require('../assets/fonts/LeckerliOne-Regular.ttf'),
      'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
      'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBoldItalic.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => setShowSplash(false), 1300);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || showSplash) {
    return <Splash />;
  }

  return (
    
    <Stack.Navigator screenOptions={{ headerShown: false, }}>

      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Details" component={Details} />
      <Stack.Screen name="SmallCard" component={SmallCard} />
      <Stack.Screen name="AddImages" component={AddImages} />
      <Stack.Screen name="Account" component={Account} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="My Properties" component={MyProperties} />
      <Stack.Screen name="EditProperty" component={EditProperty} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="Post Ad" component={PostAd} />
      <Stack.Screen name="Favorites" component={Favorites} />
    </Stack.Navigator>
  );
}


