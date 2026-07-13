import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "../utils/alert";
import { Announcement, communityService, Event } from "../services/community.service";
import { useAuth } from "../store/AuthContext";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";
import { hexToRgba } from "../utils/color";

const AMENITY_LABELS: Record<string, string> = {
  rentals: "Rental equipment",
  air: "Compressed air fills",
  "4500": "4500 PSI fills",
  "3000": "3000 PSI fills",
  parking: "Parking",
  "pro shop": "Pro shop",
  wheelchair: "Accessible facilities",
  restrooms: "Restrooms",
  concessions: "Concessions",
  lodging: "On-site lodging",
  camping: "Camping",
};

function RsvpButton({
  label,
  active,
  onPress,
  busy,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  busy: boolean;
}) {
  const { accent } = useTheme();
  return (
    <Pressable
      style={[s.rsvpBtn, active && { backgroundColor: accent, borderColor: accent }]}
      onPress={onPress}
      disabled={busy}
    >
      {busy && active ? (
        <ActivityIndicator size="small" color="#10140D" />
      ) : (
        <Text style={[s.rsvpBtnText, active && s.rsvpBtnTextActive]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const SOURCE_TYPE: Record<string, "organization" | "event" | "team"> = {
  field: "organization",
  event: "event",
  team: "team",
};

export default function CommunityEntityScreen({ route }: any) {
  const { kind, slug } = route.params || {};
  const { user } = useAuth();
  const { accent } = useTheme();
  const [data, setData] = useState<any>();
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [fieldEvents, setFieldEvents] = useState<Event[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimNote, setClaimNote] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSent, setClaimSent] = useState(false);

  useEffect(() => {
    const load =
      kind === "field"
        ? communityService.organization(slug)
        : kind === "event"
          ? communityService.event(slug)
          : communityService.team(slug);
    load.then(setData);
  }, [kind, slug]);

  useEffect(() => {
    if (!data?.id) return;
    communityService.announcements(SOURCE_TYPE[kind], data.id).then(setAnnouncements).catch(() => {});
    if (kind === "field") {
      communityService
        .followedOrganizations()
        .then((orgs) => setIsFollowing(orgs.some((o) => o.id === data.id)))
        .catch(() => {});
      communityService.organizationEvents(data.id).then(setFieldEvents).catch(() => {});
    }
    if (kind === "team") {
      communityService
        .teamMembership(data.id)
        .then((m) => setTeamRole(m.role))
        .catch(() => {});
    }
  }, [data?.id, kind]);

  if (!data)
    return (
      <View style={s.center}>
        <ActivityIndicator color={accent} />
      </View>
    );
  const location = [data.city, data.region, data.country]
    .filter(Boolean)
    .join(", ");
  const rsvp = async (status: "going" | "interested" | "not_going") => {
    setRsvpBusy(true);
    try {
      await communityService.rsvp(data.id, status);
      setRsvpStatus(status);
    } catch {
      Alert.alert("Couldn't save your RSVP", "Please try again in a moment.");
    } finally {
      setRsvpBusy(false);
    }
  };
  const toggleFollow = async () => {
    setFollowBusy(true);
    try {
      const { active } = await communityService.followOrganization(data.id);
      setIsFollowing(active);
      setData((d: any) => ({ ...d, followerCount: (d.followerCount || 0) + (active ? 1 : -1) }));
    } catch {
      Alert.alert("Couldn't update follow", "Please try again in a moment.");
    } finally {
      setFollowBusy(false);
    }
  };
  const canAnnounce =
    kind === "field"
      ? data.claimedById === user?.id
      : kind === "event"
        ? data.organizerId === user?.id
        : kind === "team"
          ? ["owner", "manager", "captain"].includes(teamRole || "")
          : false;
  const postAnnouncement = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) return;
    setPosting(true);
    try {
      const created = await communityService.postAnnouncement(SOURCE_TYPE[kind], data.id, {
        title: announceTitle.trim(),
        body: announceBody.trim(),
      });
      setAnnouncements((prev) => [created, ...prev]);
      setAnnounceTitle("");
      setAnnounceBody("");
      setShowAnnounceForm(false);
    } catch {
      Alert.alert("Couldn't post announcement", "Please try again in a moment.");
    } finally {
      setPosting(false);
    }
  };
  const submitClaim = async () => {
    setClaiming(true);
    try {
      await communityService.requestOrganizationClaim(data.id, claimNote.trim() || undefined);
      setClaimSent(true);
      setShowClaimForm(false);
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit claim request",
        e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setClaiming(false);
    }
  };
  const amenities: string[] = Array.isArray((data.details as any)?.amenities) ? (data.details as any).amenities : [];
  const hours: string | undefined = (data.details as any)?.hours;
  const openDirections = () => {
    const query =
      data.latitude != null && data.longitude != null
        ? `${data.latitude},${data.longitude}`
        : [data.address, data.city, data.region, data.country].filter(Boolean).join(", ");
    if (!query) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  };
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {(data.images?.[0] || data.logoUrl) && (
        <Image source={{ uri: data.images?.[0] || data.logoUrl }} style={s.banner} />
      )}
      <Text style={[s.kicker, { color: accent }]}>{kind?.toUpperCase()}</Text>
      <View style={s.titleRow}>
        <Text style={s.title}>{data.name || data.title}</Text>
        {kind === "field" && (
          <Pressable
            style={[
              s.followBtn,
              { borderColor: hexToRgba(accent, 0.4) },
              isFollowing && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={toggleFollow}
            disabled={followBusy}
          >
            {followBusy ? (
              <ActivityIndicator size="small" color={isFollowing ? "#10140D" : accent} />
            ) : (
              <Text style={[s.followBtnText, { color: accent }, isFollowing && s.followBtnTextActive]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      {kind === "field" && typeof data.followerCount === "number" && (
        <Text style={s.followerCount}>
          {data.followerCount} follower{data.followerCount === 1 ? "" : "s"}
        </Text>
      )}
      <Text style={s.place}>{location}</Text>
      <Text style={s.body}>{data.description}</Text>
      {kind === "event" && (
        <View style={s.rsvpRow}>
          <RsvpButton
            label="GOING"
            active={rsvpStatus === "going"}
            busy={rsvpBusy}
            onPress={() => rsvp("going")}
          />
          <RsvpButton
            label="INTERESTED"
            active={rsvpStatus === "interested"}
            busy={rsvpBusy}
            onPress={() => rsvp("interested")}
          />
          <RsvpButton
            label="CAN'T GO"
            active={rsvpStatus === "not_going"}
            busy={rsvpBusy}
            onPress={() => rsvp("not_going")}
          />
        </View>
      )}
      <View style={s.card}>
        <Text style={s.label}>DETAILS</Text>
        {data.type && <Text style={s.detail}>TYPE · {data.type}</Text>}
        {data.teamType && (
          <Text style={s.detail}>PLAY STYLE · {data.teamType}</Text>
        )}
        {data.eventType && (
          <Text style={s.detail}>FORMAT · {data.eventType}</Text>
        )}
        {kind === "event" && data.costCents != null && (
          <Text style={s.detail}>
            COST ·{" "}
            {data.costCents === 0
              ? "Free"
              : `$${(data.costCents / 100).toFixed(2)}`}
          </Text>
        )}
        {kind === "event" && data.capacity != null && (
          <Text style={s.detail}>CAPACITY · {data.capacity} players</Text>
        )}
        {kind === "event" && data.registrationUrl && (
          <Text style={s.detail}>REGISTRATION · {data.registrationUrl}</Text>
        )}
        {kind === "field" && data.address && (
          <Text style={s.detail}>ADDRESS · {data.address}</Text>
        )}
        {kind === "field" && hours && (
          <Text style={s.detail}>HOURS · {hours}</Text>
        )}
        {kind === "field" && data.websiteUrl && (
          <Text style={s.detail}>WEBSITE · {data.websiteUrl}</Text>
        )}
        {kind === "field" && data.phoneNumber && (
          <Text style={s.detail}>PHONE · {data.phoneNumber}</Text>
        )}
        {kind === "field" && data.contactEmail && (
          <Text style={s.detail}>EMAIL · {data.contactEmail}</Text>
        )}
        {data.isVerified && <Text style={[s.verified, { color: accent }]}>✓ VERIFIED</Text>}
        {data.isRecruiting && (
          <Text style={s.recruiting}>RECRUITING PLAYERS</Text>
        )}
        {kind === "field" && (data.latitude != null || data.address) && (
          <Pressable style={[s.directionsBtn, { borderColor: accent }]} onPress={openDirections}>
            <Text style={[s.directionsBtnText, { color: accent }]}>GET DIRECTIONS</Text>
          </Pressable>
        )}
      </View>

      {kind === "field" && amenities.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>AMENITIES</Text>
          <View style={s.amenityWrap}>
            {amenities.map((a) => (
              <View
                key={a}
                style={[s.amenityTag, { backgroundColor: hexToRgba(accent, 0.1), borderColor: hexToRgba(accent, 0.3) }]}
              >
                <Text style={[s.amenityTagText, { color: accent }]}>{AMENITY_LABELS[a] || a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {kind === "field" && fieldEvents.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>UPCOMING EVENTS HERE</Text>
          {fieldEvents.map((e) => (
            <View key={e.id} style={s.eventRow}>
              <Text style={s.eventTitle} numberOfLines={1}>{e.title}</Text>
              <Text style={[s.eventDate, { color: accent }]}>
                {new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {kind === "field" && !data.claimedById && (
        <View style={[s.card, { borderColor: hexToRgba(accent, 0.35) }]}>
          <Text style={s.label}>IS THIS YOUR FIELD?</Text>
          <Text style={s.claimBody}>
            Claim this listing to manage it as a free storefront — post announcements, keep hours and contact
            info current, and promote events straight to the players who follow you.
          </Text>
          {claimSent ? (
            <Text style={[s.claimSentText, { color: accent }]}>Claim request sent — an admin will review it shortly.</Text>
          ) : showClaimForm ? (
            <View style={s.announceForm}>
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="Tell us how you're connected to this field (optional)"
                placeholderTextColor="#5A655F"
                value={claimNote}
                onChangeText={setClaimNote}
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={[s.postBtn, { backgroundColor: accent }, claiming && s.postBtnDisabled]}
                onPress={submitClaim}
                disabled={claiming}
              >
                {claiming ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Submit claim request</Text>}
              </Pressable>
            </View>
          ) : (
            <Pressable style={[s.postBtn, { backgroundColor: accent }]} onPress={() => setShowClaimForm(true)}>
              <Text style={s.postBtnText}>Claim this field</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={s.card}>
        <View style={s.announceHeader}>
          <Text style={s.label}>ANNOUNCEMENTS</Text>
          {canAnnounce && (
            <Pressable onPress={() => setShowAnnounceForm((v) => !v)}>
              <Text style={[s.announceToggle, { color: accent }]}>{showAnnounceForm ? "Cancel" : "+ Post"}</Text>
            </Pressable>
          )}
        </View>
        {canAnnounce && showAnnounceForm && (
          <View style={s.announceForm}>
            <TextInput
              style={s.input}
              placeholder="Title"
              placeholderTextColor="#5A655F"
              value={announceTitle}
              onChangeText={setAnnounceTitle}
            />
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="What's going on?"
              placeholderTextColor="#5A655F"
              value={announceBody}
              onChangeText={setAnnounceBody}
              multiline
              numberOfLines={3}
            />
            <Pressable
              style={[
                s.postBtn,
                { backgroundColor: accent },
                (!announceTitle.trim() || !announceBody.trim() || posting) && s.postBtnDisabled,
              ]}
              onPress={postAnnouncement}
              disabled={!announceTitle.trim() || !announceBody.trim() || posting}
            >
              {posting ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Post</Text>}
            </Pressable>
          </View>
        )}
        {!announcements.length ? (
          <Text style={s.emptyAnnounce}>No announcements yet.</Text>
        ) : (
          announcements.map((a) => (
            <View key={a.id} style={s.announceRow}>
              <Text style={s.announceTitle}>{a.title}</Text>
              <Text style={s.announceBody}>{a.body}</Text>
              <Text style={s.announceTime}>{new Date(a.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
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
  banner: { width: "100%", height: 180, borderRadius: 14, backgroundColor: "#121819", marginBottom: 18 },
  kicker: {
    color: DEFAULT_ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: "#F3F1E8", fontSize: 34, fontWeight: "900", marginTop: 8 },
  place: { color: "#77827D", marginTop: 7 },
  body: { color: "#B8C1BC", fontSize: 15, lineHeight: 23, marginTop: 22 },
  rsvpRow: { flexDirection: "row", gap: 8, marginTop: 20, flexWrap: "wrap" },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: "#3B4645",
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minWidth: 90,
    alignItems: "center",
  },
  rsvpBtnText: { color: "#D6DDDA", fontSize: 10, fontWeight: "900" },
  rsvpBtnTextActive: { color: "#10140D" },
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
  verified: { color: DEFAULT_ACCENT, fontWeight: "900", marginTop: 13 },
  recruiting: { color: "#E8743B", fontWeight: "900", marginTop: 13 },
  directionsBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: DEFAULT_ACCENT,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  directionsBtnText: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  followBtn: {
    borderWidth: 1,
    borderColor: hexToRgba(DEFAULT_ACCENT, 0.4),
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
  },
  followBtnText: { color: DEFAULT_ACCENT, fontSize: 12, fontWeight: "900" },
  followBtnTextActive: { color: "#10140D" },
  followerCount: { color: "#75817B", fontSize: 12, marginTop: 6 },
  announceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  announceToggle: { color: DEFAULT_ACCENT, fontSize: 12, fontWeight: "900" },
  announceForm: { marginTop: 10, marginBottom: 16, gap: 10 },
  input: {
    backgroundColor: "#171c20",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#364047",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  postBtn: { alignSelf: "flex-start", backgroundColor: DEFAULT_ACCENT, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: "#10150d", fontWeight: "900", fontSize: 13 },
  emptyAnnounce: { color: "#68737d", fontSize: 13, fontStyle: "italic" },
  announceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  announceTitle: { color: "#F3F1E8", fontSize: 14, fontWeight: "800" },
  announceBody: { color: "#B8C1BC", fontSize: 13, marginTop: 4, lineHeight: 19 },
  announceTime: { color: "#5A655F", fontSize: 10, marginTop: 6 },
  amenityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityTag: {
    backgroundColor: hexToRgba(DEFAULT_ACCENT, 0.1),
    borderWidth: 1,
    borderColor: hexToRgba(DEFAULT_ACCENT, 0.3),
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  amenityTagText: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "800" },
  eventRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  eventTitle: { color: "#F3F1E8", fontSize: 13, fontWeight: "800", flex: 1, marginRight: 10 },
  eventDate: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900" },
  claimBody: { color: "#B8C1BC", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  claimSentText: { color: DEFAULT_ACCENT, fontSize: 13, fontWeight: "800" },
});
