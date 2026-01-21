import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

export default function CustomLoadingScreen() {
  // Animation for logo bounce
  const logoAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, {
          toValue: -20,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dots animation (sequential)
    Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot2Anim, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot3Anim, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Animated Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ translateY: logoAnim }],
          },
        ]}
      >
        {/* Replace with your actual logo */}
        <Image
          source={require('../../assets/longhornLivingIcon1.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* OR use SVG */}
        {/* <YourLogoSVG width={120} height={120} /> */}
      </Animated.View>

      {/* Animated Dots */}
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot1Anim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot2Anim }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              transform: [{ translateY: dot3Anim }],
            },
          ]}
        />
      </View>

      {/* Optional: Loading text */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 240,
    height: 240,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#BF5700',
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

// USAGE EXAMPLE:
// Replace ActivityIndicator with this component wherever you have loading states

// Example 1: In your main App.js or navigation
/*
if (loading) {
  return <CustomLoadingScreen />;
}
*/

// Example 2: Conditional rendering in a screen
/*
{loading ? (
  <CustomLoadingScreen />
) : (
  <YourActualContent />
)}
*/

// Example 3: In PreferencesScreen
/*
if (loading) {
  return <CustomLoadingScreen />;
}
*/