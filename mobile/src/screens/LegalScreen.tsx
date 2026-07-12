import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LAST_UPDATED, LEGAL_DOCS } from "../data/legalContent";

const TURF = "#A8C84A",
  INK = "#0A0E0F",
  PANEL = "#121819";

export default function LegalScreen({ route }: any) {
  const initialKey = route?.params?.doc || "terms";
  const [active, setActive] = useState(
    LEGAL_DOCS.find((d) => d.key === initialKey)?.key || LEGAL_DOCS[0].key,
  );
  const doc = LEGAL_DOCS.find((d) => d.key === active) || LEGAL_DOCS[0];

  return (
    <View style={s.page}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={s.tabsContent}>
        {LEGAL_DOCS.map((d) => (
          <Pressable
            key={d.key}
            style={[s.tab, active === d.key && s.tabActive]}
            onPress={() => setActive(d.key)}
          >
            <Text style={[s.tabText, active === d.key && s.tabTextActive]}>{d.title}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        <Text style={s.title}>{doc.title}</Text>
        <Text style={s.updated}>Last updated {LAST_UPDATED}</Text>
        {doc.sections.map((sec) => (
          <View key={sec.heading} style={s.section}>
            <Text style={s.heading}>{sec.heading}</Text>
            <Text style={s.text}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  tabs: { borderBottomWidth: 1, borderBottomColor: "#232C2A", flexGrow: 0 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: {
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabActive: { backgroundColor: TURF, borderColor: TURF },
  tabText: { color: "#9DA9A3", fontSize: 11, fontWeight: "800" },
  tabTextActive: { color: "#10140D" },
  body: { flex: 1 },
  bodyContent: { maxWidth: 680, width: "100%", alignSelf: "center", padding: 20, paddingBottom: 90 },
  title: { color: "#F3F1E8", fontSize: 26, fontWeight: "900" },
  updated: { color: "#687470", fontSize: 11, fontWeight: "700", marginTop: 6, marginBottom: 20 },
  section: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  heading: { color: TURF, fontSize: 12, fontWeight: "900", marginBottom: 8 },
  text: { color: "#C1C8C4", fontSize: 13, lineHeight: 20 },
});
