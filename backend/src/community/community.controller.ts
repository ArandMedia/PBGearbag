import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { CommunityService } from './community.service';
import { ApplicationStatus, ConversationType, EventStatus, OrganizationType, ReportStatus, RsvpStatus, TeamMemberRole, Visibility } from './entities/community.entity';

class GearbagDto { @IsString() @IsNotEmpty() name:string; @IsOptional() @IsString() description?:string; @IsOptional() @IsEnum(Visibility) visibility?:Visibility; @IsOptional() @IsBoolean() isPrimary?:boolean }
class GearItemDto { @IsString() @IsNotEmpty() name:string; @IsString() category:string; @IsOptional() @IsString() manufacturer?:string; @IsOptional() @IsString() model?:string; @IsOptional() @IsString() color?:string; @IsOptional() @IsString() condition?:string; @IsOptional() @IsString() serialNumber?:string; @IsOptional() @IsArray() @IsString({each:true}) images?:string[]; @IsOptional() @IsString() notes?:string; @IsOptional() @IsDateString() acquiredAt?:any; @IsOptional() @IsDateString() serviceDueAt?:any }
class TeamDto { @IsString() @IsNotEmpty() name:string; @IsString() teamType:string; @IsOptional() @IsString() description?:string; @IsOptional() @IsString() city?:string; @IsOptional() @IsString() region?:string; @IsOptional() @IsString() country?:string; @IsOptional() @IsBoolean() isRecruiting?:boolean; @IsOptional() @IsBoolean() contactEnabled?:boolean }
class ApplicationDto { @IsOptional() @IsString() message?:string }
class ApplicationDecisionDto { @IsEnum(ApplicationStatus) status:ApplicationStatus }
class OrganizationDto { @IsString() @IsNotEmpty() name:string; @IsEnum(OrganizationType) type:OrganizationType; @IsOptional() @IsString() description?:string; @IsOptional() @IsString() city?:string; @IsOptional() @IsString() region?:string; @IsOptional() @IsString() country?:string; @IsOptional() @IsString() address?:string; @IsOptional() @IsString() websiteUrl?:string; @IsOptional() @IsObject() details?:Record<string,unknown> }
class EventDto { @IsString() @IsNotEmpty() title:string; @IsString() eventType:string; @IsString() description:string; @IsDateString() startsAt:any; @IsDateString() endsAt:any; @IsString() timezone:string; @IsOptional() @IsEnum(EventStatus) status?:EventStatus; @IsOptional() @IsString() city?:string; @IsOptional() @IsString() region?:string; @IsOptional() @IsString() country?:string; @IsOptional() @IsString() registrationUrl?:string; @IsOptional() @IsInt() @Min(0) costCents?:number; @IsOptional() @IsInt() @Min(1) capacity?:number; @IsOptional() @IsString() bannerUrl?:string }
class RsvpDto { @IsEnum(RsvpStatus) status:RsvpStatus; @IsOptional() @IsEnum(Visibility) visibility?:Visibility }
class ConversationDto { @IsEnum(ConversationType) type:ConversationType; @IsArray() @IsString({each:true}) participantIds:string[]; @IsOptional() @IsString() subject?:string; @IsOptional() @IsString() contextId?:string }
class MessageDto { @IsString() @IsNotEmpty() body:string; @IsOptional() @IsArray() @IsString({each:true}) attachments?:string[] }
class OfferDto { @IsOptional() @IsInt() @Min(1) amountCents?:number; @IsOptional() @IsString() tradeDescription?:string; @IsOptional() @IsString() message?:string }
class ReportDto { @IsString() subjectId:string; @IsString() subjectType:string; @IsString() category:string; @IsString() @IsNotEmpty() description:string }
class ResolveReportDto { @IsEnum(ReportStatus) status:ReportStatus; @IsOptional() @IsString() resolutionNotes?:string; @IsOptional() @IsString() assignedToId?:string }
class ReviewDto { @IsString() subjectId:string; @IsString() subjectType:string; @IsInt() @Min(1) @Max(5) rating:number; @IsOptional() @IsString() body?:string; @IsOptional() @IsString() outcomeId?:string }
class AnnouncementDto { @IsString() @IsNotEmpty() title:string; @IsString() @IsNotEmpty() body:string; @IsOptional() @IsDateString() expiresAt?:any }

