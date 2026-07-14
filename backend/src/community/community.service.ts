import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Listing, ListingStatus } from '../marketplace/entities/listing.entity';
import { MessagePermission, User } from '../users/entities/user.entity';
import { SocialService } from '../social/social.service';
import { BillingService } from '../billing/billing.service';
import { Announcement, AnnouncementSourceType, ApplicationStatus, CommunityEvent, Conversation, ConversationParticipant, EventRsvp, EventStatus, Gearbag, GearItem, ListingFavorite, ListingOffer, Message, Notification, OfferStatus, Organization, OrganizationClaim, OrganizationFollow, Report, ReportStatus, Review, RsvpStatus, Team, TeamApplication, TeamGearOrder, TeamGearOrderItem, TeamGearOrderPick, TeamMember, TeamMemberRole, Tournament, TournamentEntry, TournamentFormat, TournamentMatch, Visibility } from './entities/community.entity';
import { importOsmFields as runOsmImport } from './osm-import.util';
import { importDirectoryBatch } from './directory-import.util';
import { DIRECTORY_ENTRIES } from '../config/directory-import-data';
import { advanceMatch, generateSingleEliminationBracket } from './tournament-bracket.util';

@Injectable()
export class CommunityService {
  constructor(private readonly db:DataSource, private readonly social:SocialService, private readonly billing:BillingService,
    @InjectRepository(Gearbag) private gearbags:Repository<Gearbag>, @InjectRepository(GearItem) private gearItems:Repository<GearItem>,
    @InjectRepository(Team) private teams:Repository<Team>, @InjectRepository(TeamMember) private teamMembers:Repository<TeamMember>, @InjectRepository(TeamApplication) private applications:Repository<TeamApplication>,
    @InjectRepository(Organization) private organizations:Repository<Organization>, @InjectRepository(OrganizationFollow) private orgFollows:Repository<OrganizationFollow>, @InjectRepository(OrganizationClaim) private orgClaims:Repository<OrganizationClaim>,
    @InjectRepository(CommunityEvent) private events:Repository<CommunityEvent>, @InjectRepository(EventRsvp) private rsvps:Repository<EventRsvp>,
    @InjectRepository(Conversation) private conversations:Repository<Conversation>, @InjectRepository(ConversationParticipant) private participants:Repository<ConversationParticipant>, @InjectRepository(Message) private messages:Repository<Message>,
    @InjectRepository(Listing) private listings:Repository<Listing>, @InjectRepository(ListingFavorite) private favorites:Repository<ListingFavorite>, @InjectRepository(ListingOffer) private offers:Repository<ListingOffer>,
    @InjectRepository(Notification) private notifications:Repository<Notification>, @InjectRepository(Report) private reports:Repository<Report>, @InjectRepository(Review) private reviews:Repository<Review>,
    @InjectRepository(Announcement) private announcements:Repository<Announcement>,
    @InjectRepository(Tournament) private tournaments:Repository<Tournament>, @InjectRepository(TournamentEntry) private tournamentEntries:Repository<TournamentEntry>, @InjectRepository(TournamentMatch) private tournamentMatches:Repository<TournamentMatch>,
    @InjectRepository(TeamGearOrder) private gearOrders:Repository<TeamGearOrder>, @InjectRepository(TeamGearOrderItem) private gearOrderItems:Repository<TeamGearOrderItem>, @InjectRepository(TeamGearOrderPick) private gearOrderPicks:Repository<TeamGearOrderPick>,
    @InjectRepository(User) private users:Repository<User>) {}

  async myGearbags(userId:string){const bags=await this.gearbags.find({where:{ownerId:userId},order:{isPrimary:'DESC',createdAt:'ASC'}});const items=await this.gearItems.find({where:{ownerId:userId,isArchived:false},order:{createdAt:'ASC'}});return bags.map(b=>({...b,items:items.filter(i=>i.gearbagId===b.id)}))}
  async primaryGearbagFor(userId:string){const bags=await this.myGearbags(userId);return bags.find(b=>b.isPrimary)||bags[0]||null}
  createGearbag(userId:string,data:Partial<Gearbag>){return this.gearbags.save(this.gearbags.create({...data,ownerId:userId}))}
  async updateGearbag(userId:string,id:string,data:Partial<Gearbag>){const row=await this.owned(this.gearbags,id,userId);Object.assign(row,data,{id,ownerId:userId});return this.gearbags.save(row)}
  async removeGearbag(userId:string,id:string){await this.owned(this.gearbags,id,userId);await this.gearbags.delete(id)}
  async addGearItem(userId:string,gearbagId:string,data:Partial<GearItem>){await this.owned(this.gearbags,gearbagId,userId);return this.gearItems.save(this.gearItems.create({...data,gearbagId,ownerId:userId}))}
  async updateGearItem(userId:string,id:string,data:Partial<GearItem>){const row=await this.owned(this.gearItems,id,userId);Object.assign(row,data,{id,ownerId:userId});return this.gearItems.save(row)}
  async archiveGearItem(userId:string,id:string){return this.updateGearItem(userId,id,{isArchived:true})}

