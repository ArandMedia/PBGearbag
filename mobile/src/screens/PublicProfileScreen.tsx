import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { authService, User } from "../services/auth.service";
import { socialService } from "../services/social.service";
const T = "#A8C84A";
export default function PublicProfileScreen({ route }: any) {
  const uId = route.params?.userId;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    authService
      .getPublicUser(uId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [uId]);
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={T} />
      </View>
    );
  if (!user)
    return (
      <View style={s.center}>
        <Text style={s.muted}>Player not found.</Text>
      </View>
    );
  const name = user.displayName || user.username;
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.cover}>
        {user.bannerUrl && (
          <Image source={{ uri: user.bannerUrl }} style={s.coverImage} />
        )}
        <Text style={s.coverLabel}>PBG PLAYER</Text>
      </View>
      <View style={s.identity}>
        <View style={s.avatar}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={s.avatarImage} />
          ) : (
            <Text style={s.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
          )}
        </View>
      </View>
      <Text style={s.name}>{name}</Text>
      <Text style={s.handle}>
        @{user.username} • {user.city || "Paintball player"}
      </Text>
      {user.bio && <Text style={s.bio}>{user.bio}</Text>}
      <View style={s.tags}>
        {user.playStyle?.map((x) => (
          <Text key={x} style={s.tag}>
            {x.toUpperCase()}
          </Text>
        ))}
      </View>
      <View style={s.actions}>
        <Pressable
          style={[s.follow, following && s.following]}
          onPress={async () => {
            await socialService.follow(user.id);
            setFollowing((v) => !v);
          }}
        >
          <Ionicons
            name={following ? "checkmark" : "person-add-outline"}
            color={following ? "#10140D" : T}
            size={16}
          />
          <Text style={[s.followText, following && { color: "#10140D" }]}>
            {following ? "FOLLOWING" : "FOLLOW"}
          </Text>
        </Pressable>
        <Pressable
          style={s.share}
          onPress={() =>
            Share.share({ message: `Check out @${user.username} on PBGearbag` })
          }
        >
          <Text style={s.shareText}>SHARE PROFILE</Text>
        </Pressable>
      </View>
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
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: {
    width: "94%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    backgroundColor: "#0A0E0F",
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
  coverLabel: {
    color: T,
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
    borderColor: "#0A0E0F",
    alignItems: "center",
    justifyContent: "center",
  },
  identity: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#263329",
    borderWidth: 4,
    borderColor: "#0A0E0F",
    marginTop: -48,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 20 },
  avatarText: { color: T, fontSize: 30, fontWeight: "900" },
  name: {
    color: "#F3F1E8",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
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
    color: T,
    borderWidth: 1,
    borderColor: "#506833",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
    fontSize: 8,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
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
  following: { backgroundColor: T, borderColor: T },
  followText: { color: T, fontWeight: "900", fontSize: 10 },
  share: {
    borderWidth: 1,
    borderColor: "#3A4541",
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  shareText: { color: "#D3DAD5", fontWeight: "900", fontSize: 10 },
  card: {
    marginTop: 25,
    backgroundColor: "#121819",
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
});
