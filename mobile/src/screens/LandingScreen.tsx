import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useAuth } from "../store/AuthContext";

const lime = "#A8C84A";
export default function LandingScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const { login, loading } = useAuth();
  const [identity, setIdentity] = React.useState("");
  const [password, setPassword] = React.useState("");
  const features = [
    [
      "FIELD FEED",
      "Post your best points, follow teammates, and keep every field day in one feed.",
    ],
    [
      "GEARBAG MARKET",
      "Price your setup, find trusted gear, and sell to players who know what it is worth.",
    ],
    ["DISCOVER", "Find nearby fields, open play, teams, clinics, and events that fit your style."],
    [
      "EVENT OPS",
      "Run smoother events with registration, rosters, brackets, payments, and results in one place.",
    ],
  ];
  return (
    <ImageBackground
      source={require("../../assets/brand/pbgearbag-hero-montage-v1.png")}
      style={[s.bg, { width: "100vw", alignSelf: "stretch" }]}
      imageStyle={[s.bgImage, compact && s.bgMobile]}
    >
      <View style={s.scrim} />
      <ScrollView
        style={s.page}
        contentContainerStyle={[s.content, compact && s.contentMobile]}
      >
        <View style={s.brand}>
          <View style={s.mark}>
            <Text style={s.markText}>PB</Text>
          </View>
          <Text style={s.brandText}>GEARBAG</Text>
        </View>
        <Text style={s.kicker}>THE PAINTBALL NETWORK</Text>
        <Text style={[s.hero, compact && s.heroMobile]}>
          Your game.{"\n"}Your people.{"\n"}Your next field day.
        </Text>
        <Text style={s.copy}>
          PBGearbag brings players, fields, teams, events, and gear together in
          one place built for the culture of paintball.
        </Text>
        <View style={[s.authPanel, !compact && s.authDesktop]}>
          <Text style={s.authLabel}>WELCOME BACK</Text>
          <TextInput
            style={s.loginInput}
            placeholder="Username or email"
            placeholderTextColor="#88939a"
            value={identity}
            onChangeText={setIdentity}
            autoCapitalize="none"
          />
          <TextInput
            style={s.loginInput}
            placeholder="Password"
            placeholderTextColor="#88939a"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={s.forgot}>Forgot password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.primary}
            onPress={() =>
              login({ usernameOrEmail: identity.trim(), password })
            }
            disabled={loading}
          >
            <Text style={s.primaryText}>
              {loading ? "Signing in…" : "Sign in →"}
            </Text>
          </TouchableOpacity>
          <Text style={s.accountPrompt}>New to PBGearbag?</Text>
          <TouchableOpacity
            style={s.secondary}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={s.secondaryText}>Create an account</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.sectionTitle}>Built for every way you play</Text>
        <View style={[s.grid, compact && s.gridMobile]}>
          {features.map(([t, d]) => (
            <View style={[s.card, compact && s.cardMobile]} key={t}>
              <Text style={s.cardTitle}>{t}</Text>
              <Text style={s.cardCopy}>{d}</Text>
            </View>
          ))}
        </View>
        <Text style={s.sectionTitle}>
          A free home base. More when you need it.
        </Text>
        <View style={s.plan}>
          <Text style={s.planName}>FREE PLAYER</Text>
          <Text style={s.price}>$0</Text>
          <Text style={s.cardCopy}>A profile, community feed, and marketplace access. Follow players, browse gear, save listings, and stay connected.</Text>
        </View>
        <View style={[s.plan, s.pro]}>
          <View style={s.proRow}>
            <Text style={s.planName}>PBG PRO</Text>
            <Text style={s.badge}>COMING SOON</Text>
          </View>
          <Text style={s.price}>
            $4<Text style={s.per}>/mo · $24/yr</Text>
          </Text>
          <Text style={s.cardCopy}>Everything in Free, plus a profile built around how you play: player, team member, coach, official, field owner, event producer, media creator, collector, or fan. Add custom fields, gear setups, goals, event tools, insights, and premium community features.</Text>
        </View>
        <Text style={s.foot}>
          Built by players. For the whole paintball community.
        </Text>
      </ScrollView>
    </ImageBackground>
  );
}
const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: "#070A0B" },
  bgImage: { resizeMode: "cover" },
  bgMobile: { resizeMode: "cover" },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,6,7,.68)",
  },
  page: { flex: 1 },
  content: {
    padding: 28,
    maxWidth: 1120,
    alignSelf: "center",
    width: "100%",
    paddingBottom: 70,
  },
  contentMobile: { padding: 20, paddingTop: 10 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  mark: {
    backgroundColor: lime,
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontWeight: "900", color: "#111", fontSize: 13 },
  brandText: {
    color: "#F5F7F8",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 2,
  },
  kicker: {
    color: lime,
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 11,
    marginTop: 48,
    textAlign: "left",
    maxWidth: 600,
  },
  hero: {
    color: "#F5F7F8",
    fontSize: 52,
    lineHeight: 55,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 12,
    textAlign: "left",
    maxWidth: 600,
  },
  heroMobile: { fontSize: 36, lineHeight: 39 },
  copy: {
    color: "#AEB7BE",
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 620,
    marginTop: 20,
    textAlign: "left",
    maxWidth: 600,
  },
  authPanel: {
    gap: 12,
    marginTop: 28,
    width: 460,
    minHeight: 330,
    maxWidth: 460,
    alignSelf: "flex-end",
    backgroundColor: "rgba(7,11,13,.58)",
    borderWidth: 1,
    borderColor: "rgba(168,200,74,.35)",
    borderRadius: 22,
    padding: 24,
  },
  authDesktop: { position: "absolute", right: 28, top: 126, marginTop: 0 },
  authLabel: {
    color: lime,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  loginInput: {
    backgroundColor: "rgba(12,16,18,.62)",
    borderColor: "rgba(190,205,214,.28)",
    borderWidth: 1,
    borderRadius: 9,
    padding: 13,
    color: "#fff",
    fontSize: 14,
  },
  forgot: {
    color: lime,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    marginTop: -4,
  },
  accountPrompt: {
    color: "#9ba6ad",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  primary: {
    backgroundColor: lime,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  primaryText: { fontWeight: "900", color: "#10150D", fontSize: 16 },
  secondary: {
    borderColor: "#384248",
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  secondaryText: { color: "#F5F7F8", fontWeight: "800" },
  sectionTitle: {
    color: "#F5F7F8",
    fontWeight: "900",
    fontSize: 25,
    marginTop: 110,
    marginBottom: 16,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridMobile: { flexDirection: "column" },
  card: {
    backgroundColor: "#111719",
    borderColor: "#273136",
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    width: "48%",
    minWidth: 260,
  },
  cardMobile: { width: "100%", minWidth: 0 },
  cardTitle: {
    color: lime,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  cardCopy: { color: "#AEB7BE", fontSize: 15, lineHeight: 22, marginTop: 9 },
  plan: {
    backgroundColor: "#111719",
    borderColor: "#273136",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
  },
  pro: { borderColor: lime },
  planName: {
    color: lime,
    fontWeight: "900",
    letterSpacing: 1.2,
    fontSize: 12,
  },
  price: { color: "#F5F7F8", fontSize: 32, fontWeight: "900", marginTop: 8 },
  per: { color: "#AEB7BE", fontSize: 16 },
  proRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    color: "#111",
    backgroundColor: lime,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: "900",
  },
  foot: { color: "#68747B", textAlign: "center", marginTop: 50, fontSize: 13 },
});
