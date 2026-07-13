import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum Visibility { PUBLIC='public', MEMBERS='members', PRIVATE='private' }
export enum TeamMemberRole { OWNER='owner', MANAGER='manager', CAPTAIN='captain', COACH='coach', PLAYER='player', SUBSTITUTE='substitute', MEDIA='media', ALUMNI='alumni' }
export enum ApplicationStatus { PENDING='pending', APPROVED='approved', DECLINED='declined', WITHDRAWN='withdrawn' }
export enum OrganizationType { FIELD='field', RETAILER='retailer', MANUFACTURER='manufacturer', AIRSMITH='airsmith', HYDRO='hydro_testing', PRODUCER='event_producer', LEAGUE='league', MEDIA='media', PHOTOGRAPHER='photographer', APPAREL='apparel', TRAVEL='travel', TRAINING='training', INDOOR='indoor_venue', OUTDOOR='outdoor_venue', COMMUNITY='community', OTHER='other' }
export enum EventStatus { DRAFT='draft', PUBLISHED='published', CANCELLED='cancelled', COMPLETED='completed' }
export enum RsvpStatus { INTERESTED='interested', GOING='going', NOT_GOING='not_going' }
export enum ConversationType { DIRECT='direct', MARKETPLACE='marketplace', TEAM='team', EVENT='event', SUPPORT='support' }
export enum OfferStatus { PENDING='pending', ACCEPTED='accepted', DECLINED='declined', WITHDRAWN='withdrawn', EXPIRED='expired' }
export enum ReportStatus { OPEN='open', REVIEWING='reviewing', RESOLVED='resolved', DISMISSED='dismissed' }

