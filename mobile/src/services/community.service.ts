import { apiClient } from './api';

export type GearItem={id:string;name:string;category:string;manufacturer?:string;model?:string;color?:string;condition?:string;notes?:string;serviceDueAt?:string};
export type Gearbag={id:string;name:string;description?:string;visibility:string;isPrimary:boolean;items:GearItem[]};
export type Team={id:string;slug:string;name:string;teamType:string;description?:string;city?:string;region?:string;country?:string;isRecruiting:boolean;bannerUrl?:string;createdAt?:string;moderationStatus?:string};
export type Organization={id:string;slug:string;name:string;type:string;description?:string;city?:string;region?:string;country?:string;address?:string;latitude?:number;longitude?:number;websiteUrl?:string;contactEmail?:string;phoneNumber?:string;logoUrl?:string;isVerified:boolean;images?:string[];details?:Record<string,unknown>;claimedById?:string;followerCount?:number;moderationStatus?:string};
export type Event={id:string;slug:string;title:string;eventType:string;description:string;startsAt:string;endsAt:string;city?:string;region?:string;costCents?:number;capacity?:number;bannerUrl?:string;status:string;organizerId?:string;moderationStatus?:string;teamId?:string};
export type Announcement={id:string;sourceType:'organization'|'event'|'team';sourceId:string;authorId:string;title:string;body:string;expiresAt?:string;createdAt:string;sourceName?:string;sourceSlug?:string};
export type OrganizationClaim={id:string;organizationId:string;userId:string;note?:string;status:string;createdAt:string};
export type Tournament={id:string;eventId:string;format:string;maxTeams?:number;registrationClosesAt?:string;status:string;createdAt?:string};
export type TournamentEntry={id:string;tournamentId:string;teamId:string;registeredBy:string;seed?:number;status:string;teamName?:string};
export type TournamentMatch={id:string;tournamentId:string;round:number;matchNumber:number;teamAEntryId?:string;teamBEntryId?:string;teamAScore?:number;teamBScore?:number;winnerEntryId?:string;nextMatchId?:string;nextMatchSlot?:'a'|'b';status:string};
export type Paginated<T>={items:T[];total:number;page:number;totalPages:number};
export type Conversation={id:string;type:string;subject?:string;lastMessageAt?:string;createdAt:string};
export type Message={id:string;conversationId:string;senderId:string;body:string;createdAt:string};
export type Notification={id:string;type:string;title:string;body:string;actionUrl?:string;readAt?:string;createdAt:string};
export type Report={id:string;reporterId:string;subjectId:string;subjectType:string;category:string;description:string;status:string;resolutionNotes?:string;createdAt:string};

