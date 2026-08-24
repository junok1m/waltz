import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

type Props = {
  onRetry: () => void;
};

export function WaltzErrorScreen({ onRetry }: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Image source={require("../assets/waltz-loading.png")} style={styles.artwork} resizeMode="contain" />
      <Text style={styles.title}>Lost the scent</Text>
      <Text style={styles.copy}>Waltz couldn't fetch your walking buddy. Check your connection and let's sniff again.</Text>
      <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
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
    paddingHorizontal: 34,
    paddingBottom: 30,
  },
  artwork: { width: 190, height: 190 },
  title: {
    marginTop: 8,
    color: "#2B2824",
    fontFamily: "Schoolbell_400Regular",
    fontSize: 34,
  },
  copy: {
    maxWidth: 310,
    marginTop: 8,
    color: "#756B60",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  button: {
    marginTop: 22,
    minWidth: 150,
    borderWidth: 1,
    borderColor: "#8C9670",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#596442",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
});
