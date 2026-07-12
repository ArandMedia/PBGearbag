import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

function MotionCard({ title, body, kicker, onPress, delay = 0 }: any) {
  const y = useRef(new Animated.Value(18)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 480, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[s.cardWrap, { opacity, transform: [{ translateY: y }] }]}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[s.card, hovered && s.cardHover]}
      >
        <View style={s.cardTop}>
          <Text style={s.cardKicker}>{kicker}</Text>
          <Text style={[s.arrow, hovered && s.arrowHover]}>↗</Text>
        </View>
        <Text style={s.cardTitle}>{title}</Text>
        <Text style={s.cardBody}>{body}</Text>
      </Pressable>
    </Animated.View>
  );
}

interface Props {
  onTrade: () => void;
  onSell: () => void;
  onPlay: () => void;
  onIdentity: () => void;
}

export default function CommandCenterBlock({ onTrade, onSell, onPlay, onIdentity }: Props) {
  return (
    <View>
      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionEyebrow}>COMMAND CENTER</Text>
          <Text style={s.sectionTitle}>What's your next move?</Text>
        </View>
        <Text style={s.sectionHint}>Everything useful. Nothing in the way.</Text>
      </View>
      <View style={s.grid}>
        <MotionCard kicker="01 / TRADE" title="Find field-ready gear" body="Fresh listings, trusted profiles, and the kit you have been hunting." onPress={onTrade} delay={80} />
        <MotionCard kicker="02 / SELL" title="Turn your bench into cash" body="Create a polished listing and reach players who know the equipment." onPress={onSell} delay={150} />
        <MotionCard kicker="03 / PLAY" title="Get on the field" body="Scenario weekends, mechanical events, and local competition." onPress={onPlay} delay={220} />
        <MotionCard kicker="04 / IDENTITY" title="Build your paintball story" body="Your style, home field, history, and reputation in one place." onPress={onIdentity} delay={290} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 },
  sectionEyebrow: { color: "#6f7a84", fontSize: 10, fontWeight: "900", letterSpacing: 1.6 },
  sectionTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.6, marginTop: 7 },
  sectionHint: { color: "#68737d", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  cardWrap: { flexGrow: 1, flexBasis: 275, minWidth: 250 },
  card: { height: 210, backgroundColor: "#121819", borderWidth: 1, borderColor: "#252c32", borderRadius: 20, padding: 22, justifyContent: "flex-end" },
  cardHover: { borderColor: "#627f4b", backgroundColor: "#151b18", transform: [{ translateY: -5 }] },
  cardTop: { position: "absolute", top: 19, left: 22, right: 20, flexDirection: "row", justifyContent: "space-between" },
  cardKicker: { color: "#7b878f", fontWeight: "900", fontSize: 10, letterSpacing: 1.2 },
  arrow: { color: "#505b63", fontSize: 21 },
  arrowHover: { color: "#A8C84A" },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 9 },
  cardBody: { color: "#8e99a2", fontSize: 13, lineHeight: 19 },
});
