import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Alert } from "../utils/alert";
import { communityService } from "../services/community.service";
import { paintballEventTypes } from "../constants/paintball";
import { useTheme } from "../store/ThemeContext";

export default function CreateEventScreen({ navigation }: any) {
  const { accent } = useTheme();
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState<string>(paintballEventTypes[0][0]);
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [capacity, setCapacity] = useState("");
  const [cost, setCost] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const valid = title.trim() && description.trim() && startsAt.trim() && endsAt.trim();

  const submit = async () => {
    if (!valid) return;
    const starts = new Date(startsAt);
    const ends = new Date(endsAt);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
      Alert.alert("Check the dates", "Start and end need to be valid dates, e.g. \"Aug 1, 2026 6:00 PM\".");
      return;
    }
    if (registrationUrl.trim() && !/^https?:\/\//i.test(registrationUrl.trim())) {
      Alert.alert("Check the ticketing link", "It should start with http:// or https://");
      return;
    }
    setSubmitting(true);
    try {
      await communityService.createEvent({
        title: title.trim(),
        eventType,
        description: description.trim(),
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        capacity: capacity.trim() ? Math.max(1, Math.round(Number(capacity))) : undefined,
        costCents: cost.trim() ? Math.round(Number(cost) * 100) : undefined,
        registrationUrl: registrationUrl.trim() || undefined,
      });
      setDone(true);
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit this event",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={s.page}>
        <View style={s.doneCard}>
          <Text style={[s.kicker, { color: accent }]}>SUBMITTED</Text>
          <Text style={s.title}>Your event is in review.</Text>
          <Text style={s.body}>
            An admin will take a quick look before it goes live on PBGearbag — usually fast. You'll get a notification
            either way.
          </Text>
          <Pressable style={[s.primary, { backgroundColor: accent }]} onPress={() => navigation.goBack()}>
            <Text style={s.primaryText}>Back to Discover</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={[s.kicker, { color: accent }]}>HOST AN EVENT</Text>
      <Text style={s.title}>Tell players what's happening.</Text>
      <Text style={s.body}>New events go through a quick admin review before they're visible to everyone.</Text>

      <Text style={s.label}>TITLE</Text>
      <TextInput style={s.input} placeholder="e.g. Saturday Woodsball Open Play" placeholderTextColor="#5A655F" value={title} onChangeText={setTitle} />

      <Text style={s.label}>FORMAT</Text>
      <View style={s.chipRow}>
        {paintballEventTypes.map(([value, label]) => (
          <Pressable
            key={value}
            style={[s.chip, eventType === value && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => setEventType(value)}
          >
            <Text style={[s.chipText, eventType === value && s.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.label}>DESCRIPTION</Text>
      <TextInput
        style={[s.input, s.inputMultiline]}
        placeholder="What should players expect?"
        placeholderTextColor="#5A655F"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>STARTS</Text>
          <TextInput style={s.input} placeholder="Aug 1, 2026 9:00 AM" placeholderTextColor="#5A655F" value={startsAt} onChangeText={setStartsAt} />
        </View>
        <View style={s.col}>
          <Text style={s.label}>ENDS</Text>
          <TextInput style={s.input} placeholder="Aug 1, 2026 4:00 PM" placeholderTextColor="#5A655F" value={endsAt} onChangeText={setEndsAt} />
        </View>
      </View>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>CITY</Text>
          <TextInput style={s.input} placeholder="Optional" placeholderTextColor="#5A655F" value={city} onChangeText={setCity} />
        </View>
        <View style={s.col}>
          <Text style={s.label}>STATE / REGION</Text>
          <TextInput style={s.input} placeholder="Optional" placeholderTextColor="#5A655F" value={region} onChangeText={setRegion} />
        </View>
      </View>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>CAPACITY</Text>
          <TextInput style={s.input} placeholder="Optional" placeholderTextColor="#5A655F" value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
        </View>
        <View style={s.col}>
          <Text style={s.label}>COST ($)</Text>
          <TextInput style={s.input} placeholder="Optional — 0 for free" placeholderTextColor="#5A655F" value={cost} onChangeText={setCost} keyboardType="decimal-pad" />
        </View>
      </View>

      <Text style={s.label}>TICKETING LINK</Text>
      <Text style={s.disclaimer}>
        PBGearbag doesn't process payments or sell tickets directly. If there's a cost to attend, link your Eventbrite
        (or similar) page here — players will see a "Get Tickets" button that sends them there.
      </Text>
      <TextInput
        style={s.input}
        placeholder="https://... (optional)"
        placeholderTextColor="#5A655F"
        value={registrationUrl}
        onChangeText={setRegistrationUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Pressable
        style={[s.primary, { backgroundColor: accent }, (!valid || submitting) && s.primaryDisabled]}
        onPress={submit}
        disabled={!valid || submitting}
      >
        {submitting ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.primaryText}>Submit event</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: { width: "94%", maxWidth: 640, alignSelf: "center", padding: 22, paddingBottom: 60 },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#F3F1E8", fontSize: 26, fontWeight: "900", marginTop: 8 },
  body: { color: "#96a1a8", fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  label: { color: "#75817B", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  disclaimer: { color: "#75817B", fontSize: 11, lineHeight: 16, marginBottom: 8, fontStyle: "italic" },
  input: {
    backgroundColor: "#171c20",
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#364047",
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#3B4645", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { color: "#D6DDDA", fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: "#10140D" },
  primary: { borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 26 },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: "#10150d", fontWeight: "900", fontSize: 14 },
  doneCard: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: "#2c353c",
    borderRadius: 20,
    padding: 26,
    marginTop: 80,
  },
});
