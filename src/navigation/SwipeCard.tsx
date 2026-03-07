import React, { useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// A card is considered swiped when dragged past 25% of the screen width.
// Below this threshold the card snaps back; above it the swipe is committed.
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function SwipeCard({ apartment, onSwipeLeft, onSwipeRight, children }) {

  // position tracks the card's x/y offset as the user drags it around.
  // swipeOpacity fades the card out during a committed swipe so it disappears
  // smoothly instead of just unmounting. Both are refs so they persist across
  // renders without triggering re-renders themselves.
  const position = useRef(new Animated.ValueXY()).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;

  // PanResponder listens to touch events and maps drag deltas directly onto the
  // position value to create the dragging feel. Using useRef means the same
  // responder instance is reused across renders — recreating it on each render
  // would break gesture tracking mid-drag.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      // On release, check if the drag crossed the threshold in either direction.
      // If not, snap the card back to center.
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

  // Slides the card off-screen and fades it out at the same time, then fires the
  // appropriate callback once done. Position and opacity are reset immediately after
  // so the card is ready if it re-enters the stack.
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

  // Spring back to center if the swipe didn't cross the threshold.
  // Spring feels more natural than a linear timing animation for a physical snap-back.
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  // Maps horizontal drag distance to a tilt angle, clamped at ±10 degrees.
  // The further the drag, the more the card leans — giving it a natural "flick" feel.
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
        {/* Card content */}
        {children}

        {/* pointerEvents="none" lets touches pass through to the card beneath.
            The background color interpolates from red on the left to green on the
            right, giving live visual feedback as the user drags. */}
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