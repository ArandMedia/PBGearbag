import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { UploadService } from '../common/services/upload.service';
import { ListingCategory, ItemCondition } from './entities/listing.entity';
import { Verified } from '../auth/decorators/verified.decorator';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly marketplaceService: MarketplaceService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, enum: ListingCategory })
  @ApiQuery({ name: 'condition', required: false, enum: ItemCondition })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, enum: ['newest','oldest','price_asc','price_desc','popular'] })
  @ApiResponse({ status: 200, description: 'Returns all listings' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: ListingCategory,
    @Query('condition') condition?: ItemCondition,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('location') location?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular',
    @Query('isNegotiable') isNegotiable?: string,
    @Query('acceptsTrades') acceptsTrades?: string,
    @Query('shippingAvailable') shippingAvailable?: string,
    @Query('localPickup') localPickup?: string,
  ) {
    const [listings, total] = await this.marketplaceService.findAll(
      page,
      limit,
      {
        category,
        condition,
        minPrice: minPrice ? parseFloat(minPrice.toString()) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice.toString()) : undefined,
        location,
        brand,
        searchQuery: search,
        sort,
        isNegotiable: isNegotiable === undefined ? undefined : isNegotiable === 'true',
        acceptsTrades: acceptsTrades === undefined ? undefined : acceptsTrades === 'true',
        shippingAvailable: shippingAvailable === undefined ? undefined : shippingAvailable === 'true',
        localPickup: localPickup === undefined ? undefined : localPickup === 'true',
      },
    );

    return {
      items: listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get('filter-options')
  @Public()
  @ApiOperation({ summary: 'Get available marketplace filter facets' })
  async getFilterOptions() { return this.marketplaceService.getFilterOptions(); }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured listings' })
  @ApiResponse({ status: 200, description: 'Returns featured listings' })
  async getFeatured() {
    return this.marketplaceService.getFeaturedListings();
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get listing counts by category' })
  @ApiResponse({ status: 200, description: 'Returns category counts' })
  async getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user listings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns user listings' })
  async getMyListings(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const [listings, total] = await this.marketplaceService.findMyListings(
      user.id,
      page,
      limit,
    );

    return {
      items: listings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get listing by ID' })
  @ApiResponse({ status: 200, description: 'Returns listing' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async findOne(@Param('id') id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Post()
  @Verified()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  async create(
    @CurrentUser() user: User,
    @Body() createListingDto: CreateListingDto,
  ) {
    return this.marketplaceService.create(user.id, createListingDto);
  }

  @Post('upload-images')
  @Verified()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload listing images (max 10)' })
  @ApiResponse({ status: 200, description: 'Images uploaded successfully' })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 images allowed');
    }

    const imageUrls = [];

    for (const file of files) {
      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException('Only image files are allowed');
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Each file must be less than 5MB');
      }

      const url = await this.uploadService.uploadFile(file, 'listings');
      imageUrls.push(url);
    }

    return {
      imageUrls,
      message: `${imageUrls.length} images uploaded successfully`,
    };
  }

  @Put(':id')
  @Verified()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.marketplaceService.update(id, user.id, updateListingDto);
  }

  @Put(':id/mark-sold')
  @Verified()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark listing as sold' })
  @ApiResponse({ status: 200, description: 'Listing marked as sold' })
  async markAsSold(@Param('id') id: string, @CurrentUser() user: User) {
    return this.marketplaceService.markAsSold(id, user.id);
  }

  @Delete(':id')
  @Verified()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete listing' })
  @ApiResponse({ status: 200, description: 'Listing deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    await this.marketplaceService.remove(id, user.id);
    return { message: 'Listing deleted successfully' };
  }
}