  listTeams(search?:string){const q=this.teams.createQueryBuilder('team').where('team.moderation_status = :s',{s:ApplicationStatus.APPROVED});if(search)q.andWhere('(team.name ILIKE :q OR team.city ILIKE :q)',{q:`%${search}%`});return q.orderBy('team.createdAt','DESC').getMany()}
  getTeam(slug:string){return this.teams.findOne({where:{slug,moderationStatus:ApplicationStatus.APPROVED}}).then(x=>{if(!x)throw new NotFoundException('Team not found');return x})}
  async createTeam(userId:string,data:Partial<Team>){return this.db.transaction(async manager=>{const repo=manager.getRepository(Team);const slug=await this.uniqueSlug(repo,data.name||'team');const team=await repo.save(repo.create({...data,slug,ownerId:userId,moderationStatus:ApplicationStatus.PENDING}));await manager.getRepository(TeamMember).save({teamId:team.id,userId,role:TeamMemberRole.OWNER,isActive:true});return team})}
  async updateTeam(userId:string,id:string,data:Partial<Team>){await this.requireTeamManager(userId,id);const team=await this.teams.findOneByOrFail({id});Object.assign(team,data,{id,ownerId:team.ownerId,slug:team.slug,moderationStatus:team.moderationStatus});return this.teams.save(team)}
  listPendingTeams(){return this.teams.find({where:{moderationStatus:ApplicationStatus.PENDING},order:{createdAt:'ASC'}})}
  async decideTeam(id:string,status:ApplicationStatus){
    const team=await this.teams.findOneBy({id});
    if(!team)throw new NotFoundException('Team not found');
    team.moderationStatus=status;
    await this.teams.save(team);
    await this.notifications.save(this.notifications.create({
      userId:team.ownerId,
      type:status===ApplicationStatus.APPROVED?'team_approved':'team_declined',
      title:status===ApplicationStatus.APPROVED?'Your team is live':'Team submission declined',
      body:status===ApplicationStatus.APPROVED?`${team.name} was approved and is now visible on PBGearbag.`:`${team.name} wasn't approved. Reach out to support if you have questions.`,
      data:{teamId:team.id},
    }));
    return team;
  }
  async applyTeam(userId:string,teamId:string,message?:string){if(await this.teamMembers.exist({where:{teamId,userId,isActive:true}}))throw new BadRequestException('Already a team member');const existing=await this.applications.findOne({where:{teamId,userId,status:ApplicationStatus.PENDING}});return existing||this.applications.save(this.applications.create({teamId,userId,message,status:ApplicationStatus.PENDING}))}
  async teamApplications(userId:string,teamId:string){
    await this.requireTeamManager(userId,teamId);
    const apps=await this.applications.find({where:{teamId,status:ApplicationStatus.PENDING},order:{createdAt:'ASC'}});
    if(!apps.length)return [];
    const applicants=await this.users.find({where:{id:In(apps.map(a=>a.userId))}});
    return apps.map(a=>({...a,userName:applicants.find(u=>u.id===a.userId)?.displayName||applicants.find(u=>u.id===a.userId)?.username||'Someone'}));
  }
  // Public — a team's roster is visible to anyone viewing the team page,
  // same visibility level as the team itself.
  async teamRoster(teamId:string){
    const members=await this.teamMembers.find({where:{teamId,isActive:true},order:{joinedAt:'ASC'}});
    if(!members.length)return [];
    const users=await this.users.find({where:{id:In(members.map(m=>m.userId))}});
    return members.map(m=>{
      const u=users.find(x=>x.id===m.userId);
      return {userId:m.userId,userName:u?.displayName||u?.username||'Someone',role:m.role,joinedAt:m.joinedAt};
    });
  }
  async teamMembership(userId:string,teamId:string){return this.teamMembers.findOne({where:{teamId,userId,isActive:true}})}
  async myTeam(userId:string){const membership=await this.teamMembers.findOne({where:{userId,isActive:true},order:{joinedAt:'ASC'}});if(!membership)return null;const team=await this.teams.findOneBy({id:membership.teamId});return team?{...team,role:membership.role}:null}
  async decideApplication(userId:string,id:string,status:ApplicationStatus){const app=await this.applications.findOneBy({id});if(!app)throw new NotFoundException('Application not found');await this.requireTeamManager(userId,app.teamId);app.status=status;await this.applications.save(app);if(status===ApplicationStatus.APPROVED&&!await this.teamMembers.exist({where:{teamId:app.teamId,userId:app.userId}}))await this.teamMembers.save({teamId:app.teamId,userId:app.userId,role:TeamMemberRole.PLAYER,isActive:true});return app}

