import React, { useEffect, useRef, useState } from "react";
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { BillboardPost } from "../../services/home.service";

const LIME = "#A8C84A";

interface Props {
  posts: BillboardPost[];
  onPressPost: (post: BillboardPost) => void;
}

// Same auto-advance/pause-on-hover/dot-nav/fade mechanics as the old
// hardcoded hero carousel in HomeScreen — just fed by real, personalized
// posts instead of fixed marketing slides.
export default function Billboard({ posts, onPressPost }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const changeSlide = (next: number) => {
    if (!posts.length) return;
    const target = (next + posts.length) % posts.length;
    if (target === active) return;
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setActive(target);
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (paused || posts.length < 2) return;
    const timer = setInterval(() => changeSlide(active + 1), 6000);
    return () => clearInterval(timer);
  }, [active, paused, posts.length]);

  useEffect(() => {
    if (active >= posts.length) setActive(0);
  }, [posts.length]);

  if (!posts.length) {
    return (
      <View style={[s.hero, s.emptyHero]}>
        <Text style={s.emptyTitle}>Your billboard is warming up</Text>
        <Text style={s.emptyBody}>
          Post a photo or clip to the Field Feed, or follow a few players and fields — this space fills in with
          what matters to you.
        </Text>
      </View>
    );
  }

  const post = posts[active] || posts[0];
  const image = post.mediaUrl || post.thumbnailUrl;
  const authorName = post.author?.displayName || post.author?.username || "Someone";

  return (
    <Pressable onHoverIn={() => setPaused(true)} onHoverOut={() => setPaused(false)}>
      <Animated.View style={{ opacity: fade }}>
        <ImageBackground source={image ? { uri: image } : undefined} style={s.hero} imageStyle={s.heroImage}>
          <View style={s.shade} />
          <Pressable style={s.tapArea} onPress={() => onPressPost(post)}>
            <View style={s.content}>
              {post.type === "clip" && (
                <View style={s.clipBadge}>
                  <Text style={s.clipBadgeText}>▶ CLIP</Text>
                </View>
              )}
              <Text style={s.caption} numberOfLines={2}>
                {post.body}
              </Text>
              <View style={s.authorRow}>
                {post.author?.avatarUrl ? (
                  <ImageBackground source={{ uri: post.author.avatarUrl }} style={s.avatar} imageStyle={s.avatarImg} />
                ) : (
                  <View style={s.avatar} />
                )}
                <Text style={s.authorName}>{authorName}</Text>
                {post.locationLabel ? <Text style={s.location}> · {post.locationLabel}</Text> : null}
              </View>
            </View>
          </Pressable>
          <View style={s.controls}>
            <Pressable onPress={() => changeSlide(active - 1)} style={s.arrow}>
              <Text style={s.arrowText}>‹</Text>
            </Pressable>
            <View style={s.dots}>
              {posts.map((p, i) => (
                <Pressable key={p.id} onPress={() => changeSlide(i)} style={[s.dot, i === active && s.dotActive]} />
              ))}
            </View>
            <Pressable onPress={() => changeSlide(active + 1)} style={s.arrow}>
              <Text style={s.arrowText}>›</Text>
            </Pressable>
          </View>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hero: {
    minHeight: 420,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333b31",
    backgroundColor: "#121819",
    justifyContent: "flex-end",
  },
  heroImage: { resizeMode: "cover" },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,5,6,.35)" },
  tapArea: { flex: 1, justifyContent: "flex-end" },
  content: { padding: 32, paddingBottom: 64, maxWidth: 680 },
  clipBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(5,8,7,.72)",
    borderWidth: 1,
    borderColor: "rgba(168,200,74,.38)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  clipBadgeText: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  caption: { color: "#fff", fontSize: 26, fontWeight: "900", lineHeight: 32 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#293231", overflow: "hidden" },
  avatarImg: { resizeMode: "cover" },
  authorName: { color: "#d0d6da", fontSize: 13, fontWeight: "800" },
  location: { color: "#8e99a2", fontSize: 12 },
  controls: {
    position: "absolute",
    left: 28,
    bottom: 22,
    zIndex: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(6,9,10,.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    padding: 7,
    borderRadius: 30,
  },
  arrow: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  arrowText: { color: "#fff", fontSize: 22, fontWeight: "500" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#697279" },
  dotActive: { width: 22, backgroundColor: LIME },
  emptyHero: { alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center" },
  emptyBody: { color: "#8e99a2", fontSize: 14, textAlign: "center", marginTop: 10, maxWidth: 420, lineHeight: 20 },
});
