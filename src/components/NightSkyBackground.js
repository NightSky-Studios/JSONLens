import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { useSettings } from '../context/SettingsContext';

const { width: SW, height: SH } = Dimensions.get('window');
const NUM_STARS  = 60;
const NUM_BIGS   = 10; // slightly larger twinkling stars

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function Star({ x, y, size, delay, duration, twinkle, opacity }) {
  const { theme } = useSettings();
  const anim     = useRef(new Animated.Value(0)).current;
  const twinkleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Float upward slowly, reset to bottom
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, []);

  useEffect(() => {
    if (!twinkle) return;
    const twinkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkleA, {
          toValue: 0.2,
          duration: randomBetween(800, 2200),
          delay: delay * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(twinkleA, {
          toValue: 1,
          duration: randomBetween(800, 2200),
          useNativeDriver: true,
        }),
      ])
    );
    twinkleLoop.start();
    return () => twinkleLoop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, -(SH * 1.2)],
  });

  const drift = anim.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0, size * 4, 0],
  });

  return (
    <Animated.View
      style={[
        s.star,
        {
          left:    x,
          top:     y,
          width:   size,
          height:  size,
          borderRadius: size / 2,
          opacity: Animated.multiply(twinkleA, opacity * theme.starOpacity),
          transform: [{ translateY }, { translateX: drift }],
          backgroundColor: twinkle ? '#ffffff' : 'rgba(220,200,255,0.9)',
          shadowColor: twinkle ? '#d4aaff' : '#ffffff',
          shadowOpacity: twinkle ? 0.9 : 0.4,
          shadowRadius: twinkle ? size * 1.5 : size,
          elevation: twinkle ? 3 : 1,
        },
      ]}
    />
  );
}

export default function NightSkyBackground() {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < NUM_STARS; i++) {
      const isBig = i < NUM_BIGS;
      arr.push({
        id:       i,
        x:        randomBetween(0, SW),
        y:        randomBetween(0, SH * 1.5),
        size:     isBig ? randomBetween(2, 3.5) : randomBetween(0.8, 1.8),
        delay:    randomBetween(0, 18000),
        duration: randomBetween(20000, 45000),
        twinkle:  isBig,
        opacity:  randomBetween(0.4, 1.0),
      });
    }
    return arr;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((star) => (
        <Star key={star.id} {...star} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  star: {
    position: 'absolute',
  },
});
