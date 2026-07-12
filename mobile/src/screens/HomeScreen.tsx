import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useAuth } from "../store/AuthContext";

const slides = [
  {
    image: require("../../assets/brand/pbgearbag-hero-v1.jpg"),
    label: "TOURNAMENT / SPEEDBALL",
    eyebrow: "THE COMPETITIVE EDGE",
    title: "Built for the\nnext breakout.",
    body: "Follow the tournament scene, sharpen your setup, and find the players pushing the game forward.",
  },
  {
    image: require("../../assets/brand/pbgearbag-hero-rec-v2.jpg"),
    label: "RECREATIONAL / COMMUNITY",
    eyebrow: "OPEN PLAY / COMMUNITY",
    title: "There’s always\nanother game.",
    body: "From a first rental day to a regular weekend crew, find the next reason to get back on the field.",
  },
  {
    image: require("../../assets/brand/pbgearbag-hero-woods-v2.jpg"),
    label: "WOODSBALL / SCENARIO",
    eyebrow: "ADVENTURE STARTS HERE",
    title: "Go deeper into\nthe game.",
    body: "Discover scenario weekends, local fields, and the field-tested gear built for long days in the woods.",
  },
  {
    image: require("../../assets/brand/pbgearbag-hero-classic-v2.jpg"),
    label: "MECHANICAL / CLASSIC",
    eyebrow: "RESPECT THE ROOTS",
    title: "The old school\nstill hits hard.",
    body: "Celebrate pump, mechanical, and classic paintball—and the community keeping its heritage alive.",
  },
];

