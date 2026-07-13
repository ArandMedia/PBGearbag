import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Listing, ListingStatus } from '../marketplace/entities/listing.entity';
import { MessagePermission, User } from '../users/entities/user.entity';
import { SocialService } from '../social/social.service';
import { Announcement, AnnouncementSourceType, ApplicationStatus, CommunityEvent, Conversation, ConversationParticipant, EventRsvp, EventStatus, Gearbag, GearItem, ListingFavorite, ListingOffer, Message, Notification, OfferStatus, Organization, OrganizationClaim, OrganizationFollow, Report, ReportStatus, Review, RsvpStatus, Team, TeamApplication, TeamMember, TeamMemberRole, Visibility } from './entities/community.entity';
import { importOsmFields as runOsmImport } from './osm-import.util';

@Injectable()
export class CommunityService {
  constructor(private readonly db:DataSource, private readonly social:SocialService,
    @InjectRepository(Gearbag) private gearbags:Repository<Gearbag>, @InjectRepository(GearItem) private gearItems:Repository<GearItem>,
    @InjectRepository(Team) private teams:Repository<Team>, @InjectRepository(TeamMember) private teamMembers:Repository<TeamMember>, @InjectRepository(TeamApplication) private applications:Repository<TeamApplication>,
    @InjectRepository(Organization) private organizations:Repository<Organization>, @InjectRepository(OrganizationFollow) private orgFollows:Repository<OrganizationFollow>, @InjectRepository(OrganizationClaim) private orgClaims:Repository<OrganizationClaim>,
    @InjectRepository(CommunityEvent) private events:Repository<CommunityEvent>, @InjectRepository(EventRsvp) private rsvps:Repository<EventRsvp>,
    @InjectRepository(Conversation) private conversations:Repository<Conversation>, @InjectRepository(ConversationParticipant) private participants:Repository<ConversationParticipant>, @InjectRepository(Message) private messages:Repository<Message>,
    @InjectRepository(Listing) private listings:Repository<Listing>, @InjectRepository(ListingFavorite) private favorites:Repository<ListingFavorite>, @InjectRepository(ListingOffer) private offers:Repository<ListingOffer>,
    @InjectRepository(Notification) private notifications:Repository<Notification>, @InjectRepository(Report) private reports:Repository<Report>, @InjectRepository(Review) private reviews:Repository<Review>,
    @InjectRepository(Announcement) private announcements:Repository<Announcement>,
    @InjectRepository(User) private users:Repository<User>) {}

  async myGearbags(userId:string){const bags=await this.gearbags.find({where:{ownerId:userId},order:{isPrimary:'DESC',createdAt:'ASC'}});const items=await this.gearItems.find({where:{ownerId:userId,isArchived:false},order:{createdAt:'ASC'}});return bags.map(b=>({...b,items:items.filter(i=>i.gearbagId===b.id)}))}
  async primaryGearbagFor(userId:string){const bags=await this.myGearbags(userId);return bags.find(b=>b.isPrimary)||bags[0]||null}
  createGearbag(userId:string,data:Partial<Gearbag>){return this.gearbags.save(this.gearbags.create({...data,ownerId:userId}))}
  async updateGearbag(userId:string,id:string,data:Partial<Gearbag>){const row=await this.owned(this.gearbags,id,userId);Object.assign(row,data,{id,ownerId:userId});return this.gearbags.save(row)}
  async removeGearbag(userId:string,id:string){await this.owned(this.gearbags,id,userId);await this.gearbags.delete(id)}
  async addGearItem(userId:string,gearbagId:string,data:Partial<GearItem>){await this.owned(this.gearbags,gearbagId,userId);return this.gearItems.save(this.gearItems.create({...data,gearbagId,ownerId:userId}))}
  async updateGearItem(userId:string,id:string,data:Partial<GearItem>){const row=await this.owned(this.gearItems,id,userId);Object.assign(row,data,{id,ownerId:userId});return this.gearItems.save(row)}
  async archiveGearItem(userId:string,id:string){return this.updateGearItem(userId,id,{isArchived:true})}

