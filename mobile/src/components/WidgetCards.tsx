import React from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Gearbag } from "../services/community.service";
import { Listing } from "../services/marketplace.service";
import { ProfileWidget } from "../services/widgets.service";
import { computeAutoAchievements } from "../utils/achievements";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";
import { hexToRgba } from "../utils/color";

const PANEL = "#121819",
  ORANGE = "#E8743B";

// Data every widget card might need, gathered once by the parent screen.
export interface WidgetContext {
  user?: {
    isVerified?: boolean;
    avatarUrl?: string;
    bannerUrl?: string;
    displayName?: string;
    bio?: string;
    city?: string;
    playStyle?: string[];
    homeField?: string;
    favoritePosition?: string;
    skillLevel?: string;
  } | null;
  bag?: Gearbag | null;
  team?: { name: string; teamType: string; role: string; city?: string } | null;
  upcomingEvents?: { id: string; title: string; startsAt: string; city?: string }[];
  listings?: Listing[];
  isPro?: boolean;
}

function Card({
  eyebrow,
  title,
  children,
  onPress,
}: {
  eyebrow: string;
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
}) {
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap style={s.card} onPress={onPress}>
      <Text style={s.eyebrow}>{eyebrow}</Text>
      {title && <Text style={s.title}>{title}</Text>}
      {children}
    </Wrap>
  );
}

function Empty({ text }: { text: string }) {
  return <Text style={s.empty}>{text}</Text>;
}

function LoadoutCard({ ctx }: { ctx: WidgetContext }) {
  const style = ctx.user?.playStyle?.[0];
  const count = ctx.bag?.items?.length || 0;
  return (
    <Card eyebrow="LOADOUT" title={style ? style.replace("_", " ").toUpperCase() : "Loadout"}>
      <Text style={s.body}>
        {count > 0
          ? `${count} item${count === 1 ? "" : "s"} in the bag.`
          : "No gear logged yet."}
      </Text>
    </Card>
  );
}

function WoodsballKitCard({ ctx }: { ctx: WidgetContext }) {
  const count = ctx.bag?.items?.length || 0;
  return (
    <Card eyebrow="WOODSBALL / SCENARIO KIT" title="Terrain-ready setup">
      <Text style={s.body}>
        {count > 0
          ? `${count} item${count === 1 ? "" : "s"} packed for the long game.`
          : "Build out your scenario loadout in the Gearbag."}
      </Text>
    </Card>
  );
}

function StatsCard({ widget }: { widget: ProfileWidget }) {
  const { accent } = useTheme();
  const stats: { primary: string; secondary: string }[] = widget.config?.items || [];
  const platform: string = widget.config?.platform || "";
  const profileUrl: string = widget.config?.profileUrl || "";
  return (
    <Card eyebrow="STATS">
      {profileUrl ? (
        <Pressable
          style={[s.platformLink, { backgroundColor: hexToRgba(accent, 0.1), borderColor: hexToRgba(accent, 0.3) }]}
          onPress={() => Linking.openURL(profileUrl)}
        >
          <Text style={[s.platformLinkText, { color: accent }]} numberOfLines={1}>
            View live stats{platform ? ` on ${platform}` : ""} →
          </Text>
        </Pressable>
      ) : null}
      {stats.length ? (
        stats.map((x, i) => (
          <View key={i} style={s.row}>
            <Text style={s.rowLabel}>{x.primary}</Text>
            <Text style={[s.rowValue, { color: accent }]}>{x.secondary}</Text>
          </View>
        ))
      ) : !profileUrl ? (
        <Empty text="No stats added yet." />
      ) : null}
    </Card>
  );
}

function TeamCard({ ctx }: { ctx: WidgetContext }) {
  if (!ctx.team) return <Card eyebrow="TEAM"><Empty text="Not on a team yet." /></Card>;
  return (
    <Card eyebrow="TEAM" title={ctx.team.name}>
      <Text style={s.body}>
        {ctx.team.role.toUpperCase()} · {ctx.team.teamType}
        {ctx.team.city ? ` · ${ctx.team.city}` : ""}
      </Text>
    </Card>
  );
}

