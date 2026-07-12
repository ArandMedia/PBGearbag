import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Announcement } from "../../services/community.service";

const ORANGE = "#E8743B";
const PANEL = "#121819";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const SOURCE_LABEL: Record<Announcement["sourceType"], string> = {
  organization: "FIELD",
  event: "EVENT",
  team: "TEAM",
};

interface Props {
  announcements: Announcement[];
  onPress: (a: Announcement) => void;
}

export default function FieldWireBlock({ announcements, onPress }: Props) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.tickerLabel}>FIELD WIRE</Text>
        <Text style={s.heading}>What your fields, teams, and events are saying</Text>
      </View>
      {!announcements.length ? (
        <Text style={s.empty}>
          Follow a field or join a team to get their announcements here — registration openings, schedule
          changes, the stuff you'd otherwise miss.
        </Text>
      ) : (
        announcements.map((a) => (
          <Pressable key={a.id} style={s.row} onPress={() => onPress(a)}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{SOURCE_LABEL[a.sourceType]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>
                {a.title}
              </Text>
              <Text style={s.body} numberOfLines={2}>
                {a.sourceName ? `${a.sourceName} · ` : ""}
                {a.body}
              </Text>
            </View>
            <Text style={s.time}>{timeAgo(a.createdAt)}</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: PANEL, borderWidth: 1, borderColor: "#252c32", borderRadius: 20, padding: 22 },
  header: { marginBottom: 10 },
  tickerLabel: { color: ORANGE, fontWeight: "900", fontSize: 11, letterSpacing: 1.4 },
  heading: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 5 },
  empty: { color: "#8e99a2", fontSize: 13, lineHeight: 19, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#1E2624" },
  badge: { backgroundColor: "rgba(232,116,59,.12)", borderWidth: 1, borderColor: "rgba(232,116,59,.35)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginTop: 2 },
  badgeText: { color: ORANGE, fontSize: 9, fontWeight: "900" },
  title: { color: "#fff", fontSize: 13, fontWeight: "800" },
  body: { color: "#8e99a2", fontSize: 12, marginTop: 3, lineHeight: 17 },
  time: { color: "#556067", fontSize: 10, marginTop: 2 },
});
