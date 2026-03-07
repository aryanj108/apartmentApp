import React, { useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, Pressable, Animated, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';

import HomeIcon from '../../assets/homeIcon.svg';
import SearchIcon from '../../assets/compass1.svg';
import ProfileIcon from '../../assets/profile.svg';

const ACTIVE_TEXT_COLOR = '#BF5700';
const INACTIVE_TEXT_COLOR = '#000000';

const Tab = createBottomTabNavigator();

// Handles all the animation logic for a single tab button. Splitting this into
// its own component keeps each tab's animated values isolated so they can run
// independently without interfering with each other.
const TabItem = ({ route, isFocused, onPress, renderIcon }) => {

  // animatedValue drives the pill background — fades/scales in when active, out when inactive.
  // scaleValue drives the icon size — grows to 1.3x when focused.
  // tapScale is a one-shot bounce that fires on every press regardless of focus.
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const tapScale = useRef(new Animated.Value(1)).current;

  // Animate the pill background in/out with a spring whenever focus changes.
  // Spring feels more natural than a linear timing animation for UI feedback.
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [isFocused]);

  // Animate the icon scale separately from the pill so each can be tuned
  // with different spring settings without coupling them together.
  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isFocused ? 1.3 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [isFocused]);

  // On press: scale up to 1.2x then spring back to 1 for a satisfying bounce.
  // Animated.sequence ensures the spring only starts after the scale-up finishes.
  // onPress is called after so the animation is always visible even on fast taps.
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(tapScale, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(tapScale, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      })
    ]).start();

    onPress();
  };

  const animatedBgStyle = {
    transform: [{ scale: animatedValue }],
    opacity: animatedValue,
  };

  // Multiply the two scale values so the focus scale and tap bounce both apply
  // to the icon at the same time without one overwriting the other.
  const combinedScale = Animated.multiply(scaleValue, tapScale);

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <View style={styles.contentWrapper}>
        {/* Pill sits behind the icon and animates in/out when the tab gains or loses focus */}
        <Animated.View style={[styles.activePillContainer, animatedBgStyle]} />

        <View style={styles.foregroundContent}>
          <Animated.View style={{ transform: [{ scale: combinedScale }] }}>
            {renderIcon(isFocused ? '#BF5700' : '#000000')}
          </Animated.View>
          <Text style={[
            styles.tabLabel,
            { color: isFocused ? ACTIVE_TEXT_COLOR : INACTIVE_TEXT_COLOR }
          ]}>
            {route.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// A fully custom tab bar passed to Tab.Navigator via the `tabBar` prop, replacing
// React Navigation's default bar entirely. This gives us full control over layout,
// animations, and styling that would be difficult to achieve by theming the default.
function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {/* BlurView only works on iOS — Android falls back to the semi-transparent
            white backgroundColor set on tabBarContainer instead. */}
        {Platform.OS === 'ios' && (
          <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          // React Navigation's recommended pattern for custom tab bars — emit the
          // tabPress event so any listeners (e.g. scroll-to-top) still fire, then
          // only navigate if the event wasn't prevented by a listener.
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Active icons are wrapped in MaskedView so a LinearGradient shows through
          // the SVG shape, giving the branded orange gradient effect. Inactive icons
          // just render as a flat color SVG.
          const renderIcon = (color) => {
            let Icon;
            if (route.name === 'Home') Icon = HomeIcon;
            else if (route.name === 'Search') Icon = SearchIcon;
            else if (route.name === 'Profile') Icon = ProfileIcon;

            if (isFocused) {
              return (
                <MaskedView maskElement={<Icon width={30} height={30} stroke="#000000" color="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 30, height: 30 }}
                  />
                </MaskedView>
              );
            }

            return <Icon width={30} height={30} stroke={color} color={color} />;
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              renderIcon={renderIcon}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <MyTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    width: 300,
    height: 65,
    borderRadius: 40,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    width: 85,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foregroundContent: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillContainer: {
    position: 'absolute',
    width: 90,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#c5c5c565',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
});