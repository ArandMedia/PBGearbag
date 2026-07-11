import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ItemCondition,
  Listing,
  ListingCategory,
  ListingFilters,
  marketplaceService,
} from "../services/marketplace.service";

const LIME = "#A8C84A";
const categories = [
  [undefined, "All gear"],
  [ListingCategory.MARKER, "Markers"],
  [ListingCategory.MASK, "Masks"],
  [ListingCategory.TANK, "Tanks"],
  [ListingCategory.LOADER, "Loaders"],
  [ListingCategory.APPAREL, "Apparel"],
  [ListingCategory.ACCESSORY, "Accessories"],
  [ListingCategory.PARTS, "Parts"],
  [ListingCategory.COMPLETE_SETUP, "Setups"],
] as const;
const conditions = [
  [undefined, "Any"],
  [ItemCondition.NEW, "New"],
  [ItemCondition.LIKE_NEW, "Like new"],
  [ItemCondition.EXCELLENT, "Excellent"],
  [ItemCondition.GOOD, "Good"],
  [ItemCondition.FAIR, "Fair"],
  [ItemCondition.PARTS, "For parts"],
] as const;
const sorts = [
  ["newest", "Newest"],
  ["price_asc", "Price: low"],
  ["price_desc", "Price: high"],
  ["popular", "Most viewed"],
  ["oldest", "Oldest"],
] as const;

function Chip({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>
        {label}
        {count !== undefined ? `  ${count}` : ""}
      </Text>
    </Pressable>
  );
}

