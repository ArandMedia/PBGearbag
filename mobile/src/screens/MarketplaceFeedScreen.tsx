import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  marketplaceService,
  Listing,
  ListingCategory,
} from '../services/marketplace.service';

export default function MarketplaceFeedScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | undefined>();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadListings();
  }, [selectedCategory]);

  const loadListings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setPage(1);
      }

      const currentPage = isRefresh ? 1 : page;
      const response = await marketplaceService.getListings(currentPage, 20, {
        category: selectedCategory,
        search: searchQuery || undefined,
      });

      if (isRefresh) {
        setListings(response.items);
      } else {
        setListings([...listings, ...response.items]);
      }

      setHasMore(currentPage < response.totalPages);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadListings(true);
  };

  const handleSearch = () => {
    setPage(1);
    setListings([]);
    setLoading(true);
    loadListings(true);
  };

  const renderListingCard = ({ item }: { item: Listing }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null;
    const location = [item.city, item.stateProvince]
      .filter(Boolean)
      .join(', ');

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.meta}>
            {item.brand && (
              <Text style={styles.brand}>{item.brand}</Text>
            )}
            <Text style={styles.condition}>{item.condition.replace('_', ' ')}</Text>
          </View>

          <Text style={styles.price}>
            ${item.price.toLocaleString()}
            {item.isNegotiable && (
              <Text style={styles.obo}> OBO</Text>
            )}
          </Text>

          {location && (
            <Text style={styles.location}>{location}</Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.seller}>
              {item.seller?.displayName || item.seller?.username || 'Seller'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const categories = [
    { value: undefined, label: 'All' },
    { value: ListingCategory.MARKER, label: 'Markers' },
    { value: ListingCategory.MASK, label: 'Masks' },
    { value: ListingCategory.TANK, label: 'Tanks' },
    { value: ListingCategory.LOADER, label: 'Loaders' },
    { value: ListingCategory.APPAREL, label: 'Apparel' },
    { value: ListingCategory.ACCESSORY, label: 'Accessories' },
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search listings..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.value && styles.categoryChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(item.value);
                setPage(1);
                setListings([]);
                setLoading(true);
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.value && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          onEndReached={() => {
            if (hasMore && !loading) {
              loadListings();
            }
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No listings found</Text>
              <Text style={styles.emptySubtext}>
                Be the first to post something!
              </Text>
            </View>
          }
        />
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateListing')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    color: '#ccc',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    fontSize: 14,
    color: '#007AFF',
    marginRight: 8,
  },
  condition: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  obo: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'normal',
  },
  location: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  seller: {
    fontSize: 12,
    color: '#ccc',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
