import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DEFAULT_ACCENT } from "../store/ThemeContext";

export default function NotFoundScreen({ navigation }: any) {
  const goHome = () => {
    if (navigation?.canGoBack?.()) navigation.popToTop();
    navigation?.navigate?.("MainDrawer");
  };
  return (
    <View style={s.page}>
      <Text style={s.kicker}>404</Text>
      <Text style={s.title}>This field doesn't exist.</Text>
      <Text style={s.body}>The page you're looking for isn't here — it may have moved, or the link was wrong.</Text>
      <Pressable style={s.primary} onPress={goHome}>
        <Text style={s.primaryText}>Back to PBGearbag</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F", alignItems: "center", justifyContent: "center", padding: 24 },
  kicker: { color: DEFAULT_ACCENT, fontSize: 42, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#F3F1E8", fontSize: 22, fontWeight: "900", textAlign: "center", marginTop: 14 },
  body: { color: "#96a1a8", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10, maxWidth: 340 },
  primary: { backgroundColor: DEFAULT_ACCENT, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 22 },
  primaryText: { color: "#10150d", fontWeight: "900", fontSize: 14 },
});