@Controller('gearbags')
export class GearbagsController { constructor(private s:CommunityService){}
  @Get('me') mine(@CurrentUser()u:User){return this.s.myGearbags(u.id)}
  @Post() create(@CurrentUser()u:User,@Body()d:GearbagDto){return this.s.createGearbag(u.id,d)}
  @Patch(':id') update(@CurrentUser()u:User,@Param('id')id:string,@Body()d:Partial<GearbagDto>){return this.s.updateGearbag(u.id,id,d)}
  @Delete(':id') async remove(@CurrentUser()u:User,@Param('id')id:string){await this.s.removeGearbag(u.id,id);return{message:'Gearbag deleted'}}
  @Post(':id/items') item(@CurrentUser()u:User,@Param('id')id:string,@Body()d:GearItemDto){return this.s.addGearItem(u.id,id,d)}
  @Patch('items/:id') updateItem(@CurrentUser()u:User,@Param('id')id:string,@Body()d:Partial<GearItemDto>){return this.s.updateGearItem(u.id,id,d)}
  @Post('items/:id/archive') archive(@CurrentUser()u:User,@Param('id')id:string){return this.s.archiveGearItem(u.id,id)}
}

@Controller('teams')
export class TeamsController { constructor(private s:CommunityService){}
  @Get() @Public() list(@Query('search')q?:string){return this.s.listTeams(q)} @Get(':slug') @Public() one(@Param('slug')slug:string){return this.s.getTeam(slug)}
  @Post() create(@CurrentUser()u:User,@Body()d:TeamDto){return this.s.createTeam(u.id,d)} @Patch(':id') update(@CurrentUser()u:User,@Param('id')id:string,@Body()d:Partial<TeamDto>){return this.s.updateTeam(u.id,id,d)}
  @Post(':id/applications') apply(@CurrentUser()u:User,@Param('id')id:string,@Body()d:ApplicationDto){return this.s.applyTeam(u.id,id,d.message)}
  @Get(':id/applications/manage') applications(@CurrentUser()u:User,@Param('id')id:string){return this.s.teamApplications(u.id,id)}
  @Patch('applications/:id') decide(@CurrentUser()u:User,@Param('id')id:string,@Body()d:ApplicationDecisionDto){return this.s.decideApplication(u.id,id,d.status)}
  @Get(':id/membership') async membership(@CurrentUser()u:User,@Param('id')id:string){const m=await this.s.teamMembership(u.id,id);return {role:m?.role||null}}
  @Get(':id/announcements') @Public() announcements(@Param('id')id:string){return this.s.listAnnouncements('team',id)}
  @Post(':id/announcements') announce(@CurrentUser()u:User,@Param('id')id:string,@Body()d:AnnouncementDto){return this.s.createAnnouncement(u.id,'team',id,d)}
}

@Controller('organizations')
export class OrganizationsController { constructor(private s:CommunityService){}
  @Get() @Public() list(@Query('type')type?:string){return this.s.listOrganizations(type)} @Get(':slug') @Public() one(@Param('slug')slug:string){return this.s.getOrganization(slug)}
  @Post('suggestions') suggest(@CurrentUser()u:User,@Body()d:OrganizationDto){return this.s.suggestOrganization(u.id,d)} @Post(':id/claim') claim(@CurrentUser()u:User,@Param('id')id:string){return this.s.claimOrganization(u.id,id)}
  @Post(':id/reviews') review(@CurrentUser()u:User,@Param('id')id:string,@Body()d:Omit<ReviewDto,'subjectId'|'subjectType'>){return this.s.createReview(u.id,{...d,subjectId:id,subjectType:'organization'})}
  @Get('followed/mine') followed(@CurrentUser()u:User){return this.s.myFollowedOrganizations(u.id)}
  @Post(':id/follow') follow(@CurrentUser()u:User,@Param('id')id:string){return this.s.followOrganization(u.id,id)}
  @Get(':id/announcements') @Public() announcements(@Param('id')id:string){return this.s.listAnnouncements('organization',id)}
  @Post(':id/announcements') announce(@CurrentUser()u:User,@Param('id')id:string,@Body()d:AnnouncementDto){return this.s.createAnnouncement(u.id,'organization',id,d)}
}