export default function MarketplaceFeedScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const columns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const compact = width < 720;
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [category, setCategory] = useState<ListingCategory>();
  const [condition, setCondition] = useState<ItemCondition>();
  const [brand, setBrand] = useState<string>();
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<ListingFilters["sort"]>("newest");
  const [negotiable, setNegotiable] = useState(false);
  const [trades, setTrades] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [pickup, setPickup] = useState(false);
  const [showFilters, setShowFilters] = useState(!compact);
  const [facets, setFacets] = useState<{
    brands: { value: string; count: number }[];
    locations: { value: string; count: number }[];
    price: { min: number; max: number };
  }>({ brands: [], locations: [], price: { min: 0, max: 0 } });
  const filters = useMemo<ListingFilters>(
    () => ({
      category,
      condition,
      brand,
      location: location || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search: appliedSearch || undefined,
      sort,
      isNegotiable: negotiable || undefined,
      acceptsTrades: trades || undefined,
      shippingAvailable: shipping || undefined,
      localPickup: pickup || undefined,
    }),
    [
      category,
      condition,
      brand,
      location,
      minPrice,
      maxPrice,
      appliedSearch,
      sort,
      negotiable,
      trades,
      shipping,
      pickup,
    ],
  );
  const activeCount = [
    condition,
    brand,
    location,
    minPrice,
    maxPrice,
    negotiable,
    trades,
    shipping,
    pickup,
  ].filter(Boolean).length;

  useEffect(() => {
    marketplaceService
      .getFilterOptions()
      .then(setFacets)
      .catch(() => {});
  }, []);
  useEffect(() => {
    load(1, true);
  }, [filters]);
  async function load(target = page, replace = false) {
    try {
      if (replace) setLoading(true);
      const response = await marketplaceService.getListings(
        target,
        24,
        filters,
      );
      setListings((prev) =>
        replace ? response.items : [...prev, ...response.items],
      );
      setTotal(response.total);
      setHasMore(target < response.totalPages);
      setPage(target + 1);
    } catch (e) {
      console.error("Failed to load marketplace", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  function reset() {
    setSearch("");
    setAppliedSearch("");
    setCategory(undefined);
    setCondition(undefined);
    setBrand(undefined);
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setNegotiable(false);
    setTrades(false);
    setShipping(false);
    setPickup(false);
  }

  const card = ({ item }: { item: Listing }) => {
    const place = [item.city, item.stateProvince].filter(Boolean).join(", ");
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() =>
          navigation.navigate("ListingDetail", { listingId: item.id })
        }
      >
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={s.image} />
        ) : (
          <View style={s.placeholder}>
            <Text style={s.muted}>NO IMAGE</Text>
          </View>
        )}
        <View style={s.cardBody}>
          <View style={s.cardTop}>
            <Text style={s.cardCategory}>
              {item.category.replace("_", " ")}
            </Text>
            {item.acceptsTrades && <Text style={s.tradeBadge}>TRADES</Text>}
          </View>
          <Text style={s.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={s.meta}>
            {item.brand && <Text style={s.brand}>{item.brand}</Text>}
            <Text style={s.condition}>{item.condition.replace("_", " ")}</Text>
          </View>
          <Text style={s.price}>
            ${Number(item.price).toLocaleString()}{" "}
            {item.isNegotiable && <Text style={s.obo}>OBO</Text>}
          </Text>
          {place && <Text style={s.location}>⌖ {place}</Text>}
          <View style={s.delivery}>
            {item.shippingAvailable && (
              <Text style={s.deliveryText}>SHIPS</Text>
            )}
            {item.localPickup && (
              <Text style={s.deliveryText}>LOCAL PICKUP</Text>
            )}
          </View>
          <View style={s.footer}>
            <Text style={s.seller}>
              {item.seller?.displayName || item.seller?.username || "Seller"}
            </Text>
            <Text style={s.muted}>{item.views || 0} views</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.page}>
      <View style={s.top}>
        <View style={s.marketHeader}>
          <View>
            <Text style={s.kicker}>PBG EXCHANGE</Text>
            <Text style={[s.marketTitle, compact && { fontSize: 27 }]}>
              Find exactly what you play.
            </Text>
            <Text style={s.marketSub}>
              Search the community’s field-tested equipment by the details that
              matter.
            </Text>
          </View>
          {!compact && (
            <View style={s.live}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>MARKET LIVE</Text>
            </View>
          )}
        </View>
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Text style={s.searchIcon}>⌕</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search markers, models, gear…"
              placeholderTextColor="#667179"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => setAppliedSearch(search.trim())}
              returnKeyType="search"
            />
            <Pressable
              onPress={() => setAppliedSearch(search.trim())}
              style={s.searchButton}
            >
              <Text style={s.searchButtonText}>SEARCH</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            style={[s.filterButton, showFilters && s.filterButtonActive]}
          >
            <Text
              style={[s.filterButtonText, showFilters && { color: "#0B0F0D" }]}
            >
              FILTERS{activeCount ? `  ${activeCount}` : ""}
            </Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.row}
        >
          {categories.map(([value, label]) => (
            <Chip
              key={label}
              label={label}
              active={category === value}
              onPress={() => setCategory(value)}
            />
          ))}
        </ScrollView>
        {showFilters && (
          <View style={s.filterPanel}>
            <View style={s.filterHeading}>
              <View>
                <Text style={s.filterEyebrow}>REFINE THE EXCHANGE</Text>
                <Text style={s.filterTitle}>{total} matching listings</Text>
              </View>
              {activeCount > 0 && (
                <Pressable onPress={reset}>
                  <Text style={s.clear}>CLEAR ALL</Text>
                </Pressable>
              )}
            </View>
            <View style={s.filterGrid}>
              <View style={s.filterGroup}>
                <Text style={s.label}>CONDITION</Text>
                <View style={s.wrap}>
                  {conditions.map(([value, label]) => (
                    <Chip
                      key={label}
                      label={label}
                      active={condition === value}
                      onPress={() => setCondition(value)}
                    />
                  ))}
                </View>
              </View>
              <View style={s.filterGroup}>
                <Text style={s.label}>PRICE RANGE</Text>
                <View style={s.priceRow}>
                  <TextInput
                    style={s.smallInput}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    placeholder={`$${facets.price.min || "Min"}`}
                    placeholderTextColor="#657078"
                  />
                  <Text style={s.dash}>—</Text>
                  <TextInput
                    style={s.smallInput}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    placeholder={`$${facets.price.max || "Max"}`}
                    placeholderTextColor="#657078"
                  />
                </View>
                <Text style={s.label}>LOCATION</Text>
                <TextInput
                  style={s.locationInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, state, or country"
                  placeholderTextColor="#657078"
                />
              </View>
              <View style={s.filterGroup}>
                <Text style={s.label}>BUYING OPTIONS</Text>
                <View style={s.wrap}>
                  <Chip
                    label="Negotiable"
                    active={negotiable}
                    onPress={() => setNegotiable((v) => !v)}
                  />
                  <Chip
                    label="Accepts trades"
                    active={trades}
                    onPress={() => setTrades((v) => !v)}
                  />
                  <Chip
                    label="Shipping"
                    active={shipping}
                    onPress={() => setShipping((v) => !v)}
                  />
                  <Chip
                    label="Local pickup"
                    active={pickup}
                    onPress={() => setPickup((v) => !v)}
                  />
                </View>
              </View>
            </View>
            {facets.brands.length > 0 && (
              <View style={s.brandGroup}>
                <Text style={s.label}>POPULAR BRANDS</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.row}
                >
                  {facets.brands.map((x) => (
                    <Chip
                      key={x.value}
                      label={x.value}
                      count={x.count}
                      active={brand === x.value}
                      onPress={() =>
                        setBrand(brand === x.value ? undefined : x.value)
                      }
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        <View style={s.resultsBar}>
          <Text style={s.resultsText}>
            {loading ? "SEARCHING…" : `${total} RESULTS`}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.sortRow}
          >
            {sorts.map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                active={sort === value}
                onPress={() => setSort(value)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
      {loading && listings.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator color={LIME} size="large" />
        </View>
      ) : (
        <FlatList
          key={`market-${columns}`}
          numColumns={columns}
          columnWrapperStyle={columns > 1 ? s.columns : undefined}
          data={listings}
          renderItem={card}
          keyExtractor={(x) => x.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(1, true);
              }}
              tintColor={LIME}
            />
          }
          onEndReached={() => hasMore && !loading && load()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No gear matches that search.</Text>
              <Text style={s.emptyBody}>
                Try widening the price range or clearing a filter.
              </Text>
              <Pressable onPress={reset} style={s.resetButton}>
                <Text style={s.resetText}>RESET FILTERS</Text>
              </Pressable>
            </View>
          }
        />
      )}
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate("CreateListing")}
      >
        <Text style={s.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  top: { width: "100%", maxWidth: 1180, alignSelf: "center" },
  marketHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  kicker: { color: LIME, fontSize: 10, fontWeight: "900", letterSpacing: 1.7 },
  marketTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 5,
  },
  marketSub: { color: "#849098", fontSize: 14, marginTop: 6 },
  live: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#30412e",
    backgroundColor: "#111a12",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: LIME },
  liveText: {
    color: "#c7efa6",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  searchRow: { paddingHorizontal: 16, flexDirection: "row", gap: 10 },
  searchBox: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12171A",
    borderWidth: 1,
    borderColor: "#2C353A",
    borderRadius: 13,
    paddingLeft: 15,
  },
  searchIcon: { color: "#88939A", fontSize: 24 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, paddingHorizontal: 10 },
  searchButton: {
    height: 40,
    marginRight: 5,
    paddingHorizontal: 18,
    borderRadius: 9,
    backgroundColor: LIME,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#0B0F0D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  filterButton: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#374047",
    justifyContent: "center",
  },
  filterButtonActive: { backgroundColor: LIME, borderColor: LIME },
  filterButtonText: {
    color: "#DCE2E5",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#12171A",
    borderWidth: 1,
    borderColor: "#30383E",
  },
  chipActive: { backgroundColor: LIME, borderColor: LIME },
  chipText: { color: "#A8B1B7", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#0C110B", fontWeight: "900" },
  filterPanel: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 17,
    backgroundColor: "#101518",
    borderWidth: 1,
    borderColor: "#283238",
  },
  filterHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  filterEyebrow: {
    color: LIME,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  filterTitle: { color: "#fff", fontSize: 18, fontWeight: "900", marginTop: 4 },
  clear: {
    color: "#E8743B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  filterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 22 },
  filterGroup: { flex: 1, minWidth: 230 },
  label: {
    color: "#69757C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 9,
    marginTop: 4,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 13,
  },
  smallInput: {
    flex: 1,
    minWidth: 80,
    height: 39,
    borderRadius: 9,
    backgroundColor: "#090D0F",
    borderWidth: 1,
    borderColor: "#293238",
    paddingHorizontal: 11,
    color: "#fff",
  },
  dash: { color: "#68737A" },
  locationInput: {
    height: 39,
    borderRadius: 9,
    backgroundColor: "#090D0F",
    borderWidth: 1,
    borderColor: "#293238",
    paddingHorizontal: 11,
    color: "#fff",
  },
  brandGroup: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#232B30",
    paddingTop: 11,
  },
  resultsBar: {
    paddingHorizontal: 16,
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsText: {
    color: "#7F8A91",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  sortRow: { gap: 7, paddingVertical: 8, paddingLeft: 12 },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 90,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  columns: { gap: 14 },
  card: {
    flex: 1,
    backgroundColor: "#121819",
    borderRadius: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#252E33",
    overflow: "hidden",
  },
  image: { width: "100%", height: 215, backgroundColor: "#20272B" },
  placeholder: {
    height: 215,
    backgroundColor: "#182025",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 14 },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategory: {
    color: "#68747B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tradeBadge: {
    color: "#E8743B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
    marginBottom: 7,
  },
  meta: { flexDirection: "row", gap: 8, alignItems: "center" },
  brand: { fontSize: 12, color: LIME, fontWeight: "800" },
  condition: { fontSize: 11, color: "#89949A", textTransform: "capitalize" },
  price: { fontSize: 21, fontWeight: "900", color: "#fff", marginTop: 11 },
  obo: { fontSize: 11, color: "#8C979D" },
  location: { fontSize: 11, color: "#7D888F", marginTop: 6 },
  delivery: { flexDirection: "row", gap: 6, marginTop: 10 },
  deliveryText: {
    fontSize: 8,
    color: "#AAB4B9",
    fontWeight: "900",
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: "#354047",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#283137",
  },
  seller: { fontSize: 11, color: "#C7CED2", fontWeight: "700" },
  muted: { fontSize: 10, color: "#647078" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 70 },
  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "900" },
  emptyBody: { color: "#79858C", marginTop: 7 },
  resetButton: {
    backgroundColor: LIME,
    borderRadius: 9,
    paddingHorizontal: 17,
    paddingVertical: 11,
    marginTop: 20,
  },
  resetText: { color: "#0B0F0D", fontSize: 10, fontWeight: "900" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: LIME,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: { fontSize: 28, color: "#0B0F0D", fontWeight: "500" },
});
