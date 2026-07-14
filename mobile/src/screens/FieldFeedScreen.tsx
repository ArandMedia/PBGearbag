import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "../utils/alert";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { useAuth } from "../store/AuthContext";
import {
  FeedComment,
  FeedPost,
  socialService,
} from "../services/social.service";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";
import { hexToRgba } from "../utils/color";
const INK = "#0A0E0F",
  PANEL = "#121819";
const postTypes = [
  ["clip", "Game clip"],
  ["event_moment", "Event moment"],
  ["field_report", "Field report"],
  ["gear_check", "Gear check"],
  ["photo", "Photo"],
  ["story", "Story"],
];
function Avatar({
  name,
  url,
  size = 38,
}: {
  name: string;
  url?: string;
  size?: number;
}) {
  const { accent } = useTheme();
  return url ? (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius: size / 3 }}
    />
  ) : (
    <View
      style={[s.avatar, { width: size, height: size, borderRadius: size / 3 }]}
    >
      <Text style={[s.avatarText, { color: accent }]}>{name.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}
function PostCard({
  post,
  reload,
  onProfile,
  currentUserId,
}: {
  post: FeedPost;
  reload: () => void;
  onProfile: (id: string) => void;
  currentUserId?: string;
}) {
  const { accent: TURF } = useTheme();
  const [open, setOpen] = useState(false),
    [comments, setComments] = useState<FeedComment[]>([]),
    [comment, setComment] = useState("");
  const isVideo =
    !!post.mediaUrl && /\.(mp4|mov|webm)(\?|$)/i.test(post.mediaUrl);
  const toggle = async () => {
    if (!open) setComments(await socialService.comments(post.id));
    setOpen(!open);
  };
  const refreshComments = async () => setComments(await socialService.comments(post.id));
  const removePost = () => {
    Alert.alert("Delete this post?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await socialService.deletePost(post.id);
          reload();
        },
      },
    ]);
  };
  const removeComment = (id: string) => {
    Alert.alert("Delete this comment?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await socialService.deleteComment(id);
          await refreshComments();
          reload();
        },
      },
    ]);
  };
  return (
    <View style={s.post}>
      <Pressable style={s.postHead} onPress={() => onProfile(post.author.id)}>
        <Avatar
          name={post.author.displayName || post.author.username}
          url={post.author.avatarUrl}
        />
        <View style={{ flex: 1 }}>
          <Text style={s.author}>
            {post.author.displayName || post.author.username}
          </Text>
          <Text style={s.postMeta}>
            @{post.author.username} •{" "}
            {new Date(post.createdAt).toLocaleDateString()}
            {post.locationLabel ? `  •  ${post.locationLabel}` : ""}
          </Text>
        </View>
        <Pressable
          style={[
            s.followButton,
            post.isFollowing && { backgroundColor: TURF, borderColor: TURF },
          ]}
          onPress={async () => {
            await socialService.follow(post.author.id);
            reload();
          }}
        >
          <Text style={[s.followText, { color: TURF }, post.isFollowing && s.followingText]}>
            {post.isFollowing ? "FOLLOWING" : "FOLLOW"}
          </Text>
        </Pressable>
        <Text style={[s.typeBadge, { color: TURF }]}>
          {post.type.replace("_", " ").toUpperCase()}
        </Text>
        {currentUserId === post.author.id && (
          <Pressable style={s.deleteButton} onPress={removePost}>
            <Ionicons name="trash-outline" color="#7C8783" size={16} />
          </Pressable>
        )}
      </Pressable>
      <Text style={s.postBody}>{post.body}</Text>
      {post.mediaUrl &&
        (isVideo ? (
          <Video
            source={{ uri: post.mediaUrl }}
            style={s.media}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        ) : (
          <Image source={{ uri: post.mediaUrl }} style={s.media} />
        ))}
      <View style={s.engagement}>
        <Pressable
          style={[
            s.engage,
            !!post.myReaction && { backgroundColor: hexToRgba(TURF, 0.08) },
          ]}
          onPress={async () => {
            await socialService.react(post.id);
            reload();
          }}
        >
          <Ionicons
            name={post.myReaction ? "flame" : "flame-outline"}
            color={post.myReaction ? TURF : "#7C8783"}
            size={18}
          />
          <Text style={[s.engageText, !!post.myReaction && { color: TURF }]}>
            {post.reactionCount} HYPE
          </Text>
        </Pressable>
        <Pressable style={s.engage} onPress={toggle}>
          <Ionicons name="chatbubble-outline" color="#7C8783" size={17} />
          <Text style={s.engageText}>{post.commentCount} REPLIES</Text>
        </Pressable>
        <Pressable
          style={s.engage}
          onPress={() =>
            Share.share({ message: `${post.body}\n\nShared from PBGearbag` })
          }
        >
          <Ionicons name="share-outline" color="#7C8783" size={18} />
          <Text style={s.engageText}>SHARE</Text>
        </Pressable>
      </View>
      {open && (
        <View style={s.comments}>
          {comments.map((x) => (
            <View key={x.id} style={s.comment}>
              <Avatar
                name={x.author.displayName || x.author.username}
                url={x.author.avatarUrl}
                size={28}
              />
              <View style={s.commentBubble}>
                <View style={s.commentBubbleHead}>
                  <Text style={s.commentAuthor}>
                    {x.author.displayName || x.author.username}
                  </Text>
                  {currentUserId === x.author.id && (
                    <Pressable onPress={() => removeComment(x.id)}>
                      <Ionicons name="trash-outline" color="#66716D" size={13} />
                    </Pressable>
                  )}
                </View>
                <Text style={s.commentBody}>{x.body}</Text>
              </View>
            </View>
          ))}
          <View style={s.commentComposer}>
            <TextInput
              style={s.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add to the conversation…"
              placeholderTextColor="#66716D"
            />
            <Pressable
              disabled={!comment.trim()}
              onPress={async () => {
                await socialService.comment(post.id, comment.trim());
                setComment("");
                setComments(await socialService.comments(post.id));
                reload();
              }}
            >
              <Ionicons
                name="send"
                color={comment.trim() ? TURF : "#52605A"}
                size={19}
              />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
export default function FieldFeedScreen({ navigation }: any) {
  const { user } = useAuth();
  const { accent: TURF } = useTheme();
  const [posts, setPosts] = useState<FeedPost[]>([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [composing, setComposing] = useState(false),
    [body, setBody] = useState(""),
    [type, setType] = useState("clip"),
    [media, setMedia] = useState<{ uri: string; mimeType?: string } | null>(
      null,
    ),
    [posting, setPosting] = useState(false),
    [feedMode, setFeedMode] = useState<"forYou" | "following">("forYou");
  const load = async () => {
    try {
      setPosts(await socialService.feed(feedMode === "following"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    load();
  }, [feedMode]);
  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      videoMaxDuration: 90,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      setMedia({ uri: a.uri, mimeType: a.mimeType });
    }
  };
  const publish = async () => {
    if (!body.trim()) return;
    setPosting(true);
    try {
      let mediaUrl;
      if (media)
        mediaUrl = (await socialService.upload(media.uri, media.mimeType))
          .mediaUrl;
      await socialService.create({ type, body: body.trim(), mediaUrl });
      setBody("");
      setMedia(null);
      setComposing(false);
      await load();
    } finally {
      setPosting(false);
    }
  };
  return (
    <ScrollView
      style={s.page}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={TURF}
        />
      }
    >
      <View style={s.feedHero}>
        <Text style={[s.kicker, { color: TURF }]}>FIELD FEED</Text>
        <Text style={s.title}>Paintball, as it happened.</Text>
        <Text style={s.subtitle}>
          Clips, field reports, gear, and the moments worth talking about.
        </Text>
      </View>
      <View style={s.composer}>
        <View style={s.composerTop}>
          <Avatar
            name={user?.displayName || user?.username || "P"}
            url={user?.avatarUrl}
          />
          <Pressable style={s.prompt} onPress={() => setComposing(true)}>
            <Text style={s.promptText}>Share something from the field…</Text>
          </Pressable>
          <Pressable
            style={s.mediaButton}
            onPress={() => {
              setComposing(true);
              pick();
            }}
          >
            <Ionicons name="videocam-outline" color={TURF} size={21} />
          </Pressable>
        </View>
        {composing && (
          <View style={s.composerOpen}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.types}
            >
              {postTypes.map(([v, l]) => (
                <Pressable
                  key={v}
                  onPress={() => setType(v)}
                  style={[
                    s.type,
                    type === v && s.typeOn,
                    type === v && { backgroundColor: hexToRgba(TURF, 0.1) },
                  ]}
                >
                  <Text style={[s.typeText, type === v && { color: TURF }]}>
                    {l}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={s.bodyInput}
              multiline
              value={body}
              onChangeText={setBody}
              autoFocus
              placeholder="What happened? Give players the story behind it."
              placeholderTextColor="#68736F"
            />
            {media && (
              <View style={s.mediaReady}>
                <Ionicons
                  name={
                    media.mimeType?.startsWith("video") ? "videocam" : "image"
                  }
                  color={TURF}
                  size={17}
                />
                <Text style={s.mediaReadyText}>Media ready to upload</Text>
                <Pressable onPress={() => setMedia(null)}>
                  <Ionicons name="close" color="#9AA4A0" size={18} />
                </Pressable>
              </View>
            )}
            <View style={s.composerActions}>
              <Pressable style={s.addMedia} onPress={pick}>
                <Ionicons name="add-circle-outline" color="#AAB3AF" size={18} />
                <Text style={s.addMediaText}>Photo or video</Text>
              </Pressable>
              <Pressable
                disabled={!body.trim() || posting}
                style={[
                  s.publish,
                  { backgroundColor: TURF },
                  (!body.trim() || posting) && { opacity: 0.45 },
                ]}
                onPress={publish}
              >
                {posting ? (
                  <ActivityIndicator color="#10140D" />
                ) : (
                  <Text style={s.publishText}>POST TO THE FIELD</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>
      <View style={s.feedTabs}>
        <Pressable
          onPress={() => setFeedMode("forYou")}
          style={[
            s.feedTab,
            feedMode === "forYou" && { borderBottomColor: TURF },
          ]}
        >
          <Text
            style={[s.feedTabText, feedMode === "forYou" && { color: TURF }]}
          >
            FOR YOU
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFeedMode("following")}
          style={[
            s.feedTab,
            feedMode === "following" && { borderBottomColor: TURF },
          ]}
        >
          <Text
            style={[s.feedTabText, feedMode === "following" && { color: TURF }]}
          >
            FOLLOWING
          </Text>
        </Pressable>
      </View>
      <View style={s.feedLabel}>
        <Text style={s.feedLabelText}>LATEST FROM THE COMMUNITY</Text>
        <Text style={s.feedCount}>{posts.length} POSTS</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={TURF} size="large" />
      ) : posts.length ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            reload={load}
            currentUserId={user?.id}
            onProfile={(id) =>
              navigation.getParent()?.navigate("PublicProfile", { userId: id })
            }
          />
        ))
      ) : (
        <View style={s.empty}>
          <Ionicons name="videocam-outline" color={TURF} size={33} />
          <Text style={s.emptyTitle}>The field is quiet—for now.</Text>
          <Text style={s.emptyBody}>
            Post the first clip, photo, or field report.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: INK },
  content: {
    width: "94%",
    maxWidth: 900,
    alignSelf: "center",
    paddingTop: 27,
    paddingBottom: 90,
  },
  feedHero: { marginBottom: 22 },
  kicker: { color: DEFAULT_ACCENT, fontSize: 9, fontWeight: "900", letterSpacing: 1.6 },
  title: {
    color: "#F3F1E8",
    fontSize: 35,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 5,
  },
  subtitle: { color: "#85908C", fontSize: 14, marginTop: 6 },
  composer: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#2A3431",
    borderRadius: 15,
    padding: 14,
  },
  composerTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    backgroundColor: "#263128",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: DEFAULT_ACCENT, fontWeight: "900", fontSize: 11 },
  prompt: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: "#313B38",
    borderRadius: 21,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  promptText: { color: "#7C8783", fontSize: 12 },
  mediaButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#1A231D",
    alignItems: "center",
    justifyContent: "center",
  },
  composerOpen: {
    borderTopWidth: 1,
    borderTopColor: "#29322F",
    marginTop: 13,
    paddingTop: 12,
  },
  types: { gap: 6, paddingBottom: 10 },
  type: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#303A37",
    borderRadius: 14,
  },
  typeOn: { borderColor: "#6F8D35" },
  typeText: { color: "#7C8783", fontSize: 9, fontWeight: "800" },
  bodyInput: {
    minHeight: 95,
    color: "#E0E5E2",
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
    padding: 5,
  },
  mediaReady: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#182119",
    padding: 10,
    borderRadius: 8,
  },
  mediaReadyText: {
    flex: 1,
    color: "#AAB3AF",
    fontSize: 11,
    fontWeight: "700",
  },
  composerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  addMedia: { flexDirection: "row", alignItems: "center", gap: 6 },
  addMediaText: { color: "#AAB3AF", fontSize: 10, fontWeight: "800" },
  publish: {
    backgroundColor: DEFAULT_ACCENT,
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  publishText: {
    color: "#10140D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  feedLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 10,
  },
  feedTabs: {
    flexDirection: "row",
    gap: 4,
    marginTop: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#29322F",
  },
  feedTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  feedTabText: {
    color: "#68736F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  feedLabelText: {
    color: "#74807B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  feedCount: { color: "#5E6965", fontSize: 8, fontWeight: "900" },
  post: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#2A3431",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 13,
  },
  postHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  author: { color: "#E0E5E2", fontSize: 12, fontWeight: "900" },
  postMeta: { color: "#66716D", fontSize: 9, marginTop: 3 },
  followButton: {
    borderWidth: 1,
    borderColor: "#526B32",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginRight: 6,
  },
  followText: {
    color: DEFAULT_ACCENT,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  followingText: { color: "#10140D" },
  typeBadge: {
    color: DEFAULT_ACCENT,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    borderWidth: 1,
    borderColor: "#40502E",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 5,
  },
  postBody: {
    color: "#C6CECA",
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 14,
    paddingBottom: 13,
  },
  media: { width: "100%", height: 450, backgroundColor: "#080B0C" },
  engagement: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#29322F",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  engage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  engageText: {
    color: "#7C8783",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  comments: { borderTopWidth: 1, borderTopColor: "#29322F", padding: 12 },
  comment: { flexDirection: "row", gap: 8, marginBottom: 9 },
  commentBubble: {
    flex: 1,
    backgroundColor: "#0D1213",
    borderRadius: 10,
    padding: 9,
  },
  deleteButton: { padding: 4, marginLeft: 4 },
  commentBubbleHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commentAuthor: { color: "#C9D0CC", fontSize: 10, fontWeight: "900" },
  commentBody: { color: "#9DA7A2", fontSize: 11, marginTop: 3 },
  commentComposer: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#303A37",
    borderRadius: 10,
    paddingHorizontal: 11,
  },
  commentInput: { flex: 1, color: "#E0E5E2", fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 70 },
  emptyTitle: {
    color: "#F3F1E8",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyBody: { color: "#7A8581", fontSize: 12, marginTop: 5 },
});
