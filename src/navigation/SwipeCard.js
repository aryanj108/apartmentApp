import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions, Alert, TouchableOpacity } from 'react-native';
import PercentIcon from '../../assets/percentIcon.svg';
import { usePreferences } from '../context/PreferencesContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function SwipeCard({ apartment, matchScore, matchColor, matchDescription, onSwipeLeft, onSwipeRight, children, navigation }) {
  const position = useRef(new Animated.ValueXY()).current;
  const swipeOpacity = useRef(new Animated.Value(1)).current;
  const { savedIds, toggleSave } = usePreferences();
  const isSaved = savedIds.includes(apartment.id);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - like
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - dislike
          forceSwipe('left');
        } else {
          // Return to original position
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
      // Reset for next card
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

  const getLikeOpacity = () => {
    return position.x.interpolate({
      inputRange: [0, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    });
  };

  const getNopeOpacity = () => {
    return position.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    });
  };

  const cardStyle = {
    ...position.getLayout(),
    transform: [{ rotate: getRotateTransform() }],
    opacity: swipeOpacity
  };

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...panResponder.panHandlers}
    >
      {/* Match Badge matchColor*/}
      <View style={[styles.matchBadge, { backgroundColor: '#ffffffde'}]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <PercentIcon width={20} height={20} />
        <Text style={styles.matchScoreText}>{matchScore}%</Text>
        {/*<Text style={styles.matchDescriptionText}>{matchDescription}</Text> */}
      </View>
      </View>

      {/* Saved Badge 
<TouchableOpacity
  activeOpacity={0.7} // optional: makes it fade slightly when pressed
  onPress={() => {
    const wasSaved = isSaved;

    Alert.alert(
    wasSaved ? 'Listing Unsaved' : 'Listing Saved',
    wasSaved
      ? 'This listing has been removed from your saved listings.'
      : 'This listing has been added to your saved listings.'
  );
      toggleSave(apartment.id)
  }}
  style={{
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 100,
  }}
>
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginTop: 20,
      backgroundColor: '#f3f4f6',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    }}
  >
          {isSaved ? (
        <SaveFilledIcon width={16} height={16} />
      ) : (
        <SaveOutlineIcon width={16} height={16} />
      )}
    <Text style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 6 }}>
      {isSaved ? 'Saved' : 'Save Listing'}
    </Text>
  </View>
</TouchableOpacity>*/}


      {children}
      <Animated.View
  pointerEvents="none" // so touches pass through
  style={[
    StyleSheet.absoluteFillObject, // fills the entire card
    {
      backgroundColor: position.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        outputRange: ['rgba(255,0,0,0.3)', 'transparent', 'rgba(0, 248, 0, 0.24)'],
        extrapolate: 'clamp',
      }),
      borderRadius: 10,
    },
  ]}
/>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: '100%',
  },
  likeStamp: {
    position: 'absolute',
    top: 50,
    left: 40,
    zIndex: 1000,
    borderWidth: 5,
    borderColor: '#10b981',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '-20deg' }],
  },
  nopeStamp: {
    position: 'absolute',
    top: 50,
    right: 40,
    zIndex: 1000,
    borderWidth: 5,
    borderColor: '#ef4444',
    borderRadius: 10,
    padding: 10,
    transform: [{ rotate: '20deg' }],
  },
  stampText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    zIndex: 100,
  },
  matchScoreText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  saveBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    zIndex: 100,
  },
  saveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  matchDescriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 2,
  },
});