@Entity('gearbags')
export class Gearbag {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index() @Column({name:'owner_id'}) ownerId:string;
  @Column({default:'My Gearbag'}) name:string;
  @Column({type:'text',nullable:true}) description?:string;
  @Column({type:'enum',enum:Visibility,default:Visibility.PUBLIC}) visibility:Visibility;
  @Column({name:'is_primary',default:false}) isPrimary:boolean;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('gear_items')
export class GearItem {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index() @Column({name:'gearbag_id'}) gearbagId:string;
  @Index() @Column({name:'owner_id'}) ownerId:string;
  @Column() name:string; @Column() category:string;
  @Column({nullable:true}) manufacturer?:string; @Column({nullable:true}) model?:string;
  @Column({nullable:true}) color?:string; @Column({nullable:true}) condition?:string;
  @Column({name:'serial_number',select:false,nullable:true}) serialNumber?:string;
  @Column('simple-array',{nullable:true}) images?:string[];
  @Column({type:'text',nullable:true}) notes?:string;
  @Column({name:'acquired_at',type:'date',nullable:true}) acquiredAt?:Date;
  @Column({name:'service_due_at',type:'date',nullable:true}) serviceDueAt?:Date;
  @Column({name:'is_archived',default:false}) isArchived:boolean;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index({unique:true}) @Column() slug:string; @Column() name:string;
  @Index() @Column({name:'owner_id'}) ownerId:string;
  @Column({name:'team_type'}) teamType:string; @Column({type:'text',nullable:true}) description?:string;
  @Column({name:'logo_url',nullable:true}) logoUrl?:string; @Column({name:'banner_url',nullable:true}) bannerUrl?:string;
  @Column({nullable:true}) city?:string; @Column({nullable:true}) region?:string; @Column({nullable:true}) country?:string;
  @Column({name:'home_field_id',type:'uuid',nullable:true}) homeFieldId?:string;
  @Column({name:'is_recruiting',default:false}) isRecruiting:boolean;
  @Column({name:'contact_enabled',default:true}) contactEnabled:boolean;
  @Column({name:'moderation_status',type:'enum',enum:ApplicationStatus,default:ApplicationStatus.APPROVED}) moderationStatus:ApplicationStatus;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('team_members')
@Index(['teamId','userId'],{unique:true})
export class TeamMember {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Column({name:'team_id'}) teamId:string; @Column({name:'user_id'}) userId:string;
  @Column({type:'enum',enum:TeamMemberRole,default:TeamMemberRole.PLAYER}) role:TeamMemberRole;
  @Column({name:'joined_at',type:'timestamptz',default:()=> 'CURRENT_TIMESTAMP'}) joinedAt:Date;
  @Column({name:'is_active',default:true}) isActive:boolean;
}

@Entity('team_applications')
export class TeamApplication {
  @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'team_id'}) teamId:string;
  @Index() @Column({name:'user_id'}) userId:string; @Column({type:'text',nullable:true}) message?:string;
  @Column({type:'enum',enum:ApplicationStatus,default:ApplicationStatus.PENDING}) status:ApplicationStatus;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid') id:string; @Index({unique:true}) @Column() slug:string; @Column() name:string;
  @Column({type:'enum',enum:OrganizationType}) type:OrganizationType;
  @Column({type:'text',nullable:true}) description?:string; @Column({nullable:true}) city?:string; @Column({nullable:true}) region?:string; @Column({nullable:true}) country?:string;
  @Column({nullable:true}) address?:string; @Column({type:'decimal',precision:9,scale:6,nullable:true}) latitude?:number; @Column({type:'decimal',precision:9,scale:6,nullable:true}) longitude?:number;
  @Column({name:'website_url',nullable:true}) websiteUrl?:string; @Column({name:'contact_email',nullable:true}) contactEmail?:string; @Column({name:'phone_number',nullable:true}) phoneNumber?:string;
  @Column({name:'logo_url',nullable:true}) logoUrl?:string; @Column('simple-array',{nullable:true}) images?:string[];
  @Column({name:'is_verified',default:false}) isVerified:boolean; @Column({name:'claimed_by_id',type:'uuid',nullable:true}) claimedById?:string;
  @Column({type:'jsonb',default:()=>"'{}'::jsonb"}) details:Record<string,unknown>;
  @Column({name:'moderation_status',type:'enum',enum:ApplicationStatus,default:ApplicationStatus.APPROVED}) moderationStatus:ApplicationStatus;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('events')
export class CommunityEvent {
  @PrimaryGeneratedColumn('uuid') id:string; @Index({unique:true}) @Column() slug:string; @Column() title:string;
  @Index() @Column({name:'organizer_id'}) organizerId:string; @Column({name:'organization_id',type:'uuid',nullable:true}) organizationId?:string;
  @Index() @Column({name:'team_id',type:'uuid',nullable:true}) teamId?:string;
  @Column({name:'event_type'}) eventType:string; @Column({type:'enum',enum:EventStatus,default:EventStatus.DRAFT}) status:EventStatus;
  @Column({type:'text'}) description:string; @Column({type:'text',nullable:true}) rules?:string;
  @Column({name:'starts_at',type:'timestamptz'}) startsAt:Date; @Column({name:'ends_at',type:'timestamptz'}) endsAt:Date; @Column() timezone:string;
  @Column({nullable:true}) city?:string; @Column({nullable:true}) region?:string; @Column({nullable:true}) country?:string;
  @Column({name:'registration_url',nullable:true}) registrationUrl?:string; @Column({name:'cost_cents',type:'int',nullable:true}) costCents?:number; @Column({nullable:true}) capacity?:number;
  @Column({name:'banner_url',nullable:true}) bannerUrl?:string; @Column({name:'cancelled_reason',type:'text',nullable:true}) cancelledReason?:string;
  @Column({name:'moderation_status',type:'enum',enum:ApplicationStatus,default:ApplicationStatus.APPROVED}) moderationStatus:ApplicationStatus;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('event_rsvps') @Index(['eventId','userId'],{unique:true})
export class EventRsvp {
  @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'event_id'}) eventId:string; @Column({name:'user_id'}) userId:string;
  @Column({type:'enum',enum:RsvpStatus}) status:RsvpStatus; @Column({type:'enum',enum:Visibility,default:Visibility.MEMBERS}) visibility:Visibility;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid') id:string; @Column({type:'enum',enum:ConversationType}) type:ConversationType;
  @Column({nullable:true}) subject?:string; @Column({name:'context_id',type:'uuid',nullable:true}) contextId?:string;
  @Column({name:'created_by_id'}) createdById:string; @Column({name:'last_message_at',type:'timestamptz',nullable:true}) lastMessageAt?:Date;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('conversation_participants') @Index(['conversationId','userId'],{unique:true})
export class ConversationParticipant {
  @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'conversation_id'}) conversationId:string; @Index() @Column({name:'user_id'}) userId:string;
  @Column({name:'last_read_at',type:'timestamptz',nullable:true}) lastReadAt?:Date; @Column({name:'muted_at',type:'timestamptz',nullable:true}) mutedAt?:Date; @Column({name:'left_at',type:'timestamptz',nullable:true}) leftAt?:Date;
  @CreateDateColumn({name:'created_at'}) createdAt:Date;
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'conversation_id'}) conversationId:string; @Column({name:'sender_id'}) senderId:string;
  @Column({type:'text'}) body:string; @Column('simple-array',{nullable:true}) attachments?:string[];
  @Column({name:'edited_at',type:'timestamptz',nullable:true}) editedAt?:Date; @Column({name:'deleted_at',type:'timestamptz',nullable:true}) deletedAt?:Date;
  @CreateDateColumn({name:'created_at'}) createdAt:Date;
}

@Entity('listing_favorites') @Index(['listingId','userId'],{unique:true})
export class ListingFavorite { @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'listing_id'}) listingId:string; @Index() @Column({name:'user_id'}) userId:string; @CreateDateColumn({name:'created_at'}) createdAt:Date; }