  listTeams(search?:string){const q=this.teams.createQueryBuilder('team');if(search)q.where('team.name ILIKE :s OR team.city ILIKE :s',{s:`%${search}%`});return q.orderBy('team.createdAt','DESC').getMany()}
  getTeam(slug:string){return this.teams.findOne({where:{slug}}).then(x=>{if(!x)throw new NotFoundException('Team not found');return x})}
  async createTeam(userId:string,data:Partial<Team>){return this.db.transaction(async manager=>{const repo=manager.getRepository(Team);const slug=await this.uniqueSlug(repo,data.name||'team');const team=await repo.save(repo.create({...data,slug,ownerId:userId}));await manager.getRepository(TeamMember).save({teamId:team.id,userId,role:TeamMemberRole.OWNER,isActive:true});return team})}
  async updateTeam(userId:string,id:string,data:Partial<Team>){await this.requireTeamManager(userId,id);const team=await this.teams.findOneByOrFail({id});Object.assign(team,data,{id,ownerId:team.ownerId,slug:team.slug});return this.teams.save(team)}
  async applyTeam(userId:string,teamId:string,message?:string){if(await this.teamMembers.exist({where:{teamId,userId,isActive:true}}))throw new BadRequestException('Already a team member');const existing=await this.applications.findOne({where:{teamId,userId,status:ApplicationStatus.PENDING}});return existing||this.applications.save(this.applications.create({teamId,userId,message,status:ApplicationStatus.PENDING}))}
  async teamApplications(userId:string,teamId:string){await this.requireTeamManager(userId,teamId);return this.applications.find({where:{teamId},order:{createdAt:'DESC'}})}
  async teamMembership(userId:string,teamId:string){return this.teamMembers.findOne({where:{teamId,userId,isActive:true}})}
  async myTeam(userId:string){const membership=await this.teamMembers.findOne({where:{userId,isActive:true},order:{joinedAt:'ASC'}});if(!membership)return null;const team=await this.teams.findOneBy({id:membership.teamId});return team?{...team,role:membership.role}:null}
  async decideApplication(userId:string,id:string,status:ApplicationStatus){const app=await this.applications.findOneBy({id});if(!app)throw new NotFoundException('Application not found');await this.requireTeamManager(userId,app.teamId);app.status=status;await this.applications.save(app);if(status===ApplicationStatus.APPROVED&&!await this.teamMembers.exist({where:{teamId:app.teamId,userId:app.userId}}))await this.teamMembers.save({teamId:app.teamId,userId:app.userId,role:TeamMemberRole.PLAYER,isActive:true});return app}

  async listOrganizations(opts:{type?:string;bbox?:string;page?:number;limit?:number}={}){
    const {type,bbox,page,limit}=opts;
    const q=this.organizations.createQueryBuilder('org');
    if(type)q.andWhere('org.type = :type',{type});
    if(bbox){
      const parts=bbox.split(',').map(Number);
      if(parts.length===4&&parts.every(n=>!Number.isNaN(n))){
        const [west,south,east,north]=parts;
        q.andWhere('org.latitude BETWEEN :south AND :north',{south,north})
         .andWhere('org.longitude BETWEEN :west AND :east',{west,east});
      }
      return q.orderBy('org.name','ASC').take(500).getMany();
    }
    if(page||limit){
      const take=Math.min(limit||30,100),skip=((page||1)-1)*take;
      const [items,total]=await q.orderBy('org.name','ASC').skip(skip).take(take).getManyAndCount();
      return {items,total,page:page||1,totalPages:Math.ceil(total/take)};
    }
    return q.orderBy('org.name','ASC').take(200).getMany();
  }
  async getOrganization(slug:string){const org=await this.organizations.findOne({where:{slug}});if(!org)throw new NotFoundException('Organization not found');const followerCount=await this.orgFollows.count({where:{organizationId:org.id}});return {...org,followerCount}}
  async suggestOrganization(userId:string,data:Partial<Organization>){const slug=await this.uniqueSlug(this.organizations,data.name||'organization');return this.organizations.save(this.organizations.create({...data,slug,isVerified:false,claimedById:undefined,details:{...data.details,suggestedBy:userId}}))}
  organizationEvents(organizationId:string){return this.events.find({where:{organizationId,status:EventStatus.PUBLISHED},order:{startsAt:'ASC'},take:20})}
  async importOsmFields(bbox:string){
    try{return await runOsmImport(this.organizations,bbox)}
    catch(error:any){throw new BadGatewayException(`OSM import failed: ${error?.message||error}`)}
  }
  // Removes the placeholder rows an earlier version of the importer created
  // for OSM nodes with no name tag ("Unnamed Paintball Field/Shop") — bare
  // pins with nothing else on them, cluttering search results with entries
  // that have no useful detail page. Only ever touches unclaimed, OSM-sourced
  // rows still carrying that exact placeholder name, so a real listing
  // someone deliberately named "Unnamed Paintball Field" (or claimed) is safe.
  async cleanupUnnamedOrganizations(){
    const result=await this.organizations.createQueryBuilder()
      .delete()
      .where('claimed_by_id IS NULL')
      .andWhere("details ->> 'source' = 'osm'")
      .andWhere('name IN (:...names)',{names:['Unnamed Paintball Field','Unnamed Paintball Shop']})
      .execute();
    return {deleted:result.affected||0};
  }

