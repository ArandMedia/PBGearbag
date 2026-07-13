import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Event } from "../../services/community.service";
import { useTheme, DEFAULT_ACCENT } from "../../store/ThemeContext";

const PANEL = "#121819";

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Row({ event, onPress }: { event: Event; onPress: () => void }) {
  const { accent } = useTheme();
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={s.dateChip}>
        <Text style={[s.dateChipText, { color: accent }]}>{dateLabel(event.startsAt)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {event.eventType.replace(/_/g, " ")}
          {event.city ? ` · ${event.city}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

interface Props {
  myEvents: Event[];
  nearbyEvents: Event[];
  onPressEvent: (event: Event) => void;
  onSeeAll: () => void;
}

export default function EventsBlock({ myEvents, nearbyEvents, onPressEvent, onSeeAll }: Props) {
  const { accent } = useTheme();
  const empty = !myEvents.length && !nearbyEvents.length;
  return (
    <View style={s.card}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>YOUR SCHEDULE</Text>
          <Text style={s.heading}>Games on your radar</Text>
        </View>
        <Pressable onPress={onSeeAll}>
          <Text style={[s.seeAll, { color: accent }]}>Discover more →</Text>
        </Pressable>
      </View>
      {empty ? (
        <Text style={s.empty}>
          Nothing on the calendar yet. RSVP to an event or follow a field to see what's coming up.
        </Text>
      ) : (
        <>
          {myEvents.length > 0 && (
            <>
              <Text style={s.sectionLabel}>GOING</Text>
              {myEvents.map((e) => (
                <Row key={e.id} event={e} onPress={() => onPressEvent(e)} />
              ))}
            </>
          )}
          {nearbyEvents.length > 0 && (
            <>
              <Text style={s.sectionLabel}>NEAR YOU</Text>
              {nearbyEvents.map((e) => (
                <Row key={e.id} event={e} onPress={() => onPressEvent(e)} />
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: PANEL, borderWidth: 1, borderColor: "#252c32", borderRadius: 20, padding: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  eyebrow: { color: "#6f7a84", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heading: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 5 },
  seeAll: { color: DEFAULT_ACCENT, fontSize: 12, fontWeight: "800" },
  empty: { color: "#8e99a2", fontSize: 13, lineHeight: 19, marginTop: 6 },
  sectionLabel: { color: "#556067", fontSize: 9, fontWeight: "900", letterSpacing: 1.2, marginTop: 14, marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#1E2624" },
  dateChip: { backgroundColor: "#1a2220", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, minWidth: 54, alignItems: "center" },
  dateChipText: { color: DEFAULT_ACCENT, fontSize: 10, fontWeight: "900" },
  title: { color: "#fff", fontSize: 13, fontWeight: "800" },
  meta: { color: "#8e99a2", fontSize: 11, marginTop: 2, textTransform: "capitalize" },
});
