import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  StatusBar
} from 'react-native';
import LonghornLivingIcon from '../../assets/loginLogo.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CustomLoadingScreen({ visible = true }) {

  // logoAnim drives the logo's gentle float up and down
  // dot1/2/3Anim each control the opacity of one loading dot, starting dim
  // overlayAnim fades the dark background in when the screen first appears
  const logoAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {

      // Fade the dark overlay in over 300ms when the screen becomes visible
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Continuously float the logo up 10px and back down, repeating forever
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoAnim, { toValue: -10, duration: 1200, useNativeDriver: true }),
          Animated.timing(logoAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();

      // Each dot pulses from dim (0.3) to fully opaque (1) and back.
      // Stagger offsets each dot by 300ms so they light up one after another
      // instead of all at once, creating the classic "wave" loading effect.
      const createDotAnimation = (anim) => {
        return Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ]);
      };

      Animated.loop(
        Animated.stagger(300, [
          createDotAnimation(dot1Anim),
          createDotAnimation(dot2Anim),
          createDotAnimation(dot3Anim),
        ])
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    // transparent Modal so the screen behind it still shows through the overlay
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      statusBarTranslucent={true}
    >
      <View style={styles.modalRoot}>

        {/* Semi-transparent dark overlay that fades in over the app content */}
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
        >
          <View style={styles.contentContainer}>

            {/* Logo floats in the top half of the content area */}
            <View style={styles.logoSection}>
              <Animated.View style={{ transform: [{ translateY: logoAnim }] }}>
                <LonghornLivingIcon width={240} height={240} />
              </Animated.View>
            </View>

            {/* App name sits in the center between the logo and dots */}
            <View style={styles.textSection}>
              <Text style={styles.loadingText}>Longhorn Living</Text>
            </View>

            {/* Three pulsing dots in the lower half */}
            <View style={styles.dotsSection}>
              <View style={styles.dotsContainer}>
                {[dot1Anim, dot2Anim, dot3Anim].map((anim, i) => (
                  <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
                ))}
              </View>
            </View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    // Add the status bar height so the overlay covers the full screen on Android
    height: SCREEN_HEIGHT + (StatusBar.currentHeight || 0),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  textSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dotsSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
});