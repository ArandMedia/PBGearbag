import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { communityService, Organization } from "../services/community.service";

const LIME = "#A8C84A";

// Leaflet is a DOM library — only safe/useful on web. Native falls back to
// a plain list rather than pulling leaflet/react-leaflet into a native
// bundle that has no window/DOM to render into.
function FieldsListFallback({ navigation, fields, loading }: any) {
  return (
    <ScrollView style={s.page} contentContainerStyle={s.listContent}>
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

  if (Platform.OS !== "web" || !WebMap) {
    return <FieldsListFallback navigation={navigation} fields={fields} loading={loading} />;
  }

  return (
    <View style={s.page}>
      <WebMap navigation={navigation} onBoundsChange={onBoundsChange} fields={fields} />
      {loading && (
        <View style={s.loadingPill}>
          <ActivityIndicator size="small" color={LIME} />
          <Text style={s.loadingPillText}>Loading fields...</Text>
        </View>
      )}
      <Text style={s.count}>{fields.length} field{fields.length === 1 ? "" : "s"} in view</Text>
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
    top: 16,
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
  count: {
    position: "absolute",
    bottom: 16,
    left: 16,
    zIndex: 1000,
    color: "#D6DDDA",
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: "rgba(6,9,10,.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
