import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const BackgroundAnimation = () => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const createParticles = (count) => {
    return Array.from({ length: count }).map((_, index) => {
      const size = Math.random() * 4 + 1;
      const xPos = Math.random() * width;
      const yPos = Math.random() * height;
      const duration = Math.random() * 3000 + 2000;

      const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [yPos, yPos - 100],
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: size,
              height: size,
              left: xPos,
              transform: [{ translateY }],
            },
          ]}
        />
      );
    });
  };

  return <View style={styles.container}>{createParticles(50)}</View>;
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#12181B',
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 50,
  },
});

export default BackgroundAnimation;