  async requestOrganizationClaim(userId:string,organizationId:string,note?:string){
    const org=await this.organizations.findOneBy({id:organizationId});
    if(!org)throw new NotFoundException('Organization not found');
    if(org.claimedById)throw new BadRequestException('This listing is already claimed');
    const existing=await this.orgClaims.findOne({where:{organizationId,userId,status:ApplicationStatus.PENDING}});
    if(existing)return existing;
    return this.orgClaims.save(this.orgClaims.create({organizationId,userId,note,status:ApplicationStatus.PENDING}));
  }
  listOrganizationClaims(){return this.orgClaims.find({where:{status:ApplicationStatus.PENDING},order:{createdAt:'ASC'}})}
  async decideOrganizationClaim(id:string,status:ApplicationStatus){
    const claim=await this.orgClaims.findOneBy({id});
    if(!claim)throw new NotFoundException('Claim request not found');
    claim.status=status;
    await this.orgClaims.save(claim);
    if(status===ApplicationStatus.APPROVED){
      const org=await this.organizations.findOneBy({id:claim.organizationId});
      if(org&&!org.claimedById){org.claimedById=claim.userId;await this.organizations.save(org)}
    }
    return claim;
  }

  async followOrganization(userId:string,organizationId:string){const existing=await this.orgFollows.findOne({where:{userId,organizationId}});if(existing){await this.orgFollows.remove(existing);return {active:false}}if(!await this.organizations.exist({where:{id:organizationId}}))throw new NotFoundException('Organization not found');await this.orgFollows.save(this.orgFollows.create({userId,organizationId}));return {active:true}}
  async myFollowedOrganizations(userId:string){const rows=await this.orgFollows.find({where:{userId}});return rows.length?this.organizations.find({where:{id:In(rows.map(r=>r.organizationId))},order:{name:'ASC'}}):[]}

  async createAnnouncement(userId:string,sourceType:AnnouncementSourceType,sourceId:string,data:{title:string;body:string;expiresAt?:Date}){
    if(sourceType==='organization'){const org=await this.organizations.findOneBy({id:sourceId});if(!org)throw new NotFoundException('Field not found');if(org.claimedById!==userId)throw new ForbiddenException('Only this field\'s claimed owner can post announcements for it')}
    else if(sourceType==='event'){const event=await this.events.findOneBy({id:sourceId});if(!event)throw new NotFoundException('Event not found');if(event.organizerId!==userId)throw new ForbiddenException('Only the organizer can post announcements for this event')}
    else if(sourceType==='team'){await this.requireTeamManager(userId,sourceId)}
    else{throw new BadRequestException('Unknown announcement source')}
    const announcement=await this.announcements.save(this.announcements.create({sourceType,sourceId,authorId:userId,...data}));
    const audience=await this.announcementAudience(sourceType,sourceId);
    if(audience.length){const actor=await this.actorName(userId);await this.notifications.save(audience.map(uid=>this.notifications.create({userId:uid,type:'announcement',title:data.title,body:`${actor}: ${data.body}`,data:{sourceType,sourceId,announcementId:announcement.id}})))}
    return announcement;
  }
  listAnnouncements(sourceType:AnnouncementSourceType,sourceId:string){return this.announcements.find({where:{sourceType,sourceId},order:{createdAt:'DESC'},take:50})}
  private async announcementAudience(sourceType:AnnouncementSourceType,sourceId:string):Promise<string[]>{
    if(sourceType==='organization')return (await this.orgFollows.find({where:{organizationId:sourceId}})).map(r=>r.userId);
    if(sourceType==='event')return (await this.rsvps.find({where:{eventId:sourceId,status:In([RsvpStatus.GOING,RsvpStatus.INTERESTED])}})).map(r=>r.userId);
    if(sourceType==='team')return (await this.teamMembers.find({where:{teamId:sourceId,isActive:true}})).map(r=>r.userId);
    return [];
  }

