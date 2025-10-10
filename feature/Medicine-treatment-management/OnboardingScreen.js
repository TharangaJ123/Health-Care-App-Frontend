import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
  Platform,
  // StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../../component/common/Icon';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Track your\nHealth',
    subtitle: '',
    description: 'Monitor your wellness journey with our comprehensive health tracking app. Stay informed, stay healthy.',
    image: null,
    colors: ['#FFFFFF', '#F8FAFC'],
    icon: 'heart',
  },
  {
    id: 2,
    title: 'Smart Reminders',
    subtitle: 'Never forget to take your medicine',
    description: 'Set customizable reminders for your medications and never miss a dose. Our app helps you stay on track with your treatment plan.',
    image: null,
    colors: ['#FFFFFF', '#F8FAFC'],
    icon: 'alarm-outline',
  },
  {
    id: 3,
    title: 'Progress Tracking',
    subtitle: 'Monitor your health journey',
    description: 'Track your medication adherence and health progress with detailed insights and analytics to help you stay on top of your wellness goals.',
    image: null,
    colors: ['#FFFFFF', '#F8FAFC'],
    icon: 'stats-chart-outline',
  },
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  const animatePagination = () => {
    // Reset animations
    fadeAnim.setValue(0.5);
    scaleAnim.setValue(0.8);
    
    // Run animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      animatePagination();
    } else {
      // On last screen, navigate to Login
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    // Navigate to Login
    navigation.replace('Login');
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / width);
        if (index !== currentIndex) {
          setCurrentIndex(index);
          animatePagination();
        }
      },
    }
  );

  const renderOnboardingItem = (item, index) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        key={item.id}
        style={[
          styles.slide,
          { 
            opacity,
            transform: [{ scale }],
          }
        ]}
      >
        <LinearGradient
          colors={item.colors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.imageContainer}
            >
              <Image 
                source={item.image} 
                style={styles.image}
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.iconCircle}>
              <Icon 
                name={item.icon} 
                size={40} 
                color="white" 
                style={styles.icon}
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <View style={styles.divider} />
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" translucent={false} /> */}
      
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={styles.slide}>
            <LinearGradient
              colors={item.colors}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.content}>
                {index < 3 ? (
                  <>
                    <View style={styles.modernHero}>
                      <View style={styles.heroIconContainer}>
                        <LinearGradient
                          colors={['#3B82F6', '#1D4ED8', '#1E40AF']}
                          style={styles.iconBackground}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Icon 
                            name={
                              index === 0 ? "heart" : 
                              index === 1 ? "alarm-outline" : 
                              "stats-chart-outline"
                            } 
                            size={70} 
                            color="#FFFFFF" 
                          />
                        </LinearGradient>
                        <View style={styles.floatingElements}>
                          <View style={[styles.floatingDot, styles.dot1]} />
                          <View style={[styles.floatingDot, styles.dot2]} />
                          <View style={[styles.floatingDot, styles.dot3]} />
                          <View style={[styles.floatingDot, styles.dot4]} />
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.imageContainer}>
                      <Image 
                        source={item.image} 
                        style={styles.image}
                        resizeMode="contain"
                      />
                    </View>
                    
                    <View style={styles.iconCircle}>
                      <Icon 
                        name={item.icon} 
                        size={40} 
                        color={theme.colors.white} 
                        style={styles.icon}
                      />
                    </View>
                  </>
                )}
                
                <View style={styles.textContainer}>
                  <Text style={[styles.title, index === 0 && styles.titleModern]}>{item.title}</Text>
                  {item.subtitle ? <Text style={[styles.subtitle, index === 0 && styles.subtitleModern]}>{item.subtitle}</Text> : null}
                  <View style={[styles.divider, index === 0 && styles.dividerModern]} />
                  <Text style={[styles.description, index === 0 && styles.descriptionModern]}>{item.description}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentIndex 
                    ? theme.colors.accentBlue
                    : '#E0E0E0',
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentIndex < onboardingData.length - 1 ? (
            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.button, 
              styles.nextButton
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextTextBlue}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Icon 
              name="arrow-forward" 
              size={20} 
              color="#FFFFFF" 
              style={styles.buttonIcon} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  imageContainer: {
    flex: 0.62,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.9,
    height: height * 0.5,
    resizeMode: 'cover',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: theme.colors.accentBlue,
  },
  icon: {
    fontSize: 36,
    color: '#fff',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-light',
  },
  divider: {
    width: 60,
    height: 4,
    backgroundColor: theme.colors.accentBlue,
    borderRadius: 2,
    marginVertical: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-light',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    zIndex: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  skipButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
  },
  skipText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 180,
    marginLeft: 'auto',
    backgroundColor: '#3B82F6',
    ...Platform.select({
      ios: {
        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  nextTextBlue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  buttonIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  // Modern theme styles for screen 1
  modernHero: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 40,
  },
  heroIconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 12px 20px rgba(29, 78, 216, 0.3)',
    elevation: 12,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    opacity: 0.8,
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
    elevation: 4,
  },
  dot1: {
    top: 15,
    right: 15,
  },
  dot2: {
    bottom: 25,
    left: 10,
  },
  dot3: {
    top: 45,
    left: -15,
  },
  dot4: {
    bottom: 15,
    right: -10,
  },
  featureChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#3B82F6',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 8,
    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.1)',
    elevation: 4,
  },
  chipText: {
    color: '#1E40AF',
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 14,
  },
  titleModern: {
    color: '#1E293B',
    fontSize: 32,
    fontWeight: '800',
  },
  subtitleModern: {
    color: '#64748B',
  },
  descriptionModern: {
    color: '#64748B',
  },
  dividerModern: {
    backgroundColor: '#3B82F6',
  },
});

export default OnboardingScreen;
