import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} allowFontScaling={false}>
        Welcome to UT Apartments!
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    backgroundColor: '#fff',
  },
  title: {
    fontSize: scale(22),
    fontWeight: '600',
    marginBottom: scale(24),
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#BF5700', // UT orange
    paddingVertical: scale(14),
    paddingHorizontal: scale(40),
    borderRadius: scale(10),
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
});
