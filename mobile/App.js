import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { UserProvider } from './app/context/UserContext';
import AppNavigator from './app/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </UserProvider>
    </GestureHandlerRootView>
  );
}
