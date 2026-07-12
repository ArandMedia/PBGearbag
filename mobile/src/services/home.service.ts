import { apiClient } from "./api";
import { Announcement, Event } from "./community.service";
import { Listing } from "./marketplace.service";

export interface BillboardPost {
  id: string;
  authorId: string;
  type: string;
  body: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  eventId?: string;
  organizationId?: string;
  locationLabel?: string;
  createdAt: string;
  author?: { id: string; username: string; displayName?: string; avatarUrl?: string };
}

export interface HomeFeed {
  billboard: BillboardPost[];
  myEvents: Event[];
  nearbyEvents: Event[];
  announcements: Announcement[];
  marketplacePicks: Listing[];
}

export interface HomeLayoutBlock {
  key: string;
  hidden: boolean;
}

export const homeService = {
  async getFeed() {
    return (await apiClient.get<HomeFeed>("/home/feed")).data;
  },
  async getLayout() {
    return (await apiClient.get<HomeLayoutBlock[]>("/home/layout")).data;
  },
  async saveLayout(blocks: HomeLayoutBlock[]) {
    return (await apiClient.put<{ blocks: HomeLayoutBlock[] }>("/home/layout", { blocks })).data;
  },
};
