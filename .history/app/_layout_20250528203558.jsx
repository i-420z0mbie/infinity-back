import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import DataContext from './DataContext';
import Splash from '../screens/Splash';
import TabNavigator from '../components/TabNavigator';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Details from '../screens/Details';
import SmallCard from '../components/SmallCard';
import AddImages from '../screens/AddImages';
import Notifications from '../screens/Notifications';
import Account from '../screens/Account';
import MyProperties from '../screens/MyProperties';
import EditProperty from '../screens/EditProperty';
import Chat from '../screens/Chat';
import Favorites from '../screens/favorites';
import PostAd from '../screens/PostAd';
import Home from '../screens/Home';

const Stack = createStackNavigator();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [data, setData] = useState({
    properties: [],
    explore: [],
    typeTabs: [],
    username: '',
    favoritesMap: {},
  });

  useEffect(() => {
    Font.loadAsync({
      'LeckerliOne-Regular': require('../assets/fonts/LeckerliOne-Regular.ttf'),
      'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
      'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => setShowSplashScreen(false), 1300);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Show splash until fonts are loaded & initial splash delay
  if (!fontsLoaded || showSplashScreen) {
    return <Splash />;
  }

  return (
    <DataContext.Provider value={{ data, setData }}>

        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={Splash} />
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Details" component={Details} />
          <Stack.Screen name="SmallCard" component={SmallCard} />
          <Stack.Screen name="AddImages" component={AddImages} />
          <Stack.Screen name="Account" component={Account} />
          <Stack.Screen name="Notifications" component={Notifications} />
          <Stack.Screen name="MyProperties" component={MyProperties} />
          <Stack.Screen name="EditProperty" component={EditProperty} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="PostAd" component={PostAd} />
          <Stack.Screen name="Favorites" component={Favorites} />
        </Stack.Navigator>

    </DataContext.Provider>
  );
}
