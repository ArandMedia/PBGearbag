import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Alert } from "../utils/alert";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../store/AuthContext";
import { communityService, Gearbag } from "../services/community.service";
import { Listing, marketplaceService } from "../services/marketplace.service";
import { billingService, BillingStatus } from "../services/billing.service";
import { ProfileWidget, widgetsService } from "../services/widgets.service";
import { RelationshipCounts, socialService } from "../services/social.service";
import { WidgetRenderer } from "../components/WidgetCards";
import { computeAutoAchievements } from "../utils/achievements";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";

const INK = "#0A0E0F",
  PANEL = "#121819",
  ORANGE = "#E8743B";
const defaultCover = require("../../assets/brand/pbgearbag-hero-classic-v2.jpg");
const loadouts: Record<
  string,
  { label: string; description: string; essentials: string[] }
> = {
  speedball: {
    label: "Speedball loadout",
    description:
      "Built for fast points, efficient movement, and tournament-ready redundancy.",
    essentials: ["marker", "mask", "tank", "loader", "pack", "pods"],
  },
  tournament: {
    label: "Tournament loadout",
    description:
      "Match-day essentials organized for quick turnarounds between points.",
    essentials: ["marker", "mask", "tank", "loader", "pack", "pods"],
  },
  mechanical: {
    label: "Mechanical loadout",
    description:
      "A reliable, streamlined kit for mechanical events and classic formats.",
    essentials: ["marker", "mask", "tank", "loader", "pack"],
  },
  pump: {
    label: "Pump loadout",
    description:
      "A lightweight setup centered on movement, accuracy, and limited paint.",
    essentials: ["marker", "mask", "tank", "loader", "pack"],
  },
  scenario: {
    label: "Scenario loadout",
    description:
      "Prepared for long games, changing missions, and a full day in the field.",
    essentials: ["marker", "mask", "tank", "loader", "harness", "apparel"],
  },
  big_game: {
    label: "Big-game loadout",
    description:
      "All-day capacity, comfort, and reliability for high-player-count events.",
    essentials: ["marker", "mask", "tank", "loader", "harness", "apparel"],
  },
  magfed: {
    label: "MagFed loadout",
    description:
      "A mission-focused kit organized around magazines, mobility, and field time.",
    essentials: ["marker", "mask", "tank", "magazine", "carrier", "apparel"],
  },
  woodsball: {
    label: "Woodsball loadout",
    description:
      "Durable, comfortable gear for varied terrain and longer games.",
    essentials: ["marker", "mask", "tank", "loader", "harness", "apparel"],
  },
  recball: {
    label: "Weekend field kit",
    description:
      "A versatile setup that is easy to run, maintain, and take anywhere.",
    essentials: ["marker", "mask", "tank", "loader", "pack"],
  },
};
function Action({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const { accent } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.action,
        primary && { backgroundColor: accent, borderColor: accent },
        pressed && { opacity: 0.72 },
      ]}
    >
      <Ionicons name={icon} size={17} color={primary ? "#10140D" : "#D6DDDA"} />
      <Text style={[s.actionText, primary && s.actionTextPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}
function Stat({
  value,
  label,
  onPress,
}: {
  value: string | number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const { accent: TURF } = useTheme();
  const { width } = useWindowDimensions();
  const canvasWidth = width >= 900 ? width - 272 : width;
  const compact = canvasWidth < 920;
  const [bag, setBag] = useState<Gearbag | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingBusy, setBillingBusy] = useState<"monthly" | "yearly" | "manage" | null>(null);
  const [widgets, setWidgets] = useState<ProfileWidget[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [relationship, setRelationship] = useState<RelationshipCounts | null>(null);
  useEffect(() => {
    Promise.all([
      communityService.gearbags(),
      marketplaceService.getMyListings(1, 6),
      communityService.conversations(),
    ])
      .then(([bags, market, chats]) => {
        setBag(bags.find((x) => x.isPrimary) || bags[0] || null);
        setListings(market.items);
        setConversationCount(chats.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    billingService
      .getStatus()
      .then(setBilling)
      .catch(() => {});
    if (user?.id) {
      widgetsService.mine().then(setWidgets).catch(() => {});
      communityService.myTeam(user.id).then(setTeam).catch(() => {});
      communityService.upcomingEvents(user.id).then(setUpcomingEvents).catch(() => {});
      socialService.relationship(user.id).then(setRelationship).catch(() => {});
    }
  }, [user?.id]);
  const upgrade = async (plan: "monthly" | "yearly") => {
    setBillingBusy(plan);
    try {
      const url = await billingService.startCheckout(plan);
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn't start checkout", "Please try again in a moment.");
    } finally {
      setBillingBusy(null);
    }
  };
  const manageBilling = async () => {
    setBillingBusy("manage");
    try {
      const url = await billingService.openPortal();
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn't open billing portal", "Please try again in a moment.");
    } finally {
      setBillingBusy(null);
    }
  };
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const displayName = user?.displayName || fullName || user?.username || "Player";
  const location = [user?.city, user?.stateProvince, user?.country]
    .filter(Boolean)
    .join(", ");
  const activeListings = listings.filter((x) => x.status === "active");
  const inferredStyle =
    user?.playStyle?.[0] ||
    (bag?.name?.toLowerCase().includes("tournament") ? "speedball" : "recball");
  const loadout = loadouts[inferredStyle] || loadouts.recball;
  const ownedCategories = new Set(
    (bag?.items || []).map((item) => item.category.toLowerCase()),
  );
  const loadoutReady = loadout.essentials.filter((item) =>
    ownedCategories.has(item),
  ).length;
  const completeness = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.avatarUrl,
      user.bannerUrl,
      user.displayName,
      user.bio,
      user.city,
      user.homeField,
      user.favoritePosition,
      user.skillLevel,
      user.playStyle?.length,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);
  const achievementsWidget = widgets.find((w) => w.widgetKey === "achievements");
  const achievementCount = useMemo(() => {
    const auto = computeAutoAchievements({
      user,
      bag,
      team,
      upcomingEvents,
      listings,
      isPro: billing?.isPro,
    });
    const custom = achievementsWidget?.config?.items || [];
    return auto.length + custom.length;
  }, [user, bag, team, upcomingEvents, listings, billing, achievementsWidget]);
  if (!user)
    return (
      <View style={s.center}>
        <Text style={s.muted}>Player profile unavailable.</Text>
      </View>
    );
  const share = () =>
    Share.share({
      title: `${displayName} on PBGearbag`,
      message: `Check out @${user.username} on PBGearbag — https://pbgearbag.com/players/${user.username}`,
    });
  const confirmLogout = () =>
    Alert.alert("Sign out", "Sign out of PBGearbag on this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  const openCustomizeWidgets = () => {
    if (billing?.isPro) {
      navigation.getParent()?.navigate("CustomizeWidgets");
      return;
    }
    Alert.alert(
      "Unlock custom widgets",
      "Profile widgets are a PBG Pro feature — pick from loadout, stats, achievements, social links, and more for $4/mo or $24/yr.",
      [
        { text: "Not now", style: "cancel" },
        { text: "Upgrade", onPress: () => upgrade("monthly") },
      ],
    );
  };
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={[
        s.content,
        { width: Math.min(canvasWidth - 36, 1450) },
      ]}
    >
      <View style={s.cover}>
        {user.bannerUrl ? (
          <Image source={{ uri: user.bannerUrl }} style={s.coverImage} />
        ) : (
          <ImageBackground
            source={defaultCover}
            style={s.coverFallback}
            imageStyle={s.defaultCoverImage}
          >
            <View style={s.fieldLine} />
            <View style={s.fieldLineTwo} />
            <Text style={s.coverWord}>PBG</Text>
          </ImageBackground>
        )}
        <View style={s.coverShade} />
        <View style={s.coverMeta}>
          <Text style={[s.coverKicker, { color: TURF }]}>PLAYER PROFILE</Text>
        </View>
      </View>
      <View style={[s.identity, compact && s.identityCompact]}>
        <View style={s.avatarFrame}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
          ) : (
            <View style={s.avatarFallback}>
              <Text style={[s.avatarText, { color: TURF }]}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[s.online, { backgroundColor: TURF }]} />
        </View>
        <View style={s.identityText}>
          <View style={s.nameLine}>
            <Text style={s.name}>{displayName}</Text>
            {user.isVerified && (
              <View style={[s.verified, { backgroundColor: TURF }]}>
                <Ionicons name="checkmark" size={10} color="#10140D" />
                <Text style={s.verifiedText}>VERIFIED</Text>
              </View>
            )}
            {billing?.isPro && (
              <View style={s.proBadge}>
                <Ionicons name="star" size={10} color="#10140D" />
                <Text style={s.proBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={s.handle}>@{user.username}</Text>
          <View style={s.metaLine}>
            {location && <Text style={s.identityMeta}>⌖ {location}</Text>}
            <Text style={s.identityMeta}>
              MEMBER SINCE {new Date(user.createdAt).getFullYear()}
            </Text>
          </View>
          {user.bio ? (
            <Text style={s.bio}>{user.bio}</Text>
          ) : (
            <Pressable
              onPress={() => navigation.getParent()?.navigate("EditProfile")}
            >
              <Text style={[s.addBio, { color: TURF }]}>＋ Add a short player bio</Text>
            </Pressable>
          )}
          <View style={s.tags}>
            {user.playStyle?.map((x) => (
              <Text key={x} style={s.tag}>
                {x.replace("_", " ").toUpperCase()}
              </Text>
            ))}
            {user.skillLevel && (
              <Text style={[s.tag, s.tagAmber]}>
                {user.skillLevel.toUpperCase()}
              </Text>
            )}
          </View>
        </View>
        <View style={[s.identityActions, compact && { width: "100%" }]}>
          <Action icon="share-outline" label="Share" onPress={share} />
          <Action
            icon="create-outline"
            label="Edit profile"
            primary
            onPress={() => navigation.getParent()?.navigate("EditProfile")}
          />
        </View>
      </View>

      <View style={s.stats}>
        <Stat
          value={relationship?.followerCount ?? 0}
          label="FOLLOWERS"
          onPress={() =>
            navigation.getParent()?.navigate("FollowList", {
              userId: user.id,
              mode: "followers",
              title: displayName,
            })
          }
        />
        <Stat
          value={relationship?.followingCount ?? 0}
          label="FOLLOWING"
          onPress={() =>
            navigation.getParent()?.navigate("FollowList", {
              userId: user.id,
              mode: "following",
              title: displayName,
            })
          }
        />
        <Stat
          value={bag?.items?.length || 0}
          label="GEAR ITEMS"
          onPress={() => navigation.navigate("Gearbag")}
        />
        <Stat
          value={activeListings.length}
          label="ACTIVE LISTINGS"
          onPress={() => navigation.getParent()?.navigate("MyListings")}
        />
        <Stat
          value={conversationCount}
          label="CONVERSATIONS"
          onPress={() => navigation.navigate("Messages")}
        />
        <Stat
          value={`${completeness}%`}
          label="PROFILE READY"
          onPress={() => navigation.getParent()?.navigate("EditProfile")}
        />
        {achievementsWidget && (
          <Stat
            value={achievementCount}
            label="ACHIEVEMENTS"
            onPress={openCustomizeWidgets}
          />
        )}
      </View>

      <View style={[s.columns, compact && { flexDirection: "column" }]}>
        <View style={s.mainColumn}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.eyebrow}>PLAYER CARD</Text>
              <Text style={s.sectionTitle}>On the field</Text>
            </View>
            <Pressable
              onPress={() => navigation.getParent()?.navigate("EditProfile")}
            >
              <Text style={[s.textLink, { color: TURF }]}>EDIT DETAILS</Text>
            </Pressable>
          </View>
          <View style={s.playerGrid}>
            <View style={s.detail}>
              <Ionicons name="flag-outline" size={18} color={TURF} />
              <View>
                <Text style={s.detailLabel}>HOME FIELD</Text>
                <Text style={s.detailValue}>
                  {user.homeField || "Not set yet"}
                </Text>
              </View>
            </View>
            <View style={s.detail}>
              <Ionicons name="locate-outline" size={18} color={TURF} />
              <View>
                <Text style={s.detailLabel}>POSITION</Text>
                <Text style={s.detailValue}>
                  {user.favoritePosition || "Any position"}
                </Text>
              </View>
            </View>
            <View style={s.detail}>
              <Ionicons name="speedometer-outline" size={18} color="#D39A3A" />
              <View>
                <Text style={s.detailLabel}>EXPERIENCE</Text>
                <Text style={s.detailValue}>
                  {user.skillLevel?.replace("_", " ") || "Not listed"}
                </Text>
              </View>
            </View>
            <View style={s.detail}>
              <Ionicons name="people-outline" size={18} color="#D39A3A" />
              <View>
                <Text style={s.detailLabel}>PLAYS</Text>
                <Text style={s.detailValue}>
                  {user.playStyle
                    ?.map((x) => x.replace("_", " "))
                    .join(" / ") || "Open to anything"}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.sectionHeader}>
            <View>
              <Text style={s.eyebrow}>
                {inferredStyle.replace("_", " ").toUpperCase()} SETUP
              </Text>
              <Text style={s.sectionTitle}>{loadout.label}</Text>
            </View>
            <Pressable onPress={() => navigation.navigate("Gearbag")}>
              <Text style={[s.textLink, { color: TURF }]}>OPEN GEARBAG →</Text>
            </Pressable>
          </View>
          <View style={s.loadoutIntro}>
            <View style={{ flex: 1 }}>
              <Text style={s.loadoutDescription}>{loadout.description}</Text>
              <View style={s.essentialRow}>
                {loadout.essentials.map((item) => (
                  <View
                    key={item}
                    style={[
                      s.essential,
                      ownedCategories.has(item) && { backgroundColor: TURF, borderColor: TURF },
                    ]}
                  >
                    <Ionicons
                      name={ownedCategories.has(item) ? "checkmark" : "add"}
                      size={10}
                      color={ownedCategories.has(item) ? "#10140D" : "#7D8984"}
                    />
                    <Text
                      style={[
                        s.essentialText,
                        ownedCategories.has(item) && s.essentialTextOwned,
                      ]}
                    >
                      {item.toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={s.readiness}>
              <Text style={s.readinessValue}>
                {loadoutReady}/{loadout.essentials.length}
              </Text>
              <Text style={s.readinessLabel}>ESSENTIALS</Text>
            </View>
          </View>
          <View style={s.gearList}>
            {loading ? (
              <ActivityIndicator color={TURF} />
            ) : bag?.items?.length ? (
              bag.items.slice(0, 4).map((item) => (
                <Pressable
                  key={item.id}
                  style={s.gearRow}
                  onPress={() =>
                    navigation.getParent()?.navigate("GearItem", { item })
                  }
                >
                  <View style={s.gearIcon}>
                    <Text style={[s.gearIconText, { color: TURF }]}>
                      {item.category.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.gearName}>{item.name}</Text>
                    <Text style={s.gearMeta}>
                      {[item.manufacturer, item.model, item.condition]
                        .filter(Boolean)
                        .join("  •  ")}
                    </Text>
                  </View>
                  <Text style={s.rowArrow}>→</Text>
                </Pressable>
              ))
            ) : (
              <View style={s.empty}>
                <Text style={s.emptyTitle}>Start your digital gearbag.</Text>
                <Text style={s.emptyBody}>
                  Keep your setup, service notes, and selling history together.
                </Text>
                <Action
                  icon="add"
                  label="Add gear"
                  primary
                  onPress={() => navigation.getParent()?.navigate("AddGear")}
                />
              </View>
            )}
          </View>
        </View>

        <View style={s.sideColumn}>
          <View style={[s.sideCard, billing?.isPro && s.proCard]}>
            {billing?.isPro ? (
              <>
                <View style={s.proHeader}>
                  <Ionicons name="star" size={16} color={ORANGE} />
                  <Text style={s.proEyebrow}>PBG PRO</Text>
                </View>
                <Text style={s.proBody}>
                  {billing.cancelAtPeriodEnd
                    ? `Your Pro membership ends ${billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : "soon"}.`
                    : `Renews ${billing.currentPeriodEnd ? new Date(billing.currentPeriodEnd).toLocaleDateString() : "automatically"}.`}
                </Text>
                <Pressable onPress={manageBilling} disabled={billingBusy === "manage"}>
                  {billingBusy === "manage" ? (
                    <ActivityIndicator color={ORANGE} style={{ marginTop: 10 }} />
                  ) : (
                    <Text style={s.proManageLink}>Manage billing</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={s.eyebrow}>PBG PRO</Text>
                <Text style={s.proTitle}>Upgrade your profile</Text>
                <Text style={s.proBody}>
                  Custom fields, gear insights, and premium community
                  features for $4/mo or $24/yr.
                </Text>
                <Action
                  icon="star-outline"
                  label={
                    billingBusy === "monthly" ? "Starting…" : "Upgrade — $4/mo"
                  }
                  primary
                  onPress={() => upgrade("monthly")}
                />
                <Pressable
                  onPress={() => upgrade("yearly")}
                  disabled={billingBusy === "yearly"}
                >
                  <Text style={s.proYearlyLink}>
                    {billingBusy === "yearly"
                      ? "Starting…"
                      : "or save with $24/yr →"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
          <View style={s.sideCard}>
            <Text style={s.eyebrow}>QUICK LINKS</Text>
            <Pressable
              style={s.quickRow}
              onPress={() => navigation.getParent()?.navigate("MyListings")}
            >
              <Ionicons name="pricetags-outline" size={18} color={TURF} />
              <Text style={s.quickText}>My marketplace listings</Text>
              <Text style={s.rowArrow}>→</Text>
            </Pressable>
            <Pressable
              style={s.quickRow}
              onPress={() => navigation.getParent()?.navigate("Favorites")}
            >
              <Ionicons name="heart-outline" size={18} color={TURF} />
              <Text style={s.quickText}>Saved listings</Text>
              <Text style={s.rowArrow}>→</Text>
            </Pressable>
            <Pressable
              style={s.quickRow}
              onPress={() => navigation.navigate("Messages")}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={TURF} />
              <Text style={s.quickText}>Messages</Text>
              <Text style={s.rowArrow}>→</Text>
            </Pressable>
            <Pressable
              style={s.quickRow}
              onPress={() => navigation.getParent()?.navigate("Notifications")}
            >
              <Ionicons name="notifications-outline" size={18} color={TURF} />
              <Text style={s.quickText}>Notifications</Text>
              <Text style={s.rowArrow}>→</Text>
            </Pressable>
            <Pressable style={s.quickRow} onPress={openCustomizeWidgets}>
              <Ionicons name="apps-outline" size={18} color={TURF} />
              <Text style={s.quickText}>Customize profile widgets</Text>
              {!billing?.isPro && (
                <View style={s.proChip}>
                  <Text style={s.proChipText}>PRO</Text>
                </View>
              )}
              <Text style={s.rowArrow}>→</Text>
            </Pressable>
            {user.roles?.some((x) => x === "admin" || x === "moderator") && (
              <Pressable
                style={s.quickRow}
                onPress={() => navigation.getParent()?.navigate("Admin")}
              >
                <Ionicons name="shield-outline" size={18} color={ORANGE} />
                <Text style={s.quickText}>PBG Operations</Text>
                <Text style={s.rowArrow}>→</Text>
              </Pressable>
            )}
          </View>
          <View style={s.sideCard}>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.eyebrow}>ON THE MARKET</Text>
                <Text style={s.sideTitle}>
                  {activeListings.length
                    ? `${activeListings.length} live listing${activeListings.length === 1 ? "" : "s"}`
                    : "Nothing listed"}
                </Text>
              </View>
            </View>
            {activeListings.slice(0, 2).map((x) => (
              <Pressable
                key={x.id}
                style={s.marketRow}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate("ListingDetail", { listingId: x.id })
                }
              >
                {x.images?.[0] ? (
                  <Image source={{ uri: x.images[0] }} style={s.marketImage} />
                ) : (
                  <View style={s.marketImage} />
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={s.marketName}>
                    {x.title}
                  </Text>
                  <Text style={[s.marketPrice, { color: TURF }]}>
                    ${Number(x.price).toLocaleString()}
                  </Text>
                </View>
              </Pressable>
            ))}
            <Pressable
              onPress={() => navigation.getParent()?.navigate("CreateListing")}
            >
              <Text style={[s.listLink, { color: TURF }]}>＋ LIST AN ITEM</Text>
            </Pressable>
          </View>
          <View style={s.account}>
            <Pressable
              onPress={() => navigation.getParent()?.navigate("AccountSettings")}
            >
              <Text style={s.accountLink}>Account settings</Text>
            </Pressable>
            <Pressable onPress={confirmLogout}>
              <Text style={s.logout}>Sign out</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <View>
          <Text style={s.eyebrow}>PLUGINS</Text>
          <View style={s.widgetTitleRow}>
            <Text style={s.sectionTitle}>Profile widgets</Text>
            {!billing?.isPro && (
              <View style={s.proChip}>
                <Text style={s.proChipText}>PRO</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable onPress={openCustomizeWidgets}>
          <Text style={[s.textLink, { color: TURF }]}>CUSTOMIZE →</Text>
        </Pressable>
      </View>
      {widgets.length ? (
        <View style={s.widgetGrid}>
          {widgets
            .filter((w) => w.isVisible)
            .map((w) => (
              <View key={w.id} style={s.widgetSlot}>
                <WidgetRenderer
                  widget={w}
                  ctx={{ user, bag, team, upcomingEvents, listings, isPro: billing?.isPro }}
                />
              </View>
            ))}
        </View>
      ) : billing?.isPro ? (
        <Pressable style={s.widgetEmpty} onPress={openCustomizeWidgets}>
          <Ionicons name="apps-outline" size={20} color={TURF} />
          <Text style={s.widgetEmptyText}>
            Add widgets to customize your profile for how you play.
          </Text>
        </Pressable>
      ) : (
        <Pressable style={s.widgetUpsell} onPress={openCustomizeWidgets}>
          <View style={s.widgetUpsellIcon}>
            <Ionicons name="star" size={18} color={ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.widgetUpsellTitle}>
              Unlock custom profile widgets
            </Text>
            <Text style={s.widgetUpsellText}>
              PBG Pro lets you build your profile out of loadout, stats,
              achievements, social links, and more — $4/mo or $24/yr.
            </Text>
          </View>
          <Text style={[s.textLink, { color: TURF }]}>UPGRADE →</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  content: {
    maxWidth: 1450,
    alignSelf: "flex-start",
    marginLeft: 18,
    paddingTop: 18,
    paddingBottom: 90,
  },
  center: {
    flex: 1,
    backgroundColor: INK,
    alignItems: "center",
    justifyContent: "center",
  },
  cover: {
    height: 218,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#30393A",
  },
  coverImage: { width: "100%", height: "100%" },
  coverFallback: { flex: 1, backgroundColor: "#1A2520", overflow: "hidden" },
  defaultCoverImage: { resizeMode: "cover" },
  fieldLine: {
    position: "absolute",
    width: "70%",
    height: 260,
    borderWidth: 1,
    borderColor: "rgba(168,200,74,.16)",
    borderRadius: 140,
    right: -100,
    top: -80,
  },
  fieldLineTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderWidth: 45,
    borderColor: "rgba(232,116,59,.06)",
    borderRadius: 150,
    left: "32%",
    top: 30,
  },
  coverWord: {
    position: "absolute",
    right: 24,
    bottom: -22,
    color: "rgba(243,241,232,.04)",
    fontSize: 150,
    fontWeight: "900",
  },
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,8,.68)",
  },
  coverMeta: { position: "absolute", left: 24, top: 22 },
  coverKicker: {
    color: DEFAULT_ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },
  identity: {
    marginHorizontal: 26,
    marginTop: -44,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 18,
    zIndex: 3,
  },
  identityCompact: { flexWrap: "wrap", marginHorizontal: 14 },
  avatarFrame: {
    width: 104,
    height: 104,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: INK,
    backgroundColor: "#1B2425",
  },
  avatar: { width: "100%", height: "100%", borderRadius: 23 },
  avatarFallback: {
    flex: 1,
    borderRadius: 23,
    backgroundColor: "#273229",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: DEFAULT_ACCENT, fontSize: 34, fontWeight: "900" },
  online: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: DEFAULT_ACCENT,
    borderWidth: 3,
    borderColor: INK,
  },
  identityText: { flex: 1, minWidth: 250, paddingBottom: 3 },
  nameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flexWrap: "wrap",
  },
  name: {
    color: "#F3F1E8",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
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
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ORANGE,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 10,
  },
  proBadgeText: {
    color: "#10140D",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  proChip: {
    backgroundColor: "rgba(232,116,59,.16)",
    borderWidth: 1,
    borderColor: "rgba(232,116,59,.4)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proChipText: {
    color: ORANGE,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  handle: { color: "#8B968F", fontSize: 12, fontWeight: "700", marginTop: 3 },
  metaLine: { flexDirection: "row", gap: 14, flexWrap: "wrap", marginTop: 4 },
  identityMeta: {
    color: "#727E7A",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  bio: {
    color: "#B8C0BC",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 650,
    marginTop: 10,
  },
  addBio: { color: DEFAULT_ACCENT, fontSize: 12, fontWeight: "800", marginTop: 9 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: {
    color: "#ABB4B0",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    borderWidth: 1,
    borderColor: "#35403E",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tagAmber: { color: "#D9A54B", borderColor: "#5C4B2E" },
  identityActions: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  action: {
    minHeight: 39,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#3B4645",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    alignSelf: "flex-start",
  },
  actionText: {
    color: "#D6DDDA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  actionTextPrimary: { color: "#10140D" },
  stats: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#293231",
    backgroundColor: PANEL,
    borderRadius: 13,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    minWidth: 125,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRightWidth: 1,
    borderRightColor: "#293231",
  },
  statValue: { color: "#F3F1E8", fontSize: 20, fontWeight: "900" },
  statLabel: {
    color: "#687470",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 4,
  },
  columns: {
    flexDirection: "row",
    gap: 20,
    marginTop: 32,
    alignItems: "flex-start",
  },
  mainColumn: { flex: 2, minWidth: 0 },
  sideColumn: { width: 355, maxWidth: "100%", gap: 14 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  eyebrow: {
    color: "#75817D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  sectionTitle: {
    color: "#F3F1E8",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 4,
  },
  textLink: { color: DEFAULT_ACCENT, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  playerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 31,
  },
  detail: {
    flex: 1,
    flexBasis: "46%",
    minWidth: 260,
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#283231",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
  },
  detailLabel: {
    color: "#65716D",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },
  detailValue: {
    color: "#DCE1DE",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "capitalize",
  },
  loadoutIntro: {
    backgroundColor: "#101613",
    borderWidth: 1,
    borderColor: "#34422F",
    borderRadius: 13,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  loadoutDescription: {
    color: "#9DA9A3",
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 620,
  },
  essentialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 11,
  },
  essential: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderColor: "#303A37",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  essentialText: {
    color: "#7D8984",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  essentialTextOwned: { color: "#10140D" },
  readiness: {
    minWidth: 70,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#344039",
    paddingLeft: 15,
  },
  readinessValue: { color: "#F3F1E8", fontSize: 22, fontWeight: "900" },
  readinessLabel: {
    color: "#68746F",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  gearList: {
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: PANEL,
  },
  gearRow: {
    minHeight: 69,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#283130",
  },
  gearIcon: {
    width: 37,
    height: 37,
    borderRadius: 9,
    backgroundColor: "#212B24",
    alignItems: "center",
    justifyContent: "center",
  },
  gearIconText: { color: DEFAULT_ACCENT, fontSize: 9, fontWeight: "900" },
  gearName: { color: "#E4E8E5", fontSize: 13, fontWeight: "900" },
  gearMeta: {
    color: "#6F7B77",
    fontSize: 9,
    marginTop: 4,
    textTransform: "capitalize",
  },
  rowArrow: { color: "#68736F", fontSize: 17 },
  empty: { padding: 24, alignItems: "flex-start" },
  emptyTitle: { color: "#F3F1E8", fontSize: 16, fontWeight: "900" },
  emptyBody: { color: "#7B8783", fontSize: 12, marginTop: 5, marginBottom: 15 },
  sideCard: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 13,
    padding: 17,
  },
  proCard: { borderColor: "#5C4B2E", backgroundColor: "#181410" },
  proHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  proEyebrow: {
    color: ORANGE,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  proTitle: { color: "#F3F1E8", fontSize: 18, fontWeight: "900", marginTop: 4 },
  proBody: {
    color: "#9DA9A3",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 14,
  },
  proManageLink: {
    color: ORANGE,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  proYearlyLink: {
    color: "#9DA9A3",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
  sideTitle: {
    color: "#E7EBE8",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  quickRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#283130",
  },
  quickText: { flex: 1, color: "#C1C8C4", fontSize: 12, fontWeight: "700" },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#283130",
  },
  marketImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#222B2C",
  },
  marketName: { color: "#D7DDDA", fontSize: 11, fontWeight: "800" },
  marketPrice: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900", marginTop: 3 },
  listLink: {
    color: DEFAULT_ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 10,
  },
  account: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  accountLink: { color: "#7E8985", fontSize: 10 },
  logout: { color: "#B97861", fontSize: 10 },
  muted: { color: "#78827F" },
  widgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  widgetSlot: { width: 280, flexGrow: 1, minWidth: 240 },
  widgetEmpty: {
    borderWidth: 1,
    borderColor: "#34422F",
    borderStyle: "dashed",
    borderRadius: 13,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  widgetEmptyText: { color: "#9DA9A3", fontSize: 12, flex: 1 },
  widgetTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  widgetUpsell: {
    borderWidth: 1,
    borderColor: "#5C4B2E",
    backgroundColor: "#181410",
    borderRadius: 13,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  widgetUpsellIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(232,116,59,.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  widgetUpsellTitle: { color: "#F3F1E8", fontSize: 14, fontWeight: "900" },
  widgetUpsellText: {
    color: "#9DA9A3",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
});
