import { type ReactNode, useState } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

function wobblyCardBorder(width: number, height: number) {
  const inset = 4;
  const right = width - inset;
  const bottom = height - inset;
  const corner = Math.min(13, width / 10, height / 5);

  return [
    `M ${inset + corner} ${inset + 0.3}`,
    `C ${width * 0.22} ${inset - 1.4}, ${width * 0.38} ${inset + 1.7}, ${width * 0.54} ${inset - 0.5}`,
    `C ${width * 0.69} ${inset + 1.4}, ${width * 0.83} ${inset - 1.1}, ${right - corner} ${inset + 0.4}`,
    `Q ${right} ${inset}, ${right + 0.2} ${inset + corner}`,
    `C ${right - 1.1} ${height * 0.25}, ${right + 1.5} ${height * 0.38}, ${right - 0.4} ${height * 0.52}`,
    `C ${right + 1.2} ${height * 0.66}, ${right - 1.4} ${height * 0.79}, ${right + 0.1} ${bottom - corner}`,
    `Q ${right} ${bottom}, ${right - corner} ${bottom + 0.1}`,
    `C ${width * 0.79} ${bottom - 1.5}, ${width * 0.63} ${bottom + 1.6}, ${width * 0.47} ${bottom - 0.4}`,
    `C ${width * 0.32} ${bottom + 1.3}, ${width * 0.18} ${bottom - 1.2}, ${inset + corner} ${bottom + 0.2}`,
    `Q ${inset} ${bottom}, ${inset - 0.1} ${bottom - corner}`,
    `C ${inset + 1.3} ${height * 0.78}, ${inset - 0.6} ${height * 0.64}, ${inset + 0.9} ${height * 0.49}`,
    `C ${inset - 1.4} ${height * 0.34}, ${inset + 0.5} ${height * 0.21}, ${inset + 0.1} ${inset + corner}`,
    `Q ${inset} ${inset}, ${inset + corner} ${inset + 0.3} Z`,
  ].join(" ");
}

export function WobblyDivider({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.divider, style]}>
      <Svg width="100%" height={5} viewBox="0 0 100 5" preserveAspectRatio="none">
        <Path d="M 0 2.7 C 15 1.4, 29 3.8, 43 2.2 C 58 1.1, 72 3.7, 85 2.3 C 92 1.7, 97 3.1, 100 2.5" fill="none" stroke="#E5E0D8" strokeWidth={0.65} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export function WobblyCard({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={styles.card}
      onLayout={({ nativeEvent: { layout } }) => {
        if (layout.width > 0 && layout.height > 0 && (layout.width !== size.width || layout.height !== size.height)) {
          setSize({ width: layout.width, height: layout.height });
        }
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg pointerEvents="none" width={size.width} height={size.height} style={styles.border} viewBox={`0 0 ${size.width} ${size.height}`}>
          <Path d={wobblyCardBorder(size.width, size.height)} fill="#FFFDF8" stroke="#D8D1C7" strokeWidth={1.05} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: "relative" },
  border: { position: "absolute", top: 0, left: 0 },
  content: { position: "relative", zIndex: 1, padding: 16 },
  divider: { height: 5 },
});
