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
  const logoAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Logo Loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoAnim, { toValue: -10, duration: 1200, useNativeDriver: true }),
          Animated.timing(logoAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();

      // Dots Loop
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
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      // This is crucial for Android to draw behind the status bar
      statusBarTranslucent={true} 
    >
      {/* Using a standard View for the background and an absoluteFill 
         Animated.View for the fade effect ensures it covers the whole screen.
      */}
      <View style={styles.modalRoot}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
        >
          <View style={styles.contentContainer}>
            {/* Animated Logo */}
            <Animated.View style={{ transform: [{ translateY: logoAnim }] }}>
              <LonghornLivingIcon width={240} height={240} />
            </Animated.View>

            {/* Loading Text */}
            <Text style={styles.loadingText}>Longhorn Living</Text>

            {/* Pulsing Dots */}
            <View style={styles.dotsContainer}>
              {[dot1Anim, dot2Anim, dot3Anim].map((anim, i) => (
                <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
              ))}
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
    // This ensures that even if the OS tries to pad the view, 
    // it expands to the physical limits.
    backgroundColor: 'transparent', 
  },
  overlay: {
    // absoluteFill covers the entire parent (the Modal)
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker for better contrast
    justifyContent: 'center',
    alignItems: 'center',
    // We use the screen dimensions to force it past the nav bar
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT + (StatusBar.currentHeight || 0),
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6, // Added for spacing stability
  },
});