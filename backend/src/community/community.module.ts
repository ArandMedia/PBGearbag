import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, CommunityEvent, Conversation, ConversationParticipant, EventRsvp, Gearbag, GearItem, ListingFavorite, ListingOffer, Message, Notification, Organization, Report, Review, Team, TeamApplication, TeamMember } from './entities/community.entity';
import { Listing } from '../marketplace/entities/listing.entity';
import { CommunityService } from './community.service';
import { EventsController, GearbagsController, MarketplaceTrustController, MessagesController, NotificationsController, OrganizationsController, ProfileDataController, ReportsController, TeamsController } from './community.controller';

export const communityEntities=[Gearbag,GearItem,Team,TeamMember,TeamApplication,Organization,CommunityEvent,EventRsvp,Conversation,ConversationParticipant,Message,ListingFavorite,ListingOffer,Review,Report,Notification,AuditLog];

@Module({imports:[TypeOrmModule.forFeature([...communityEntities,Listing])],providers:[CommunityService],controllers:[GearbagsController,TeamsController,OrganizationsController,EventsController,MessagesController,MarketplaceTrustController,NotificationsController,ReportsController,ProfileDataController],exports:[TypeOrmModule,CommunityService]})
export class CommunityModule {}
