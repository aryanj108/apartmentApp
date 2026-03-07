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

// Creates the stack navigator — think of it as a stack of screens where you
// push new ones on top and pop them off to go back. The native version uses
// platform-level animations (iOS/Android) rather than JavaScript, so it feels
// smoother and more responsive.
const Stack = createNativeStackNavigator();

export default function AppNavigator() {

  // These three values from AuthContext control which screens the user sees:
  //   user                   — the logged-in Firebase user, or null if signed out
  //   loading                — true while Firebase is still figuring out auth state on app open
  //   hasCompletedOnboarding — fetched from Firestore; null means the fetch is still pending
  const { user, loading, hasCompletedOnboarding } = useAuth();

  // We always show the loading screen for at least 4 seconds so it doesn't
  // just flash on screen for a split second on fast connections.
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  useEffect(() => {
    // Set minimum loading time of 4 seconds
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 4000);
    return () => clearTimeout(timer); // Clean up the timer if the component unmounts early
  }, []);

  // Hold on the loading screen until we have everything we need to make a
  // routing decision. If we skip any of these checks we risk briefly showing
  // the wrong screen before the real data arrives — a bad experience for users.
  //   1. Firebase has resolved the auth state (loading)
  //   2. The 4-second minimum splash has passed (minLoadingTime)
  //   3. If a user is logged in, we've confirmed their onboarding status from Firestore
  if (loading || minLoadingTime || (user && hasCompletedOnboarding === null)) {
    return <CustomLoadingScreen />;
  }

  // Instead of one big stack with guards, we conditionally register different
  // sets of screens based on auth state. React Navigation only mounts the screens
  // in the active branch, so users can never navigate somewhere they shouldn't be.
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Not signed in — only show login-related screens
        <>
          {/*<Stack.Screen name="Welcome" component={WelcomeScreen} /> // Temporarily skip welcome screen for faster testing*/}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : !user.emailVerified ? (
        // Signed in but email not yet verified — gate the whole app here until
        // the user clicks the verification link sent to their inbox
        <>
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      ) : !hasCompletedOnboarding ? (
        // Verified but hasn't finished onboarding — walk them through
        // Preferences → SwipeSearch before landing in the main app
        <>
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
          <Stack.Screen name="SwipeSearch" component={SwipeScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="HomePage" component={Home} />
          <Stack.Screen name="ApartmentListingDetails" component={ApartmentListingDetailsScreen} />
          <Stack.Screen name="RoomListingDetailsScreen" component={RoomListingDetailsScreen} />
          <Stack.Screen name="RoomListingDetailsScreen_SearchVersion" component={RoomListingDetailsScreen_SearchScreen} />
        </>
      ) : (
        // Fully signed in and onboarded — go straight to the main app.
        // Preferences and SwipeSearch are still registered so the user can
        // revisit them later (e.g. from a settings screen).
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Preferences" component={PreferencesScreen} />
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