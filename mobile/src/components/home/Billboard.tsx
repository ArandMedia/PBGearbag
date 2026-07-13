import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { BillboardPost } from "../../services/home.service";

const LIME = "#A8C84A";

// Shown until a player has enough real activity (follows, posts, RSVPs) to
// fill the billboard with their own content — cycles through the game's
// major formats instead of leaving the space blank. Matches the styles the
// user is most likely to actually play, keyed by PlayStyle so it can be
// biased toward theirs first once we know it.
const PLACEHOLDER_SLIDES = [
  {
    key: "speedball",
    styles: ["speedball", "tournament"],
    image: require("../../../assets/brand/pbgearbag-hero-v1.jpg"),
    kicker: "TOURNAMENT / SPEEDBALL",
    title: "Built for the next breakout.",
    body: "Follow the tournament scene, sharpen your setup, and find the players pushing the game forward.",
  },
  {
    key: "recball",
    styles: ["recball"],
    image: require("../../../assets/brand/pbgearbag-hero-rec-v2.jpg"),
    kicker: "RECREATIONAL / COMMUNITY",
    title: "There's always another game.",
    body: "From a first rental day to a regular weekend crew, find the next reason to get back on the field.",
  },
  {
    key: "woodsball",
    styles: ["woodsball", "scenario", "big_game"],
    image: require("../../../assets/brand/pbgearbag-hero-woods-v2.jpg"),
    kicker: "WOODSBALL / SCENARIO",
    title: "Go deeper into the game.",
    body: "Discover scenario weekends, local fields, and the field-tested gear built for long days in the woods.",
  },
  {
    key: "mechanical",
    styles: ["mechanical", "pump"],
    image: require("../../../assets/brand/pbgearbag-hero-classic-v2.jpg"),
    kicker: "MECHANICAL / CLASSIC",
    title: "The old school still hits hard.",
    body: "Celebrate pump, mechanical, and classic paintball—and the community keeping its heritage alive.",
  },
];

function orderedPlaceholders(playStyle?: string[]) {
  if (!playStyle?.length) return PLACEHOLDER_SLIDES;
  const matchIndex = PLACEHOLDER_SLIDES.findIndex((s) => s.styles.some((st) => playStyle.includes(st)));
  if (matchIndex <= 0) return PLACEHOLDER_SLIDES;
  return [PLACEHOLDER_SLIDES[matchIndex], ...PLACEHOLDER_SLIDES.filter((_, i) => i !== matchIndex)];
}

interface Props {
  posts: BillboardPost[];
  playStyle?: string[];
  onPressPost: (post: BillboardPost) => void;
  onExplore: () => void;
}

// Same auto-advance/pause-on-hover/dot-nav/fade mechanics as the old
// hardcoded hero carousel in HomeScreen — just fed by real, personalized
// posts once there are any, falling back to format-themed placeholders
// (never a blank card) until there's enough activity to fill it.
export default function Billboard({ posts, playStyle, onPressPost, onExplore }: Props) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  const usingPlaceholders = posts.length === 0;
  const placeholders = useMemo(() => orderedPlaceholders(playStyle), [playStyle]);
  const count = usingPlaceholders ? placeholders.length : posts.length;

  const changeSlide = (next: number) => {
    if (!count) return;
    const target = (next + count) % count;
    if (target === active) return;
    Animated.timing(fade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setActive(target);
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }).start();
    });
  };

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = setInterval(() => changeSlide(active + 1), usingPlaceholders ? 7000 : 6000);
    return () => clearInterval(timer);
  }, [active, paused, count, usingPlaceholders]);

  useEffect(() => {
    if (active >= count) setActive(0);
  }, [count]);

  if (usingPlaceholders) {
    const slide = placeholders[active] || placeholders[0];
    return (
      <Pressable onHoverIn={() => setPaused(true)} onHoverOut={() => setPaused(false)}>
        <Animated.View style={{ opacity: fade }}>
          <ImageBackground source={slide.image} style={s.hero} imageStyle={s.heroImage}>
            <View style={s.shade} />
            <Pressable style={s.tapArea} onPress={onExplore}>
              <View style={s.content}>
                <Text style={s.kicker}>{slide.kicker}</Text>
                <Text style={s.placeholderTitle}>{slide.title}</Text>
                <Text style={s.placeholderBody}>{slide.body}</Text>
                <View style={s.exploreRow}>
                  <Text style={s.exploreText}>Explore what's happening →</Text>
                </View>
              </View>
            </Pressable>
            <View style={s.controls}>
              <Pressable onPress={() => changeSlide(active - 1)} style={s.arrow}>
                <Text style={s.arrowText}>‹</Text>
              </Pressable>
              <View style={s.dots}>
                {placeholders.map((p, i) => (
                  <Pressable key={p.key} onPress={() => changeSlide(i)} style={[s.dot, i === active && s.dotActive]} />
                ))}
              </View>
              <Pressable onPress={() => changeSlide(active + 1)} style={s.arrow}>
                <Text style={s.arrowText}>›</Text>
              </Pressable>
            </View>
            <View style={s.placeholderBadge}>
              <Text style={s.placeholderBadgeText}>YOUR BILLBOARD IS WARMING UP</Text>
            </View>
          </ImageBackground>
        </Animated.View>
      </Pressable>
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
  kicker: { color: LIME, fontSize: 12, fontWeight: "900", letterSpacing: 2, marginBottom: 12 },
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
  placeholderTitle: { color: "#fff", fontSize: 32, fontWeight: "900", lineHeight: 37, letterSpacing: -0.8 },
  placeholderBody: { color: "#d0d6da", fontSize: 15, lineHeight: 22, marginTop: 12, maxWidth: 480 },
  exploreRow: { marginTop: 18 },
  exploreText: { color: LIME, fontSize: 13, fontWeight: "900" },
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
  placeholderBadge: {
    position: "absolute",
    right: 22,
    top: 22,
    zIndex: 4,
    backgroundColor: "rgba(6,9,10,.78)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  placeholderBadgeText: { color: "#AEB7BC", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
});