function UpcomingEventsCard({ ctx }: { ctx: WidgetContext }) {
  const { accent } = useTheme();
  const events = ctx.upcomingEvents || [];
  return (
    <Card eyebrow="UPCOMING EVENTS">
      {events.length ? (
        events.slice(0, 3).map((e) => (
          <View key={e.id} style={s.row}>
            <Text style={s.rowLabel} numberOfLines={1}>
              {e.title}
            </Text>
            <Text style={[s.rowValue, { color: accent }]}>
              {new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
          </View>
        ))
      ) : (
        <Empty text="No upcoming events." />
      )}
    </Card>
  );
}

function HomeFieldCard({ ctx }: { ctx: WidgetContext }) {
  return (
    <Card eyebrow="HOME FIELD" title={ctx.user?.homeField || "Not set"}>
      <Text style={s.body}>
        {ctx.user?.favoritePosition || "Open to anything"}
        {ctx.user?.skillLevel ? ` · ${ctx.user.skillLevel}` : ""}
      </Text>
    </Card>
  );
}

function AchievementsCard({ widget, ctx }: { widget: ProfileWidget; ctx: WidgetContext }) {
  const custom: { primary: string; secondary?: string }[] = widget.config?.items || [];
  const auto = computeAutoAchievements(ctx);
  const items = [...auto, ...custom];
  return (
    <Card eyebrow="ACHIEVEMENTS">
      {items.length ? (
        items.map((x, i) => (
          <View key={i} style={s.row}>
            <Ionicons name="ribbon-outline" size={14} color={ORANGE} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={s.rowLabel}>{x.primary}</Text>
              {x.secondary ? <Text style={s.achievementSub}>{x.secondary}</Text> : null}
            </View>
          </View>
        ))
      ) : (
        <Empty text="No achievements yet — they'll appear automatically as you use PBGearbag." />
      )}
    </Card>
  );
}

function SocialLinksCard({ widget }: { widget: ProfileWidget }) {
  const { accent } = useTheme();
  const links: { primary: string; secondary: string }[] = widget.config?.items || [];
  return (
    <Card eyebrow="SOCIAL LINKS">
      {links.length ? (
        links.map((x, i) => (
          <View key={i} style={s.row}>
            <Text style={s.rowLabel}>{x.primary}</Text>
            <Text style={[s.link, { color: accent }]} numberOfLines={1}>
              {x.secondary}
            </Text>
          </View>
        ))
      ) : (
        <Empty text="No links added yet." />
      )}
    </Card>
  );
}

function BioSpotlightCard({ widget }: { widget: ProfileWidget }) {
  const title = widget.config?.title || "Spotlight";
  const body = widget.config?.body || "";
  return (
    <Card eyebrow="SPOTLIGHT" title={title}>
      {body ? <Text style={s.body}>{body}</Text> : <Empty text="Nothing written yet." />}
    </Card>
  );
}

function MarketplacePicksCard({ ctx }: { ctx: WidgetContext }) {
  const { accent } = useTheme();
  const active = (ctx.listings || []).filter((x) => x.status === "active");
  return (
    <Card eyebrow="MARKETPLACE PICKS">
      {active.length ? (
        active.slice(0, 3).map((x) => (
          <View key={x.id} style={s.marketRow}>
            {x.images?.[0] ? (
              <Image source={{ uri: x.images[0] }} style={s.marketImage} />
            ) : (
              <View style={s.marketImage} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel} numberOfLines={1}>
                {x.title}
              </Text>
              <Text style={[s.rowValue, { color: accent }]}>${Number(x.price).toLocaleString()}</Text>
            </View>
          </View>
        ))
      ) : (
        <Empty text="Nothing listed right now." />
      )}
    </Card>
  );
}

const RENDERERS: Record<
  string,
  (props: { widget: ProfileWidget; ctx: WidgetContext }) => React.ReactElement
> = {
  loadout: ({ ctx }) => <LoadoutCard ctx={ctx} />,
  woodsball_kit: ({ ctx }) => <WoodsballKitCard ctx={ctx} />,
  stats: ({ widget }) => <StatsCard widget={widget} />,
  team: ({ ctx }) => <TeamCard ctx={ctx} />,
  upcoming_events: ({ ctx }) => <UpcomingEventsCard ctx={ctx} />,
  home_field: ({ ctx }) => <HomeFieldCard ctx={ctx} />,
  achievements: ({ widget, ctx }) => <AchievementsCard widget={widget} ctx={ctx} />,
  social_links: ({ widget }) => <SocialLinksCard widget={widget} />,
  bio_spotlight: ({ widget }) => <BioSpotlightCard widget={widget} />,
  marketplace_picks: ({ ctx }) => <MarketplacePicksCard ctx={ctx} />,
};

export function WidgetRenderer({
  widget,
  ctx,
}: {
  widget: ProfileWidget;
  ctx: WidgetContext;
}) {
  const Renderer = RENDERERS[widget.widgetKey];
  if (!Renderer) return null;
  return Renderer({ widget, ctx });
}

const s = StyleSheet.create({
  card: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#293231",
    borderRadius: 13,
    padding: 16,
  },
  eyebrow: {
    color: "#75817D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: { color: "#F3F1E8", fontSize: 15, fontWeight: "900", marginTop: 6 },
  body: { color: "#9DA9A3", fontSize: 12, marginTop: 8, lineHeight: 18 },
  empty: { color: "#687470", fontSize: 12, marginTop: 8, fontStyle: "italic" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2624",
  },
  rowLabel: { color: "#D6DDDA", fontSize: 12, fontWeight: "700" },
  rowValue: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900" },
  achievementSub: { color: "#687470", fontSize: 10, marginTop: 2 },
  platformLink: {
    backgroundColor: hexToRgba(DEFAULT_ACCENT, 0.1),
    borderWidth: 1,
    borderColor: hexToRgba(DEFAULT_ACCENT, 0.3),
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  platformLinkText: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900" },
  link: { color: DEFAULT_ACCENT, fontSize: 11, maxWidth: 160 },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2624",
  },
  marketImage: {
    width: 36,
    height: 36,
    borderRadius: 7,
    backgroundColor: "#222B2C",
  },
});
