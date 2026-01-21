import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import MainTabs from './MainTabs';
import SwipeScreen from '../screens/SwipeScreen';
import ApartmentListingDetailsScreen from '../screens/ApartmentListingDetailsScreen';
import RoomListingDetailsScreen from '../screens/RoomListingDetailsScreen';
import RoomListingDetailsScreen_SearchScreen from '../screens/RoomListingDetailsScreen_SearchTab';

import Home from '../screens/HomeScreen';
import CustomLoadingScreen from '../screens/CustomLoadingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  
  useEffect(() => {
    // Set minimum loading time of 2 seconds (adjust as needed)
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 4000); // 2000ms = 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while checking auth OR until minimum time has passed
  if (loading || minLoadingTime) {
    return <CustomLoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // User is NOT signed in - show auth screens
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : !user.emailVerified ? (
        // User is signed in but email NOT verified - show verification screen
        <>
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      ) : (
        // User is signed in AND email is verified - show main app
        <>
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="SwipeSearch" component={SwipeScreen} />
          <Stack.Screen name="HomePage" component={Home} />
          <Stack.Screen name="ApartmentListingDetails" component={ApartmentListingDetailsScreen} />
          <Stack.Screen name="RoomListingDetailsScreen" component={RoomListingDetailsScreen} />
          <Stack.Screen name="RoomListingDetailsScreen_SearchVersion" component={RoomListingDetailsScreen_SearchScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});