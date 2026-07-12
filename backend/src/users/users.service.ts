import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MessagePermission, User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder('user').addSelect('user.password')
      .where('user.id = :id', { id }).getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.createQueryBuilder('user').addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() }).getOne();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username: username.toLowerCase() },
    });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .orWhere('user.username = :username', {
        username: username.toLowerCase(),
      })
      .getOne();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = avatarUrl;
    return this.usersRepository.save(user);
  }

  async updateBanner(id: string, bannerUrl: string): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.bannerUrl = bannerUrl;
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async verifyEmail(id:string):Promise<void>{await this.usersRepository.update(id,{isVerified:true,emailVerifiedAt:new Date()})}
  async updateStripeCustomerId(id: string, stripeCustomerId: string): Promise<void> {
    await this.usersRepository.update(id, { stripeCustomerId });
  }
  async updatePassword(id:string,password:string):Promise<void>{await this.usersRepository.createQueryBuilder().update(User).set({password}).where('id = :id',{id}).execute()}
  async setPendingEmail(id:string,pendingEmail:string):Promise<void>{await this.usersRepository.update(id,{pendingEmail})}
  async updateMessagePermission(id:string,messagePermission:MessagePermission):Promise<void>{await this.usersRepository.update(id,{messagePermission})}
  async applyPendingEmailChange(id:string,email:string):Promise<void>{await this.usersRepository.update(id,{email,pendingEmail:null as any})}

  async remove(id: string): Promise<void> {
    // An early synchronize:true deploy (before this project switched to
    // migrations) left a few tables with a SECOND, non-cascading foreign
    // key constraint duplicating one the migrations already created with
    // ON DELETE CASCADE. Postgres enforces every constraint on a column,
    // so the duplicate blocks the delete regardless of the good one.
    // Confirmed against production: it's exactly the tables backing
    // entities that declare @ManyToOne(() => User) without an explicit
    // onDelete — Listing.seller, SocialPost.author, SocialComment.author.
    // Explicitly clearing those rows (children first) sidesteps the bad
    // constraint entirely instead of depending on any cascade behavior.
    // Casts are ::text because the synchronize-era columns ended up typed
    // varchar instead of uuid, and uuid/varchar comparisons need one.
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM listing_offers WHERE buyer_id::text = $1::text OR listing_id::text IN (SELECT id::text FROM listings WHERE seller_id::text = $1::text)`,
        [id],
      );
      await manager.query(
        `DELETE FROM listing_favorites WHERE user_id::text = $1::text OR listing_id::text IN (SELECT id::text FROM listings WHERE seller_id::text = $1::text)`,
        [id],
      );
      await manager.query(`DELETE FROM listings WHERE seller_id::text = $1::text`, [id]);
      await manager.query(
        `DELETE FROM social_reactions WHERE user_id::text = $1::text OR post_id::text IN (SELECT id::text FROM social_posts WHERE author_id::text = $1::text)`,
        [id],
      );
      await manager.query(
        `DELETE FROM social_comments WHERE author_id::text = $1::text OR post_id::text IN (SELECT id::text FROM social_posts WHERE author_id::text = $1::text)`,
        [id],
      );
      await manager.query(`DELETE FROM social_posts WHERE author_id::text = $1::text`, [id]);
      await manager.delete(User, id);
    });
  }

  async findAll(page: number = 1, limit: number = 20): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<[User[], number]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.username ILIKE :query', { query: `%${query}%` })
      .orWhere('user.displayName ILIKE :query', { query: `%${query}%` })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }
}
