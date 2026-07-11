import "dotenv/config";
import * as bcrypt from "bcryptjs";
import dataSource from "./typeorm.config";
import { User, UserRole } from "../users/entities/user.entity";
import {
  ItemCondition,
  Listing,
  ListingCategory,
  ListingStatus,
} from "../marketplace/entities/listing.entity";
import {
  CommunityEvent,
  Conversation,
  ConversationParticipant,
  ConversationType,
  EventStatus,
  Gearbag,
  GearItem,
  Message,
  Notification,
  Organization,
  OrganizationType,
  Team,
  TeamMember,
  TeamMemberRole,
  Visibility,
} from "../community/entities/community.entity";
import { PostType, SocialPost } from "../social/social.entity";

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const listings = dataSource.getRepository(Listing);
  const gearbags = dataSource.getRepository(Gearbag),
    gearItems = dataSource.getRepository(GearItem),
    teams = dataSource.getRepository(Team),
    members = dataSource.getRepository(TeamMember),
    orgs = dataSource.getRepository(Organization),
    events = dataSource.getRepository(CommunityEvent),
    conversations = dataSource.getRepository(Conversation),
    participants = dataSource.getRepository(ConversationParticipant),
    messages = dataSource.getRepository(Message),
    notifications = dataSource.getRepository(Notification);
  const socialPosts = dataSource.getRepository(SocialPost);
  let demo = await users.findOne({ where: { email: "demo@pbgearbag.com" } });
  if (!demo) {
    demo = await users.save(
      users.create({
        email: "demo@pbgearbag.com",
        username: "demo_player",
        password: await bcrypt.hash("Paintball123!", 12),
        firstName: "Demo",
        lastName: "Player",
        displayName: "Demo Player",
        city: "St. Louis",
        stateProvince: "MO",
        bio: "Weekend paintball player, gear tinkerer, and scenario-game regular.",
        roles: [UserRole.USER],
      }),
    );
  }
  await users.update(demo.id, {
    isVerified: true,
    emailVerifiedAt: demo.emailVerifiedAt || new Date(),
    ageConfirmed: true,
    termsAcceptedAt: demo.termsAcceptedAt || new Date(),
  });
  let scout = await users.findOne({ where: { email: "scout@pbgearbag.com" } });
  if (!scout)
    scout = await users.save(
      users.create({
        email: "scout@pbgearbag.com",
        username: "midwest_scout",
        password: await bcrypt.hash("Paintball123!", 12),
        displayName: "Midwest Scout",
        city: "Kansas City",
        stateProvince: "MO",
        bio: "Scenario player and regional event organizer.",
        roles: [UserRole.USER],
      }),
    );
  await users.update(scout.id, {
    isVerified: true,
    emailVerifiedAt: scout.emailVerifiedAt || new Date(),
    ageConfirmed: true,
    termsAcceptedAt: scout.termsAcceptedAt || new Date(),
  });
  let admin = await users.findOne({ where: { email: "admin@pbgearbag.com" } });
  if (!admin)
    admin = await users.save(
      users.create({
        email: "admin@pbgearbag.com",
        username: "pbg_admin",
        password: await bcrypt.hash("Paintball123!", 12),
        displayName: "PBG Moderation",
        roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
        isVerified: true,
      }),
    );
  await users.update(admin.id, {
    isVerified: true,
    emailVerifiedAt: admin.emailVerifiedAt || new Date(),
    ageConfirmed: true,
    termsAcceptedAt: admin.termsAcceptedAt || new Date(),
  });
  if ((await listings.count({ where: { sellerId: demo.id } })) === 0) {
    const media =
      process.env.SEED_MEDIA_URL || "http://localhost:3000/uploads/seed";
    await listings.save([
      listings.create({
        sellerId: demo.id,
        title: "Tournament Marker — Field Ready",
        description:
          "Clean, maintained marker with a fresh battery and recent service. Includes barrel and case.",
        category: ListingCategory.MARKER,
        brand: "Planet Eclipse",
        model: "CS3",
        condition: ItemCondition.EXCELLENT,
        price: 649,
        isNegotiable: true,
        acceptsTrades: true,
        images: [`${media}/marker-field.jpg`],
        city: "St. Louis",
        stateProvince: "MO",
        country: "USA",
        status: ListingStatus.ACTIVE,
      }),
      listings.create({
        sellerId: demo.id,
        title: "Thermal Paintball Mask",
        description:
          "Dual-pane thermal lens, soft ears, and a clean foam seal. Used for one season.",
        category: ListingCategory.MASK,
        brand: "JT",
        model: "Proflex",
        condition: ItemCondition.GOOD,
        price: 95,
        isNegotiable: true,
        acceptsTrades: false,
        images: [`${media}/mask-field.jpg`],
        city: "St. Louis",
        stateProvince: "MO",
        country: "USA",
        status: ListingStatus.ACTIVE,
      }),
    ]);
  } else {
    const media =
      process.env.SEED_MEDIA_URL || "http://localhost:3000/uploads/seed";
    await listings.update(
      { sellerId: demo.id, title: "Tournament Marker — Field Ready" },
      {
        brand: "Planet Eclipse",
        model: "CS3",
        images: [`${media}/marker-field.jpg`],
      },
    );
    await listings.update(
      { sellerId: demo.id, title: "Thermal Paintball Mask" },
      { brand: "JT", model: "Proflex", images: [`${media}/mask-field.jpg`] },
    );
  }
  let bag = await gearbags.findOne({
    where: { ownerId: demo.id, isPrimary: true },
  });
  if (!bag)
    bag = await gearbags.save(
      gearbags.create({
        ownerId: demo.id,
        name: "Tournament Setup",
        description: "My field-ready speedball rotation.",
        visibility: Visibility.PUBLIC,
        isPrimary: true,
      }),
    );
  if ((await gearItems.count({ where: { gearbagId: bag.id } })) === 0)
    await gearItems.save([
      gearItems.create({
        gearbagId: bag.id,
        ownerId: demo.id,
        name: "Primary Marker",
        category: "marker",
        manufacturer: "Planet Eclipse",
        model: "CS3",
        condition: "excellent",
        color: "Graphite / Lime",
        notes: "Serviced before every event.",
      }),
      gearItems.create({
        gearbagId: bag.id,
        ownerId: demo.id,
        name: "Tournament Mask",
        category: "mask",
        manufacturer: "JT",
        model: "Proflex",
        condition: "good",
        color: "Black",
        serviceDueAt: new Date(Date.now() + 45 * 86400000),
      }),
      gearItems.create({
        gearbagId: bag.id,
        ownerId: demo.id,
        name: "Air System",
        category: "tank",
        manufacturer: "Ninja",
        model: "SL2 77/4500",
        condition: "excellent",
      }),
    ]);
  let field = await orgs.findOne({ where: { slug: "gateway-action-sports" } });
  if (!field)
    field = await orgs.save(
      orgs.create({
        slug: "gateway-action-sports",
        name: "Gateway Action Sports",
        type: OrganizationType.FIELD,
        description:
          "Tournament and recreational paintball with air, rentals, pro shop, and seasonal events.",
        city: "Wentzville",
        region: "MO",
        country: "USA",
        isVerified: true,
        claimedById: scout.id,
        images: ["http://localhost:3000/uploads/seed/marker-field.jpg"],
        details: {
          formats: ["speedball", "open play", "scenario"],
          air: "4500 PSI",
          byop: true,
          amenities: ["parking", "pro shop", "air", "rentals"],
        },
      }),
    );
  if (!(await orgs.exist({ where: { slug: "midwest-airsmith-lab" } })))
    await orgs.save(
      orgs.create({
        slug: "midwest-airsmith-lab",
        name: "Midwest Airsmith Lab",
        type: OrganizationType.AIRSMITH,
        description: "Marker repair, tuning, and regulator service.",
        city: "St. Louis",
        region: "MO",
        country: "USA",
        isVerified: true,
        claimedById: scout.id,
        details: { services: ["repair", "tuning", "annual service"] },
      }),
    );
  let team = await teams.findOne({ where: { slug: "gateway-breakout" } });
  if (!team)
    team = await teams.save(
      teams.create({
        slug: "gateway-breakout",
        name: "Gateway Breakout",
        ownerId: scout.id,
        teamType: "speedball",
        description:
          "Competitive Midwest squad focused on mechanical and regional events.",
        city: "St. Louis",
        region: "MO",
        country: "USA",
        homeFieldId: field.id,
        isRecruiting: true,
        contactEnabled: true,
        bannerUrl: "http://localhost:3000/uploads/seed/marker-field.jpg",
      }),
    );
  if (!(await members.exist({ where: { teamId: team.id, userId: scout.id } })))
    await members.save({
      teamId: team.id,
      userId: scout.id,
      role: TeamMemberRole.OWNER,
      isActive: true,
    });
  if (!(await members.exist({ where: { teamId: team.id, userId: demo.id } })))
    await members.save({
      teamId: team.id,
      userId: demo.id,
      role: TeamMemberRole.PLAYER,
      isActive: true,
    });
  const nextMonth = new Date();
  nextMonth.setUTCDate(nextMonth.getUTCDate() + 30);
  nextMonth.setUTCHours(14, 0, 0, 0);
  const end = new Date(nextMonth.getTime() + 9 * 3600000);
  let event = await events.findOne({
    where: { slug: "midwest-scenario-weekend" },
  });
  if (!event)
    event = await events.save(
      events.create({
        slug: "midwest-scenario-weekend",
        title: "Midwest Scenario Weekend",
        organizerId: scout.id,
        organizationId: field.id,
        eventType: "scenario",
        status: EventStatus.PUBLISHED,
        description:
          "Two-day scenario game with camping, missions, team registration, and evening activities.",
        rules:
          "Field chronograph and full-mask rules apply. Review the organizer packet before arrival.",
        startsAt: nextMonth,
        endsAt: end,
        timezone: "America/Chicago",
        city: "Wentzville",
        region: "MO",
        country: "USA",
        registrationUrl: "https://example.com/register",
        costCents: 6500,
        capacity: 300,
        bannerUrl: "http://localhost:3000/uploads/seed/marker-field.jpg",
      }),
    );
  if ((await notifications.count({ where: { userId: demo.id } })) === 0)
    await notifications.save([
      notifications.create({
        userId: demo.id,
        type: "event_reminder",
        title: "Scenario weekend is one month out",
        body: "Midwest Scenario Weekend is now open for RSVPs.",
        actionUrl: `/events/${event.slug}`,
        data: { eventId: event.id },
      }),
      notifications.create({
        userId: demo.id,
        type: "marketplace",
        title: "Your marker listing is getting attention",
        body: "Players viewed your listing this week.",
        actionUrl: "/marketplace",
        data: {},
      }),
    ]);
  let conversation = await conversations.findOne({
    where: { subject: "Midwest Scenario Weekend planning" },
  });
  if (!conversation) {
    conversation = await conversations.save(
      conversations.create({
        type: ConversationType.DIRECT,
        subject: "Midwest Scenario Weekend planning",
        createdById: scout.id,
        lastMessageAt: new Date(),
      }),
    );
    await participants.save([
      { conversationId: conversation.id, userId: scout.id },
      { conversationId: conversation.id, userId: demo.id },
    ]);
    await messages.save([
      messages.create({
        conversationId: conversation.id,
        senderId: scout.id,
        body: "Are you bringing the team to scenario weekend?",
      }),
      messages.create({
        conversationId: conversation.id,
        senderId: demo.id,
        body: "Yes—we are finalizing our roster this week.",
      }),
    ]);
  }
  if ((await socialPosts.count()) === 0)
    await socialPosts.save([
      socialPosts.create({
        authorId: scout.id,
        type: PostType.EVENT_MOMENT,
        body: "Sunrise walk-through at Gateway before the first game. Fresh layout, dry turf, and a full day ahead.",
        mediaUrl: "http://localhost:3000/uploads/seed/marker-field.jpg",
        locationLabel: "Gateway Action Sports",
      }),
      socialPosts.create({
        authorId: demo.id,
        type: PostType.GEAR_CHECK,
        body: "Finished the pre-event service on the primary setup. Fresh battery, clean eyes, reg checked, and ready for the weekend.",
        mediaUrl: "http://localhost:3000/uploads/seed/mask-field.jpg",
        locationLabel: "St. Louis, MO",
      }),
    ]);
  console.log("Seed complete. Demo login: demo@pbgearbag.com / Paintball123!");
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
