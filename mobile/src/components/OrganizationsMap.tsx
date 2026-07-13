import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Organization } from "../services/community.service";
import { DEFAULT_ACCENT } from "../store/ThemeContext";

// Leaflet is a DOM library — only safe/useful on web. Renders a static set
// of markers from whatever `organizations` the caller already filtered
// (Discover's own search/type/amenity/verified filters), rather than doing
// its own bounds-triggered fetch — the directory is small enough (low
// hundreds, not thousands) that loading it all up front is simpler and
// keeps list/map showing exactly the same result set.
let WebMap: React.ComponentType<{ organizations: Organization[]; onSelect: (o: Organization) => void }> | null = null;

if (Platform.OS === "web") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("leaflet/dist/leaflet.css");
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");
  const L = require("leaflet");

  // Built once at module load (Leaflet icons aren't React elements), so
  // these can't reach the theme context — pins stay fixed colors regardless
  // of the viewer's chosen accent, a minor deliberate exception. Fields get
  // the default-green dot; every other business type gets an orange square
  // so the two categories are distinguishable at a glance.
  const fieldIcon = L.divIcon({
    className: "pbg-field-marker",
    html: `<div style="width:14px;height:14px;border-radius:7px;background:${DEFAULT_ACCENT};border:2px solid #0A0E0F;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
  const businessIcon = L.divIcon({
    className: "pbg-business-marker",
    html: `<div style="width:12px;height:12px;border-radius:3px;background:#E8743B;border:2px solid #0A0E0F;"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  // Continental-US-ish default so the map opens somewhere sane; Leaflet
  // auto-fits to the marker set on first render via the bounds effect below.
  const DEFAULT_CENTER: [number, number] = [39.5, -98.35];
  const DEFAULT_ZOOM = 4;

  function FitToMarkers({ organizations }: { organizations: Organization[] }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    React.useEffect(() => {
      const points = organizations
        .filter((o) => o.latitude != null && o.longitude != null)
        .map((o) => [o.latitude as number, o.longitude as number] as [number, number]);
      if (points.length) map.fitBounds(points, { padding: [40, 40], maxZoom: 11 });
    }, [organizations]);
    return null;
  }

  WebMap = function WebMapImpl({ organizations, onSelect }) {
    return (
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToMarkers organizations={organizations} />
        {organizations.map((o) =>
          o.latitude != null && o.longitude != null ? (
            <Marker
              key={o.id}
              position={[o.latitude, o.longitude]}
              icon={o.type === "field" ? fieldIcon : businessIcon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{o.name}</strong>
                  <div style={{ fontSize: 12, color: "#556", margin: "4px 0" }}>
                    {[o.city, o.region].filter(Boolean).join(", ")}
                  </div>
                  <a
                    href="#"
                    onClick={(e: any) => {
                      e.preventDefault();
                      onSelect(o);
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

export default function OrganizationsMap({
  organizations,
  onSelect,
}: {
  organizations: Organization[];
  onSelect: (o: Organization) => void;
}) {
  if (!WebMap) return null;
  return (
    <View style={s.wrap}>
      <WebMap organizations={organizations} onSelect={onSelect} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: 640, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "#273137" },
});
