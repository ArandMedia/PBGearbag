export enum ListingCategory {
  MARKER = 'marker',
  MASK = 'mask',
  TANK = 'tank',
  LOADER = 'loader',
  APPAREL = 'apparel',
  ACCESSORY = 'accessory',
  COMPLETE_SETUP = 'complete_setup',
}

export enum ItemCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  PARTS = 'parts',
}

export enum ListingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PENDING = 'pending',
  SOLD = 'sold',
  REMOVED = 'removed',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: ListingCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: ItemCondition;
  price: number;
  originalPrice?: number;
  isNegotiable: boolean;
  acceptsTrades: boolean;
  images: string[];
  videos?: string[];
  city?: string;
  stateProvince?: string;
  country?: string;
  shippingAvailable: boolean;
  localPickup: boolean;
  status: ListingStatus;
  views: number;
  favorites: number;
  createdAt: Date;
  updatedAt: Date;
  soldAt?: Date;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  shippingCost: number;
  totalAmount: number;
  paymentIntentId?: string;
  paymentStatus: string;
  shippingAddress?: object;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Review {
  id: string;
  transactionId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  reviewType: 'buyer' | 'seller';
  createdAt: Date;
}

export interface CreateListingDto {
  title: string;
  description: string;
  category: ListingCategory;
  subcategory?: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: ItemCondition;
  price: number;
  originalPrice?: number;
  isNegotiable?: boolean;
  acceptsTrades?: boolean;
  images: string[];
  shippingAvailable?: boolean;
  localPickup?: boolean;
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  price?: number;
  isNegotiable?: boolean;
  acceptsTrades?: boolean;
  status?: ListingStatus;
}

export interface ListingFilters {
  category?: ListingCategory;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  brand?: string;
  searchQuery?: string;
}