  listEvents(){return this.events.find({where:{status:EventStatus.PUBLISHED},order:{startsAt:'ASC'}})}
  getEvent(slug:string){return this.events.findOne({where:{slug}}).then(x=>{if(!x)throw new NotFoundException('Event not found');return x})}
  async createEvent(userId:string,data:Partial<CommunityEvent>){const slug=await this.uniqueSlug(this.events,data.title||'event');return this.events.save(this.events.create({...data,slug,organizerId:userId}))}
  async updateEvent(userId:string,id:string,data:Partial<CommunityEvent>){const event=await this.events.findOneBy({id});if(!event)throw new NotFoundException('Event not found');if(event.organizerId!==userId)throw new ForbiddenException('Only the organizer can edit this event');Object.assign(event,data,{id,organizerId:userId,slug:event.slug});return this.events.save(event)}
  async rsvpEvent(userId:string,eventId:string,status:RsvpStatus,visibility=Visibility.MEMBERS){const event=await this.events.findOneBy({id:eventId});if(!event||event.status!==EventStatus.PUBLISHED)throw new NotFoundException('Published event not found');let rsvp=await this.rsvps.findOne({where:{eventId,userId}});if(!rsvp)rsvp=this.rsvps.create({eventId,userId,status,visibility});else Object.assign(rsvp,{status,visibility});return this.rsvps.save(rsvp)}
  async myUpcomingEvents(userId:string,limit=5){const going=await this.rsvps.find({where:{userId,status:RsvpStatus.GOING}});if(!going.length)return [];return this.events.find({where:{id:In(going.map(x=>x.eventId)),status:EventStatus.PUBLISHED},order:{startsAt:'ASC'},take:limit})}

  async listConversations(userId:string){const memberships=await this.participants.find({where:{userId,leftAt:IsNull()}});if(!memberships.length)return [];return this.conversations.find({where:{id:In(memberships.map(x=>x.conversationId))},order:{lastMessageAt:'DESC',createdAt:'DESC'}})}
  async createConversation(userId:string,type:any,participantIds:string[],subject?:string,contextId?:string){const ids=[...new Set([userId,...participantIds])];if(ids.length<2)throw new BadRequestException('A conversation needs another participant');
    if(ids.length===2){
      const otherId=ids.find(id=>id!==userId)!;
      if(await this.social.isBlockedEitherWay(userId,otherId))throw new ForbiddenException("You can't message this player.");
      const other=await this.users.findOneBy({id:otherId});
      if(other?.messagePermission===MessagePermission.NOBODY)throw new ForbiddenException('This player is not accepting messages.');
      if(other?.messagePermission===MessagePermission.FOLLOWING&&!(await this.social.isFollowing(otherId,userId))){
        throw new ForbiddenException('This player only accepts messages from people they follow.');
      }
    }
    return this.db.transaction(async manager=>{const c=await manager.getRepository(Conversation).save({type,subject,contextId,createdById:userId});await manager.getRepository(ConversationParticipant).save(ids.map(id=>({conversationId:c.id,userId:id})));return c})}
  async conversationMessages(userId:string,conversationId:string){await this.requireParticipant(userId,conversationId);await this.participants.update({conversationId,userId},{lastReadAt:new Date()});return this.messages.find({where:{conversationId,deletedAt:IsNull()},order:{createdAt:'ASC'},take:100})}
  async sendMessage(userId:string,conversationId:string,body:string,attachments?:string[]){await this.requireParticipant(userId,conversationId);const message=await this.messages.save(this.messages.create({conversationId,senderId:userId,body,attachments}));await this.conversations.update(conversationId,{lastMessageAt:message.createdAt});
    const others=(await this.participants.find({where:{conversationId,leftAt:IsNull()}})).filter(p=>p.userId!==userId);
    if(others.length){const actor=await this.actorName(userId);await this.notifications.save(others.map(p=>this.notifications.create({userId:p.userId,type:'message',title:'New message',body:`${actor} sent you a message`,data:{conversationId}})))}
    return message}
  private async actorName(userId:string){const u=await this.users.findOneBy({id:userId});return u?.displayName||u?.username||'Someone'}