  async listOrganizations(opts:{type?:string;bbox?:string;page?:number;limit?:number}={}){
    const {type,bbox,page,limit}=opts;
    const q=this.organizations.createQueryBuilder('org').where('org.moderation_status = :ms',{ms:ApplicationStatus.APPROVED});
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
    // Discover's merged list/map view loads the whole directory up front
    // (no bbox) so switching views shows the same result set — this is a
    // bounded, niche directory (low thousands at most), not a general
    // business listing, so a flat higher cap is simpler than pagination here.
    return q.orderBy('org.name','ASC').take(2000).getMany();
  }
  async getOrganization(slug:string){const org=await this.organizations.findOne({where:{slug,moderationStatus:ApplicationStatus.APPROVED}});if(!org)throw new NotFoundException('Organization not found');const followerCount=await this.orgFollows.count({where:{organizationId:org.id}});return {...org,followerCount}}
  async suggestOrganization(userId:string,data:Partial<Organization>){const slug=await this.uniqueSlug(this.organizations,data.name||'organization');return this.organizations.save(this.organizations.create({...data,slug,isVerified:false,claimedById:undefined,moderationStatus:ApplicationStatus.PENDING,details:{...data.details,suggestedBy:userId}}))}
  listPendingOrganizationSuggestions(){return this.organizations.find({where:{moderationStatus:ApplicationStatus.PENDING},order:{createdAt:'ASC'}})}
  async decideOrganizationSuggestion(id:string,status:ApplicationStatus){
    const org=await this.organizations.findOneBy({id});
    if(!org)throw new NotFoundException('Organization not found');
    org.moderationStatus=status;
    await this.organizations.save(org);
    const suggestedBy=(org.details as any)?.suggestedBy;
    if(suggestedBy){
      await this.notifications.save(this.notifications.create({
        userId:suggestedBy,
        type:status===ApplicationStatus.APPROVED?'field_suggestion_approved':'field_suggestion_declined',
        title:status===ApplicationStatus.APPROVED?'Your listing is live':'Listing submission declined',
        body:status===ApplicationStatus.APPROVED?`${org.name} was approved and is now visible on PBGearbag.`:`${org.name} wasn't approved. Reach out to support if you have questions.`,
        data:{organizationId:org.id},
      }));
    }
    return org;
  }
  organizationEvents(organizationId:string){return this.events.find({where:{organizationId,status:EventStatus.PUBLISHED},order:{startsAt:'ASC'},take:20})}
  // A claimed listing's owner can correct/enrich their own details — the
  // claim approval already was the staff review (same reasoning as
  // vetted-partner tournaments/events), so this applies immediately with
  // no second moderation pass. type/slug/claimedById stay fixed here:
  // slug is the URL identity (changing it breaks existing links/bookmarks)
  // and type changes would let a claimed owner recategorize their listing
  // without review.
  async updateOrganization(userId:string,id:string,data:{name?:string;description?:string;address?:string;city?:string;region?:string;country?:string;websiteUrl?:string;contactEmail?:string;phoneNumber?:string;logoUrl?:string;images?:string[];amenities?:string[];hours?:string}){
    const org=await this.organizations.findOneBy({id});
    if(!org)throw new NotFoundException('Organization not found');
    if(org.claimedById!==userId)throw new ForbiddenException('Only this listing\'s claimed owner can edit it');
    const {amenities,hours,...fields}=data;
    Object.assign(org,fields);
    org.details={...org.details,...(amenities?{amenities}:{}),...(hours!==undefined?{hours}:{})};
    return this.organizations.save(org);
  }
  async importOsmFields(bbox:string){
    try{return await runOsmImport(this.organizations,bbox)}
    catch(error:any){throw new BadGatewayException(`OSM import failed: ${error?.message||error}`)}
  }
  // Chunked so a single HTTP call stays well under any proxy timeout —
  // geocoding each entry against Nominatim takes ~1-2s, and the full list
  // is processed a slice at a time by repeated calls with increasing
  // offsets (same shape as the OSM batch importer's per-region calls).
  async importDirectoryChunk(offset:number,limit:number){
    const slice=DIRECTORY_ENTRIES.slice(offset,offset+limit);
    if(!slice.length)return{...(await importDirectoryBatch(this.organizations,[])),processed:0,total:DIRECTORY_ENTRIES.length,done:true};
    try{
      const result=await importDirectoryBatch(this.organizations,slice);
      return{...result,processed:offset+slice.length,total:DIRECTORY_ENTRIES.length,done:offset+slice.length>=DIRECTORY_ENTRIES.length};
    }catch(error:any){throw new BadGatewayException(`Directory import failed: ${error?.message||error}`)}
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
  // Same real-world venue getting tagged more than once in OSM (a way for
  // the boundary plus a separate node for the office, a re-submission years
  // apart) predates the dedup check the importer now runs before creating a
  // new row, so this sweeps up rows that were already duplicated before that
  // check existed. Groups unclaimed, OSM-sourced rows by name + ~500m
  // proximity, keeps whichever row in each group has the most filled-in
  // fields (ties broken by whichever was created first), deletes the rest.
  async cleanupDuplicateOrganizations(){
    const rows=await this.organizations.createQueryBuilder('o')
      .where('o.claimed_by_id IS NULL')
      .andWhere("o.details ->> 'source' = 'osm'")
      .andWhere('o.latitude IS NOT NULL')
      .andWhere('o.longitude IS NOT NULL')
      .getMany();

    const completeness=(o:Organization)=>[o.address,o.phoneNumber,o.contactEmail,o.websiteUrl,o.description].filter(Boolean).length;
    const byName=new Map<string,Organization[]>();
    for(const o of rows){
      const key=(o.name||'').trim().toLowerCase();
      if(!key)continue;
      (byName.get(key)||byName.set(key,[]).get(key)!).push(o);
    }

    const toDelete:string[]=[];
    let groups=0;
    for(const candidates of byName.values()){
      if(candidates.length<2)continue;
      const clusters:Organization[][]=[];
      for(const o of candidates){
        const lat=Number(o.latitude),lon=Number(o.longitude);
        const cluster=clusters.find(c=>{
          const r=c[0];
          return Math.abs(Number(r.latitude)-lat)<0.005&&Math.abs(Number(r.longitude)-lon)<0.005;
        });
        if(cluster)cluster.push(o);else clusters.push([o]);
      }
      for(const cluster of clusters){
        if(cluster.length<2)continue;
        groups++;
        const sorted=[...cluster].sort((a,b)=>completeness(b)-completeness(a)||new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
        toDelete.push(...sorted.slice(1).map(o=>o.id));
      }
    }

    if(!toDelete.length)return{groups:0,deleted:0};
    const result=await this.organizations.createQueryBuilder().delete().whereInIds(toDelete).execute();
    return{groups,deleted:result.affected||0};
  }
  // Aggregate view for admins to keep the directory usable — how many
  // listings are missing enough info to be worth much, plus a capped sample
  // to review/enrich/remove rather than every thin listing at once.
  async organizationQualityReport(){
    const [total,missingContact,missingAddress]=await Promise.all([
      this.organizations.count(),
      this.organizations.count({where:[{websiteUrl:IsNull(),phoneNumber:IsNull(),contactEmail:IsNull()}]}),
      this.organizations.count({where:{address:IsNull()}}),
    ]);
    const thin=await this.organizations.createQueryBuilder('o')
      .where('o.website_url IS NULL')
      .andWhere('o.phone_number IS NULL')
      .andWhere('o.contact_email IS NULL')
      .andWhere('o.address IS NULL')
      .orderBy('o.name','ASC')
      .take(100)
      .getMany();
    return {total,missingContact,missingAddress,thinCount:thin.length,thin};
  }
  async deleteOrganization(id:string){
    const result=await this.organizations.delete(id);
    if(!result.affected)throw new NotFoundException('Organization not found');
    return{message:'Organization deleted'};
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

  listEvents(){return this.events.find({where:{status:EventStatus.PUBLISHED,moderationStatus:ApplicationStatus.APPROVED,teamId:IsNull()},order:{startsAt:'ASC'}})}
  getEvent(slug:string){return this.events.findOne({where:{slug,moderationStatus:ApplicationStatus.APPROVED,teamId:IsNull()}}).then(x=>{if(!x)throw new NotFoundException('Event not found');return x})}
  // Vetted partners (a claimed field's owner — the same admin-approved claim
  // that gates tournament hosting) skip the moderation queue entirely for
  // events tied to their own listing: that claim approval already was the
  // staff review. Anyone else creating an event with no claimed-org tie
  // still goes through the pending queue, since there's no other vetting
  // for who they are.
  async createEvent(userId:string,data:Partial<CommunityEvent>){
    const slug=await this.uniqueSlug(this.events,data.title||'event');
    const isVettedPartner=!!data.organizationId&&await this.organizations.exist({where:{id:data.organizationId,claimedById:userId}});
    return this.events.save(this.events.create({...data,slug,organizerId:userId,status:EventStatus.DRAFT,moderationStatus:isVettedPartner?ApplicationStatus.APPROVED:ApplicationStatus.PENDING}));
  }
  async updateEvent(userId:string,id:string,data:Partial<CommunityEvent>){
    const event=await this.events.findOneBy({id});
    if(!event)throw new NotFoundException('Event not found');
    if(event.organizerId!==userId)throw new ForbiddenException('Only the organizer can edit this event');
    if(data.status===EventStatus.PUBLISHED&&event.moderationStatus!==ApplicationStatus.APPROVED)throw new ForbiddenException('This event needs to be approved before it can be published');
    Object.assign(event,data,{id,organizerId:userId,slug:event.slug,moderationStatus:event.moderationStatus});
    return this.events.save(event);
  }
  listPendingEvents(){return this.events.find({where:{moderationStatus:ApplicationStatus.PENDING},order:{createdAt:'ASC'}})}
  async decideEvent(id:string,status:ApplicationStatus){
    const event=await this.events.findOneBy({id});
    if(!event)throw new NotFoundException('Event not found');
    event.moderationStatus=status;
    if(status===ApplicationStatus.APPROVED&&event.status===EventStatus.DRAFT)event.status=EventStatus.PUBLISHED;
    await this.events.save(event);
    await this.notifications.save(this.notifications.create({
      userId:event.organizerId,
      type:status===ApplicationStatus.APPROVED?'event_approved':'event_declined',
      title:status===ApplicationStatus.APPROVED?'Your event is live':'Event submission declined',
      body:status===ApplicationStatus.APPROVED?`${event.title} was approved and is now visible on PBGearbag.`:`${event.title} wasn't approved. Reach out to support if you have questions.`,
      data:{eventId:event.id},
    }));
    return event;
  }
  async rsvpEvent(userId:string,eventId:string,status:RsvpStatus,visibility=Visibility.MEMBERS){
    const event=await this.events.findOneBy({id:eventId});
    if(!event||event.status!==EventStatus.PUBLISHED)throw new NotFoundException('Published event not found');
    let rsvp=await this.rsvps.findOne({where:{eventId,userId}});
    if(status===RsvpStatus.GOING&&event.capacity!=null&&rsvp?.status!==RsvpStatus.GOING){
      const goingCount=await this.rsvps.count({where:{eventId,status:RsvpStatus.GOING}});
      if(goingCount>=event.capacity)throw new ForbiddenException('This event is at capacity');
    }
    if(!rsvp)rsvp=this.rsvps.create({eventId,userId,status,visibility});
    else Object.assign(rsvp,{status,visibility});
    return this.rsvps.save(rsvp);
  }
  // Organizer-only roster — mirrors the gear-order manager tally pattern:
  // aggregate counts are public (via getEvent), the actual who's-coming
  // list is only for the person running the event.
  async eventAttendees(userId:string,eventId:string){
    const event=await this.events.findOneBy({id:eventId});
    if(!event)throw new NotFoundException('Event not found');
    if(event.organizerId!==userId)throw new ForbiddenException('Only the organizer can view attendees');
    const rsvps=await this.rsvps.find({where:{eventId},order:{createdAt:'ASC'}});
    if(!rsvps.length)return [];
    const attendees=await this.users.find({where:{id:In(rsvps.map(r=>r.userId))}});
    return rsvps.map(r=>{
      const u=attendees.find(a=>a.id===r.userId);
      return {userId:r.userId,userName:u?.displayName||u?.username||'Someone',status:r.status,createdAt:r.createdAt};
    });
  }
  async myUpcomingEvents(userId:string,limit=5){const going=await this.rsvps.find({where:{userId,status:RsvpStatus.GOING}});if(!going.length)return [];return this.events.find({where:{id:In(going.map(x=>x.eventId)),status:EventStatus.PUBLISHED},order:{startsAt:'ASC'},take:limit})}

  // Team practices are events scoped private to a roster — same title/time
  // range/RSVP shape as a public event (reuses CommunityEvent + EventRsvp
  // rather than a parallel entity), but they skip the public moderation
  // queue entirely (teamId:IsNull() keeps them out of listEvents/getEvent)
  // and are gated on the team OWNER holding an active Pro subscription,
  // not the scheduler's own billing status.
  async createTeamPractice(userId:string,teamId:string,data:{title:string;description?:string;startsAt:string|Date;endsAt:string|Date;timezone:string;city?:string;region?:string}){
    await this.requireTeamManager(userId,teamId);
    const team=await this.teams.findOneBy({id:teamId});
    if(!team)throw new NotFoundException('Team not found');
    const {isPro}=await this.billing.getStatus(team.ownerId);
    if(!isPro)throw new ForbiddenException('Team scheduling requires the team owner to have an active Pro subscription');
    const slug=await this.uniqueSlug(this.events,data.title||'practice');
    const practice=await this.events.save(this.events.create({
      ...data,
      description:data.description||'',
      slug,
      teamId,
      organizerId:userId,
      eventType:'practice',
      status:EventStatus.PUBLISHED,
      moderationStatus:ApplicationStatus.APPROVED,
    }));
    const audience=(await this.announcementAudience('team',teamId)).filter(uid=>uid!==userId);
    if(audience.length){
      const actor=await this.actorName(userId);
      await this.notifications.save(audience.map(uid=>this.notifications.create({
        userId:uid,
        type:'team_practice_scheduled',
        title:`New ${team.name} practice`,
        body:`${actor} scheduled "${practice.title}" for ${new Date(practice.startsAt).toLocaleDateString()}.`,
        data:{teamId,eventId:practice.id},
      })));
    }
    return practice;
  }
  async listTeamPractices(userId:string,teamId:string){
    const member=await this.teamMembers.findOne({where:{teamId,userId,isActive:true}});
    if(!member)throw new ForbiddenException('Team members only');
    const team=await this.teams.findOneBy({id:teamId});
    if(!team)throw new NotFoundException('Team not found');
    const [items,{isPro:ownerIsPro}]=await Promise.all([
      this.events.find({where:{teamId},order:{startsAt:'ASC'}}),
      this.billing.getStatus(team.ownerId),
    ]);
    return {items,ownerIsPro};
  }

  // Team gear orders — a captain/manager's bulk catalog; teammates pick
  // their size/qty, the captain gets a tally to coordinate the real
  // purchase off-platform (Venmo/cash/vendor order). Pro-gating mirrors
  // createTeamPractice exactly: the team OWNER needs active Pro to
  // create/manage an order; any active member can browse and pick for free.
  async createGearOrder(userId:string,teamId:string,data:{title:string;description?:string;closesAt?:string|Date;items:{name:string;priceCents?:number;variantOptions?:string[]}[]}){
    await this.requireTeamManager(userId,teamId);
    const team=await this.teams.findOneBy({id:teamId});
    if(!team)throw new NotFoundException('Team not found');
    const {isPro}=await this.billing.getStatus(team.ownerId);
    if(!isPro)throw new ForbiddenException('Team gear orders require the team owner to have an active Pro subscription');
    const items=(data.items||[]).map(i=>({...i,name:(i.name||'').trim()})).filter(i=>i.name);
    if(!items.length)throw new BadRequestException('Add at least one item');
    const result=await this.db.transaction(async manager=>{
      const ordersRepo=manager.getRepository(TeamGearOrder),itemsRepo=manager.getRepository(TeamGearOrderItem);
      const order=await ordersRepo.save(ordersRepo.create({teamId,createdById:userId,title:data.title,description:data.description,closesAt:data.closesAt,status:'open'}));
      const savedItems=await itemsRepo.save(items.map(i=>itemsRepo.create({orderId:order.id,name:i.name,priceCents:i.priceCents,variantOptions:i.variantOptions?.length?i.variantOptions:undefined})));
      return {order,items:savedItems};
    });
    const audience=(await this.announcementAudience('team',teamId)).filter(uid=>uid!==userId);
    if(audience.length){
      const actor=await this.actorName(userId);
      await this.notifications.save(audience.map(uid=>this.notifications.create({
        userId:uid,type:'team_gear_order_created',title:`New ${team.name} gear order`,
        body:`${actor} started "${result.order.title}" — go pick your items.`,
        data:{teamId,orderId:result.order.id},
      })));
    }
    return result;
  }
  async listTeamGearOrders(userId:string,teamId:string){
    const member=await this.teamMembers.findOne({where:{teamId,userId,isActive:true}});
    if(!member)throw new ForbiddenException('Team members only');
    const team=await this.teams.findOneBy({id:teamId});
    if(!team)throw new NotFoundException('Team not found');
    const [orders,{isPro:ownerIsPro}]=await Promise.all([
      this.gearOrders.find({where:{teamId},order:{createdAt:'DESC'}}),
      this.billing.getStatus(team.ownerId),
    ]);
    if(!orders.length)return {items:[],ownerIsPro};
    const items=await this.gearOrderItems.find({where:{orderId:In(orders.map(o=>o.id))}});
    return {items:orders.map(o=>({...o,itemCount:items.filter(i=>i.orderId===o.id).length})),ownerIsPro};
  }
  async getGearOrder(userId:string,orderId:string){
    const order=await this.gearOrders.findOneBy({id:orderId});
    if(!order)throw new NotFoundException('Gear order not found');
    const member=await this.teamMembers.findOne({where:{teamId:order.teamId,userId,isActive:true}});
    if(!member)throw new ForbiddenException('Team members only');
    const isManager=[TeamMemberRole.OWNER,TeamMemberRole.MANAGER,TeamMemberRole.CAPTAIN].includes(member.role);
    const [items,allPicks,myPicks]=await Promise.all([
      this.gearOrderItems.find({where:{orderId},order:{createdAt:'ASC'}}),
      this.gearOrderPicks.find({where:{orderId}}),
      this.gearOrderPicks.find({where:{orderId,userId}}),
    ]);
    const itemTotals:Record<string,{quantity:number;byVariant:Record<string,number>}>={};
    for(const p of allPicks){
      const t=itemTotals[p.itemId]||(itemTotals[p.itemId]={quantity:0,byVariant:{}});
      t.quantity+=p.quantity;
      const key=p.variant||'—';
      t.byVariant[key]=(t.byVariant[key]||0)+p.quantity;
    }
    let tally:any[]|undefined;
    if(isManager){
      const pickers=await this.users.find({where:{id:In([...new Set(allPicks.map(p=>p.userId))])}});
      tally=allPicks.map(p=>({...p,userName:pickers.find(u=>u.id===p.userId)?.displayName||pickers.find(u=>u.id===p.userId)?.username||'Someone'}));
    }
    return {order,items,myPicks,itemTotals,isManager,tally};
  }
  async closeGearOrder(userId:string,orderId:string){
    const order=await this.gearOrders.findOneBy({id:orderId});
    if(!order)throw new NotFoundException('Gear order not found');
    await this.requireTeamManager(userId,order.teamId);
    order.status='closed';
    return this.gearOrders.save(order);
  }
  async addGearOrderItem(userId:string,orderId:string,data:{name:string;priceCents?:number;variantOptions?:string[]}){
    const order=await this.gearOrders.findOneBy({id:orderId});
    if(!order)throw new NotFoundException('Gear order not found');
    await this.requireTeamManager(userId,order.teamId);
    if(order.status!=='open')throw new ForbiddenException('This order is closed');
    const name=(data.name||'').trim();
    if(!name)throw new BadRequestException('Item name is required');
    return this.gearOrderItems.save(this.gearOrderItems.create({orderId,name,priceCents:data.priceCents,variantOptions:data.variantOptions?.length?data.variantOptions:undefined}));
  }
  private async openOrderForItem(itemId:string){
    const item=await this.gearOrderItems.findOneBy({id:itemId});
    if(!item)throw new NotFoundException('Item not found');
    const order=await this.gearOrders.findOneBy({id:item.orderId});
    if(!order)throw new NotFoundException('Gear order not found');
    return {item,order};
  }
  async pickGearOrderItem(userId:string,itemId:string,data:{variant?:string;quantity?:number}){
    const {item,order}=await this.openOrderForItem(itemId);
    const member=await this.teamMembers.findOne({where:{teamId:order.teamId,userId,isActive:true}});
    if(!member)throw new ForbiddenException('Team members only');
    if(order.status!=='open')throw new ForbiddenException('This order is closed');
    if(order.closesAt&&new Date(order.closesAt)<new Date())throw new ForbiddenException('The pick deadline for this order has passed');
    const quantity=Math.max(1,Math.floor(data.quantity||1));
    if(item.variantOptions?.length){
      if(!data.variant||!item.variantOptions.includes(data.variant))throw new BadRequestException('Choose a valid size/option for this item');
    } else if(data.variant){
      throw new BadRequestException('This item has no size/variant options');
    }
    let pick=await this.gearOrderPicks.findOne({where:{itemId,userId}});
    if(pick)Object.assign(pick,{variant:data.variant,quantity});
    else pick=this.gearOrderPicks.create({orderId:order.id,itemId,userId,variant:data.variant,quantity});
    return this.gearOrderPicks.save(pick);
  }
  async unpickGearOrderItem(userId:string,itemId:string){
    const {order}=await this.openOrderForItem(itemId);
    const member=await this.teamMembers.findOne({where:{teamId:order.teamId,userId,isActive:true}});
    if(!member)throw new ForbiddenException('Team members only');
    if(order.status!=='open')throw new ForbiddenException('This order is closed');
    await this.gearOrderPicks.delete({itemId,userId});
    return {message:'Pick removed'};
  }

  // Tournaments are CommunityEvents (eventType:'tournament') plus bracket
  // state. "Partner channel" = the caller already owns the hosting field
  // via the existing admin-approved claim flow — no separate partner
  // role/table needed. That claim approval already *was* the staff review,
  // so unlike a regular public event this goes live immediately — routing
  // it through Phase 1's moderation queue too would mean a vetted partner
  // still needs a human to greenlight every tournament, defeating the
  // point of self-serve creation.
  async createTournament(userId:string,data:{organizationId:string;title:string;description?:string;startsAt:string|Date;endsAt:string|Date;timezone:string;city?:string;region?:string;format?:TournamentFormat;maxTeams?:number;registrationClosesAt?:string|Date}){
    const org=await this.organizations.findOneBy({id:data.organizationId});
    if(!org)throw new NotFoundException('Field not found');
    if(org.claimedById!==userId)throw new ForbiddenException('Only this field\'s claimed owner can host a tournament here');
    return this.db.transaction(async manager=>{
      const eventsRepo=manager.getRepository(CommunityEvent),tournamentsRepo=manager.getRepository(Tournament);
      const slug=await this.uniqueSlug(eventsRepo,data.title||'tournament');
      const event=await eventsRepo.save(eventsRepo.create({
        title:data.title,description:data.description||'',slug,organizerId:userId,organizationId:org.id,
        eventType:'tournament',status:EventStatus.PUBLISHED,moderationStatus:ApplicationStatus.APPROVED,
        startsAt:data.startsAt,endsAt:data.endsAt,timezone:data.timezone,city:data.city,region:data.region,
      }));
      const tournament=await tournamentsRepo.save(tournamentsRepo.create({
        eventId:event.id,format:data.format||'single_elimination',maxTeams:data.maxTeams,
        registrationClosesAt:data.registrationClosesAt,status:'registration_open',
      }));
      return {event,tournament};
    });
  }
  async getTournament(eventId:string){
    const tournament=await this.tournaments.findOneBy({eventId});
    if(!tournament)throw new NotFoundException('Tournament not found');
    const entries=await this.tournamentEntries.find({where:{tournamentId:tournament.id},order:{createdAt:'ASC'}});
    const teams=entries.length?await this.teams.find({where:{id:In(entries.map(e=>e.teamId))}}):[];
    const matches=await this.tournamentMatches.find({where:{tournamentId:tournament.id},order:{round:'ASC',matchNumber:'ASC'}});
    return {tournament,entries:entries.map(e=>({...e,teamName:teams.find(t=>t.id===e.teamId)?.name})),matches};
  }
  async registerTeamForTournament(userId:string,tournamentId:string,teamId:string){
    await this.requireTeamManager(userId,teamId);
    const tournament=await this.tournaments.findOneBy({id:tournamentId});
    if(!tournament)throw new NotFoundException('Tournament not found');
    if(tournament.status!=='registration_open')throw new ForbiddenException('Registration for this tournament is closed');
    if(tournament.registrationClosesAt&&new Date(tournament.registrationClosesAt)<new Date())throw new ForbiddenException('Registration for this tournament is closed');
    if(await this.tournamentEntries.exist({where:{tournamentId,teamId,status:'registered'}}))throw new BadRequestException('This team is already registered');
    if(tournament.maxTeams){const count=await this.tournamentEntries.count({where:{tournamentId,status:'registered'}});if(count>=tournament.maxTeams)throw new ForbiddenException('This tournament is full')}
    return this.tournamentEntries.save(this.tournamentEntries.create({tournamentId,teamId,registeredBy:userId,status:'registered'}));
  }
  private async requireTournamentOrganizer(userId:string,tournamentId:string){
    const tournament=await this.tournaments.findOneBy({id:tournamentId});
    if(!tournament)throw new NotFoundException('Tournament not found');
    const event=await this.events.findOneBy({id:tournament.eventId});
    if(!event)throw new NotFoundException('Tournament not found');
    if(event.organizerId!==userId)throw new ForbiddenException('Only the tournament organizer can do this');
    return {tournament,event};
  }
  async startTournament(userId:string,tournamentId:string){
    const {tournament}=await this.requireTournamentOrganizer(userId,tournamentId);
    if(tournament.status!=='registration_open')throw new ForbiddenException('This tournament has already started');
    const entries=await this.tournamentEntries.find({where:{tournamentId,status:'registered'},order:{seed:'ASC',createdAt:'ASC'}});
    if(entries.length<2)throw new BadRequestException('At least 2 registered teams are required to start');
    const shells=generateSingleEliminationBracket(entries.map(e=>({entryId:e.id,seed:e.seed})));
    await this.tournamentMatches.save(shells.map(s=>this.tournamentMatches.create({
      id:s.id,tournamentId,round:s.round,matchNumber:s.matchNumber,
      teamAEntryId:s.teamAEntryId,teamBEntryId:s.teamBEntryId,winnerEntryId:s.winnerEntryId,
      nextMatchId:s.nextMatchId,nextMatchSlot:s.nextMatchSlot,status:s.status,
    })));
    tournament.status='in_progress';
    await this.tournaments.save(tournament);
    const managers=(await Promise.all(entries.map(e=>this.teamMembers.find({where:{teamId:e.teamId,isActive:true,role:In([TeamMemberRole.OWNER,TeamMemberRole.MANAGER,TeamMemberRole.CAPTAIN])}})))).flat();
    if(managers.length){
      const event=await this.events.findOneBy({id:tournament.eventId});
      await this.notifications.save(managers.map(m=>this.notifications.create({userId:m.userId,type:'tournament_started',title:'Tournament bracket is live',body:`${event?.title||'The tournament'} has started — check the bracket.`,data:{tournamentId,eventId:tournament.eventId}})));
    }
    return this.getTournament(tournament.eventId);
  }
  async reportMatchResult(userId:string,matchId:string,teamAScore:number,teamBScore:number){
    const match=await this.tournamentMatches.findOneBy({id:matchId});
    if(!match)throw new NotFoundException('Match not found');
    const {tournament,event}=await this.requireTournamentOrganizer(userId,match.tournamentId);
    const allMatches=await this.tournamentMatches.find({where:{tournamentId:tournament.id}});
    const shells=allMatches.map(m=>({id:m.id,round:m.round,matchNumber:m.matchNumber,teamAEntryId:m.teamAEntryId,teamBEntryId:m.teamBEntryId,teamAScore:m.teamAScore,teamBScore:m.teamBScore,winnerEntryId:m.winnerEntryId,nextMatchId:m.nextMatchId,nextMatchSlot:m.nextMatchSlot,status:m.status}));
    try{advanceMatch(shells,matchId,teamAScore,teamBScore)}catch(error:any){throw new BadRequestException(error?.message||'Could not report this result')}
    const changed=shells.filter(s=>s.id===matchId||s.id===match.nextMatchId);
    await this.tournamentMatches.save(changed.map(s=>({id:s.id,teamAEntryId:s.teamAEntryId,teamBEntryId:s.teamBEntryId,teamAScore:s.teamAScore,teamBScore:s.teamBScore,winnerEntryId:s.winnerEntryId,status:s.status})));
    const reportedMatch=shells.find(s=>s.id===matchId)!;
    if(!reportedMatch.nextMatchId){tournament.status='completed';await this.tournaments.save(tournament)}
    const entryIds=[match.teamAEntryId,match.teamBEntryId].filter(Boolean) as string[];
    if(entryIds.length){
      const entries=await this.tournamentEntries.find({where:{id:In(entryIds)}});
      const managers=(await Promise.all(entries.map(e=>this.teamMembers.find({where:{teamId:e.teamId,isActive:true,role:In([TeamMemberRole.OWNER,TeamMemberRole.MANAGER,TeamMemberRole.CAPTAIN])}})))).flat();
      if(managers.length)await this.notifications.save(managers.map(m=>this.notifications.create({userId:m.userId,type:'tournament_match_result',title:'Match result reported',body:`A result was reported in ${event.title}.`,data:{tournamentId:tournament.id,eventId:tournament.eventId,matchId}})));
    }
    return this.getTournament(tournament.eventId);
  }

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
  async listingOffers(userId:string,listingId:string){
    const listing=await this.listings.findOneBy({id:listingId});
    if(!listing)throw new NotFoundException('Listing not found');
    if(listing.sellerId!==userId)throw new ForbiddenException('Only the seller can view offers');
    const offers=await this.offers.find({where:{listingId},order:{createdAt:'DESC'}});
    if(!offers.length)return [];
    const buyers=await this.users.find({where:{id:In(offers.map(o=>o.buyerId))}});
    return offers.map(o=>({...o,buyerName:buyers.find(b=>b.id===o.buyerId)?.displayName||buyers.find(b=>b.id===o.buyerId)?.username||'Someone'}));
  }
  // Accepting an offer auto-declines every other still-pending offer on the
  // same listing — a physical item can only go to one buyer, and leaving
  // the rest pending would just confuse sellers into thinking they still
  // need to individually reject each one.
  async decideOffer(userId:string,offerId:string,status:OfferStatus.ACCEPTED|OfferStatus.DECLINED){
    const offer=await this.offers.findOneBy({id:offerId});
    if(!offer)throw new NotFoundException('Offer not found');
    const listing=await this.listings.findOneBy({id:offer.listingId});
    if(!listing)throw new NotFoundException('Listing not found');
    if(listing.sellerId!==userId)throw new ForbiddenException('Only the seller can respond to offers');
    if(offer.status!==OfferStatus.PENDING)throw new BadRequestException('This offer has already been decided');
    offer.status=status;
    await this.offers.save(offer);
    await this.notifications.save(this.notifications.create({
      userId:offer.buyerId,
      type:status===OfferStatus.ACCEPTED?'offer_accepted':'offer_declined',
      title:status===OfferStatus.ACCEPTED?'Your offer was accepted':'Your offer was declined',
      body:status===OfferStatus.ACCEPTED?`${listing.title}'s seller accepted your offer.`:`${listing.title}'s seller declined your offer.`,
      data:{listingId:listing.id,offerId:offer.id},
    }));
    if(status===OfferStatus.ACCEPTED){
      const others=await this.offers.find({where:{listingId:listing.id,status:OfferStatus.PENDING}});
      if(others.length){
        await this.offers.save(others.map(o=>({...o,status:OfferStatus.DECLINED})));
        await this.notifications.save(others.map(o=>this.notifications.create({
          userId:o.buyerId,type:'offer_declined',title:'Your offer was declined',
          body:`${listing.title} sold to another buyer.`,data:{listingId:listing.id,offerId:o.id},
        })));
      }
    }
    return offer;
  }

  myNotifications(userId:string){return this.notifications.find({where:{userId},order:{createdAt:'DESC'},take:100})}
  async readNotification(userId:string,id:string){const n=await this.notifications.findOne({where:{id,userId}});if(!n)throw new NotFoundException('Notification not found');n.readAt=new Date();return this.notifications.save(n)}
  createReport(userId:string,data:Partial<Report>){return this.reports.save(this.reports.create({...data,reporterId:userId,status:ReportStatus.OPEN}))}
  listReports(){return this.reports.find({order:{createdAt:'DESC'}})}
  async resolveReport(id:string,data:Partial<Report>){const report=await this.reports.findOneBy({id});if(!report)throw new NotFoundException('Report not found');Object.assign(report,data,{id});return this.reports.save(report)}
  // One review per (author, subject) — resubmitting edits the existing row
  // rather than piling up duplicates, matching how a real reviewer expects
  // "leave a review" to work once they've already left one.
  async createReview(userId:string,data:Partial<Review>){
    if(!data.rating||data.rating<1||data.rating>5)throw new BadRequestException('Rating must be 1-5');
    const existing=await this.reviews.findOne({where:{authorId:userId,subjectId:data.subjectId,subjectType:data.subjectType}});
    if(existing){Object.assign(existing,data,{authorId:userId});return this.reviews.save(existing)}
    return this.reviews.save(this.reviews.create({...data,authorId:userId}));
  }
  // Reviews had a write side but nothing ever read them back — not even
  // for admins. Public since a field's reviews are meant to be seen by
  // anyone deciding whether to play there.
  async organizationReviews(organizationId:string){
    const reviews=await this.reviews.find({where:{subjectId:organizationId,subjectType:'organization',isVisible:true},order:{createdAt:'DESC'},take:50});
    if(!reviews.length)return {items:[],averageRating:null,count:0};
    const authors=await this.users.find({where:{id:In(reviews.map(r=>r.authorId))}});
    const items=reviews.map(r=>({...r,authorName:authors.find(a=>a.id===r.authorId)?.displayName||authors.find(a=>a.id===r.authorId)?.username||'Someone'}));
    const averageRating=Math.round((reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length)*10)/10;
    return {items,averageRating,count:reviews.length};
  }
  // Author-or-admin — a review isn't cascade-deleted when its author's
  // account is (Review.authorId is a bare column, not a relation, same as
  // CommunityEvent.organizerId elsewhere in this file), so this is also
  // the only way to clean up a review left behind by a deleted account.
  async deleteReview(userId:string,isAdmin:boolean,id:string){
    const review=await this.reviews.findOneBy({id});
    if(!review)throw new NotFoundException('Review not found');
    if(review.authorId!==userId&&!isAdmin)throw new ForbiddenException('Only the review author can delete it');
    await this.reviews.delete(id);
    return {message:'Review deleted'};
  }

  private async owned<T extends {id:string;ownerId:string}>(repo:Repository<T>,id:string,userId:string){const row=await repo.findOne({where:{id} as any});if(!row)throw new NotFoundException('Record not found');if(row.ownerId!==userId)throw new ForbiddenException('You do not own this record');return row}
  private async requireTeamManager(userId:string,teamId:string){const member=await this.teamMembers.findOne({where:{teamId,userId,isActive:true}});if(!member||![TeamMemberRole.OWNER,TeamMemberRole.MANAGER,TeamMemberRole.CAPTAIN].includes(member.role))throw new ForbiddenException('Team manager access required');return member}
  private async requireParticipant(userId:string,conversationId:string){const p=await this.participants.findOne({where:{conversationId,userId,leftAt:IsNull()}});if(!p)throw new ForbiddenException('Conversation membership required');return p}
  private async activeListing(id:string){const listing=await this.listings.findOneBy({id,status:ListingStatus.ACTIVE});if(!listing)throw new NotFoundException('Active listing not found');return listing}
  private async uniqueSlug<T extends {slug:string}>(repo:Repository<T>,value:string){const base=value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';let slug=base,i=1;while(await repo.exist({where:{slug} as any}))slug=`${base}-${++i}`;return slug}
}
