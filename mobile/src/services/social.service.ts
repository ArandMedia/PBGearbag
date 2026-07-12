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
    return (await apiClient.post(`/feed/users/${userId}/follow`)).data;
  },
};
