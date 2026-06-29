import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useUser } from '../context/UserContext';
import Colors from '../constants/colors';

// Screens
import PlatformPicker from '../screens/PlatformPicker';
import AboutYou from '../screens/AboutYou';
import Loading from '../screens/Loading';
import Result from '../screens/Result';
import Paywall from '../screens/Paywall';
import MyBios from '../screens/MyBios';
import Account from '../screens/Account';
import Auth from '../screens/Auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GenerateStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="PlatformPicker" component={PlatformPicker} />
      <Stack.Screen name="AboutYou" component={AboutYou} />
      <Stack.Screen name="Loading" component={Loading} options={{ gestureEnabled: false }} />
      <Stack.Screen name="Result" component={Result} />
      <Stack.Screen name="Paywall" component={Paywall} options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Generate: focused ? 'lightning-bolt' : 'lightning-bolt-outline',
            'My Bios': focused ? 'bookmark-multiple' : 'bookmark-multiple-outline',
            Account: focused ? 'account-circle' : 'account-circle-outline',
          };
          return <MaterialCommunityIcons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Generate" component={GenerateStack} />
      <Tab.Screen name="My Bios" component={MyBios} />
      <Tab.Screen name="Account" component={Account} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={Auth} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
