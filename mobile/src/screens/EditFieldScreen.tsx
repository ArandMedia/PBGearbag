import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Alert } from "../utils/alert";
import { communityService, Organization } from "../services/community.service";
import { paintballAmenities } from "../constants/paintball";
import { useTheme } from "../store/ThemeContext";

export default function EditFieldScreen({ route, navigation }: any) {
  const { slug } = route.params || {};
  const { accent } = useTheme();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [hours, setHours] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    communityService
      .organization(slug)
      .then((o) => {
        setOrg(o);
        setName(o.name || "");
        setDescription(o.description || "");
        setAddress(o.address || "");
        setCity(o.city || "");
        setRegion(o.region || "");
        setCountry(o.country || "");
        setWebsiteUrl(o.websiteUrl || "");
        setContactEmail(o.contactEmail || "");
        setPhoneNumber(o.phoneNumber || "");
        setLogoUrl(o.logoUrl || "");
        setHours(((o.details as any)?.hours as string) || "");
        setAmenities(Array.isArray((o.details as any)?.amenities) ? (o.details as any).amenities : []);
      })
      .catch(() => {
        Alert.alert("Couldn't load this listing", "Please try again in a moment.");
        navigation.goBack();
      });
  }, [slug]);

  const toggleAmenity = (value: string) => {
    setAmenities((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));
  };

  const save = async () => {
    if (!org || !name.trim()) return;
    setSaving(true);
    try {
      await communityService.updateOrganization(org.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        region: region.trim() || undefined,
        country: country.trim() || undefined,
        websiteUrl: websiteUrl.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        amenities,
        hours: hours.trim() || undefined,
      });
      Alert.alert("Saved", "Your listing has been updated.");
      navigation.replace("CommunityEntity", { kind: "field", slug: org.slug });
    } catch (e: any) {
      Alert.alert(
        "Couldn't save changes",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!org)
    return (
      <View style={s.center}>
        <ActivityIndicator color={accent} />
      </View>
    );

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <Text style={[s.kicker, { color: accent }]}>MANAGE LISTING</Text>
      <Text style={s.title}>Keep your storefront current.</Text>
      <Text style={s.body}>Changes are live immediately — your claim already verified you own this listing.</Text>

      <Text style={s.label}>NAME</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor="#5A655F" />

      <Text style={s.label}>DESCRIPTION</Text>
      <TextInput
        style={[s.input, s.inputMultiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="What should players know?"
        placeholderTextColor="#5A655F"
        multiline
        numberOfLines={4}
      />

      <Text style={s.label}>ADDRESS</Text>
      <TextInput style={s.input} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor="#5A655F" />

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>CITY</Text>
          <TextInput style={s.input} value={city} onChangeText={setCity} placeholderTextColor="#5A655F" />
        </View>
        <View style={s.col}>
          <Text style={s.label}>STATE / REGION</Text>
          <TextInput style={s.input} value={region} onChangeText={setRegion} placeholderTextColor="#5A655F" />
        </View>
        <View style={s.col}>
          <Text style={s.label}>COUNTRY</Text>
          <TextInput style={s.input} value={country} onChangeText={setCountry} placeholderTextColor="#5A655F" />
        </View>
      </View>

      <Text style={s.label}>HOURS</Text>
      <TextInput style={s.input} value={hours} onChangeText={setHours} placeholder="e.g. Sat-Sun 9am-5pm" placeholderTextColor="#5A655F" />

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>WEBSITE</Text>
          <TextInput style={s.input} value={websiteUrl} onChangeText={setWebsiteUrl} autoCapitalize="none" placeholderTextColor="#5A655F" />
        </View>
        <View style={s.col}>
          <Text style={s.label}>PHONE</Text>
          <TextInput style={s.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholderTextColor="#5A655F" />
        </View>
      </View>

      <Text style={s.label}>CONTACT EMAIL</Text>
      <TextInput style={s.input} value={contactEmail} onChangeText={setContactEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#5A655F" />

      <Text style={s.label}>PHOTO URL</Text>
      <TextInput style={s.input} value={logoUrl} onChangeText={setLogoUrl} placeholder="https://... (optional)" autoCapitalize="none" placeholderTextColor="#5A655F" />

      <Text style={s.label}>AMENITIES</Text>
      <View style={s.chipRow}>
        {paintballAmenities.map(([value, label]) => (
          <Pressable
            key={value}
            style={[s.chip, amenities.includes(value) && { backgroundColor: accent, borderColor: accent }]}
            onPress={() => toggleAmenity(value)}
          >
            <Text style={[s.chipText, amenities.includes(value) && s.chipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={[s.primary, { backgroundColor: accent }, (!name.trim() || saving) && s.primaryDisabled]} onPress={save} disabled={!name.trim() || saving}>
        {saving ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.primaryText}>Save changes</Text>}
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: { width: "94%", maxWidth: 640, alignSelf: "center", padding: 22, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: "#0A0E0F", alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#F3F1E8", fontSize: 26, fontWeight: "900", marginTop: 8 },
  body: { color: "#96a1a8", fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 },
  label: { color: "#75817B", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
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
});
