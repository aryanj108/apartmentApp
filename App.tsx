import React from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { AuthProvider } from './src/context/AuthContext';

(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.allowFontScaling = false;

export default function App() {
  const [fontsLoaded] = useFonts({
    'Test': require('./assets/fonts/Satoshi-Variable.ttf')
  });

    useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PreferencesProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </PreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
