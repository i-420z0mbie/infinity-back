

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="HomeMain" component={Home} options={{ title: 'Home' }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}