@Entity('listing_offers')
export class ListingOffer {
  @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'listing_id'}) listingId:string; @Column({name:'buyer_id'}) buyerId:string;
  @Column({name:'amount_cents',type:'int',nullable:true}) amountCents?:number; @Column({name:'trade_description',type:'text',nullable:true}) tradeDescription?:string; @Column({type:'text',nullable:true}) message?:string;
  @Column({type:'enum',enum:OfferStatus,default:OfferStatus.PENDING}) status:OfferStatus; @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'author_id'}) authorId:string; @Index() @Column({name:'subject_id'}) subjectId:string; @Column({name:'subject_type'}) subjectType:string;
  @Column({type:'smallint'}) rating:number; @Column({type:'text',nullable:true}) body?:string; @Column({name:'outcome_id',type:'uuid',nullable:true}) outcomeId?:string;
  @Column({name:'is_visible',default:true}) isVisible:boolean; @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid') id:string; @Column({name:'reporter_id'}) reporterId:string; @Index() @Column({name:'subject_id'}) subjectId:string; @Column({name:'subject_type'}) subjectType:string;
  @Column() category:string; @Column({type:'text'}) description:string; @Column({type:'enum',enum:ReportStatus,default:ReportStatus.OPEN}) status:ReportStatus;
  @Column({name:'assigned_to_id',type:'uuid',nullable:true}) assignedToId?:string; @Column({name:'resolution_notes',type:'text',nullable:true}) resolutionNotes?:string;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'user_id'}) userId:string; @Column() type:string; @Column() title:string; @Column({type:'text'}) body:string;
  @Column({name:'action_url',nullable:true}) actionUrl?:string; @Column({type:'jsonb',default:()=>"'{}'::jsonb"}) data:Record<string,unknown>;
  @Column({name:'read_at',type:'timestamptz',nullable:true}) readAt?:Date; @CreateDateColumn({name:'created_at'}) createdAt:Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id:string; @Index() @Column({name:'actor_id',type:'uuid',nullable:true}) actorId?:string; @Column() action:string;
  @Column({name:'subject_type'}) subjectType:string; @Column({name:'subject_id',type:'uuid',nullable:true}) subjectId?:string; @Column({name:'request_id',nullable:true}) requestId?:string;
  @Column({type:'jsonb',default:()=>"'{}'::jsonb"}) metadata:Record<string,unknown>; @CreateDateColumn({name:'created_at'}) createdAt:Date;
}

// A player following a field/retailer/league/etc — the signal that drives
// which announcements and Home "Field Wire" activity they care about.
@Entity('organization_follows') @Index(['userId','organizationId'],{unique:true})
export class OrganizationFollow {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index() @Column({name:'user_id'}) userId:string;
  @Index() @Column({name:'organization_id'}) organizationId:string;
  @CreateDateColumn({name:'created_at'}) createdAt:Date;
}

// A broadcast from a field owner, event organizer, or team manager/captain.
// sourceType+sourceId points at whichever entity posted it; who sees it is
// computed at read time from follows/RSVPs/membership, not stored here.
export type AnnouncementSourceType = 'organization' | 'event' | 'team';
@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index() @Column({name:'source_type'}) sourceType:AnnouncementSourceType;
  @Index() @Column({name:'source_id'}) sourceId:string;
  @Column({name:'author_id'}) authorId:string;
  @Column() title:string; @Column({type:'text'}) body:string;
  @Column({name:'expires_at',type:'timestamptz',nullable:true}) expiresAt?:Date;
  @CreateDateColumn({name:'created_at'}) createdAt:Date;
}

// One row per user: the saved order/visibility of their Home dashboard
// blocks. The billboard carousel isn't in here — it's fixed above the
// blocks, not a reorderable/hideable block itself.
@Entity('home_layouts')
export class HomeLayout {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index({unique:true}) @Column({name:'user_id'}) userId:string;
  @Column({type:'jsonb',default:()=>"'[]'::jsonb"}) blocks:{key:string;hidden:boolean}[];
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}

// A request to take ownership of an organization listing — replaces the old
// instant/unverified claim now that the directory holds real, OSM-sourced
// businesses. An admin reviews and approves/denies (mirrors TeamApplication).
@Entity('organization_claims')
export class OrganizationClaim {
  @PrimaryGeneratedColumn('uuid') id:string;
  @Index() @Column({name:'organization_id'}) organizationId:string;
  @Index() @Column({name:'user_id'}) userId:string;
  @Column({type:'text',nullable:true}) note?:string;
  @Column({type:'enum',enum:ApplicationStatus,default:ApplicationStatus.PENDING}) status:ApplicationStatus;
  @CreateDateColumn({name:'created_at'}) createdAt:Date; @UpdateDateColumn({name:'updated_at'}) updatedAt:Date;
}
