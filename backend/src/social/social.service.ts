import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import {
  PostType,
  ReactionType,
  SocialComment,
  SocialFollow,
  SocialPost,
  SocialReaction,
  UserBlock,
} from "./social.entity";

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(SocialPost) private posts: Repository<SocialPost>,
    @InjectRepository(SocialReaction)
    private reactions: Repository<SocialReaction>,
    @InjectRepository(SocialComment)
    private comments: Repository<SocialComment>,
    @InjectRepository(SocialFollow) private follows: Repository<SocialFollow>,
    @InjectRepository(UserBlock) private blocks: Repository<UserBlock>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}
  async feed(userId: string, page = 1, limit = 20, onlyFollowing = false) {
    const follows = onlyFollowing
      ? await this.follows.find({ where: { followerId: userId }, take: 100 })
      : [];
    if (onlyFollowing && !follows.length)
      return { items: [], total: 0, page, totalPages: 0 };
    const [items, total] = await this.posts
      .createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .select([
        "post",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatarUrl",
        "author.playStyle",
        "author.isVerified",
      ])
      .where(
        onlyFollowing ? "post.authorId IN (:...following)" : "1=1",
        onlyFollowing ? { following: follows.map((x) => x.followingId) } : {},
      )
      .orderBy("post.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const ids = items.map((x) => x.id);
    if (!ids.length) return { items: [], total, page, totalPages: 0 };
    const reactionRows = await this.reactions
      .createQueryBuilder("r")
      .select("r.postId", "postId")
      .addSelect("COUNT(*)", "count")
      .where("r.postId IN (:...ids)", { ids })
      .groupBy("r.postId")
      .getRawMany();
    const commentRows = await this.comments
      .createQueryBuilder("c")
      .select("c.postId", "postId")
      .addSelect("COUNT(*)", "count")
      .where("c.postId IN (:...ids)", { ids })
      .groupBy("c.postId")
      .getRawMany();
    const mine = await this.reactions.find({
      where: { postId: In(ids), userId },
    });
    const followed = await this.follows.find({
      where: {
        followerId: userId,
        followingId: In(items.map((x) => x.authorId)),
      },
    });
    const followerRows = await this.follows
      .createQueryBuilder("f")
      .select("f.followingId", "userId")
      .addSelect("COUNT(*)", "count")
      .where("f.followingId IN (:...authors)", {
        authors: items.map((x) => x.authorId),
      })
      .groupBy("f.followingId")
      .getRawMany();
    return {
      items: items.map((post) => ({
        ...post,
        reactionCount: Number(
          reactionRows.find((x) => x.postId === post.id)?.count || 0,
        ),
        commentCount: Number(
          commentRows.find((x) => x.postId === post.id)?.count || 0,
        ),
        myReaction: mine.find((x) => x.postId === post.id)?.type,
        isFollowing: !!followed.find((x) => x.followingId === post.authorId),
        followerCount: Number(
          followerRows.find((x) => x.userId === post.authorId)?.count || 0,
        ),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
  create(
    authorId: string,
    data: {
      type: PostType;
      body: string;
      mediaUrl?: string;
      thumbnailUrl?: string;
      eventId?: string;
      organizationId?: string;
      locationLabel?: string;
    },
  ) {
    return this.posts.save(this.posts.create({ ...data, authorId }));
  }
  async react(userId: string, postId: string, type: ReactionType) {
    if (!(await this.posts.exist({ where: { id: postId } })))
      throw new NotFoundException("Post not found");
    const existing = await this.reactions.findOne({
      where: { postId, userId },
    });
    if (existing) {
      if (existing.type === type) {
        await this.reactions.remove(existing);
        return { active: false };
      }
      existing.type = type;
      await this.reactions.save(existing);
      return { active: true, type };
    }
    await this.reactions.save(this.reactions.create({ postId, userId, type }));
    return { active: true, type };
  }
  commentsFor(postId: string) {
    return this.comments
      .createQueryBuilder("comment")
      .leftJoinAndSelect("comment.author", "author")
      .select([
        "comment",
        "author.id",
        "author.username",
        "author.displayName",
        "author.avatarUrl",
        "author.isVerified",
      ])
      .where("comment.postId = :postId", { postId })
      .orderBy("comment.createdAt", "ASC")
      .take(100)
      .getMany();
  }
  async comment(authorId: string, postId: string, body: string) {
    if (!(await this.posts.exist({ where: { id: postId } })))
      throw new NotFoundException("Post not found");
    return this.comments.save(this.comments.create({ postId, authorId, body }));
  }
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) return { active: false };
    const existing = await this.follows.findOne({
      where: { followerId, followingId },
    });
    if (existing) {
      await this.follows.remove(existing);
      return { active: false };
    }
    if (await this.isBlockedEitherWay(followerId, followingId)) {
      throw new ForbiddenException("You can't follow this player.");
    }
    await this.follows.save(this.follows.create({ followerId, followingId }));
    return { active: true };
  }
  async isBlockedEitherWay(userA: string, userB: string) {
    const count = await this.blocks
      .createQueryBuilder("b")
      .where(
        "(b.blockerId = :userA AND b.blockedId = :userB) OR (b.blockerId = :userB AND b.blockedId = :userA)",
        { userA, userB },
      )
      .getCount();
    return count > 0;
  }
  async isFollowing(followerId: string, followingId: string) {
    return (await this.follows.count({ where: { followerId, followingId } })) > 0;
  }
  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException("You can't block yourself.");
    }
    const existing = await this.blocks.findOne({ where: { blockerId, blockedId } });
    if (existing) return { active: true };
    await this.blocks.save(this.blocks.create({ blockerId, blockedId }));
    await this.follows.delete({ followerId: blockerId, followingId: blockedId });
    await this.follows.delete({ followerId: blockedId, followingId: blockerId });
    return { active: true };
  }
  async unblock(blockerId: string, blockedId: string) {
    await this.blocks.delete({ blockerId, blockedId });
    return { active: false };
  }
  async blockedUsers(blockerId: string) {
    const rows = await this.blocks.find({ where: { blockerId }, order: { createdAt: "DESC" } });
    return this.hydrate(rows.map((r) => r.blockedId));
  }
  following(userId: string) {
    return this.follows.find({
      where: { followerId: userId },
      order: { createdAt: "DESC" },
      take: 100,
    });
  }
  async relationshipCounts(userId: string) {
    const [followerCount, followingCount] = await Promise.all([
      this.follows.count({ where: { followingId: userId } }),
      this.follows.count({ where: { followerId: userId } }),
    ]);
    return { followerCount, followingCount };
  }
  private async hydrate(ids: string[]) {
    if (!ids.length) return [];
    const rows = await this.users
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.username",
        "u.displayName",
        "u.avatarUrl",
        "u.isVerified",
        "u.city",
        "u.playStyle",
      ])
      .where("u.id IN (:...ids)", { ids })
      .getMany();
    const byId = new Map(rows.map((u) => [u.id, u]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }
  async followersList(userId: string, page = 1, limit = 30) {
    const [rows, total] = await this.follows.findAndCount({
      where: { followingId: userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: await this.hydrate(rows.map((r) => r.followerId)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
  async followingList(userId: string, page = 1, limit = 30) {
    const [rows, total] = await this.follows.findAndCount({
      where: { followerId: userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: await this.hydrate(rows.map((r) => r.followingId)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