function MotionCard({ title, body, kicker, onPress, delay = 0 }: any) {
  const y = useRef(new Animated.Value(18)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y, {
        toValue: 0,
        duration: 480,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View
      style={[styles.cardWrap, { opacity, transform: [{ translateY: y }] }]}
    >
      <Pressable
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.card, hovered && styles.cardHover]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardKicker}>{kicker}</Text>
          <Text style={[styles.arrow, hovered && styles.arrowHover]}>↗</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const name =
    user?.displayName || user?.firstName || user?.username || "player";
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const heroFade = useRef(new Animated.Value(1)).current;
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const changeSlide = (next: number) => {
    const target = (next + slides.length) % slides.length;
    if (target === activeSlide) return;
    if (reducedMotion) {
      setActiveSlide(target);
      return;
    }
    Animated.timing(heroFade, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setActiveSlide(target);
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }).start();
    });
  };
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      setReducedMotion(reduced);
      Animated.timing(enter, {
        toValue: 1,
        duration: reduced ? 0 : 700,
        useNativeDriver: true,
      }).start();
      if (!reduced)
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.65,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
          ]),
        ).start();
    });
  }, []);
  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = setInterval(() => changeSlide(activeSlide + 1), 7000);
    return () => clearInterval(timer);
  }, [activeSlide, paused, reducedMotion]);
  const slide = slides[activeSlide];
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable
        onHoverIn={() => setPaused(true)}
        onHoverOut={() => setPaused(false)}
      >
        <Animated.View style={{ opacity: heroFade }}>
          <ImageBackground
            source={slide.image}
            style={styles.hero}
            imageStyle={styles.heroImage}
            accessible
            accessibilityLabel={`${slide.label} paintball feature`}
          >
            <View style={styles.heroShade} />
            <View style={styles.paintOrb} />
            <View
              style={[styles.heroContent, compact && styles.heroContentCompact]}
            >
              <Animated.View
                style={{
                  opacity: enter,
                  transform: [
                    {
                      translateY: enter.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                }}
              >
                <View style={styles.livePill}>
                  <Animated.View
                    style={[
                      styles.livePulse,
                      { transform: [{ scale: pulse }] },
                    ]}
                  />
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>PBG NETWORK LIVE</Text>
                </View>
                <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
                <Text style={[styles.title, compact && styles.titleCompact]}>
                  {slide.title}
                </Text>
                <Text style={styles.subtitle}>
                  Welcome back, {name}. {slide.body}
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primary,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => navigation.navigate("Marketplace")}
                  >
                    <Text style={styles.primaryText}>Explore marketplace</Text>
                    <Text style={styles.primaryArrow}>→</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondary,
                      pressed && styles.pressed,
                    ]}
                    onPress={() =>
                      navigation.getParent()?.navigate("MyListings")
                    }
                  >
                    <Text style={styles.secondaryText}>Sell your gear</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
            <View style={styles.slideControls}>
              <Pressable
                accessibilityLabel="Previous hero"
                onPress={() => changeSlide(activeSlide - 1)}
                style={styles.slideArrow}
              >
                <Text style={styles.slideArrowText}>‹</Text>
              </Pressable>
              <View style={styles.dots}>
                {slides.map((item, index) => (
                  <Pressable
                    key={item.label}
                    accessibilityLabel={`Show ${item.label}`}
                    onPress={() => changeSlide(index)}
                    style={[
                      styles.dot,
                      index === activeSlide && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.slideLabel}>{slide.label}</Text>
              <Pressable
                accessibilityLabel="Next hero"
                onPress={() => changeSlide(activeSlide + 1)}
                style={styles.slideArrow}
              >
                <Text style={styles.slideArrowText}>›</Text>
              </Pressable>
            </View>
            {!compact && (
              <View style={styles.heroStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>2.4k</Text>
                  <Text style={styles.statLabel}>GEAR WATCHES</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>38</Text>
                  <Text style={styles.statLabel}>GAMES THIS WEEK</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>LIVE</Text>
                  <Text style={styles.statLabel}>MARKET STATUS</Text>
                </View>
              </View>
            )}
          </ImageBackground>
        </Animated.View>
      </Pressable>

      <View style={styles.ticker}>
        <Text style={styles.tickerLabel}>FIELD WIRE</Text>
        <View style={styles.tickerRule} />
        <Text style={styles.tickerText}>
          Gateway 5-Man registration opens Friday
        </Text>
        <Text style={styles.tickerDot}>●</Text>
        <Text style={styles.tickerText}>Markers trending in St. Louis</Text>
        <Text style={styles.tickerArrow}>→</Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>COMMAND CENTER</Text>
          <Text style={styles.sectionTitle}>What’s your next move?</Text>
        </View>
        <Text style={styles.sectionHint}>
          Everything useful. Nothing in the way.
        </Text>
      </View>
      <View style={styles.grid}>
        <MotionCard
          kicker="01 / TRADE"
          title="Find field-ready gear"
          body="Fresh listings, trusted profiles, and the kit you have been hunting."
          onPress={() => navigation.navigate("Marketplace")}
          delay={80}
        />
        <MotionCard
          kicker="02 / SELL"
          title="Turn your bench into cash"
          body="Create a polished listing and reach players who know the equipment."
          onPress={() => navigation.getParent()?.navigate("MyListings")}
          delay={150}
        />
        <MotionCard
          kicker="03 / PLAY"
          title="Get on the field"
          body="Scenario weekends, mechanical events, and local competition."
          onPress={() => navigation.navigate("Discover")}
          delay={220}
        />
        <MotionCard
          kicker="04 / IDENTITY"
          title="Build your paintball story"
          body="Your style, home field, history, and reputation in one place."
          onPress={() => navigation.navigate("Profile")}
          delay={290}
        />
      </View>
      <View style={styles.bottomBand}>
        <View>
          <Text style={styles.bandKicker}>PBG TRUST LAYER</Text>
          <Text style={styles.bandTitle}>
            Trade with a history, not a mystery.
          </Text>
        </View>
        <Text style={styles.bandBody}>
          Persistent identities, ownership controls, listing history, and
          revocable sessions make every interaction more accountable.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: {
    width: "96%",
    maxWidth: 1380,
    alignSelf: "center",
    paddingTop: 18,
    paddingBottom: 90,
  },
  hero: {
    minHeight: 610,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333b31",
    justifyContent: "space-between",
  },
  heroImage: { resizeMode: "cover" },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,5,6,.18)",
  },
  paintOrb: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(168,200,74,.08)",
    left: -120,
    top: 160,
  },
  heroContent: {
    paddingHorizontal: 48,
    paddingTop: 64,
    maxWidth: 680,
    zIndex: 2,
  },
  heroContentCompact: { paddingHorizontal: 22, paddingTop: 36 },
  livePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(5,8,7,.72)",
    borderWidth: 1,
    borderColor: "rgba(168,200,74,.38)",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 24,
  },
  livePulse: {
    position: "absolute",
    left: 13,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "rgba(168,200,74,.28)",
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#A8C84A" },
  liveText: {
    color: "#d9ffc2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  eyebrow: {
    color: "#A8C84A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 14,
  },
  title: {
    color: "#fff",
    fontSize: 58,
    lineHeight: 60,
    fontWeight: "900",
    letterSpacing: -2,
  },
  titleCompact: { fontSize: 42, lineHeight: 44 },
  subtitle: {
    color: "#d0d6da",
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 580,
    marginTop: 19,
    textShadowColor: "rgba(0,0,0,.7)",
    textShadowRadius: 12,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 30 },
  primary: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
    backgroundColor: "#A8C84A",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryText: { color: "#10150d", fontWeight: "900", fontSize: 15 },
  primaryArrow: { color: "#10150d", fontWeight: "900", fontSize: 19 },
  secondary: {
    backgroundColor: "rgba(10,13,15,.7)",
    borderWidth: 1,
    borderColor: "#59636c",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 14,
  },
  secondaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  heroStats: {
    zIndex: 2,
    alignSelf: "flex-end",
    flexDirection: "row",
    backgroundColor: "rgba(7,9,11,.84)",
    borderTopLeftRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#394139",
    paddingHorizontal: 12,
  },
  stat: {
    paddingHorizontal: 25,
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: "#2d332e",
  },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "900" },
  statLabel: {
    color: "#89948d",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 4,
  },
  ticker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#101418",
    borderWidth: 1,
    borderColor: "#232a30",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginTop: 14,
    overflow: "hidden",
  },
  tickerLabel: {
    color: "#E8743B",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 1.4,
  },
  tickerRule: { height: 18, width: 1, backgroundColor: "#37404a" },
  tickerText: { color: "#b8c1c9", fontSize: 13 },
  tickerDot: { color: "#44505a", fontSize: 7 },
  tickerArrow: { color: "#A8C84A", fontSize: 18, marginLeft: "auto" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 46,
    marginBottom: 18,
  },
  sectionEyebrow: {
    color: "#6f7a84",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.7,
    marginTop: 7,
  },
  sectionHint: { color: "#68737d", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  cardWrap: { flexGrow: 1, flexBasis: 275, minWidth: 250 },
  card: {
    height: 225,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: "#252c32",
    borderRadius: 20,
    padding: 22,
    justifyContent: "flex-end",
  },
  cardHover: {
    borderColor: "#627f4b",
    backgroundColor: "#151b18",
    transform: [{ translateY: -5 }],
  },
  cardTop: {
    position: "absolute",
    top: 19,
    left: 22,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardKicker: {
    color: "#7b878f",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  arrow: { color: "#505b63", fontSize: 21 },
  arrowHover: { color: "#A8C84A" },
  cardTitle: {
    color: "#fff",
    fontSize: 21,
    fontWeight: "900",
    marginBottom: 10,
  },
  cardBody: { color: "#8e99a2", fontSize: 14, lineHeight: 21 },
  bottomBand: {
    marginTop: 18,
    backgroundColor: "#142016",
    borderWidth: 1,
    borderColor: "#29442c",
    borderRadius: 22,
    padding: 28,
    flexDirection: "row",
    gap: 30,
    justifyContent: "space-between",
    alignItems: "center",
  },
  bandKicker: {
    color: "#A8C84A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  bandTitle: {
    color: "#efffe7",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  bandBody: { color: "#91a493", lineHeight: 21, maxWidth: 580 },
  slideControls: {
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
  slideArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  slideArrowText: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "500",
  },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#697279" },
  dotActive: { width: 22, backgroundColor: "#A8C84A" },
  slideLabel: {
    color: "#AEB7BC",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginHorizontal: 4,
  },
});
