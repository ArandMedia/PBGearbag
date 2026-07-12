import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "../store/AuthContext";
import { homeService, HomeFeed, HomeLayoutBlock, BillboardPost } from "../services/home.service";
import { billingService, BillingStatus } from "../services/billing.service";
import { widgetsService, ProfileWidget } from "../services/widgets.service";
import { communityService, Announcement, Event, Gearbag } from "../services/community.service";
import { marketplaceService, Listing } from "../services/marketplace.service";
import Billboard from "../components/home/Billboard";
import EventsBlock from "../components/home/EventsBlock";
import FieldWireBlock from "../components/home/FieldWireBlock";
import CommandCenterBlock from "../components/home/CommandCenterBlock";
import ProWidgetsBlock from "../components/home/ProWidgetsBlock";
import MarketplacePicksBlock from "../components/home/MarketplacePicksBlock";
import DraggableBlockList, { BlockDef } from "../components/home/DraggableBlockList";

const LIME = "#A8C84A";

const BLOCK_CATALOG: BlockDef[] = [
  { key: "events", label: "Your Schedule", hint: "Upcoming + nearby events" },
  { key: "field_wire", label: "Field Wire", hint: "Announcements from fields, teams, events" },
  { key: "command_center", label: "Command Center", hint: "Quick actions" },
  { key: "pro_widgets", label: "Pro Widgets", hint: "Your profile widgets" },
  { key: "marketplace_picks", label: "Marketplace Picks", hint: "Gear picked for you" },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const name = user?.displayName || user?.firstName || user?.username || "player";

  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [layout, setLayout] = useState<HomeLayoutBlock[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [widgets, setWidgets] = useState<ProfileWidget[]>([]);
  const [bag, setBag] = useState<Gearbag | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    homeService
      .getFeed()
      .then(setFeed)
      .catch(() => {})
      .finally(() => setLoading(false));
    homeService.getLayout().then(setLayout).catch(() => {});
    billingService.getStatus().then(setBilling).catch(() => {});
  }, []);

  useEffect(() => {
    if (!billing?.isPro || !user?.id) return;
    Promise.all([
      widgetsService.mine(),
      communityService.gearbags(),
      communityService.myTeam(user.id),
      marketplaceService.getMyListings(1, 20),
    ])
      .then(([w, bags, myTeam, listingsPage]) => {
        setWidgets(w);
        setBag(bags.find((b) => b.isPrimary) || bags[0] || null);
        setTeam(myTeam);
        setMyListings(listingsPage.items);
      })
      .catch(() => {});
  }, [billing?.isPro, user?.id]);

  const saveLayout = async (next: HomeLayoutBlock[]) => {
    setLayout(next);
    try {
      await homeService.saveLayout(next);
    } catch {}
  };

  const widgetCtx = useMemo(
    () => ({
      user: user as any,
      bag,
      team,
      upcomingEvents: feed?.myEvents || [],
      listings: myListings,
      isPro: billing?.isPro,
    }),
    [user, bag, team, feed?.myEvents, myListings, billing?.isPro],
  );

  const goEntity = (kind: "field" | "event" | "team", slug?: string) => {
    if (!slug) return;
    navigation.getParent()?.navigate("CommunityEntity", { kind, slug });
  };

  const renderBlock = (key: string) => {
    switch (key) {
      case "events":
        return (
          <EventsBlock
            myEvents={feed?.myEvents || []}
            nearbyEvents={feed?.nearbyEvents || []}
            onPressEvent={(e: Event) => goEntity("event", e.slug)}
            onSeeAll={() => navigation.navigate("Discover")}
          />
        );
      case "field_wire":
        return (
          <FieldWireBlock
            announcements={feed?.announcements || []}
            onPress={(a: Announcement) => goEntity(a.sourceType === "organization" ? "field" : a.sourceType, a.sourceSlug)}
          />
        );
      case "command_center":
        return (
          <CommandCenterBlock
            onTrade={() => navigation.navigate("Marketplace")}
            onSell={() => navigation.getParent()?.navigate("MyListings")}
            onPlay={() => navigation.navigate("Discover")}
            onIdentity={() => navigation.navigate("Profile")}
          />
        );
      case "pro_widgets":
        return (
          <ProWidgetsBlock
            isPro={!!billing?.isPro}
            widgets={widgets}
            ctx={widgetCtx}
            onUpgrade={() => navigation.navigate("Profile")}
            onManage={() => navigation.getParent()?.navigate("CustomizeWidgets")}
          />
        );
      case "marketplace_picks":
        return (
          <MarketplacePicksBlock
            listings={feed?.marketplacePicks || []}
            onPressListing={(l: Listing) => navigation.navigate("ListingDetail", { listingId: l.id })}
            onSeeAll={() => navigation.navigate("Marketplace")}
          />
        );
      default:
        return null;
    }
  };

  const onPressBillboardPost = (post: BillboardPost) => {
    navigation.getParent()?.navigate("PublicProfile", { userId: post.authorId });
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      <View style={s.greetingRow}>
        <View>
          <Text style={s.eyebrow}>WELCOME BACK</Text>
          <Text style={s.greeting}>Hey {name}, here's your field.</Text>
        </View>
        <Pressable style={[s.editBtn, editing && s.editBtnActive]} onPress={() => setEditing((v) => !v)}>
          <Ionicons name={editing ? "checkmark" : "pencil"} size={14} color={editing ? "#10150d" : LIME} />
          <Text style={[s.editBtnText, editing && s.editBtnTextActive]}>{editing ? "Done" : "Edit Home"}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color={LIME} />
        </View>
      ) : (
        <>
          <Billboard posts={feed?.billboard || []} onPressPost={onPressBillboardPost} />

          <View style={s.blocks}>
            {editing ? (
              <DraggableBlockList catalog={BLOCK_CATALOG} order={layout} onChange={saveLayout} />
            ) : (
              layout
                .filter((b) => !b.hidden)
                .map((b) => (
                  <View key={b.key} style={s.blockWrap}>
                    {renderBlock(b.key)}
                  </View>
                ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: { width: "96%", maxWidth: 1380, alignSelf: "center", paddingTop: 18, paddingBottom: 90 },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 },
  eyebrow: { color: "#A8C84A", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 6 },
  greeting: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(168,200,74,.4)",
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  editBtnActive: { backgroundColor: LIME, borderColor: LIME },
  editBtnText: { color: LIME, fontSize: 12, fontWeight: "900" },
  editBtnTextActive: { color: "#10150d" },
  loading: { paddingVertical: 100, alignItems: "center" },
  blocks: { marginTop: 20, gap: 20 },
  blockWrap: {},
});
