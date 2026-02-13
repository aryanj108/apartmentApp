import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal } from 'react-native';
import LonghornLivingIcon from '../../assets/loginLogo.svg'; 

export default function CustomLoadingScreen({ visible = true }) {
  // Animation for logo bounce
  const logoAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for dots
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  
  // Background overlay opacity
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in overlay
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

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

      // Pulsing dots animation (sequential wave effect)
      Animated.loop(
        Animated.stagger(200, [
          // Dot 1
          Animated.sequence([
            Animated.timing(dot1Anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot1Anim, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Dot 2
          Animated.sequence([
            Animated.timing(dot2Anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Anim, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          // Dot 3
          Animated.sequence([
            Animated.timing(dot3Anim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Anim, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      // Fade out overlay when not visible
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      statusBarTranslucent={true}
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: overlayAnim,
          }
        ]}
      >
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
            <LonghornLivingIcon width={240} height={240} />
          </Animated.View>

          {/* Pulsing Dots */}
          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot1Anim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot2Anim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                {
                  opacity: dot3Anim,
                },
              ]}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
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
    backgroundColor: '#FFFFFF',
  },
});