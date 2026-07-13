import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Alert } from "../utils/alert";
import { useAuth } from "../store/AuthContext";
import { authService, User } from "../services/auth.service";
import {
  RelationshipCounts,
  socialService,
} from "../services/social.service";
import { communityService, Gearbag } from "../services/community.service";
import { Listing, marketplaceService } from "../services/marketplace.service";
import { ProfileWidget, widgetsService } from "../services/widgets.service";
import { WidgetRenderer } from "../components/WidgetCards";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";

const INK = "#0A0E0F",
  PANEL = "#121819";
const defaultCover = require("../../assets/brand/pbgearbag-hero-classic-v2.jpg");

export default function PublicProfileScreen({ route, navigation }: any) {
  const uId = route.params?.userId;
  const { user: viewer } = useAuth();
  const { accent: TURF } = useTheme();
  const isSelf = viewer?.id === uId;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [relationship, setRelationship] = useState<RelationshipCounts | null>(null);
  const [widgets, setWidgets] = useState<ProfileWidget[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [bag, setBag] = useState<Gearbag | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!uId) return;
    authService
      .getPublicUser(uId)
      .then(setUser)
      .finally(() => setLoading(false));
    widgetsService.forUser(uId).then(setWidgets).catch(() => {});
    communityService.myTeam(uId).then(setTeam).catch(() => {});
    communityService.upcomingEvents(uId).then(setUpcomingEvents).catch(() => {});
    communityService.gearbagFor(uId).then(setBag).catch(() => {});
    marketplaceService
      .getListings(1, 6, { sellerId: uId })
      .then((r) => setListings(r.items))
      .catch(() => {});
    socialService.relationship(uId).then(setRelationship).catch(() => {});
    if (viewer && !isSelf) {
      socialService
        .myFollowing()
        .then((rows) => setFollowing(rows.some((r) => r.followingId === uId)))
        .catch(() => {});
      socialService
        .blockedUsers()
        .then((rows) => setBlocked(rows.some((r) => r.id === uId)))
        .catch(() => {});
    }
  }, [uId, viewer?.id]);

  const toggleBlock = () => {
    if (blocked) {
      setBlockBusy(true);
      socialService
        .unblock(uId)
        .then(() => setBlocked(false))
        .catch(() => Alert.alert("Couldn't unblock", "Please try again in a moment."))
        .finally(() => setBlockBusy(false));
      return;
    }
    Alert.alert(
      `Block ${name}?`,
      "They won't be able to follow or message you, and you'll stop following each other.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            setBlockBusy(true);
            socialService
              .block(uId)
              .then(() => {
                setBlocked(true);
                setFollowing(false);
              })
              .catch(() => Alert.alert("Couldn't block", "Please try again in a moment."))
              .finally(() => setBlockBusy(false));
          },
        },
      ],
    );
  };

  const toggleFollow = async () => {
    if (!viewer) {
      navigation.getParent()?.navigate?.("Login");
      return;
    }
    const prev = following;
    setFollowing(!prev);
    setRelationship((r) =>
      r
        ? { ...r, followerCount: r.followerCount + (prev ? -1 : 1) }
        : r,
    );
    try {
      const { active } = await socialService.follow(uId);
      setFollowing(active);
    } catch {
      setFollowing(prev);
      setRelationship((r) =>
        r
          ? { ...r, followerCount: r.followerCount + (prev ? 1 : -1) }
          : r,
      );
    }
  };

  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={TURF} />
      </View>
    );
  if (!user)
    return (
      <View style={s.center}>
        <Text style={s.muted}>Player not found.</Text>
      </View>
    );
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const name = user.displayName || fullName || user.username;
  const location = [user.city, user.stateProvince, user.country]
    .filter(Boolean)
    .join(", ");

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.cover}>
        {user.bannerUrl ? (
          <Image source={{ uri: user.bannerUrl }} style={s.coverImage} />
        ) : (
          <ImageBackground
            source={defaultCover}
            style={s.coverFallback}
            imageStyle={s.coverFallbackImage}
          >
            <View style={s.coverShade} />
          </ImageBackground>
        )}
        <View style={s.coverShadeThin} />
        <Text style={[s.coverLabel, { color: TURF }]}>PBG PLAYER</Text>
      </View>
      <View style={s.identity}>
        <View style={s.avatar}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={s.avatarImage} />
          ) : (
            <Text style={[s.avatarText, { color: TURF }]}>{name.slice(0, 2).toUpperCase()}</Text>
          )}
        </View>
      </View>
      <View style={s.nameLine}>
        <Text style={s.name}>{name}</Text>
        {user.isVerified && (
          <View style={[s.verified, { backgroundColor: TURF }]}>
            <Ionicons name="checkmark" size={10} color="#10140D" />
            <Text style={s.verifiedText}>VERIFIED</Text>
          </View>
        )}
      </View>
      <Text style={s.handle}>
        @{user.username}
        {location ? ` • ${location}` : ""}
      </Text>
      {user.bio && <Text style={s.bio}>{user.bio}</Text>}
      <View style={s.tags}>
        {user.playStyle?.map((x) => (
          <Text key={x} style={[s.tag, { color: TURF }]}>
            {x.replace("_", " ").toUpperCase()}
          </Text>
        ))}
        {user.skillLevel && (
          <Text style={[s.tag, s.tagAmber]}>{user.skillLevel.toUpperCase()}</Text>
        )}
      </View>

      <View style={s.stats}>
        <Pressable
          style={s.stat}
          onPress={() =>
            navigation.navigate("FollowList", {
              userId: uId,
              mode: "followers",
              title: name,
            })
          }
        >
          <Text style={s.statValue}>{relationship?.followerCount ?? 0}</Text>
          <Text style={s.statLabel}>FOLLOWERS</Text>
        </Pressable>
        <Pressable
          style={s.stat}
          onPress={() =>
            navigation.navigate("FollowList", {
              userId: uId,
              mode: "following",
              title: name,
            })
          }
        >
          <Text style={s.statValue}>{relationship?.followingCount ?? 0}</Text>
          <Text style={s.statLabel}>FOLLOWING</Text>
        </Pressable>
        <View style={s.stat}>
          <Text style={s.statValue}>{bag?.items?.length || 0}</Text>
          <Text style={s.statLabel}>GEAR ITEMS</Text>
        </View>
        <View style={[s.stat, s.statLast]}>
          <Text style={s.statValue}>{listings.length}</Text>
          <Text style={s.statLabel}>LISTINGS</Text>
        </View>
      </View>

      <View style={s.actions}>
        {!isSelf && (
          <Pressable
            style={[s.follow, following && { backgroundColor: TURF, borderColor: TURF }]}
            onPress={toggleFollow}
          >
            <Ionicons
              name={following ? "checkmark" : "person-add-outline"}
              color={following ? "#10140D" : TURF}
              size={16}
            />
            <Text style={[s.followText, { color: TURF }, following && { color: "#10140D" }]}>
              {following ? "FOLLOWING" : "FOLLOW"}
            </Text>
          </Pressable>
        )}
        <Pressable
          style={s.share}
          onPress={() =>
            Share.share({
              message: `Check out @${user.username} on PBGearbag — https://pbgearbag.com/players/${user.username}`,
            })
          }
        >
          <Text style={s.shareText}>SHARE PROFILE</Text>
        </Pressable>
        {!isSelf && (
          <Pressable style={s.moreBtn} onPress={() => setMenuOpen((v) => !v)}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#D3DAD5" />
          </Pressable>
        )}
      </View>

      {menuOpen && !isSelf && (
        <View style={s.menu}>
          <Pressable
            style={s.menuRow}
            onPress={() => {
              setMenuOpen(false);
              navigation.navigate("Report", {
                subjectId: uId,
                subjectType: "user",
                title: name,
              });
            }}
          >
            <Ionicons name="flag-outline" size={16} color="#D3DAD5" />
            <Text style={s.menuText}>Report {name}</Text>
          </Pressable>
          <Pressable
            style={s.menuRow}
            onPress={() => {
              setMenuOpen(false);
              toggleBlock();
            }}
            disabled={blockBusy}
          >
            <Ionicons name={blocked ? "lock-open-outline" : "ban-outline"} size={16} color="#E8743B" />
            <Text style={[s.menuText, { color: "#E8743B" }]}>
              {blocked ? `Unblock ${name}` : `Block ${name}`}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.eyebrow}>PLAYER DETAILS</Text>
        <Text style={s.detail}>
          HOME FIELD · {user.homeField || "Not listed"}
        </Text>
        <Text style={s.detail}>
          POSITION · {user.favoritePosition || "Open to anything"}
        </Text>
        <Text style={s.detail}>
          EXPERIENCE · {user.skillLevel || "Not listed"}
        </Text>
      </View>

      {widgets.length > 0 && (
        <>
          <Text style={s.widgetsEyebrow}>ON {name.toUpperCase()}'S PROFILE</Text>
          <View style={s.widgetGrid}>
            {widgets.map((w) => (
              <View key={w.id} style={s.widgetSlot}>
                <WidgetRenderer
                  widget={w}
                  ctx={{ user, bag, team, upcomingEvents, listings }}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  content: {
    width: "94%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    height: 190,
    borderRadius: 18,
    backgroundColor: "#18211D",
    borderWidth: 1,
    borderColor: "#2C3832",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  coverFallback: { flex: 1 },
  coverFallbackImage: { resizeMode: "cover" },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,8,.62)",
  },
  coverShadeThin: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: "rgba(5,8,8,.35)",
  },
  coverLabel: {
    color: DEFAULT_ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    padding: 18,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#263329",
    borderWidth: 4,
    borderColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    width: 96,
    height: 96,
    marginTop: -48,
    alignSelf: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 20 },
  avatarText: { color: DEFAULT_ACCENT, fontSize: 30, fontWeight: "900" },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  name: {
    color: "#F3F1E8",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: DEFAULT_ACCENT,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedText: {
    color: "#10140D",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  handle: { color: "#75817B", fontSize: 11, textAlign: "center", marginTop: 4 },
  bio: {
    color: "#B8C1BC",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 18,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  tag: {
    color: DEFAULT_ACCENT,
    borderWidth: 1,
    borderColor: "#506833",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 8,
    fontWeight: "900",
  },
  tagAmber: { color: "#D9A54B", borderColor: "#5C4B2E" },
  stats: {
    flexDirection: "row",
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#293231",
    backgroundColor: PANEL,
    borderRadius: 13,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#293231",
  },
  statLast: { borderRightWidth: 0 },
  statValue: { color: "#F3F1E8", fontSize: 18, fontWeight: "900" },
  statLabel: {
    color: "#687470",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  follow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#506833",
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  followText: { color: DEFAULT_ACCENT, fontWeight: "900", fontSize: 10 },
  share: {
    borderWidth: 1,
    borderColor: "#3A4541",
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  shareText: { color: "#D3DAD5", fontWeight: "900", fontSize: 10 },
  moreBtn: {
    borderWidth: 1,
    borderColor: "#3A4541",
    borderRadius: 9,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    alignSelf: "center",
    marginTop: 10,
    width: 220,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 10,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#232C2A",
  },
  menuText: { color: "#D3DAD5", fontSize: 12, fontWeight: "700" },
  card: {
    marginTop: 25,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293431",
    borderRadius: 14,
    padding: 18,
  },
  eyebrow: {
    color: "#75817B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  detail: {
    color: "#D0D8D2",
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#28312F",
  },
  muted: { color: "#84908A" },
  widgetsEyebrow: {
    color: "#75817B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 26,
    marginBottom: 12,
  },
  widgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  widgetSlot: { width: "100%" },
});
