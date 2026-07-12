import { apiClient } from "./api";
import { toUploadPart } from "../utils/upload";
export type FeedPost = {
  id: string;
  type: string;
  body: string;
  mediaUrl?: string;
  locationLabel?: string;
  createdAt: string;
  reactionCount: number;
  commentCount: number;
  myReaction?: string;
  isFollowing?: boolean;
  followerCount?: number;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
};
export type FeedComment = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string; displayName?: string; avatarUrl?: string };
};
export type RelationshipCounts = { followerCount: number; followingCount: number };
export type SocialProfileSummary = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  city?: string;
  playStyle?: string[];
};
export type SocialProfilePage = {
  items: SocialProfileSummary[];
  total: number;
  page: number;
  totalPages: number;
};
export const socialService = {
  async feed(following = false) {
    return (
      await apiClient.get<{ items: FeedPost[] }>("/feed", {
        params: following ? { following: "true" } : undefined,
      })
    ).data.items;
  },
  async create(data: {
    type: string;
    body: string;
    mediaUrl?: string;
    locationLabel?: string;
  }) {
    return (await apiClient.post("/feed", data)).data;
  },
  async upload(uri: string, mimeType?: string) {
    const name = uri.split("/").pop() || "field-media";
    const form = new FormData();
    form.append("file", await toUploadPart(uri, name, mimeType || "image/jpeg"));
    return (await apiClient.post<{ mediaUrl: string }>("/feed/upload", form)).data;
  },
  async react(id: string, type = "hype") {
    return (await apiClient.post(`/feed/${id}/reactions`, { type })).data;
  },
  async comments(id: string) {
    return (await apiClient.get<FeedComment[]>(`/feed/${id}/comments`)).data;
  },
  async comment(id: string, body: string) {
    return (await apiClient.post(`/feed/${id}/comments`, { body })).data;
  },
  async follow(userId: string) {
    return (await apiClient.post<{ active: boolean }>(`/feed/users/${userId}/follow`)).data;
  },
  async relationship(userId: string) {
    return (await apiClient.get<RelationshipCounts>(`/feed/users/${userId}/relationship`)).data;
  },
  async followers(userId: string, page = 1) {
    return (await apiClient.get<SocialProfilePage>(`/feed/users/${userId}/followers`, { params: { page } })).data;
  },
  async followingOf(userId: string, page = 1) {
    return (await apiClient.get<SocialProfilePage>(`/feed/users/${userId}/following`, { params: { page } })).data;
  },
  async myFollowing() {
    return (await apiClient.get<{ followingId: string }[]>("/feed/following")).data;
  },
};
