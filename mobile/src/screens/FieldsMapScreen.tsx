import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { communityService, Organization } from "../services/community.service";
import { paintballAmenities } from "../constants/paintball";

const LIME = "#A8C84A";

function matchesFilters(f: Organization, search: string, verifiedOnly: boolean, amenities: string[]) {
  if (verifiedOnly && !f.isVerified) return false;
  if (search.trim()) {
    const hay = `${f.name} ${f.city || ""} ${f.region || ""} ${f.country || ""}`.toLowerCase();
    if (!hay.includes(search.trim().toLowerCase())) return false;
  }
  if (amenities.length) {
    const hay = JSON.stringify(f.details || {}).toLowerCase();
    if (!amenities.every((a) => hay.includes(a))) return false;
  }
  return true;
}

function FilterBar({
  search,
  setSearch,
  verifiedOnly,
  setVerifiedOnly,
  amenities,
  toggleAmenity,
  filtersOpen,
  setFiltersOpen,
  resultCount,
}: any) {
  return (
    <View style={s.filterBar}>
      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search fields by name or city"
          placeholderTextColor="#7b878f"
        />
        <Pressable style={[s.filterToggle, filtersOpen && s.filterToggleOn]} onPress={() => setFiltersOpen((v: boolean) => !v)}>
          <Text style={[s.filterToggleText, filtersOpen && s.filterToggleTextOn]}>
            FILTERS{amenities.length ? ` (${amenities.length})` : ""}
          </Text>
        </Pressable>
      </View>
      {filtersOpen && (
        <View style={s.filterPanel}>
          <Pressable style={[s.chip, verifiedOnly && s.chipOn]} onPress={() => setVerifiedOnly((v: boolean) => !v)}>
            <Text style={[s.chipText, verifiedOnly && s.chipTextOn]}>Verified only</Text>
          </Pressable>
          <ScrollView style={s.amenityScroll}>
            <View style={s.chipWrap}>
              {paintballAmenities.map(([value, label]) => (
                <Pressable
                  key={value}
                  style={[s.chip, amenities.includes(value) && s.chipOn]}
                  onPress={() => toggleAmenity(value)}
                >
                  <Text style={[s.chipText, amenities.includes(value) && s.chipTextOn]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
      <Text style={s.resultCount}>{resultCount} field{resultCount === 1 ? "" : "s"} match</Text>
    </View>
  );
}

// Leaflet is a DOM library — only safe/useful on web. Native falls back to
// a plain list rather than pulling leaflet/react-leaflet into a native
// bundle that has no window/DOM to render into.
function FieldsListFallback({ navigation, fields, loading, filterProps }: any) {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.listContent}>
      <FilterBar {...filterProps} />
      {loading ? (
        <ActivityIndicator color={LIME} style={{ marginTop: 40 }} />
      ) : (
        fields.map((f: Organization) => (
          <Pressable
            key={f.id}
            style={s.listRow}
            onPress={() => navigation.getParent()?.navigate("CommunityEntity", { kind: "field", slug: f.slug })}
          >
            <Text style={s.listRowTitle}>{f.name}</Text>
            <Text style={s.listRowSub}>{[f.city, f.region, f.country].filter(Boolean).join(", ")}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// Default US-ish center so the map has somewhere sane to open before the
// first bounds-driven fetch — panning/zooming immediately refines it.
const DEFAULT_CENTER: [number, number] = [39.5, -98.35];
const DEFAULT_ZOOM = 4;

let WebMap: React.ComponentType<any> | null = null;
if (Platform.OS === "web") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("leaflet/dist/leaflet.css");
  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = require("react-leaflet");
  const L = require("leaflet");

  const fieldIcon = L.divIcon({
    className: "pbg-field-marker",
    html: `<div style="width:14px;height:14px;border-radius:7px;background:${LIME};border:2px solid #0A0E0F;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  function BoundsWatcher({ onBoundsChange }: { onBoundsChange: (b: any) => void }) {
    const map = useMapEvents({
      moveend: () => onBoundsChange(map.getBounds()),
    });
    useEffect(() => {
      onBoundsChange(map.getBounds());
    }, []);
    return null;
  }

  WebMap = function WebMapImpl({ navigation, onBoundsChange, fields }: any) {
    return (
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsWatcher onBoundsChange={onBoundsChange} />
        {fields.map((f: Organization) =>
          f.latitude != null && f.longitude != null ? (
            <Marker key={f.id} position={[f.latitude, f.longitude]} icon={fieldIcon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{f.name}</strong>
                  <div style={{ fontSize: 12, color: "#556", margin: "4px 0" }}>
                    {[f.city, f.region].filter(Boolean).join(", ")}
                  </div>
                  <a
                    href="#"
                    onClick={(e: any) => {
                      e.preventDefault();
                      navigation.getParent()?.navigate("CommunityEntity", { kind: "field", slug: f.slug });
                    }}
                  >
                    View storefront →
                  </a>
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    );
  };
}

export default function FieldsMapScreen({ navigation }: any) {
  const [fields, setFields] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toggleAmenity = (value: string) =>
    setAmenities((prev) => (prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]));

  const onBoundsChange = (bounds: any) => {
    setLoading(true);
    communityService
      .organizationsInBounds(
        { west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth() },
        "field",
      )
      .then(setFields)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (Platform.OS === "web") return; // web fetches on map bounds instead
    communityService
      .organizations("field")
      .then(setFields)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => fields.filter((f) => matchesFilters(f, search, verifiedOnly, amenities)),
    [fields, search, verifiedOnly, amenities],
  );

  const filterProps = {
    search,
    setSearch,
    verifiedOnly,
    setVerifiedOnly,
    amenities,
    toggleAmenity,
    filtersOpen,
    setFiltersOpen,
    resultCount: filtered.length,
  };

  if (Platform.OS !== "web" || !WebMap) {
    return <FieldsListFallback navigation={navigation} fields={filtered} loading={loading} filterProps={filterProps} />;
  }

  return (
    <View style={s.page}>
      <WebMap navigation={navigation} onBoundsChange={onBoundsChange} fields={filtered} />
      <View style={s.overlayTop}>
        <FilterBar {...filterProps} />
      </View>
      {loading && (
        <View style={s.loadingPill}>
          <ActivityIndicator size="small" color={LIME} />
          <Text style={s.loadingPillText}>Loading fields...</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  listContent: { padding: 16 },
  listRow: { backgroundColor: "#121819", borderWidth: 1, borderColor: "#293431", borderRadius: 12, padding: 16, marginBottom: 10 },
  listRowTitle: { color: "#F3F1E8", fontSize: 15, fontWeight: "800" },
  listRowSub: { color: "#77827D", fontSize: 12, marginTop: 4 },
  loadingPill: {
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(6,9,10,.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingPillText: { color: "#D6DDDA", fontSize: 12, fontWeight: "700" },
  overlayTop: { position: "absolute", top: 16, left: 16, right: 16, zIndex: 1000 },
  filterBar: {
    backgroundColor: "rgba(10,14,15,.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    borderRadius: 16,
    padding: 12,
    maxWidth: 520,
  },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchInput: {
    flex: 1,
    backgroundColor: "#171c20",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#364047",
  },
  filterToggle: {
    borderWidth: 1,
    borderColor: "rgba(168,200,74,.4)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterToggleOn: { backgroundColor: LIME, borderColor: LIME },
  filterToggleText: { color: LIME, fontSize: 10, fontWeight: "900" },
  filterToggleTextOn: { color: "#10150d" },
  filterPanel: { marginTop: 10 },
  amenityScroll: { maxHeight: 160, marginTop: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: "#364047",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 0,
  },
  chipOn: { backgroundColor: LIME, borderColor: LIME },
  chipText: { color: "#D6DDDA", fontSize: 11, fontWeight: "700" },
  chipTextOn: { color: "#10150d" },
  resultCount: { color: "#77827D", fontSize: 11, marginTop: 10, fontWeight: "700" },
});
