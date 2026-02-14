import React, { useEffect, useRef } from 'react';
import { View, Platform, StyleSheet, Pressable, Animated, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';

import HomeIcon from '../../assets/homeIcon.svg'; 
import SearchIcon from '../../assets/compass1.svg'; 
import ProfileIcon from '../../assets/profile.svg';

const ACTIVE_TEXT_COLOR = '#BF5700';   
const INACTIVE_TEXT_COLOR = '#000000';

const Tab = createBottomTabNavigator();

const TabItem = ({ route, isFocused, onPress, renderIcon }) => {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,   
      tension: 100,  
    }).start();
  }, [isFocused]);

  const animatedBgStyle = {
    transform: [{ scale: animatedValue }],
    opacity: animatedValue,
  };

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <View style={styles.contentWrapper}>
        {/* PILL / CYLINDER BACKGROUND */}
        <Animated.View style={[styles.activePillContainer, animatedBgStyle]} />
        
        {/* ICON AND TEXT */}
        <View style={styles.foregroundContent}>
          {renderIcon(isFocused ? '#BF5700' : '#000000')}
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

function MyTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {/* iOS Blur Background */}
        {Platform.OS === 'ios' && (
          <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
        )}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

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

          const renderIcon = (color) => {
            const props = { width: 30, height: 30, stroke: color, color: color };
            if (route.name === 'Home') return <HomeIcon {...props} />;
            if (route.name === 'Search') return <SearchIcon {...props} />;
            if (route.name === 'Profile') return <ProfileIcon {...props} />;
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
    width: 300, // Width of the entire bar
    height: 65, // Height of the entire bar
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
    zIndex: 2, // Keeps icon and text above the orange background
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