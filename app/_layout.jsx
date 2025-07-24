// App/Layout.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createRef,
} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  AppState,
  Alert,
} from 'react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign } from '@expo/vector-icons';
import * as NavigationBar from 'expo-navigation-bar';

import DataContext from './DataContext';
import TabNavigator from '../components/TabNavigator';
import Login from '../screens/login';
import Register from '../screens/register';
import Details from '../screens/details';
import SmallCard from '../components/SmallCard';
import AddImages from '../screens/AddImages';
import Chat from '../screens/Chat';
import PostAd from '../screens/postAd';
import MyProperties from '../screens/MyProperties';
import EditProperty from '../screens/EditProperty';
import Home from '../screens/home';
import PayStack from '../components/PayStackPayment';
import MySubscriptions from '../screens/MySubscription';
import SubscriptionPlans from '../screens/SubscriptionPlans';
import SubscriptionCheckout from '../components/SubscriptionCheckout';

import api from '../src/api';
import { ACCESS_TOKEN } from '../src/constant';

const { width } = Dimensions.get('window');
const Stack = createStackNavigator();

// Create a navigation ref so we can navigate outside components
export const navigationRef = createRef();

// Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

// Configure how notifications are shown when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  // Track app state
  const appStateRef = useRef(AppState.currentState);

  // Force nav‑bar color on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#1c1c1e');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  const [assetsReady, setAssetsReady] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [data, setData] = useState({
    properties: [],
    explore: [],
    typeTabs: [],
    username: '',
    favoritesMap: {},
  });

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [expoPushToken, setExpoPushToken] = useState(null);

  // Register for push and listen to notifications
  useEffect(() => {
    let responseListener;
    const registerForPushNotifications = async () => {
      if (!Device.isDevice) {
        Alert.alert('Must use physical device for Push Notifications');
        return;
      }
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notifications!');
        return;
      }
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(token);

      // send token to backend
      try {
        await api.post('/main/push-tokens/', { token });
      } catch (e) {
        console.warn('Error registering push token:', e);
      }
    };

    registerForPushNotifications();

    // Listen for incoming notifications
    responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      if (data.chatId) {
        navigationRef.current?.navigate('Chat', { chatId: data.chatId });
      } else if (data.notifId) {
        // handle notification tap
      }
    });

    // Handle AppState to re-register if needed
    const handleAppState = nextAppState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        registerForPushNotifications();
      }
      appStateRef.current = nextAppState;
    };
    const appStateSub = AppState.addEventListener('change', handleAppState);

    return () => {
      responseListener && responseListener.remove();
      appStateSub.remove();
    };
  }, []);

  // Load fonts and fetch initial data
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
        const typeTabs = Array.from(
          new Set(verified.flatMap(p => [p.type, p.property_type]))
        );

        if (token) {
          await Promise.all(
            verified.map(async p => {
              try {
                const { data: favs } = await api.get(
                  `main/properties/${p.id}/favorites/`
                );
                favoritesMap[p.id] = {
                  liked: favs.length > 0,
                  favId: favs[0]?.id || null,
                };
              } catch {
                favoritesMap[p.id] = { liked: false, favId: null };
              }
            })
          );
        }

        setData({ properties: verified, explore, typeTabs, username, favoritesMap });
      } catch (e) {
        console.warn('Error preparing app:', e);
        setData({
          properties: [],
          explore: [],
          typeTabs: [],
          username: '',
          favoritesMap: {},
        });
      } finally {
        setAssetsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (assetsReady) {
      await SplashScreen.hideAsync();
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ).start();
      setTimeout(() => setShowSpinner(false), 2000);
    }
  }, [assetsReady, rotateAnim]);

  if (!assetsReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {showSpinner ? (
        <View style={styles.animationContainer}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <AntDesign name="arrowright" size={48} color="#FFD700" />
          </Animated.View>
        </View>
      ) : (
        <DataContext.Provider value={{ data, setData }}>
          {/* <NavigationContainer ref={navigationRef}> */}
            <Stack.Navigator initialRouteName="Main" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="Details" component={Details} />
              <Stack.Screen name="SmallCard" component={SmallCard} />
              <Stack.Screen name="AddImages" component={AddImages} />
              <Stack.Screen name="Chat" component={Chat} />
              <Stack.Screen name="PostAd" component={PostAd} />

              {/* Global subscription screens */}
              <Stack.Screen
                name="SubscriptionPlans"
                component={SubscriptionPlans}
                options={{ headerShown: true, title: 'Subscription Plans' }}
              />
              <Stack.Screen
                name="SubscriptionCheckout"
                component={SubscriptionCheckout}
                options={{ headerShown: true, title: 'Subscription Checkout' }}
              />
              <Stack.Screen
                name="PaystackPayment"
                component={PayStack}
                options={{ headerShown: true, title: 'One Time Payment' }}
              />
              <Stack.Screen
                name="MySubscriptions"
                component={MySubscriptions}
                options={{ headerShown: true, title: 'My Subscriptions' }}
              />
              <Stack.Screen
                name="MyProperties"
                component={MyProperties}
                options={{ headerShown: true, title: 'My Properties' }}
              />
              <Stack.Screen
                name="EditProperty"
                component={EditProperty}
                options={{ headerShown: true, title: 'Edit Properties' }}
              />
            </Stack.Navigator>
          {/* </NavigationContainer> */}
        </DataContext.Provider>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
