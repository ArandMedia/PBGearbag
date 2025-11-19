import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing, ListingCategory, ItemCondition, ListingStatus } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

export interface ListingFilters {
  category?: ListingCategory;
  condition?: ItemCondition;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  brand?: string;
  searchQuery?: string;
  sellerId?: string;
}

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
  ) {}

  async create(
    sellerId: string,
    createListingDto: CreateListingDto,
  ): Promise<Listing> {
    const listing = this.listingsRepository.create({
      ...createListingDto,
      sellerId,
    });

    return this.listingsRepository.save(listing);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: ListingFilters,
  ): Promise<[Listing[], number]> {
    const query = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.seller', 'seller')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE });

    // Apply filters
    if (filters) {
      if (filters.category) {
        query.andWhere('listing.category = :category', {
          category: filters.category,
        });
      }

      if (filters.condition) {
        query.andWhere('listing.condition = :condition', {
          condition: filters.condition,
        });
      }

      if (filters.minPrice !== undefined) {
        query.andWhere('listing.price >= :minPrice', {
          minPrice: filters.minPrice,
        });
      }

      if (filters.maxPrice !== undefined) {
        query.andWhere('listing.price <= :maxPrice', {
          maxPrice: filters.maxPrice,
        });
      }

      if (filters.brand) {
        query.andWhere('LOWER(listing.brand) = LOWER(:brand)', {
          brand: filters.brand,
        });
      }

      if (filters.location) {
        query.andWhere(
          '(LOWER(listing.city) LIKE LOWER(:location) OR LOWER(listing.stateProvince) LIKE LOWER(:location) OR LOWER(listing.country) LIKE LOWER(:location))',
          { location: `%${filters.location}%` },
        );
      }

      if (filters.sellerId) {
        query.andWhere('listing.sellerId = :sellerId', {
          sellerId: filters.sellerId,
        });
      }

      if (filters.searchQuery) {
        query.andWhere(
          '(LOWER(listing.title) LIKE LOWER(:search) OR LOWER(listing.description) LIKE LOWER(:search) OR LOWER(listing.brand) LIKE LOWER(:search) OR LOWER(listing.model) LIKE LOWER(:search))',
          { search: `%${filters.searchQuery}%` },
        );
      }
    }

    query
      .orderBy('listing.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Increment view count
    await this.listingsRepository.increment({ id }, 'views', 1);

    return listing;
  }

  async findMyListings(
    sellerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<[Listing[], number]> {
    return this.listingsRepository.findAndCount({
      where: { sellerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async update(
    id: string,
    sellerId: string,
    updateListingDto: UpdateListingDto,
  ): Promise<Listing> {
    const listing = await this.findOne(id);

    // Only the seller can update their listing
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only update your own listings');
    }

    Object.assign(listing, updateListingDto);

    // If marking as sold, set soldAt timestamp
    if (updateListingDto.status === ListingStatus.SOLD && !listing.soldAt) {
      listing.soldAt = new Date();
    }

    return this.listingsRepository.save(listing);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const listing = await this.findOne(id);

    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    await this.listingsRepository.delete(id);
  }

  async markAsSold(id: string, sellerId: string): Promise<Listing> {
    return this.update(id, sellerId, {
      status: ListingStatus.SOLD,
    });
  }

  async getFeaturedListings(limit: number = 10): Promise<Listing[]> {
    return this.listingsRepository.find({
      where: { status: ListingStatus.ACTIVE },
      relations: ['seller'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getCategories(): Promise<Record<string, number>> {
    const result = await this.listingsRepository
      .createQueryBuilder('listing')
      .select('listing.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('listing.status = :status', { status: ListingStatus.ACTIVE })
      .groupBy('listing.category')
      .getRawMany();

    return result.reduce((acc, item) => {
      acc[item.category] = parseInt(item.count);
      return acc;
    }, {});
  }
}
