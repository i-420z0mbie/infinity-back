import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';

import Home from '../screens/home';
import SearchScreen from '../screens/search';
import HomeStack from './HomeStack';
import ProfileStackNavigator from './ProfileStackNavigator';
import MessagesScreen from '../screens/MessagesScreen';
import PostAd from '../screens/postAd';

import { UnreadProvider, UnreadContext } from '../components/UnreadContext';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
export const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { unreadCount } = useContext(UnreadContext);

  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        
        let iconName;
        switch (route.name) {
          case 'Home':
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'Search':
            iconName = isFocused ? 'search' : 'search-outline';
            break;
          case 'Messages':
            iconName = isFocused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            break;
          case 'Profile':
            iconName = isFocused ? 'person' : 'person-outline';
            break;
          case 'PostAd':
            iconName = isFocused ? 'add-circle' : 'add-circle-outline';
            break;
          default:
            iconName = 'ellipse';
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Animatable.View
            key={route.key}
            animation={isFocused ? 'pulse' : undefined}
            duration={800}
            easing="ease-out"
            style={styles.tabButton}
          >
            <Ionicons
              name={iconName}
              size={route.name === 'PostAd' ? 36 : 26}
              color={isFocused ? '#FFD700' : '#888'}
              onPress={onPress}
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
      })}
    </View>
  );
};

function InnerTabs() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Tab.Navigator
        screenOptions={{ 
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: '#1c1c1e',
            borderTopColor: 'transparent',
            elevation: 24,
            height: 50,
          },
        }}
        tabBar={props => <CustomTabBar {...props} />}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="PostAd" component={PostAd} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </SafeAreaView>
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
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    height: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 24,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
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