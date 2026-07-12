import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Not, Repository } from 'typeorm';
import { CommunityService } from '../community/community.service';
import {
  Announcement,
  AnnouncementSourceType,
  CommunityEvent,
  EventRsvp,
  EventStatus,
  HomeLayout,
  ListingOffer,
  OfferStatus,
  Organization,
  OrganizationFollow,
  RsvpStatus,
  Team,
  TeamMember,
} from '../community/entities/community.entity';
import { Listing, ListingStatus } from '../marketplace/entities/listing.entity';
import { PostType, SocialFollow, SocialPost } from '../social/social.entity';
import { User } from '../users/entities/user.entity';

const MEDIA_TYPES = [PostType.PHOTO, PostType.CLIP, PostType.EVENT_MOMENT];
const DEFAULT_BLOCKS = ['events', 'field_wire', 'command_center', 'pro_widgets', 'marketplace_picks'].map(
  (key) => ({ key, hidden: false }),
);

@Injectable()
export class HomeService {
  constructor(
    private readonly community: CommunityService,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Organization) private organizations: Repository<Organization>,
    @InjectRepository(OrganizationFollow) private orgFollows: Repository<OrganizationFollow>,
    @InjectRepository(CommunityEvent) private events: Repository<CommunityEvent>,
    @InjectRepository(EventRsvp) private rsvps: Repository<EventRsvp>,
    @InjectRepository(TeamMember) private teamMembers: Repository<TeamMember>,
    @InjectRepository(Team) private teams: Repository<Team>,
    @InjectRepository(Announcement) private announcements: Repository<Announcement>,
    @InjectRepository(Listing) private listings: Repository<Listing>,
    @InjectRepository(ListingOffer) private offers: Repository<ListingOffer>,
    @InjectRepository(SocialPost) private posts: Repository<SocialPost>,
    @InjectRepository(SocialFollow) private socialFollows: Repository<SocialFollow>,
    @InjectRepository(HomeLayout) private layouts: Repository<HomeLayout>,
  ) {}

  async getFeed(userId: string) {
    const me = await this.users.findOneBy({ id: userId });
    const [myEvents, followedOrgIds] = await Promise.all([
      this.community.myUpcomingEvents(userId, 5),
      this.orgFollows.find({ where: { userId } }).then((rows) => rows.map((r) => r.organizationId)),
    ]);
    const nearbyEvents = await this.nearbyEvents(me, followedOrgIds, myEvents.map((e) => e.id));
    const [announcements, marketplacePicks, billboard] = await Promise.all([
      this.personalizedAnnouncements(userId, me, followedOrgIds),
      this.personalizedMarketplace(userId, me),
      this.personalizedBillboard(userId, me, followedOrgIds),
    ]);
    return { billboard, myEvents, nearbyEvents, announcements, marketplacePicks };
  }

  private async nearbyEvents(me: User | null, followedOrgIds: string[], excludeIds: string[]) {
    const now = new Date();
    const clauses: any[] = [];
    if (me?.city) clauses.push({ status: EventStatus.PUBLISHED, city: me.city, startsAt: MoreThan(now) });
    if (followedOrgIds.length)
      clauses.push({ status: EventStatus.PUBLISHED, organizationId: In(followedOrgIds), startsAt: MoreThan(now) });
    if (!clauses.length) return [];
    const rows = await this.events.find({ where: clauses, order: { startsAt: 'ASC' }, take: 12 });
    return rows.filter((e) => !excludeIds.includes(e.id)).slice(0, 6);
  }

  private async personalizedAnnouncements(userId: string, me: User | null, followedOrgIds: string[]) {
    const [myTeamIds, myEventIds, cityOrgIds] = await Promise.all([
      this.teamMembers.find({ where: { userId, isActive: true } }).then((r) => r.map((x) => x.teamId)),
      this.rsvps
        .find({ where: { userId, status: In([RsvpStatus.GOING, RsvpStatus.INTERESTED]) } })
        .then((r) => r.map((x) => x.eventId)),
      me?.city ? this.organizations.find({ where: { city: me.city } }).then((r) => r.map((o) => o.id)) : [],
    ]);
    const orgIds = [...new Set([...followedOrgIds, ...cityOrgIds])];
    const clauses: any[] = [];
    if (orgIds.length) clauses.push({ sourceType: 'organization' as AnnouncementSourceType, sourceId: In(orgIds) });
    if (myEventIds.length) clauses.push({ sourceType: 'event' as AnnouncementSourceType, sourceId: In(myEventIds) });
    if (myTeamIds.length) clauses.push({ sourceType: 'team' as AnnouncementSourceType, sourceId: In(myTeamIds) });
    if (!clauses.length) return [];
    const now = new Date();
    const rows = (await this.announcements.find({ where: clauses, order: { createdAt: 'DESC' }, take: 20 })).filter(
      (a) => !a.expiresAt || a.expiresAt > now,
    );
    if (!rows.length) return [];

    const orgSourceIds = rows.filter((a) => a.sourceType === 'organization').map((a) => a.sourceId);
    const eventSourceIds = rows.filter((a) => a.sourceType === 'event').map((a) => a.sourceId);
    const teamSourceIds = rows.filter((a) => a.sourceType === 'team').map((a) => a.sourceId);
    const [orgs, events, teams] = await Promise.all([
      orgSourceIds.length ? this.organizations.find({ where: { id: In(orgSourceIds) } }) : [],
      eventSourceIds.length ? this.events.find({ where: { id: In(eventSourceIds) } }) : [],
      teamSourceIds.length ? this.teams.find({ where: { id: In(teamSourceIds) } }) : [],
    ]);
    return rows.map((a) => ({
      ...a,
      sourceName:
        a.sourceType === 'organization'
          ? orgs.find((o) => o.id === a.sourceId)?.name
          : a.sourceType === 'event'
            ? events.find((e) => e.id === a.sourceId)?.title
            : teams.find((t) => t.id === a.sourceId)?.name,
      sourceSlug:
        a.sourceType === 'organization'
          ? orgs.find((o) => o.id === a.sourceId)?.slug
          : a.sourceType === 'event'
            ? events.find((e) => e.id === a.sourceId)?.slug
            : teams.find((t) => t.id === a.sourceId)?.slug,
    }));
  }

  private async personalizedMarketplace(userId: string, me: User | null) {
    const purchasedListingIds = (
      await this.offers.find({ where: { buyerId: userId, status: OfferStatus.ACCEPTED } })
    ).map((o) => o.listingId);
    const purchasedSellerIds = purchasedListingIds.length
      ? [
          ...new Set(
            (await this.listings.find({ where: { id: In(purchasedListingIds) } })).map((l) => l.sellerId),
          ),
        ]
      : [];

    const orConditions: string[] = [];
    const params: Record<string, unknown> = { status: ListingStatus.ACTIVE };
    if (me?.city) {
      orConditions.push('listing.city = :city');
      params.city = me.city;
    }
    if (purchasedSellerIds.length) {
      orConditions.push('listing.sellerId IN (:...sellerIds)');
      params.sellerIds = purchasedSellerIds;
    }

    let picks: Listing[] = [];
    if (orConditions.length) {
      picks = await this.listings
        .createQueryBuilder('listing')
        .where('listing.status = :status', { status: ListingStatus.ACTIVE })
        .andWhere(`(${orConditions.join(' OR ')})`, params)
        .orderBy('listing.createdAt', 'DESC')
        .take(8)
        .getMany();
    }
    if (picks.length < 8) {
      const existingIds = picks.map((p) => p.id);
      const fallback = await this.listings.find({
        where: { status: ListingStatus.ACTIVE, ...(existingIds.length ? { id: Not(In(existingIds)) } : {}) },
        order: { createdAt: 'DESC' },
        take: 8 - picks.length,
      });
      picks = [...picks, ...fallback];
    }
    return picks;
  }

  private async personalizedBillboard(userId: string, me: User | null, followedOrgIds: string[]) {
    const limit = 15;
    const seen = new Set<string>();
    const result: SocialPost[] = [];
    const pushUnique = (rows: SocialPost[]) => {
      for (const row of rows) {
        if (result.length >= limit) break;
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        result.push(row);
      }
    };
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    // Tier 1: people the viewer follows
    const followingIds = (await this.socialFollows.find({ where: { followerId: userId } })).map(
      (f) => f.followingId,
    );
    if (followingIds.length && result.length < limit) {
      pushUnique(
        await this.posts.find({
          where: { authorId: In(followingIds), type: In(MEDIA_TYPES), createdAt: MoreThan(thirtyDaysAgo) },
          order: { createdAt: 'DESC' },
          take: limit,
        }),
      );
    }

    // Tier 2: fields the viewer follows or shares a city with
    if (result.length < limit) {
      const cityOrgIds = me?.city
        ? (await this.organizations.find({ where: { city: me.city } })).map((o) => o.id)
        : [];
      const orgIds = [...new Set([...followedOrgIds, ...cityOrgIds])];
      if (orgIds.length) {
        pushUnique(
          await this.posts.find({
            where: { organizationId: In(orgIds), type: In(MEDIA_TYPES) },
            order: { createdAt: 'DESC' },
            take: limit,
          }),
        );
      }
    }

    // Tier 3: authors who share a playstyle. playStyle is a simple-array
    // (comma-joined text column, not a real Postgres array), so overlap is
    // checked in application code against a recent candidate batch rather
    // than with an array SQL operator.
    if (result.length < limit && me?.playStyle?.length) {
      const candidates = await this.posts
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.type IN (:...types)', { types: MEDIA_TYPES })
        .orderBy('post.createdAt', 'DESC')
        .take(100)
        .getMany();
      const styles = new Set(me.playStyle);
      pushUnique(candidates.filter((p) => p.author?.playStyle?.some((s) => styles.has(s))));
    }

    // Tier 4: fallback — most recent platform-wide, so the carousel is
    // never sparse for a brand-new account
    if (result.length < limit) {
      pushUnique(
        await this.posts.find({ where: { type: In(MEDIA_TYPES) }, order: { createdAt: 'DESC' }, take: limit }),
      );
    }

    const authorIds = [...new Set(result.map((p) => p.authorId))];
    const authors = authorIds.length
      ? await this.users
          .createQueryBuilder('u')
          .select(['u.id', 'u.username', 'u.displayName', 'u.avatarUrl'])
          .where('u.id IN (:...ids)', { ids: authorIds })
          .getMany()
      : [];
    return result.map((p) => ({ ...p, author: authors.find((a) => a.id === p.authorId) }));
  }

  async getLayout(userId: string) {
    const row = await this.layouts.findOne({ where: { userId } });
    return row?.blocks?.length ? row.blocks : DEFAULT_BLOCKS;
  }

  async saveLayout(userId: string, blocks: { key: string; hidden: boolean }[]) {
    let row = await this.layouts.findOne({ where: { userId } });
    if (!row) row = this.layouts.create({ userId, blocks });
    else row.blocks = blocks;
    await this.layouts.save(row);
    return { blocks: row.blocks };
  }
}
