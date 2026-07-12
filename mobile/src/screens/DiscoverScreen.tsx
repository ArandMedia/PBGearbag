import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Alert } from "../utils/alert";
import {
  communityService,
  Event,
  Organization,
  Team,
} from "../services/community.service";

type Mode = "events" | "fields" | "teams";
type DateFilter = "all" | "30" | "90";
type PriceFilter = "all" | "free" | "paid";
const LIME = "#A8C84A";
const paintballEventTypes = [
  ["speedball", "Speedball"],
  ["tournament", "Tournament"],
  ["mechanical", "Mechanical"],
  ["pump", "Pump"],
  ["woodsball", "Woodsball"],
  ["scenario", "Scenario"],
  ["big_game", "Big game"],
  ["magfed", "MagFed"],
  ["open_play", "Open play"],
  ["recreational", "Recreational"],
  ["league", "League"],
  ["clinic", "Clinic / camp"],
  ["team_tryout", "Team tryout"],
  ["charity", "Charity"],
  ["private_event", "Private event"],
  ["trade_show", "Expo / trade show"],
] as const;
const paintballPlaceTypes = [
  ["field", "Paintball field"],
  ["retailer", "Retailer / pro shop"],
  ["manufacturer", "Manufacturer"],
  ["airsmith", "Airsmith / tech"],
  ["hydro_testing", "Hydro testing"],
  ["event_producer", "Event producer"],
  ["league", "League / series"],
  ["media", "Paintball media"],
  ["photographer", "Photographer / video"],
  ["apparel", "Apparel / custom gear"],
  ["travel", "Travel / lodging"],
  ["training", "Training academy"],
  ["indoor_venue", "Indoor venue"],
  ["outdoor_venue", "Outdoor venue"],
  ["community", "Club / community"],
  ["other", "Other paintball business"],
] as const;
const paintballAmenities = [
  ["rentals", "Rental equipment"],
  ["beginner", "Beginner friendly"],
  ["low impact", "Low-impact paintball"],
  ["kids", "Youth programs"],
  ["air", "Air fills"],
  ["4500", "4500 PSI fills"],
  ["co2", "CO₂ fills"],
  ["pro shop", "On-site pro shop"],
  ["tech", "Tech services"],
  ["repair", "Repairs"],
  ["byop", "Bring your own paint"],
  ["paint included", "Paint included"],
  ["speedball", "Speedball field"],
  ["woodsball", "Woodsball field"],
  ["scenario", "Scenario field"],
  ["indoor", "Indoor play"],
  ["covered", "Covered staging"],
  ["lights", "Night play / lights"],
  ["chronograph", "Chronograph station"],
  ["turf", "Turf field"],
  ["food", "Food / concessions"],
  ["restrooms", "Restrooms"],
  ["parking", "Parking"],
  ["camping", "Camping"],
  ["showers", "Showers"],
  ["wifi", "Wi-Fi"],
  ["private parties", "Private parties"],
  ["corporate", "Corporate groups"],
  ["birthday", "Birthday packages"],
  ["league play", "League play"],
  ["tournaments", "Tournaments"],
  ["wheelchair", "Accessible facilities"],
  ["lodging", "Nearby lodging"],
  ["shipping", "Shipping"],
  ["online store", "Online store"],
  ["custom work", "Custom work"],
] as const;
function Chip({
  label,
  on,
  press,
}: {
  label: string;
  on: boolean;
  press: () => void;
}) {
  return (
    <Pressable onPress={press} style={[s.chip, on && s.chipOn]}>
      <Text style={[s.chipText, on && s.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}
function Search({
  value,
  set,
  placeholder,
}: {
  value: string;
  set: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={s.search}>
      <Text style={s.searchIcon}>⌕</Text>
      <TextInput
        style={s.searchInput}
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        placeholderTextColor="#657178"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

export default function DiscoverScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const [mode, setMode] = useState<Mode>("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [fields, setFields] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [minEventPrice, setMinEventPrice] = useState("");
  const [maxEventPrice, setMaxEventPrice] = useState("");
  const [eventSort, setEventSort] = useState<"soonest" | "price">("soonest");
  const [fieldType, setFieldType] = useState("all");
  const [verified, setVerified] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [fieldSort, setFieldSort] = useState<"name" | "location">("name");
  const [placeTypesOpen, setPlaceTypesOpen] = useState(false);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [teamType, setTeamType] = useState("all");
  const [recruiting, setRecruiting] = useState(false);
  const [teamSort, setTeamSort] = useState<"name" | "newest">("name");
  useEffect(() => {
    Promise.all([
      communityService.events(),
      communityService.organizations(),
      communityService.teams(),
    ])
      .then(([e, o, t]) => {
        setEvents(e);
        setFields(o);
        setTeams(t);
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    setQuery("");
    setLocation("");
  }, [mode]);
  const includes = (values: (string | undefined)[]) => {
    const q = query.trim().toLowerCase(),
      loc = location.trim().toLowerCase();
    return (
      (!q || values.slice(0, -3).some((v) => v?.toLowerCase().includes(q))) &&
      (!loc || values.slice(-3).some((v) => v?.toLowerCase().includes(loc)))
    );
  };
  const eventTypes = useMemo(() => {
    const known = new Set(paintballEventTypes.map((x) => x[0] as string));
    const custom = events
      .map((x) => x.eventType)
      .filter((x) => x && !known.has(x));
    return [
      ...paintballEventTypes,
      ...custom.map((x) => [x, x.replace(/_/g, " ")] as const),
    ];
  }, [events]);
  const fieldTypes = useMemo(() => {
    const known = new Set(paintballPlaceTypes.map((x) => x[0] as string));
    const custom = fields.map((x) => x.type).filter((x) => x && !known.has(x));
    return [
      ...paintballPlaceTypes,
      ...custom.map((x) => [x, x.replace(/_/g, " ")] as const),
    ];
  }, [fields]);
  const teamTypes = useMemo(
    () => Array.from(new Set(teams.map((x) => x.teamType).filter(Boolean))),
    [teams],
  );
  const filteredEvents = useMemo(
    () =>
      events
        .filter((e) => {
          const days = (new Date(e.startsAt).getTime() - Date.now()) / 86400000;
          const price = (e.costCents || 0) / 100;
          return (
            includes([
              e.title,
              e.description,
              e.eventType,
              e.city,
              e.region,
              (e as any).country,
            ]) &&
            (eventType === "all" || e.eventType === eventType) &&
            (dateFilter === "all" ||
              (days >= 0 && days <= Number(dateFilter))) &&
            (priceFilter === "all" ||
              (priceFilter === "free" ? price === 0 : price > 0)) &&
            (!minEventPrice || price >= Number(minEventPrice)) &&
            (!maxEventPrice || price <= Number(maxEventPrice))
          );
        })
        .sort((a, b) =>
          eventSort === "price"
            ? (a.costCents || 0) - (b.costCents || 0)
            : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [
      events,
      query,
      location,
      eventType,
      dateFilter,
      priceFilter,
      minEventPrice,
      maxEventPrice,
      eventSort,
    ],
  );
  const filteredFields = useMemo(
    () =>
      fields
        .filter((f) => {
          const details = f.details || {};
          const hay =
            `${f.description || ""} ${JSON.stringify(details)}`.toLowerCase();
          return (
            includes([
              f.name,
              f.description,
              f.type,
              f.city,
              f.region,
              f.country,
            ]) &&
            (fieldType === "all" || f.type === fieldType) &&
            (!verified || f.isVerified) &&
            amenities.every((a) => hay.includes(a))
          );
        })
        .sort((a, b) =>
          fieldSort === "location"
            ? `${a.region}${a.city}`.localeCompare(`${b.region}${b.city}`)
            : a.name.localeCompare(b.name),
        ),
    [fields, query, location, fieldType, verified, amenities, fieldSort],
  );
  const filteredTeams = useMemo(
    () =>
      teams
        .filter(
          (t) =>
            includes([
              t.name,
              t.description,
              t.teamType,
              t.city,
              t.region,
              t.country,
            ]) &&
            (teamType === "all" || t.teamType === teamType) &&
            (!recruiting || t.isRecruiting),
        )
        .sort((a, b) =>
          teamSort === "name"
            ? a.name.localeCompare(b.name)
            : new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
        ),
    [teams, query, location, teamType, recruiting, teamSort],
  );
  const reset = () => {
    setQuery("");
    setLocation("");
    setEventType("all");
    setDateFilter("all");
    setPriceFilter("all");
    setMinEventPrice("");
    setMaxEventPrice("");
    setEventSort("soonest");
    setFieldType("all");
    setVerified(false);
    setAmenities([]);
    setFieldSort("name");
    setTeamType("all");
    setRecruiting(false);
    setTeamSort("name");
  };
  const resultCount =
    mode === "events"
      ? filteredEvents.length
      : mode === "fields"
        ? filteredFields.length
        : filteredTeams.length;
  const selectedPlaceLabel =
    fieldType === "all"
      ? "All paintball places"
      : fieldTypes.find((x) => x[0] === fieldType)?.[1] || fieldType;
  const selectedAmenityLabels = amenities.map(
    (value) => paintballAmenities.find((x) => x[0] === value)?.[1] || value,
  );
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={LIME} size="large" />
      </View>
    );
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.hero}>
        <Text style={s.kicker}>THE PAINTBALL MAP</Text>
        <Text style={[s.title, compact && { fontSize: 32 }]}>
          Find your next place to play.
        </Text>
        <Text style={s.sub}>
          Search the games, fields, services, and teams that keep paintball
          moving.
        </Text>
      </View>
      <View style={s.tabs}>
        {(["events", "fields", "teams"] as Mode[]).map((x) => (
          <Pressable
            key={x}
            style={[s.tab, mode === x && s.tabOn]}
            onPress={() => setMode(x)}
          >
            <Text style={[s.tabText, mode === x && s.tabTextOn]}>
              {x.toUpperCase()}
            </Text>
            <Text style={[s.tabCount, mode === x && s.tabCountOn]}>
              {x === "events"
                ? events.length
                : x === "fields"
                  ? fields.length
                  : teams.length}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.discoveryBar}>
        <View style={[s.searches, compact && { flexDirection: "column" }]}>
          <Search
            value={query}
            set={setQuery}
            placeholder={`Search ${mode} by name, type, or details…`}
          />
          <View style={s.locationSearch}>
            <Text style={s.pin}>⌖</Text>
            <TextInput
              style={s.searchInput}
              value={location}
              onChangeText={setLocation}
              placeholder="City, state, or region"
              placeholderTextColor="#657178"
            />
          </View>
        </View>
        <View style={s.filterArea}>
          {mode === "events" && (
            <>
              <View style={s.eventTypeBlock}>
                <Text style={s.label}>EVENT TYPE</Text>
                <View style={s.wrap}>
                  <Chip
                    label="All event types"
                    on={eventType === "all"}
                    press={() => setEventType("all")}
                  />
                  {eventTypes.map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      on={eventType === value}
                      press={() => setEventType(value)}
                    />
                  ))}
                </View>
              </View>
              <View style={s.filterBlock}>
                <Text style={s.label}>WHEN</Text>
                <View style={s.wrap}>
                  <Chip
                    label="Any date"
                    on={dateFilter === "all"}
                    press={() => setDateFilter("all")}
                  />
                  <Chip
                    label="Next 30 days"
                    on={dateFilter === "30"}
                    press={() => setDateFilter("30")}
                  />
                  <Chip
                    label="Next 90 days"
                    on={dateFilter === "90"}
                    press={() => setDateFilter("90")}
                  />
                </View>
              </View>
              <View style={s.filterBlock}>
                <Text style={s.label}>PRICE</Text>
                <View style={s.wrap}>
                  <Chip
                    label="Any price"
                    on={priceFilter === "all"}
                    press={() => setPriceFilter("all")}
                  />
                  <Chip
                    label="Free"
                    on={priceFilter === "free"}
                    press={() => setPriceFilter("free")}
                  />
                  <Chip
                    label="Paid"
                    on={priceFilter === "paid"}
                    press={() => setPriceFilter("paid")}
                  />
                </View>
                <View style={s.eventPriceRow}>
                  <View style={s.priceInputWrap}>
                    <Text style={s.currency}>$</Text>
                    <TextInput
                      style={s.priceInput}
                      value={minEventPrice}
                      onChangeText={setMinEventPrice}
                      keyboardType="numeric"
                      placeholder="Min"
                      placeholderTextColor="#657178"
                    />
                  </View>
                  <Text style={s.priceTo}>TO</Text>
                  <View style={s.priceInputWrap}>
                    <Text style={s.currency}>$</Text>
                    <TextInput
                      style={s.priceInput}
                      value={maxEventPrice}
                      onChangeText={setMaxEventPrice}
                      keyboardType="numeric"
                      placeholder="Max"
                      placeholderTextColor="#657178"
                    />
                  </View>
                </View>
              </View>
              <View style={s.filterBlock}>
                <Text style={s.label}>SORT</Text>
                <View style={s.wrap}>
                  <Chip
                    label="Soonest"
                    on={eventSort === "soonest"}
                    press={() => setEventSort("soonest")}
                  />
                  <Chip
                    label="Lowest cost"
                    on={eventSort === "price"}
                    press={() => setEventSort("price")}
                  />
                </View>
              </View>
            </>
          )}
          {mode === "fields" && (
            <>
              <View style={s.collapsible}>
                <Pressable
                  style={s.collapseHeader}
                  onPress={() => setPlaceTypesOpen((v) => !v)}
                >
                  <View>
                    <Text style={s.label}>PAINTBALL PLACE TYPE</Text>
                    <Text style={s.collapseSummary}>{selectedPlaceLabel}</Text>
                  </View>
                  <Text style={s.chevron}>{placeTypesOpen ? "⌃" : "⌄"}</Text>
                </Pressable>
                {placeTypesOpen && (
                  <View style={s.collapseBody}>
                    <View style={s.wrap}>
                      <Chip
                        label="All paintball places"
                        on={fieldType === "all"}
                        press={() => {
                          setFieldType("all");
                          setPlaceTypesOpen(false);
                        }}
                      />
                      {fieldTypes.map(([value, label]) => (
                        <Chip
                          key={value}
                          label={label}
                          on={fieldType === value}
                          press={() => {
                            setFieldType(value);
                            setPlaceTypesOpen(false);
                          }}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <View style={s.collapsible}>
                <Pressable
                  style={s.collapseHeader}
                  onPress={() => setAmenitiesOpen((v) => !v)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.label}>
                      AMENITIES & SERVICES · SELECT MULTIPLE
                    </Text>
                    <Text numberOfLines={1} style={s.collapseSummary}>
                      {selectedAmenityLabels.length
                        ? selectedAmenityLabels.join("  •  ")
                        : "Any amenities or services"}
                    </Text>
                  </View>
                  <View style={s.collapseRight}>
                    {amenities.length > 0 && (
                      <View style={s.selectionCount}>
                        <Text style={s.selectionCountText}>
                          {amenities.length}
                        </Text>
                      </View>
                    )}
                    <Text style={s.chevron}>{amenitiesOpen ? "⌃" : "⌄"}</Text>
                  </View>
                </Pressable>
                {amenitiesOpen && (
                  <View style={s.collapseBody}>
                    <View style={s.amenityHeading}>
                      {amenities.length > 0 ? (
                        <Pressable onPress={() => setAmenities([])}>
                          <Text
                            style={s.clear}
                          >{`CLEAR ${amenities.length}`}</Text>
                        </Pressable>
                      ) : (
                        <View />
                      )}
                      <Pressable
                        style={s.doneButton}
                        onPress={() => setAmenitiesOpen(false)}
                      >
                        <Text style={s.doneText}>DONE</Text>
                      </Pressable>
                    </View>
                    <View style={s.wrap}>
                      {paintballAmenities.map(([value, label]) => (
                        <Chip
                          key={value}
                          label={label}
                          on={amenities.includes(value)}
                          press={() =>
                            setAmenities((current) =>
                              current.includes(value)
                                ? current.filter((x) => x !== value)
                                : [...current, value],
                            )
                          }
                        />
                      ))}
                    </View>
                  </View>
                )}
              </View>
              <View style={s.filterBlock}>
                <Text style={s.label}>TRUST & SORT</Text>
                <View style={s.wrap}>
                  <Chip
                    label="Verified only"
                    on={verified}
                    press={() => setVerified((v) => !v)}
                  />
                  <Chip
                    label="A–Z"
                    on={fieldSort === "name"}
                    press={() => setFieldSort("name")}
                  />
                  <Chip
                    label="By location"
                    on={fieldSort === "location"}
                    press={() => setFieldSort("location")}
                  />
                </View>
              </View>
            </>
          )}
          {mode === "teams" && (
            <>
              <View style={s.filterBlock}>
                <Text style={s.label}>PLAY STYLE</Text>
                <View style={s.wrap}>
                  <Chip
                    label="All"
                    on={teamType === "all"}
                    press={() => setTeamType("all")}
                  />
                  {teamTypes.map((x) => (
                    <Chip
                      key={x}
                      label={x.replace("_", " ")}
                      on={teamType === x}
                      press={() => setTeamType(x)}
                    />
                  ))}
                </View>
              </View>
              <View style={s.filterBlock}>
                <Text style={s.label}>ROSTER STATUS</Text>
                <View style={s.wrap}>
                  <Chip
                    label="Recruiting now"
                    on={recruiting}
                    press={() => setRecruiting((v) => !v)}
                  />
                  <Chip
                    label="A–Z"
                    on={teamSort === "name"}
                    press={() => setTeamSort("name")}
                  />
                  <Chip
                    label="Newest"
                    on={teamSort === "newest"}
                    press={() => setTeamSort("newest")}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </View>
      <View style={s.results}>
        <Text style={s.resultsText}>
          {resultCount} {mode.toUpperCase()} FOUND
        </Text>
        <Pressable onPress={reset}>
          <Text style={s.clear}>RESET FILTERS</Text>
        </Pressable>
      </View>
      {mode === "events" &&
        filteredEvents.map((e) => (
          <Pressable
            style={s.feature}
            key={e.id}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate("CommunityEntity", { kind: "event", slug: e.slug })
            }
          >
            {e.bannerUrl && (
              <Image source={{ uri: e.bannerUrl }} style={s.image} />
            )}
            <View style={s.overlay} />
            <View style={s.featureBody}>
              <Text style={s.meta}>
                {e.eventType.toUpperCase()} •{" "}
                {new Date(e.startsAt).toLocaleDateString()}
              </Text>
              <Text style={s.featureTitle}>{e.title}</Text>
              <Text style={s.body}>{e.description}</Text>
              <Text style={s.place}>
                ⌖ {[e.city, e.region].filter(Boolean).join(", ")}{" "}
                {e.costCents
                  ? ` • $${(e.costCents / 100).toFixed(0)}`
                  : " • FREE"}
              </Text>
              <View style={s.actions}>
                <Pressable
                  style={s.primary}
                  onPress={async () => {
                    await communityService.rsvp(e.id, "going");
                    Alert.alert(
                      "You’re going",
                      `${e.title} was added to your plans.`,
                    );
                  }}
                >
                  <Text style={s.primaryText}>I’M GOING</Text>
                </Pressable>
                <Pressable
                  style={s.secondary}
                  onPress={async () => {
                    await communityService.rsvp(e.id, "interested");
                    Alert.alert(
                      "Saved",
                      "We’ll keep this event on your radar.",
                    );
                  }}
                >
                  <Text style={s.secondaryText}>INTERESTED</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      {mode === "fields" &&
        filteredFields.map((f) => (
          <Pressable
            style={s.row}
            key={f.id}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate("CommunityEntity", { kind: "field", slug: f.slug })
            }
          >
            <View style={s.rowIcon}>
              <Text style={s.rowIconText}>
                {f.type === "field" ? "FLD" : "PBG"}
              </Text>
            </View>
            <View style={s.rowBody}>
              <View style={s.nameRow}>
                <Text style={s.rowTitle}>{f.name}</Text>
                {f.isVerified && <Text style={s.verified}>✓ VERIFIED</Text>}
              </View>
              <Text style={s.body}>{f.description}</Text>
              <Text style={s.place}>
                ⌖ {[f.city, f.region].filter(Boolean).join(", ")} •{" "}
                {f.type.replace("_", " ")}
              </Text>
              <View style={s.detailTags}>
                {Object.values(f.details || {})
                  .flatMap((v) => (Array.isArray(v) ? v : []))
                  .slice(0, 5)
                  .map((x: any) => (
                    <Text key={String(x)} style={s.detailTag}>
                      {String(x).toUpperCase()}
                    </Text>
                  ))}
              </View>
            </View>
            <Text style={s.arrow}>→</Text>
          </Pressable>
        ))}
      {mode === "teams" &&
        filteredTeams.map((t) => (
          <Pressable
            style={s.row}
            key={t.id}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate("CommunityEntity", { kind: "team", slug: t.slug })
            }
          >
            <View style={s.rowIcon}>
              <Text style={s.rowIconText}>
                {t.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={s.rowBody}>
              <View style={s.nameRow}>
                <Text style={s.rowTitle}>{t.name}</Text>
                {t.isRecruiting && <Text style={s.recruiting}>RECRUITING</Text>}
              </View>
              <Text style={s.body}>{t.description}</Text>
              <Text style={s.place}>
                ⌖ {[t.city, t.region].filter(Boolean).join(", ")} • {t.teamType}
              </Text>
            </View>
            {t.isRecruiting && (
              <Pressable
                style={s.secondary}
                onPress={async () => {
                  await communityService.applyTeam(
                    t.id,
                    "I am interested in joining the roster.",
                  );
                  Alert.alert(
                    "Application sent",
                    `Your interest was sent to ${t.name}.`,
                  );
                }}
              >
                <Text style={s.secondaryText}>APPLY</Text>
              </Pressable>
            )}
          </Pressable>
        ))}
      {resultCount === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>⌖</Text>
          <Text style={s.emptyTitle}>Nothing matches those filters yet.</Text>
          <Text style={s.emptyBody}>
            Try a nearby region or broaden your selections.
          </Text>
          <Pressable style={s.primary} onPress={reset}>
            <Text style={s.primaryText}>RESET SEARCH</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: {
    width: "94%",
    maxWidth: 1140,
    alignSelf: "center",
    paddingTop: 28,
    paddingBottom: 90,
  },
  center: {
    flex: 1,
    backgroundColor: "#0A0E0F",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { paddingBottom: 4 },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 },
  title: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 7,
  },
  sub: { color: "#87939A", fontSize: 16, marginTop: 7, maxWidth: 700 },
  tabs: { flexDirection: "row", gap: 8, marginTop: 25, marginBottom: 13 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#2D363B",
    backgroundColor: "#121819",
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 22,
  },
  tabOn: { backgroundColor: LIME, borderColor: LIME },
  tabText: {
    color: "#89949A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tabTextOn: { color: "#0B0F0D" },
  tabCount: { color: "#677279", fontSize: 9, fontWeight: "900" },
  tabCountOn: { color: "#4B681E" },
  discoveryBar: {
    backgroundColor: "#101518",
    borderWidth: 1,
    borderColor: "#273137",
    borderRadius: 20,
    padding: 15,
  },
  searches: { flexDirection: "row", gap: 10 },
  search: {
    height: 48,
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#303A40",
    backgroundColor: "#090D0F",
    borderRadius: 11,
    paddingHorizontal: 13,
  },
  locationSearch: {
    height: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#303A40",
    backgroundColor: "#090D0F",
    borderRadius: 11,
    paddingHorizontal: 13,
  },
  searchIcon: { color: "#7C888E", fontSize: 22 },
  pin: { color: LIME, fontSize: 17 },
  searchInput: { flex: 1, color: "#fff", fontSize: 14, paddingHorizontal: 9 },
  filterArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    paddingTop: 16,
  },
  filterBlock: { flex: 1, minWidth: 200 },
  eventTypeBlock: { width: "100%" },
  amenityHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  collapsible: {
    width: "100%",
    backgroundColor: "#0C1113",
    borderWidth: 1,
    borderColor: "#293238",
    borderRadius: 12,
    overflow: "hidden",
  },
  collapseHeader: {
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  collapseBody: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#222B30",
  },
  collapseSummary: {
    color: "#D6DDE0",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },
  collapseRight: { flexDirection: "row", alignItems: "center", gap: 9 },
  chevron: { color: LIME, fontSize: 19, fontWeight: "900" },
  selectionCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCountText: { color: "#0B0F0D", fontSize: 10, fontWeight: "900" },
  doneButton: {
    backgroundColor: LIME,
    borderRadius: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  doneText: {
    color: "#0B0F0D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  label: {
    color: "#67737A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "#303A40",
    backgroundColor: "#141A1E",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 18,
  },
  chipOn: { backgroundColor: "rgba(168,200,74,.12)", borderColor: "#628A2E" },
  chipText: {
    color: "#8E999F",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  chipTextOn: { color: LIME, fontWeight: "900" },
  eventPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 9,
  },
  priceInputWrap: {
    flex: 1,
    minWidth: 78,
    height: 37,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#303A40",
    backgroundColor: "#090D0F",
    borderRadius: 9,
    paddingHorizontal: 9,
  },
  currency: { color: LIME, fontSize: 12, fontWeight: "900" },
  priceInput: { flex: 1, color: "#fff", fontSize: 12, paddingHorizontal: 5 },
  priceTo: { color: "#667279", fontSize: 8, fontWeight: "900" },
  results: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 17,
  },
  resultsText: {
    color: "#748087",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  clear: { color: "#E8743B", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  feature: {
    minHeight: 400,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#354036",
    justifyContent: "flex-end",
    marginBottom: 13,
  },
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,5,6,.61)",
  },
  featureBody: { padding: 29, maxWidth: 730 },
  meta: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  featureTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 8,
  },
  body: { color: "#ADB6BC", lineHeight: 21, marginTop: 7 },
  place: {
    color: "#7B878E",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 11,
    textTransform: "capitalize",
  },
  actions: { flexDirection: "row", gap: 9, marginTop: 20 },
  primary: {
    backgroundColor: LIME,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: "center",
  },
  primaryText: {
    color: "#0B0F0D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  secondary: {
    borderWidth: 1,
    borderColor: "#455159",
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 10,
    alignSelf: "center",
  },
  secondaryText: {
    color: "#E1E6E8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: "#252E33",
    borderRadius: 17,
    padding: 18,
    marginBottom: 11,
  },
  rowIcon: {
    width: 56,
    height: 56,
    borderRadius: 15,
    backgroundColor: "#19231A",
    borderWidth: 1,
    borderColor: "#33492D",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { color: LIME, fontWeight: "900", fontSize: 11 },
  rowBody: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flexWrap: "wrap",
  },
  rowTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  verified: { color: LIME, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  recruiting: {
    color: "#FF9653",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  arrow: { color: LIME, fontSize: 20 },
  detailTags: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 9 },
  detailTag: {
    fontSize: 7,
    color: "#9DA7AC",
    fontWeight: "900",
    letterSpacing: 0.6,
    borderWidth: 1,
    borderColor: "#303A40",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  empty: { alignItems: "center", paddingVertical: 65, gap: 9 },
  emptyIcon: { color: LIME, fontSize: 30 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  emptyBody: { color: "#7E8A91", marginBottom: 10 },
});
