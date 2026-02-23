import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from '../screens/AuthScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SignalsScreen } from '../screens/SignalsScreen';
import { ChartScreen } from '../screens/ChartScreen';
import { JournalScreen } from '../screens/JournalScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.card },
      headerTintColor: colors.text,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
          Dashboard: 'speedometer',
          Signals: 'radio',
          Chart: 'stats-chart',
          Journal: 'book',
          Settings: 'settings'
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      }
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Signals" component={SignalsScreen} />
    <Tab.Screen name="Chart" component={ChartScreen} />
    <Tab.Screen name="Journal" component={JournalScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? <Stack.Screen name="Main" component={MainTabs} /> : <Stack.Screen name="Auth" component={AuthScreen} />}
    </Stack.Navigator>
  );
};
