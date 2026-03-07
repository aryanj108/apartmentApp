import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

// Grabbed once when the file loads so we're not calling Dimensions.get on
// every render. Safe here because the carousel always fills the full screen width.
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  images: any[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {

  // Tracks which image the user is currently on so we can highlight the right dot
  const [activeIndex, setActiveIndex] = useState(0);

  // A ref gives us direct access to the ScrollView without triggering re-renders.
  // Useful if we ever want to programmatically scroll (e.g. auto-advance or jump to a slide).
  const scrollViewRef = useRef<ScrollView>(null);

  // As the user swipes, we divide the scroll offset by the screen width to figure
  // out which page they're on. Math.round snaps to the nearest page mid-swipe
  // so the active dot updates smoothly instead of only changing at the very end.
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>

      {/* pagingEnabled makes the scroll snap to exact page boundaries on release.
          scrollEventThrottle={16} fires onScroll roughly every 16ms (~60fps) so
          the dot indicator stays in sync during the swipe without overloading the JS thread. */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((image, index) => (
          <Image
            key={index}
            source={image}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Dot indicators — one dot per image. The active dot is slightly larger
          and fully opaque so it's easy to tell which page you're on at a glance. */}
      <View style={styles.dotsContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: SCREEN_WIDTH,
  },
  image: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});