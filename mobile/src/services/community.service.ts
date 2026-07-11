import { apiClient } from './api';

export type GearItem={id:string;name:string;category:string;manufacturer?:string;model?:string;color?:string;condition?:string;notes?:string;serviceDueAt?:string};
export type Gearbag={id:string;name:string;description?:string;visibility:string;isPrimary:boolean;items:GearItem[]};
export type Team={id:string;slug:string;name:string;teamType:string;description?:string;city?:string;region?:string;country?:string;isRecruiting:boolean;bannerUrl?:string;createdAt?:string};
export type Organization={id:string;slug:string;name:string;type:string;description?:string;city?:string;region?:string;country?:string;isVerified:boolean;images?:string[];details?:Record<string,unknown>};
export type Event={id:string;slug:string;title:string;eventType:string;description:string;startsAt:string;endsAt:string;city?:string;region?:string;costCents?:number;capacity?:number;bannerUrl?:string;status:string};
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
  async organizations(){return (await apiClient.get<Organization[]>('/organizations')).data},
  async organization(slug:string){return (await apiClient.get<Organization>(`/organizations/${slug}`)).data},
  async events(){return (await apiClient.get<Event[]>('/events')).data}, async rsvp(id:string,status:'interested'|'going'|'not_going'){return (await apiClient.post(`/events/${id}/rsvp`,{status})).data},
  async event(slug:string){return (await apiClient.get<Event>(`/events/${slug}`)).data},
  async team(slug:string){return (await apiClient.get<Team>(`/teams/${slug}`)).data},
  async conversations(){return (await apiClient.get<Conversation[]>('/conversations')).data}, async messages(id:string){return (await apiClient.get<Message[]>(`/conversations/${id}/messages`)).data}, async sendMessage(id:string,body:string){return (await apiClient.post<Message>(`/conversations/${id}/messages`,{body})).data},
  async createConversation(data:{type:string;participantIds:string[];subject?:string;contextId?:string}){return (await apiClient.post<Conversation>('/conversations',data)).data},
  async notifications(){return (await apiClient.get<Notification[]>('/notifications')).data}, async readNotification(id:string){return (await apiClient.patch(`/notifications/${id}/read`)).data},
  async favoriteListing(id:string){return (await apiClient.post(`/marketplace/${id}/favorite`)).data}, async unfavoriteListing(id:string){return apiClient.delete(`/marketplace/${id}/favorite`)},
  async makeOffer(id:string,data:{amountCents?:number;tradeDescription?:string;message?:string}){return (await apiClient.post(`/marketplace/${id}/offers`,data)).data},
  async report(data:{subjectId:string;subjectType:string;category:string;description:string}){return (await apiClient.post('/reports',data)).data},
  async reports(){return (await apiClient.get<Report[]>('/reports')).data}, async resolveReport(id:string,status:'reviewing'|'resolved'|'dismissed',resolutionNotes?:string){return (await apiClient.patch(`/reports/${id}`,{status,resolutionNotes})).data},
};
