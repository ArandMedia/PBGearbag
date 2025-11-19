import { apiClient } from './api';

export enum ListingCategory {
  MARKER = 'marker',
  MASK = 'mask',
  TANK = 'tank',
  LOADER = 'loader',
  APPAREL = 'apparel',
  ACCESSORY = 'accessory',
  COMPLETE_SETUP = 'complete_setup',
  PAINT = 'paint',
  PARTS = 'parts',
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

export interface Listing {
  id: string;
  sellerId: string;
  seller?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
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
  createdAt: string;
  updatedAt: string;
  soldAt?: string;
}

export interface CreateListingData {
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
  city?: string;
  stateProvince?: string;
  country?: string;
  shippingAvailable?: boolean;
  localPickup?: boolean;
}

export interface UpdateListingData {
  title?: string;
  description?: string;
  condition?: ItemCondition;
  price?: number;
  isNegotiable?: boolean;
  acceptsTrades?: boolean;
  images?: string[];
  status?: ListingStatus;
  shippingAvailable?: boolean;
  localPickup?: boolean;
}

export interface ListingFilters {
  category?: ListingCategory;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  brand?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class MarketplaceService {
  async getListings(
    page: number = 1,
    limit: number = 20,
    filters?: ListingFilters,
  ): Promise<PaginatedResponse<Listing>> {
    const params: any = { page, limit };

    if (filters) {
      if (filters.category) params.category = filters.category;
      if (filters.condition) params.condition = filters.condition;
      if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
      if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
      if (filters.location) params.location = filters.location;
      if (filters.brand) params.brand = filters.brand;
      if (filters.search) params.search = filters.search;
    }

    const response = await apiClient.get<PaginatedResponse<Listing>>(
      '/marketplace',
      { params },
    );
    return response.data;
  }

  async getFeaturedListings(): Promise<Listing[]> {
    const response = await apiClient.get<Listing[]>('/marketplace/featured');
    return response.data;
  }

  async getCategories(): Promise<Record<string, number>> {
    const response = await apiClient.get<Record<string, number>>(
      '/marketplace/categories',
    );
    return response.data;
  }

  async getMyListings(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponse<Listing>> {
    const response = await apiClient.get<PaginatedResponse<Listing>>(
      '/marketplace/my-listings',
      { params: { page, limit } },
    );
    return response.data;
  }

  async getListing(id: string): Promise<Listing> {
    const response = await apiClient.get<Listing>(`/marketplace/${id}`);
    return response.data;
  }

  async createListing(data: CreateListingData): Promise<Listing> {
    const response = await apiClient.post<Listing>('/marketplace', data);
    return response.data;
  }

  async updateListing(
    id: string,
    data: UpdateListingData,
  ): Promise<Listing> {
    const response = await apiClient.put<Listing>(`/marketplace/${id}`, data);
    return response.data;
  }

  async deleteListing(id: string): Promise<void> {
    await apiClient.delete(`/marketplace/${id}`);
  }

  async markAsSold(id: string): Promise<Listing> {
    const response = await apiClient.put<Listing>(
      `/marketplace/${id}/mark-sold`,
    );
    return response.data;
  }

  async uploadImages(imageUris: string[]): Promise<string[]> {
    const formData = new FormData();

    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const filename = uri.split('/').pop() || `image${i}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('files', {
        uri,
        name: filename,
        type,
      } as any);
    }

    const response = await apiClient.post<{ imageUrls: string[] }>(
      '/marketplace/upload-images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data.imageUrls;
  }
}

export const marketplaceService = new MarketplaceService();
