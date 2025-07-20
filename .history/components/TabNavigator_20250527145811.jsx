// TabNavigator.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

import Home from '../screens/home';
import SearchScreen from '../screens/search';
import Profile from '../screens/profile';
import MessagesScreen from '../screens/MessagesScreen';
import PostAd from '../screens/postAd';

import { UnreadProvider, UnreadContext } from '../components/UnreadContext';

const Tab = createBottomTabNavigator();

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    Font.loadAsync({
      'LeckerliOne-Regular': require('../assets/fonts/LeckerliOne-Regular.ttf'),
    }).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => setShowSplash(false), 1300);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);




function InnerTabs() {
  const { unreadCount } = useContext(UnreadContext);






  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopColor: 'transparent',
          elevation: 0,
          height: 70,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Messages':
              iconName = focused
                ? 'chatbubble-ellipses'
                : 'chatbubble-ellipses-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            case 'PostAd':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <Animatable.View
              animation={focused ? 'pulse' : undefined}
              duration={800}
              easing="ease-out"
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: focused ? '#FFD700' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
              }}
            >
              <Ionicons
                name={iconName}
                size={route.name === 'PostAd' ? 36 : 26}
                color={focused ? '#FFD700' : '#888'}
              />
              {route.name === 'Messages' && unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Animatable.View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="PostAd" component={PostAd} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

export default function TabNavigator() {
  return (
    <UnreadProvider>
      <InnerTabs />
    </UnreadProvider>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    right: -10,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
