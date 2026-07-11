import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { communityService } from "../services/community.service";
export default function CommunityEntityScreen({ route }: any) {
  const { kind, slug } = route.params || {};
  const [data, setData] = useState<any>();
  useEffect(() => {
    const load =
      kind === "field"
        ? communityService.organization(slug)
        : kind === "event"
          ? communityService.event(slug)
          : communityService.team(slug);
    load.then(setData);
  }, [kind, slug]);
  if (!data)
    return (
      <View style={s.center}>
        <ActivityIndicator color="#A8C84A" />
      </View>
    );
  const location = [data.city, data.region, data.country]
    .filter(Boolean)
    .join(", ");
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={s.kicker}>{kind?.toUpperCase()}</Text>
      <Text style={s.title}>{data.name || data.title}</Text>
      <Text style={s.place}>{location}</Text>
      <Text style={s.body}>{data.description}</Text>
      <View style={s.card}>
        <Text style={s.label}>DETAILS</Text>
        {data.type && <Text style={s.detail}>TYPE · {data.type}</Text>}
        {data.teamType && (
          <Text style={s.detail}>PLAY STYLE · {data.teamType}</Text>
        )}
        {data.eventType && (
          <Text style={s.detail}>FORMAT · {data.eventType}</Text>
        )}
        {data.isVerified && <Text style={s.verified}>✓ VERIFIED</Text>}
        {data.isRecruiting && (
          <Text style={s.recruiting}>RECRUITING PLAYERS</Text>
        )}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: { width: "94%", maxWidth: 760, alignSelf: "center", padding: 22 },
  center: {
    flex: 1,
    backgroundColor: "#0A0E0F",
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: "#A8C84A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: "#F3F1E8", fontSize: 34, fontWeight: "900", marginTop: 8 },
  place: { color: "#77827D", marginTop: 7 },
  body: { color: "#B8C1BC", fontSize: 15, lineHeight: 23, marginTop: 22 },
  card: {
    marginTop: 25,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: "#293431",
    borderRadius: 14,
    padding: 18,
  },
  label: {
    color: "#75817B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  detail: {
    color: "#D1D9D3",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#29322F",
  },
  verified: { color: "#A8C84A", fontWeight: "900", marginTop: 13 },
  recruiting: { color: "#E8743B", fontWeight: "900", marginTop: 13 },
});