export const communityService={
  async gearbags(){return (await apiClient.get<Gearbag[]>('/gearbags/me')).data},
  async addGearItem(gearbagId:string,data:Partial<GearItem>){return (await apiClient.post(`/gearbags/${gearbagId}/items`,data)).data},
  async updateGearItem(id:string,data:Partial<GearItem>){return (await apiClient.patch(`/gearbags/items/${id}`,data)).data},
  async archiveGearItem(id:string){return (await apiClient.post(`/gearbags/items/${id}/archive`)).data},
  async teams(){return (await apiClient.get<Team[]>('/teams')).data}, async applyTeam(id:string,message?:string){return (await apiClient.post(`/teams/${id}/applications`,{message})).data},
  async teamPractices(teamId:string){return (await apiClient.get<{items:Event[];ownerIsPro:boolean}>(`/teams/${teamId}/practices`)).data},
  async createTeamPractice(teamId:string,data:{title:string;description?:string;startsAt:string;endsAt:string;timezone:string;city?:string;region?:string}){return (await apiClient.post<Event>(`/teams/${teamId}/practices`,data)).data},
  async pendingTeams(){return (await apiClient.get<Team[]>('/teams/pending')).data},
  async decideTeam(id:string,status:'approved'|'declined'){return (await apiClient.patch<Team>(`/teams/${id}/moderate`,{status})).data},
  async pendingEvents(){return (await apiClient.get<Event[]>('/events/pending')).data},
  async decideEvent(id:string,status:'approved'|'declined'){return (await apiClient.patch<Event>(`/events/${id}/moderate`,{status})).data},
  async pendingOrganizationSuggestions(){return (await apiClient.get<Organization[]>('/organizations/pending-suggestions')).data},
  async decideOrganizationSuggestion(id:string,status:'approved'|'declined'){return (await apiClient.patch<Organization>(`/organizations/${id}/moderate-suggestion`,{status})).data},
  async organizations(type?:string){return (await apiClient.get<Organization[]>('/organizations',{params:{type}})).data},
  async organizationsPaginated(params:{type?:string;page:number;limit?:number}){return (await apiClient.get<Paginated<Organization>>('/organizations',{params})).data},
  async organizationsInBounds(bbox:{west:number;south:number;east:number;north:number},type?:string){return (await apiClient.get<Organization[]>('/organizations',{params:{type,bbox:`${bbox.west},${bbox.south},${bbox.east},${bbox.north}`}})).data},
  async organization(slug:string){return (await apiClient.get<Organization>(`/organizations/${slug}`)).data},
  async organizationEvents(id:string){return (await apiClient.get<Event[]>(`/organizations/${id}/events`)).data},
  async requestOrganizationClaim(id:string,note?:string){return (await apiClient.post<OrganizationClaim>(`/organizations/${id}/claim`,{note})).data},
  async organizationClaims(){return (await apiClient.get<OrganizationClaim[]>('/organizations/claims')).data},
  async decideOrganizationClaim(id:string,status:'approved'|'declined'){return (await apiClient.patch<OrganizationClaim>(`/organizations/claims/${id}`,{status})).data},
  async importOsmFields(bbox:string){return (await apiClient.post<{candidates:number;created:number;updated:number;skipped:number}>('/organizations/import-osm',{bbox})).data},
  async cleanupDuplicateOrganizations(){return (await apiClient.delete<{groups:number;deleted:number}>('/organizations/cleanup-duplicates')).data},
  async organizationQualityReport(){return (await apiClient.get<{total:number;missingContact:number;missingAddress:number;thinCount:number;thin:Organization[]}>('/organizations/quality-report')).data},
  async deleteOrganization(id:string){return (await apiClient.delete<{message:string}>(`/organizations/${id}`)).data},
  async events(){return (await apiClient.get<Event[]>('/events')).data}, async rsvp(id:string,status:'interested'|'going'|'not_going'){return (await apiClient.post(`/events/${id}/rsvp`,{status})).data},
  async event(slug:string){return (await apiClient.get<Event>(`/events/${slug}`)).data},
  async createTournament(data:{organizationId:string;title:string;description?:string;startsAt:string;endsAt:string;timezone:string;city?:string;region?:string;maxTeams?:number;registrationClosesAt?:string}){return (await apiClient.post<{event:Event;tournament:Tournament}>('/tournaments',data)).data},
  async tournament(eventId:string){return (await apiClient.get<{tournament:Tournament;entries:TournamentEntry[];matches:TournamentMatch[]}>(`/tournaments/${eventId}`)).data},
  async registerTournamentTeam(tournamentId:string,teamId:string){return (await apiClient.post<TournamentEntry>(`/tournaments/${tournamentId}/register`,{teamId})).data},
  async startTournament(tournamentId:string){return (await apiClient.post<{tournament:Tournament;entries:TournamentEntry[];matches:TournamentMatch[]}>(`/tournaments/${tournamentId}/start`)).data},
  async reportTournamentMatch(matchId:string,teamAScore:number,teamBScore:number){return (await apiClient.patch<{tournament:Tournament;entries:TournamentEntry[];matches:TournamentMatch[]}>(`/tournaments/matches/${matchId}`,{teamAScore,teamBScore})).data},
  async team(slug:string){return (await apiClient.get<Team>(`/teams/${slug}`)).data},
  async teamMembership(id:string){return (await apiClient.get<{role:string|null}>(`/teams/${id}/membership`)).data},
  async followOrganization(id:string){return (await apiClient.post<{active:boolean}>(`/organizations/${id}/follow`)).data},
  async followedOrganizations(){return (await apiClient.get<Organization[]>('/organizations/followed/mine')).data},
  async announcements(sourceType:'organization'|'event'|'team',id:string){return (await apiClient.get<Announcement[]>(`/${sourceType==='organization'?'organizations':sourceType==='event'?'events':'teams'}/${id}/announcements`)).data},
  async postAnnouncement(sourceType:'organization'|'event'|'team',id:string,data:{title:string;body:string;expiresAt?:string}){return (await apiClient.post<Announcement>(`/${sourceType==='organization'?'organizations':sourceType==='event'?'events':'teams'}/${id}/announcements`,data)).data},
  async myTeam(userId:string){return (await apiClient.get<(Team&{role:string})|null>(`/profile-data/${userId}/team`)).data},
  async upcomingEvents(userId:string){return (await apiClient.get<Event[]>(`/profile-data/${userId}/upcoming-events`)).data},
  async gearbagFor(userId:string){return (await apiClient.get<Gearbag|null>(`/profile-data/${userId}/gearbag`)).data},
  async conversations(){return (await apiClient.get<Conversation[]>('/conversations')).data}, async messages(id:string){return (await apiClient.get<Message[]>(`/conversations/${id}/messages`)).data}, async sendMessage(id:string,body:string){return (await apiClient.post<Message>(`/conversations/${id}/messages`,{body})).data},
  async createConversation(data:{type:string;participantIds:string[];subject?:string;contextId?:string}){return (await apiClient.post<Conversation>('/conversations',data)).data},
  async notifications(){return (await apiClient.get<Notification[]>('/notifications')).data}, async readNotification(id:string){return (await apiClient.patch(`/notifications/${id}/read`)).data},
  async favoriteListing(id:string){return (await apiClient.post(`/marketplace/${id}/favorite`)).data}, async unfavoriteListing(id:string){return apiClient.delete(`/marketplace/${id}/favorite`)},
  async makeOffer(id:string,data:{amountCents?:number;tradeDescription?:string;message?:string}){return (await apiClient.post(`/marketplace/${id}/offers`,data)).data},
  async report(data:{subjectId:string;subjectType:string;category:string;description:string}){return (await apiClient.post('/reports',data)).data},
  async reports(){return (await apiClient.get<Report[]>('/reports')).data}, async resolveReport(id:string,status:'reviewing'|'resolved'|'dismissed',resolutionNotes?:string){return (await apiClient.patch(`/reports/${id}`,{status,resolutionNotes})).data},
};
