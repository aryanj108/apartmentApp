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
      statusBarTranslucent={true} 
    >
      <View style={styles.modalRoot}>
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
        >
          <View style={styles.contentContainer}>
            {/* Logo - positioned above center */}
            <View style={styles.logoSection}>
              <Animated.View style={{ transform: [{ translateY: logoAnim }] }}>
                <LonghornLivingIcon width={240} height={240} />
              </Animated.View>
            </View>

            {/* Loading Text - centered in the middle */}
            <View style={styles.textSection}>
              <Text style={styles.loadingText}>Longhorn Living</Text>
            </View>

            {/* Pulsing Dots - positioned below center */}
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
    marginHorizontal: 4
  },
});