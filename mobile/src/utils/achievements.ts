// Real, automatically-computed achievements — every one of these reflects
// something actually true about the account (verified, gear logged, a
// team joined, etc.), not a manually-typed claim. Blended with a player's
// own custom entries in AchievementsCard.
export interface AchievementSource {
  user?: {
    isVerified?: boolean;
    avatarUrl?: string;
    bannerUrl?: string;
    displayName?: string;
    bio?: string;
    city?: string;
    homeField?: string;
    favoritePosition?: string;
    skillLevel?: string;
    playStyle?: string[];
  } | null;
  bag?: { items?: any[] } | null;
  team?: { name: string } | null;
  upcomingEvents?: any[];
  listings?: any[];
  isPro?: boolean;
}

export interface Achievement {
  key: string;
  primary: string;
  secondary?: string;
}

export function computeAutoAchievements(src: AchievementSource): Achievement[] {
  const out: Achievement[] = [];
  const u = src.user;

  if (u?.isVerified) {
    out.push({ key: "verified", primary: "Verified Player", secondary: "Confirmed account" });
  }

  if (u) {
    const fields = [
      u.avatarUrl,
      u.bannerUrl,
      u.displayName,
      u.bio,
      u.city,
      u.homeField,
      u.favoritePosition,
      u.skillLevel,
      u.playStyle?.length,
    ];
    if (fields.every(Boolean)) {
      out.push({ key: "profile_complete", primary: "Profile Complete", secondary: "100% filled out" });
    }
  }

  const gearCount = src.bag?.items?.length || 0;
  if (gearCount > 0) {
    out.push({
      key: "gearbag_started",
      primary: "Gearbag Started",
      secondary: `${gearCount} item${gearCount === 1 ? "" : "s"} logged`,
    });
  }

  if (src.team) {
    out.push({ key: "team_player", primary: "Team Player", secondary: src.team.name });
  }

  const listingCount = src.listings?.length || 0;
  if (listingCount > 0) {
    out.push({
      key: "marketplace_seller",
      primary: "Marketplace Seller",
      secondary: `${listingCount} listing${listingCount === 1 ? "" : "s"}`,
    });
  }

  if ((src.upcomingEvents?.length || 0) > 0) {
    out.push({ key: "event_goer", primary: "Event Goer", secondary: "RSVP'd to an event" });
  }

  if (src.isPro) {
    out.push({ key: "pro_member", primary: "PBG Pro", secondary: "Supporting the platform" });
  }

  return out;
}
