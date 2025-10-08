import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  Image
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  
  useEffect(() => {
    // Fade in animation
    // Using useNativeDriver: false since opacity animations don't support native driver
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false, // Set to false for opacity animations
    }).start();
    
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 5000); // 2 seconds duration

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <Image 
            source={require('../../assets/onboarding/p1.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>AtmosCare</Text>
        </Animated.View>
      </View>
      <View style={styles.bottomContent}>
        <Text style={styles.caption}>Empowering Healthier You</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContent: {
    paddingBottom: 50,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  appName: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#4A6CF7',
    textAlign: 'center',
    marginTop: 20,
  },
  caption: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default SplashScreen;