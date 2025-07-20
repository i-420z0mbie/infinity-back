import { createStackNavigator } from '@react-navigation/stack';
import Home from '../screens/home';
import Notifications from '../screens/Notifications';
const Stack = createStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} options={{ title: 'Home' }} />
      <Stack.Screen name="Notifications" component={Notifications} options={{ title: 'Notifications' }} />
    </Stack.Navigator>
  );
}