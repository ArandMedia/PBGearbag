import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Alert } from '../utils/alert';
import { marketplaceService, Listing } from '../services/marketplace.service';
import { useAuth } from '../store/AuthContext';
import { communityService } from '../services/community.service';

const { width } = Dimensions.get('window');

export default function ListingDetailScreen({ route, navigation }: any) {
  const { listingId } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [offers, setOffers] = useState<{ id: string; buyerId: string; buyerName: string; amountCents?: number; tradeDescription?: string; message?: string; status: string; createdAt: string }[]>([]);
  const [decidingOfferId, setDecidingOfferId] = useState<string | null>(null);

  useEffect(() => {
    loadListing();
  }, [listingId]);

  useEffect(() => {
    if (listing && user?.id === listing.sellerId) {
      communityService.listingOffers(listingId).then(setOffers).catch(() => {});
    }
  }, [listing?.sellerId, user?.id, listingId]);

  const decideOffer = async (id: string, status: 'accepted' | 'declined') => {
    setDecidingOfferId(id);
    try {
      await communityService.decideOffer(id, status);
      const refreshed = await communityService.listingOffers(listingId);
      setOffers(refreshed);
      if (status === 'accepted') Alert.alert('Offer accepted', 'The buyer has been notified. Other pending offers on this listing were automatically declined.');
    } catch (e: any) {
      Alert.alert("Couldn't update this offer", e?.response?.data?.error?.message || e?.response?.data?.message || 'Please try again in a moment.');
    } finally {
      setDecidingOfferId(null);
    }
  };

  const loadListing = async () => {
    try {
      const data = await marketplaceService.getListing(listingId);
      setListing(data);
    } catch (error) {
      console.error('Failed to load listing:', error);
      Alert.alert('Error', 'Failed to load listing');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await marketplaceService.deleteListing(listingId);
              Alert.alert('Success', 'Listing deleted');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ],
    );
  };

  const handleMarkSold = async () => {
    try {
      await marketplaceService.markAsSold(listingId);
      Alert.alert('Success', 'Listing marked as sold');
      loadListing();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as sold');
    }
  };

  const handleContact = async () => {
    if (!listing?.seller?.id) return;
    await communityService.createConversation({type:'marketplace',participantIds:[listing.seller.id],subject:`Listing: ${listing.title}`,contextId:listing.id});
    navigation.navigate('MainTabs',{screen:'Messages'});
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D39A3A" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Listing not found</Text>
      </View>
    );
  }

  const isOwner = user?.id === listing.sellerId;
  const isSold = listing.status === 'sold';
  const location = [listing.city, listing.stateProvince, listing.country]
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      {listing.images && listing.images.length > 0 ? (
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              setCurrentImageIndex(index);
            }}
          >
            {listing.images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.image}
              />
            ))}
          </ScrollView>

          {listing.images.length > 1 && (
            <View style={styles.pagination}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Images</Text>
        </View>
      )}

      {/* Status Badge */}
      {isSold && (
        <View style={styles.soldBadge}>
          <Text style={styles.soldText}>SOLD</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            ${listing.price.toLocaleString()}
            {listing.isNegotiable && (
              <Text style={styles.obo}> OBO</Text>
            )}
          </Text>
          {listing.originalPrice && listing.originalPrice > listing.price && (
            <Text style={styles.originalPrice}>
              ${listing.originalPrice.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{listing.title}</Text>

        {/* Meta */}
        <View style={styles.meta}>
          {listing.brand && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Brand:</Text>
              <Text style={styles.metaValue}>{listing.brand}</Text>
            </View>
          )}
          {listing.model && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Model:</Text>
              <Text style={styles.metaValue}>{listing.model}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Condition:</Text>
            <Text style={[styles.metaValue, styles.conditionBadge]}>
              {listing.condition.replace('_', ' ')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category:</Text>
            <Text style={styles.metaValue}>
              {listing.category.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>
        </View>

        {/* Shipping & Pickup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availability}>
            {listing.shippingAvailable && (
              <View style={styles.availabilityItem}>
                <Text style={styles.availabilityText}>✓ Shipping Available</Text>
              </View>
            )}
            {listing.localPickup && (
              <View style={styles.availabilityItem}>
                <Text style={styles.availabilityText}>✓ Local Pickup</Text>
              </View>
            )}
            {listing.acceptsTrades && (
              <View style={styles.availabilityItem}>
                <Text style={styles.availabilityText}>✓ Trades Accepted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        {location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}

        {/* Seller Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerCard}>
            {listing.seller?.avatarUrl ? (
              <Image
                source={{ uri: listing.seller.avatarUrl }}
                style={styles.sellerAvatar}
              />
            ) : (
              <View style={styles.sellerAvatarPlaceholder}>
                <Text style={styles.sellerAvatarText}>
                  {listing.seller?.username?.charAt(0).toUpperCase() || 'S'}
                </Text>
              </View>
            )}
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>
                {listing.seller?.displayName || listing.seller?.username || 'Seller'}
              </Text>
              <Text style={styles.sellerUsername}>
                @{listing.seller?.username || 'unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Offers (seller only) */}
        {isOwner && offers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Offers ({offers.filter((o) => o.status === 'pending').length} pending)</Text>
            {offers.map((o) => (
              <View key={o.id} style={styles.offerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.offerBuyer}>{o.buyerName}</Text>
                  <Text style={styles.offerDetail}>
                    {o.amountCents != null ? `$${(o.amountCents / 100).toLocaleString()}` : ''}
                    {o.tradeDescription ? `${o.amountCents != null ? ' + ' : ''}Trade: ${o.tradeDescription}` : ''}
                  </Text>
                  {!!o.message && <Text style={styles.offerMessage} numberOfLines={2}>{o.message}</Text>}
                  {o.status !== 'pending' && <Text style={styles.offerStatus}>{o.status.toUpperCase()}</Text>}
                </View>
                {o.status === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.offerAcceptBtn} onPress={() => decideOffer(o.id, 'accepted')} disabled={decidingOfferId === o.id}>
                      {decidingOfferId === o.id ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.offerBtnText}>Accept</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.offerDeclineBtn} onPress={() => decideOffer(o.id, 'declined')} disabled={decidingOfferId === o.id}>
                      <Text style={[styles.offerBtnText, { color: '#ff3b30' }]}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Meta Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Posted {new Date(listing.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.footerText}>{listing.views} views</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isOwner ? (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  navigation.navigate('EditListing', { listingId: listing.id })
                }
              >
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </TouchableOpacity>

              {!isSold && (
                <TouchableOpacity
                  style={styles.successButton}
                  onPress={handleMarkSold}
                >
                  <Text style={styles.successButtonText}>Mark as Sold</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleDelete}
              >
                <Text style={styles.dangerButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : (<>
            <TouchableOpacity
              style={[styles.primaryButton, isSold && styles.buttonDisabled]}
              onPress={handleContact}
              disabled={isSold}
            >
              <Text style={styles.primaryButtonText}>
                {isSold ? 'Sold' : 'Contact Seller'}
              </Text>
            </TouchableOpacity>
            {!isSold&&<TouchableOpacity style={styles.successButton} onPress={()=>navigation.navigate('MakeOffer',{listing})}><Text style={styles.successButtonText}>Make an offer</Text></TouchableOpacity>}
            <TouchableOpacity style={styles.secondaryButton} onPress={async()=>{await communityService.favoriteListing(listing.id);Alert.alert('Saved','This listing was added to your favorites.')}}><Text style={styles.secondaryButtonText}>♡ Save listing</Text></TouchableOpacity>
            <TouchableOpacity style={styles.dangerButton} onPress={()=>navigation.navigate('Report',{subjectId:listing.id,subjectType:'listing',title:listing.title})}><Text style={styles.dangerButtonText}>Report</Text></TouchableOpacity>
          </>)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101516',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#101516',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width,
    height: 300,
    backgroundColor: '#283033',
  },
  imagePlaceholder: {
    width,
    height: 300,
    backgroundColor: '#283033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  soldBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  soldText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7E9F45',
  },
  obo: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'normal',
  },
  originalPrice: {
    fontSize: 18,
    color: '#666',
    textDecorationLine: 'line-through',
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  meta: {
    backgroundColor: '#283033',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#888',
  },
  metaValue: {
    fontSize: 14,
    color: '#fff',
    textTransform: 'capitalize',
  },
  conditionBadge: {
    color: '#D39A3A',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  availability: {
    gap: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 14,
    color: '#7E9F45',
  },
  locationText: {
    fontSize: 16,
    color: '#ccc',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#283033',
    padding: 16,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D39A3A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sellerUsername: {
    fontSize: 14,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#D39A3A',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D39A3A',
  },
  secondaryButtonText: {
    color: '#D39A3A',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#7E9F45',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  dangerButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#283033',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  offerBuyer: { color: '#fff', fontSize: 15, fontWeight: '700' },
  offerDetail: { color: '#7E9F45', fontSize: 14, fontWeight: '700', marginTop: 4 },
  offerMessage: { color: '#ccc', fontSize: 13, marginTop: 4 },
  offerStatus: { color: '#888', fontSize: 11, fontWeight: '900', marginTop: 6 },
  offerAcceptBtn: { backgroundColor: '#7E9F45', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  offerDeclineBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: '#ff3b30' },
  offerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