  async favoriteListing(userId:string,listingId:string){await this.activeListing(listingId);const found=await this.favorites.findOne({where:{listingId,userId}});return found||this.favorites.save({listingId,userId})}
  async unfavoriteListing(userId:string,listingId:string){await this.favorites.delete({listingId,userId})}
  async myFavorites(userId:string){const favs=await this.favorites.find({where:{userId}});return favs.length?this.listings.find({where:{id:In(favs.map(x=>x.listingId))},relations:['seller']}):[]}
  async makeOffer(userId:string,listingId:string,data:Partial<ListingOffer>){const listing=await this.activeListing(listingId);if(listing.sellerId===userId)throw new BadRequestException('You cannot offer on your own listing');if(await this.social.isBlockedEitherWay(userId,listing.sellerId))throw new ForbiddenException("You can't offer on this listing.");const offer=await this.offers.save(this.offers.create({...data,listingId,buyerId:userId,status:OfferStatus.PENDING}));const actor=await this.actorName(userId);await this.notifications.save(this.notifications.create({userId:listing.sellerId,type:'offer',title:'New offer',body:`${actor} made an offer on ${listing.title}`,data:{listingId,offerId:offer.id}}));return offer}
  async listingOffers(userId:string,listingId:string){const listing=await this.listings.findOneBy({id:listingId});if(!listing)throw new NotFoundException('Listing not found');if(listing.sellerId!==userId)throw new ForbiddenException('Only the seller can view offers');return this.offers.find({where:{listingId},order:{createdAt:'DESC'}})}

  myNotifications(userId:string){return this.notifications.find({where:{userId},order:{createdAt:'DESC'},take:100})}
  async readNotification(userId:string,id:string){const n=await this.notifications.findOne({where:{id,userId}});if(!n)throw new NotFoundException('Notification not found');n.readAt=new Date();return this.notifications.save(n)}
  createReport(userId:string,data:Partial<Report>){return this.reports.save(this.reports.create({...data,reporterId:userId,status:ReportStatus.OPEN}))}
  listReports(){return this.reports.find({order:{createdAt:'DESC'}})}
  async resolveReport(id:string,data:Partial<Report>){const report=await this.reports.findOneBy({id});if(!report)throw new NotFoundException('Report not found');Object.assign(report,data,{id});return this.reports.save(report)}
  createReview(userId:string,data:Partial<Review>){if(!data.rating||data.rating<1||data.rating>5)throw new BadRequestException('Rating must be 1-5');return this.reviews.save(this.reviews.create({...data,authorId:userId}))}

  private async owned<T extends {id:string;ownerId:string}>(repo:Repository<T>,id:string,userId:string){const row=await repo.findOne({where:{id} as any});if(!row)throw new NotFoundException('Record not found');if(row.ownerId!==userId)throw new ForbiddenException('You do not own this record');return row}
  private async requireTeamManager(userId:string,teamId:string){const member=await this.teamMembers.findOne({where:{teamId,userId,isActive:true}});if(!member||![TeamMemberRole.OWNER,TeamMemberRole.MANAGER,TeamMemberRole.CAPTAIN].includes(member.role))throw new ForbiddenException('Team manager access required');return member}
  private async requireParticipant(userId:string,conversationId:string){const p=await this.participants.findOne({where:{conversationId,userId,leftAt:IsNull()}});if(!p)throw new ForbiddenException('Conversation membership required');return p}
  private async activeListing(id:string){const listing=await this.listings.findOneBy({id,status:ListingStatus.ACTIVE});if(!listing)throw new NotFoundException('Active listing not found');return listing}
  private async uniqueSlug<T extends {slug:string}>(repo:Repository<T>,value:string){const base=value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';let slug=base,i=1;while(await repo.exist({where:{slug} as any}))slug=`${base}-${++i}`;return slug}
}
