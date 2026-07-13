import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement, AuditLog, CommunityEvent, Conversation, ConversationParticipant, EventRsvp, Gearbag, GearItem, ListingFavorite, ListingOffer, Message, Notification, Organization, OrganizationClaim, OrganizationFollow, Report, Review, Team, TeamApplication, TeamMember, Tournament, TournamentEntry, TournamentMatch } from './entities/community.entity';
import { Listing } from '../marketplace/entities/listing.entity';
import { User } from '../users/entities/user.entity';
import { SocialModule } from '../social/social.module';
import { BillingModule } from '../billing/billing.module';
import { CommunityService } from './community.service';
import { EventsController, GearbagsController, MarketplaceTrustController, MessagesController, NotificationsController, OrganizationsController, ProfileDataController, ReportsController, TeamsController, TournamentsController } from './community.controller';

export const communityEntities=[Gearbag,GearItem,Team,TeamMember,TeamApplication,Organization,OrganizationFollow,OrganizationClaim,CommunityEvent,EventRsvp,Conversation,ConversationParticipant,Message,ListingFavorite,ListingOffer,Review,Report,Notification,AuditLog,Announcement,Tournament,TournamentEntry,TournamentMatch];

@Module({imports:[TypeOrmModule.forFeature([...communityEntities,Listing,User]),SocialModule,BillingModule],providers:[CommunityService],controllers:[GearbagsController,TeamsController,OrganizationsController,EventsController,MessagesController,MarketplaceTrustController,NotificationsController,ReportsController,ProfileDataController,TournamentsController],exports:[TypeOrmModule,CommunityService]})
export class CommunityModule {}
