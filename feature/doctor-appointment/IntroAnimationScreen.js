import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity } from 'react-native';

// IntroAnimationScreen
// Sequence:
// 0.0s-1.5s: heartbeat line animates across
// 1.5s-2.5s: line fades out, heart glows in and scales up
// 2.5s-3.5s: doctor icons fade in
// 3.5s-4.5s: tagline lines fade in
// 4.0s: auto navigate (slightly overlaps for snappier UX)

export default function IntroAnimationScreen({ navigation, onDone }) {
  const { width } = Dimensions.get('window');

  // Animated values
  const progress = useRef(new Animated.Value(0)).current; // for line sweep 0->1
  const lineOpacity = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(0.6)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const heartGlow = useRef(new Animated.Value(0)).current; // 0..1
  const docsOpacity = useRef(new Animated.Value(0)).current;
  const text1Opacity = useRef(new Animated.Value(0)).current;
  const text2Opacity = useRef(new Animated.Value(0)).current;

  // Timing constants (ms)
  const T = useMemo(() => ({
    heartbeat: 1500, // 0.0 - 1.5s
    heartIn: 500,    // 1.5 - 2.0s
    docsIn: 1000,    // 2.0 - 3.0s
    textIn: 1000,    // 3.0 - 4.0s (both lines within 1s)
    autoNav: 4000,   // navigate at 4.0s
  }), []);

  useEffect(() => {
    // Heartbeat sweep with subtle spike (scaleY effect simulated by opacity pulse)
    const heartbeat = Animated.timing(progress, {
      toValue: 1,
      duration: T.heartbeat,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    const toHeart = Animated.parallel([
      Animated.timing(lineOpacity, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(heartOpacity, { toValue: 1, duration: T.heartIn, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: T.heartIn, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartGlow, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          Animated.timing(heartGlow, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        ]),
        { iterations: 2 }
      ),
    ]);

    const docsIn = Animated.timing(docsOpacity, { toValue: 1, duration: T.docsIn, easing: Easing.out(Easing.cubic), useNativeDriver: true });

    // Stagger both lines within 1s window
    const textIn = Animated.stagger(300, [
      Animated.timing(text1Opacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(text2Opacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);

    // Orchestrate timeline
    const timeline = Animated.sequence([
      heartbeat, // 0.0 - 1.5s
      toHeart,   // 1.5 - 2.0s
      docsIn,    // 2.0 - 3.0s
      textIn,    // 3.0 - 4.0s
    ]);

    timeline.start();

    const navTimer = setTimeout(() => {
      if (onDone) onDone();
      else if (navigation && navigation.replace) navigation.replace('DoctorProfile');
    }, T.autoNav);

    return () => {
      progress.stopAnimation();
      heartScale.stopAnimation();
      heartGlow.stopAnimation();
      text1Opacity.stopAnimation();
      text2Opacity.stopAnimation();
      docsOpacity.stopAnimation();
      clearTimeout(navTimer);
    };
  }, [T, docsOpacity, heartGlow, heartOpacity, heartScale, navigation, onDone, progress, text1Opacity, text2Opacity, lineOpacity]);

  // Derived render values
  const lineWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.9],
  });

  const glowSize = heartGlow.interpolate({ inputRange: [0, 1], outputRange: [120, 136] });
  const glowOpacity = heartGlow.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });

  const skipNow = () => {
    if (onDone) onDone();
    else if (navigation && navigation.replace) navigation.replace('DoctorProfile');
  };

  return (
    <View style={s.container}>
      {/* Soft gradient-ish background made from layered shapes (no extra deps) */}
      <View style={s.bgTop} />
      <View style={s.bgBlob} />

      {/* Skip */}
      <TouchableOpacity onPress={skipNow} style={s.skipBtn}>
        <Text style={s.skipTxt}>Skip →</Text>
      </TouchableOpacity>

      {/* Heartbeat line */}
      <Animated.View style={[s.lineWrap, { opacity: lineOpacity }]}>
        <View style={s.lineBase} />
        <Animated.View style={[s.lineSweep, { width: lineWidth }]} />
        {/* Pulse dot at the end */}
        <Animated.View style={[s.pulseDot, { transform: [{ translateX: Animated.add(lineWidth, new Animated.Value(-6)) }] }]} />
      </Animated.View>

      {/* Heart icon */}
      <Animated.View style={[s.heartWrap, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]}>
        <Animated.View style={[s.heartGlow, { opacity: glowOpacity, width: glowSize, height: glowSize }]} />
        <Text style={s.heart}>❤️</Text>
      </Animated.View>

      {/* Doctors icons */}
      <Animated.View style={[s.docsWrap, { opacity: docsOpacity }]}>
        <Text style={s.docIcon}>👨‍⚕️</Text>
        <Text style={[s.docIcon, { marginHorizontal: 24 }]}>🩺</Text>
        <Text style={s.docIcon}>👩‍⚕️</Text>
      </Animated.View>

      {/* Tagline */}
      <View style={s.tagWrap}>
        <Animated.Text style={[s.tagLine, { opacity: text1Opacity }]}>They give their best...</Animated.Text>
        <Animated.Text style={[s.tagLine2, { opacity: text2Opacity }]}>So we can live our best.</Animated.Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Gradient-like background without external deps
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: '#E9F3FF', // light blue
  },
  bgBlob: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    backgroundColor: '#DDEBFF',
    borderRadius: 200,
    opacity: 0.7,
  },
  skipBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
  },
  skipTxt: {
    color: '#1565C0',
    fontWeight: '700',
  },
  // Heartbeat line
  lineWrap: {
    position: 'absolute',
    top: '35%',
    width: '90%',
    alignItems: 'flex-start',
  },
  lineBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#90CAF9',
    opacity: 0.5,
    borderRadius: 2,
  },
  lineSweep: {
    height: 2,
    backgroundColor: '#0D47A1',
    borderRadius: 2,
  },
  pulseDot: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#42A5F5',
    shadowColor: '#42A5F5',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  // Heart
  heartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  heartGlow: {
    position: 'absolute',
    backgroundColor: '#FFCDD2',
    borderRadius: 120,
  },
  heart: {
    fontSize: 64,
  },
  // Doctors icons
  docsWrap: {
    position: 'absolute',
    bottom: '28%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIcon: {
    fontSize: 32,
  },
  // Tagline
  tagWrap: {
    position: 'absolute',
    bottom: '16%',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  tagLine: {
    fontSize: 18,
    color: '#0D47A1',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  tagLine2: {
    fontSize: 16,
    color: '#27445D',
    fontWeight: '600',
    textAlign: 'center',
  },
});
