import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  socialService,
  SocialProfileSummary,
} from "../services/social.service";

const TURF = "#A8C84A",
  INK = "#0A0E0F",
  PANEL = "#121819";

export default function FollowListScreen({ route, navigation }: any) {
  const { userId, mode, title } = route.params || {};
  const [items, setItems] = useState<SocialProfileSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (p: number) => {
    const fn =
      mode === "following" ? socialService.followingOf : socialService.followers;
    const result = await fn(userId, p);
    setTotalPages(result.totalPages);
    return result.items;
  };

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetchPage(1)
      .then((rows) => {
        setItems(rows);
        setPage(1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, mode]);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const rows = await fetchPage(page + 1);
      setItems((prev) => [...prev, ...rows]);
      setPage((p) => p + 1);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <View style={s.page}>
      <View style={s.header}>
        <Text style={s.title}>
          {mode === "following" ? "Following" : "Followers"}
        </Text>
        {title ? <Text style={s.subtitle}>{title}</Text> : null}
      </View>
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={TURF} />
        </View>
      ) : items.length === 0 ? (
        <View style={s.center}>
          <Text style={s.empty}>
            {mode === "following"
              ? "Not following anyone yet."
              : "No followers yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          contentContainerStyle={s.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={TURF} style={{ marginVertical: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={s.row}
              onPress={() =>
                navigation.push("PublicProfile", { userId: item.id })
              }
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatarFallback}>
                  <Text style={s.avatarText}>
                    {(item.displayName || item.username).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={s.nameLine}>
                  <Text style={s.name}>{item.displayName || item.username}</Text>
                  {item.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color={TURF} />
                  )}
                </View>
                <Text style={s.handle}>
                  @{item.username}
                  {item.city ? ` • ${item.city}` : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#5C6864" />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#232B29",
  },
  title: { color: "#F3F1E8", fontSize: 22, fontWeight: "900" },
  subtitle: { color: "#75817B", fontSize: 12, fontWeight: "700", marginTop: 3 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { color: "#84908A", fontSize: 13 },
  list: { padding: 14, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 12,
    padding: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 12 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#273229",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: TURF, fontSize: 14, fontWeight: "900" },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  name: { color: "#F3F1E8", fontSize: 14, fontWeight: "800" },
  handle: { color: "#75817B", fontSize: 11, marginTop: 2 },
});