@Controller('events')
export class EventsController { constructor(private s:CommunityService){}
  @Get() @Public() list(){return this.s.listEvents()} @Get(':slug') @Public() one(@Param('slug')slug:string){return this.s.getEvent(slug)}
  @Post() create(@CurrentUser()u:User,@Body()d:EventDto){return this.s.createEvent(u.id,d as any)} @Patch(':id') update(@CurrentUser()u:User,@Param('id')id:string,@Body()d:Partial<EventDto>){return this.s.updateEvent(u.id,id,d as any)}
  @Post(':id/rsvp') rsvp(@CurrentUser()u:User,@Param('id')id:string,@Body()d:RsvpDto){return this.s.rsvpEvent(u.id,id,d.status,d.visibility)}
  @Get(':id/announcements') @Public() announcements(@Param('id')id:string){return this.s.listAnnouncements('event',id)}
  @Post(':id/announcements') announce(@CurrentUser()u:User,@Param('id')id:string,@Body()d:AnnouncementDto){return this.s.createAnnouncement(u.id,'event',id,d)}
}

@Controller('conversations')
export class MessagesController { constructor(private s:CommunityService){}
  @Get() list(@CurrentUser()u:User){return this.s.listConversations(u.id)} @Post() create(@CurrentUser()u:User,@Body()d:ConversationDto){return this.s.createConversation(u.id,d.type,d.participantIds,d.subject,d.contextId)}
  @Get(':id/messages') messages(@CurrentUser()u:User,@Param('id')id:string){return this.s.conversationMessages(u.id,id)} @Post(':id/messages') send(@CurrentUser()u:User,@Param('id')id:string,@Body()d:MessageDto){return this.s.sendMessage(u.id,id,d.body,d.attachments)}
}

@Controller('marketplace')
export class MarketplaceTrustController { constructor(private s:CommunityService){}
  @Post(':id/favorite') favorite(@CurrentUser()u:User,@Param('id')id:string){return this.s.favoriteListing(u.id,id)} @Delete(':id/favorite') async unfavorite(@CurrentUser()u:User,@Param('id')id:string){await this.s.unfavoriteListing(u.id,id);return{message:'Favorite removed'}}
  @Get('me/favorites/all') favorites(@CurrentUser()u:User){return this.s.myFavorites(u.id)} @Post(':id/offers') offer(@CurrentUser()u:User,@Param('id')id:string,@Body()d:OfferDto){return this.s.makeOffer(u.id,id,d)} @Get(':id/offers') offers(@CurrentUser()u:User,@Param('id')id:string){return this.s.listingOffers(u.id,id)}
}

@Controller('notifications')
export class NotificationsController { constructor(private s:CommunityService){} @Get() mine(@CurrentUser()u:User){return this.s.myNotifications(u.id)} @Patch(':id/read') read(@CurrentUser()u:User,@Param('id')id:string){return this.s.readNotification(u.id,id)} }

@Controller('reports')
export class ReportsController { constructor(private s:CommunityService){} @Post() create(@CurrentUser()u:User,@Body()d:ReportDto){return this.s.createReport(u.id,d)} @Get() @Roles(UserRole.MODERATOR,UserRole.ADMIN) list(){return this.s.listReports()} @Patch(':id') @Roles(UserRole.MODERATOR,UserRole.ADMIN) resolve(@Param('id')id:string,@Body()d:ResolveReportDto){return this.s.resolveReport(id,d)} }

@Controller('profile-data')
export class ProfileDataController { constructor(private s:CommunityService){}
  @Get(':userId/team') @Public() team(@Param('userId')userId:string){return this.s.myTeam(userId)}
  @Get(':userId/upcoming-events') @Public() upcomingEvents(@Param('userId')userId:string){return this.s.myUpcomingEvents(userId)}
  @Get(':userId/gearbag') @Public() gearbag(@Param('userId')userId:string){return this.s.primaryGearbagFor(userId)}
}
