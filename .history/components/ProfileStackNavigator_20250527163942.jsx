// navigation/ProfileStackNavigator.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Profile from '../'
import Account from '../screens/Account';
import MyProperties from '../screens/MyProperties';
import Favorites from '../screens/Favorites';
import Notifications from '../screens/Notifications';

const Stack = createNativeStackNavigator();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileMain"
        component={Profile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Account"
        component={Account}
        options={{
          headerShown: true,
          headerTitle: 'Account Settings',
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="My Properties"
        component={MyProperties}
        options={{
          headerShown: true,
          headerTitle: 'My Properties',
        }}
      />
      <Stack.Screen
        name="Favorites"
        component={Favorites}
        options={{
          headerShown: true,
          headerTitle: 'Favorites',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={Notifications}
        options={{
          headerShown: true,
          headerTitle: 'Notifications',
        }}
      />
    </Stack.Navigator>
  );
}
