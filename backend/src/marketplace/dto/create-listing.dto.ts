import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
  IsInt,
} from 'class-validator';
import {
  ListingCategory,
  ItemCondition,
} from '../entities/listing.entity';

export class CreateListingDto {
  @ApiProperty({ example: 'Planet Eclipse CS2 Pro - Excellent Condition' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Lightly used CS2 Pro in excellent condition. Comes with case, barrel kit, and spare parts.',
  })
  @IsString()
  description: string;

  @ApiProperty({ enum: ListingCategory, example: ListingCategory.MARKER })
  @IsEnum(ListingCategory)
  category: ListingCategory;

  @ApiProperty({ required: false, example: 'Electronic' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ required: false, example: 'Planet Eclipse' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false, example: 'CS2 Pro' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false, example: 2023 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiProperty({ enum: ItemCondition, example: ItemCondition.EXCELLENT })
  @IsEnum(ItemCondition)
  condition: ItemCondition;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ required: false, example: 1600 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  acceptsTrades?: boolean;

  @ApiProperty({
    type: [String],
    example: ['/uploads/listings/image1.jpg', '/uploads/listings/image2.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stateProvince?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  shippingAvailable?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  localPickup?: boolean;
}
