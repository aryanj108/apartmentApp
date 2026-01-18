import React, { useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function SwipeCard({ apartment, onSwipeLeft, onSwipeRight, children }) {
  const position = useRef(new Animated.ValueXY()).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction) => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: 250,
        useNativeDriver: false
      }),
      Animated.timing(swipeOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false
      })
    ]).start(() => {
      if (direction === 'right') {
        onSwipeRight(apartment);
      } else {
        onSwipeLeft(apartment);
      }
      position.setValue({ x: 0, y: 0 });
      swipeOpacity.setValue(1);
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const getRotateTransform = () => {
    return position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp'
    });
  };

const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate: getRotateTransform() }
    ],
    opacity: swipeOpacity
  };

  return (
  <View style={styles.screenWrapper}>
    <Animated.View
      style={[styles.actualCard, cardStyle]}
      {...panResponder.panHandlers}
    >
      {/* Card Content */}
      {children}

      {/* Swipe Overlay (red/green tint) */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: position.x.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
              outputRange: ['rgba(255,0,0,0.3)', 'transparent', 'rgba(0, 248, 0, 0.24)'],
              extrapolate: 'clamp',
            }),
            borderRadius: 20,
          },
        ]}
      />
    </Animated.View>
  </View>
  );
}



const styles = StyleSheet.create({
  screenWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none', 
  },
  actualCard: {
    borderRadius: 20,
    backgroundColor: 'white', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});
