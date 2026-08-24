import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

type Props = {
  showWordmark?: boolean;
};

export function WaltzLoadingScreen({ showWordmark = true }: Props) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [motion]);

  const animatedStyle = {
    opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
    transform: [
      { translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
      { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [2, -2] }) },
      { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
    ],
  };

  return (
    <View style={styles.container} accessibilityLabel="Waltz is loading">
      <Animated.View style={[styles.artworkWrap, animatedStyle]}>
        <Image
          source={require("../assets/waltz-loading.png")}
          style={styles.artwork}
          resizeMode="contain"
        />
      </Animated.View>
      {showWordmark ? <Text style={styles.wordmark}>waltz</Text> : null}
      <Text style={styles.message}>sniffing things out...</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F3E9",
    paddingBottom: 34,
  },
  artworkWrap: {
    width: 230,
    height: 230,
  },
  artwork: {
    width: "100%",
    height: "100%",
  },
  wordmark: {
    marginTop: 2,
    color: "#2B2824",
    fontFamily: "Schoolbell_400Regular",
    fontSize: 42,
    lineHeight: 50,
  },
  message: {
    marginTop: 5,
    color: "#817B72",
    fontSize: 13,
    letterSpacing: 0.6,
  },
});
