import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

@Entity('listings')
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'seller_id' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ListingCategory,
  })
  category: ListingCategory;

  @Column({ nullable: true })
  subcategory?: string;

  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({
    type: 'enum',
    enum: ItemCondition,
  })
  condition: ItemCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'original_price',
    nullable: true,
  })
  originalPrice?: number;

  @Column({ name: 'is_negotiable', default: true })
  isNegotiable: boolean;

  @Column({ name: 'accepts_trades', default: false })
  acceptsTrades: boolean;

  @Column('simple-array')
  images: string[];

  @Column('simple-array', { nullable: true })
  videos?: string[];

  @Column({ nullable: true })
  city?: string;

  @Column({ name: 'state_province', nullable: true })
  stateProvince?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ name: 'shipping_available', default: true })
  shippingAvailable: boolean;

  @Column({ name: 'local_pickup', default: true })
  localPickup: boolean;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  favorites: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'sold_at', nullable: true })
  soldAt?: Date;
}
