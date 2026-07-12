import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Listing } from "../../services/marketplace.service";

const LIME = "#A8C84A";
const PANEL = "#121819";

interface Props {
  listings: Listing[];
  onPressListing: (listing: Listing) => void;
  onSeeAll: () => void;
}

export default function MarketplacePicksBlock({ listings, onPressListing, onSeeAll }: Props) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>MARKETPLACE</Text>
          <Text style={s.heading}>Picked for you</Text>
        </View>
        <Pressable onPress={onSeeAll}>
          <Text style={s.seeAll}>Browse all →</Text>
        </Pressable>
      </View>
      {!listings.length ? (
        <Text style={s.empty}>Nothing to show yet — check back once more gear near you gets listed.</Text>
      ) : (
        <View style={s.grid}>
          {listings.slice(0, 6).map((item) => (
            <Pressable key={item.id} style={s.item} onPress={() => onPressListing(item)}>
              {item.images?.[0] ? (
                <Image source={{ uri: item.images[0] }} style={s.image} />
              ) : (
                <View style={s.image} />
              )}
              <Text style={s.title} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={s.price}>${Number(item.price).toLocaleString()}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: PANEL, borderWidth: 1, borderColor: "#252c32", borderRadius: 20, padding: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  eyebrow: { color: "#6f7a84", fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  heading: { color: "#fff", fontSize: 19, fontWeight: "900", marginTop: 5 },
  seeAll: { color: LIME, fontSize: 12, fontWeight: "800" },
  empty: { color: "#8e99a2", fontSize: 13, lineHeight: 19 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  item: { width: 130 },
  image: { width: 130, height: 100, borderRadius: 10, backgroundColor: "#222B2C", marginBottom: 6 },
  title: { color: "#D6DDDA", fontSize: 12, fontWeight: "700" },
  price: { color: LIME, fontSize: 12, fontWeight: "900", marginTop: 2 },
});
