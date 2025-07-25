import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Profile from '../screens/profile';
import Account from '../screens/Account';
import MyProperties from '../screens/MyProperties';
import Favorites from '../screens/favorites';
import Notifications from '../screens/Notifications';
import MySubscriptions from '../screens/MySubscription';
import SubscriptionPlans from '../screens/SubscriptionPlans';
import SubscriptionCheckout from '../components/SubscriptionCheckout';
import EditProperty from '../screens/EditProperty';

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
        name="MyProperties"
        component={MyProperties}
        options={{
          headerShown: true,
          headerTitle: 'My Properties',
        }}
      />
      <Stack.Screen
        name="EditProperty"
        component={EditProperty}
        options={{
          headerShown: true,
          headerTitle: 'Edit Property',
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
      <Stack.Screen
        name="MySubscriptions"
        component={MySubscriptions}
        options={{
          headerShown: false,
          headerTitle: 'My Subscriptions',
        }}
      />
      <Stack.Screen
        name="SubscriptionPlans"
        component={SubscriptionPlans}
        options={{
          headerShown: true,
          headerTitle: 'Subscription Plans',
        }}
      />
      <Stack.Screen
        name="SubscriptionCheckout"
        component={SubscriptionCheckout}
        options={{
          headerShown: true,
          headerTitle: 'Checkout',
        }}
      />
    </Stack.Navigator>
  );
}