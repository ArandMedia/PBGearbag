import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Alert } from "../utils/alert";
import { Announcement, communityService, Event, Team, TeamGearOrder, Tournament, TournamentEntry, TournamentMatch } from "../services/community.service";
import { billingService } from "../services/billing.service";
import { useAuth } from "../store/AuthContext";
import { useTheme, DEFAULT_ACCENT } from "../store/ThemeContext";
import { hexToRgba } from "../utils/color";

const AMENITY_LABELS: Record<string, string> = {
  rentals: "Rental equipment",
  air: "Compressed air fills",
  "4500": "4500 PSI fills",
  "3000": "3000 PSI fills",
  parking: "Parking",
  "pro shop": "Pro shop",
  wheelchair: "Accessible facilities",
  restrooms: "Restrooms",
  concessions: "Concessions",
  lodging: "On-site lodging",
  camping: "Camping",
};

function RsvpButton({
  label,
  active,
  onPress,
  busy,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  busy: boolean;
}) {
  const { accent } = useTheme();
  return (
    <Pressable
      style={[s.rsvpBtn, active && { backgroundColor: accent, borderColor: accent }]}
      onPress={onPress}
      disabled={busy}
    >
      {busy && active ? (
        <ActivityIndicator size="small" color="#10140D" />
      ) : (
        <Text style={[s.rsvpBtnText, active && s.rsvpBtnTextActive]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const SOURCE_TYPE: Record<string, "organization" | "event" | "team"> = {
  field: "organization",
  event: "event",
  team: "team",
};

export default function CommunityEntityScreen({ route, navigation }: any) {
  const { kind, slug } = route.params || {};
  const { user } = useAuth();
  const { accent } = useTheme();
  const [data, setData] = useState<any>();
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnounceForm, setShowAnnounceForm] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceBody, setAnnounceBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [fieldEvents, setFieldEvents] = useState<Event[]>([]);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimNote, setClaimNote] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimSent, setClaimSent] = useState(false);
  const [practices, setPractices] = useState<Event[]>([]);
  const [practicesOwnerIsPro, setPracticesOwnerIsPro] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [practiceTitle, setPracticeTitle] = useState("");
  const [practiceStart, setPracticeStart] = useState("");
  const [practiceEnd, setPracticeEnd] = useState("");
  const [practiceDescription, setPracticeDescription] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [practiceGoing, setPracticeGoing] = useState<Record<string, boolean>>({});
  const [practiceRsvpBusy, setPracticeRsvpBusy] = useState<string | null>(null);
  const [tournamentData, setTournamentData] = useState<{ tournament: Tournament; entries: TournamentEntry[]; matches: TournamentMatch[] } | null>(null);
  const [myManagedTeam, setMyManagedTeam] = useState<(Team & { role: string }) | null>(null);
  const [gearOrders, setGearOrders] = useState<TeamGearOrder[]>([]);
  const [gearOrdersOwnerIsPro, setGearOrdersOwnerIsPro] = useState(false);
  const [showGearOrderForm, setShowGearOrderForm] = useState(false);
  const [goTitle, setGoTitle] = useState("");
  const [goDescription, setGoDescription] = useState("");
  const [goClosesAt, setGoClosesAt] = useState("");
  const [goItems, setGoItems] = useState([{ name: "", price: "", sizes: "" }]);
  const [creatingGearOrder, setCreatingGearOrder] = useState(false);
  const [eventAttendees, setEventAttendees] = useState<{ userId: string; userName: string; status: string; createdAt: string }[] | null>(null);
  const [teamRoster, setTeamRoster] = useState<{ userId: string; userName: string; role: string; joinedAt: string }[]>([]);
  const [teamApplications, setTeamApplications] = useState<{ id: string; userId: string; userName: string; message?: string; status: string; createdAt: string }[]>([]);
  const [decidingApplicationId, setDecidingApplicationId] = useState<string | null>(null);
  const [registeringTournament, setRegisteringTournament] = useState(false);
  const [startingTournament, setStartingTournament] = useState(false);
  const [reportingMatchId, setReportingMatchId] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, { a: string; b: string }>>({});
  const [showHostForm, setShowHostForm] = useState(false);
  const [hostTitle, setHostTitle] = useState("");
  const [hostDescription, setHostDescription] = useState("");
  const [hostStart, setHostStart] = useState("");
  const [hostEnd, setHostEnd] = useState("");
  const [hostMaxTeams, setHostMaxTeams] = useState("");
  const [hosting, setHosting] = useState(false);
  const [hostSent, setHostSent] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; authorId: string; authorName: string; rating: number; body?: string; createdAt: string }[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const load =
      kind === "field"
        ? communityService.organization(slug)
        : kind === "event"
          ? communityService.event(slug)
          : communityService.team(slug);
    load.then(setData).catch(() => navigation?.replace?.("NotFound"));
  }, [kind, slug]);

  useEffect(() => {
    if (!data?.id) return;
    communityService.announcements(SOURCE_TYPE[kind], data.id).then(setAnnouncements).catch(() => {});
    if (kind === "field") {
      communityService
        .followedOrganizations()
        .then((orgs) => setIsFollowing(orgs.some((o) => o.id === data.id)))
        .catch(() => {});
      communityService.organizationEvents(data.id).then(setFieldEvents).catch(() => {});
      communityService
        .organizationReviews(data.id)
        .then(({ items, averageRating: avg, count }) => {
          setReviews(items);
          setAverageRating(avg);
          setReviewCount(count);
        })
        .catch(() => {});
    }
    if (kind === "team") {
      communityService.teamRoster(data.id).then(setTeamRoster).catch(() => {});
      communityService
        .teamMembership(data.id)
        .then((m) => {
          setTeamRole(m.role);
          if (m.role) {
            communityService
              .teamPractices(data.id)
              .then(({ items, ownerIsPro }) => {
                setPractices(items);
                setPracticesOwnerIsPro(ownerIsPro);
              })
              .catch(() => {});
            communityService
              .teamGearOrders(data.id)
              .then(({ items, ownerIsPro }) => {
                setGearOrders(items);
                setGearOrdersOwnerIsPro(ownerIsPro);
              })
              .catch(() => {});
            if (["owner", "manager", "captain"].includes(m.role)) {
              communityService.teamApplications(data.id).then(setTeamApplications).catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
    if (kind === "event" && data.eventType === "tournament") {
      communityService.tournament(data.id).then(setTournamentData).catch(() => {});
      if (user?.id) communityService.myTeam(user.id).then(setMyManagedTeam).catch(() => {});
    }
    if (kind === "event" && data.organizerId === user?.id) {
      communityService.eventAttendees(data.id).then(setEventAttendees).catch(() => {});
    }
  }, [data?.id, kind, data?.eventType, data?.organizerId, user?.id]);

  if (!data)
    return (
      <View style={s.center}>
        <ActivityIndicator color={accent} />
      </View>
    );
  const location = [data.city, data.region, data.country]
    .filter(Boolean)
    .join(", ");
  const rsvp = async (status: "going" | "interested" | "not_going") => {
    setRsvpBusy(true);
    try {
      await communityService.rsvp(data.id, status);
      setRsvpStatus(status);
    } catch (e: any) {
      Alert.alert(
        "Couldn't save your RSVP",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setRsvpBusy(false);
    }
  };
  const toggleFollow = async () => {
    setFollowBusy(true);
    try {
      const { active } = await communityService.followOrganization(data.id);
      setIsFollowing(active);
      setData((d: any) => ({ ...d, followerCount: (d.followerCount || 0) + (active ? 1 : -1) }));
    } catch {
      Alert.alert("Couldn't update follow", "Please try again in a moment.");
    } finally {
      setFollowBusy(false);
    }
  };
  const canAnnounce =
    kind === "field"
      ? data.claimedById === user?.id
      : kind === "event"
        ? data.organizerId === user?.id
        : kind === "team"
          ? ["owner", "manager", "captain"].includes(teamRole || "")
          : false;
  const postAnnouncement = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) return;
    setPosting(true);
    try {
      const created = await communityService.postAnnouncement(SOURCE_TYPE[kind], data.id, {
        title: announceTitle.trim(),
        body: announceBody.trim(),
      });
      setAnnouncements((prev) => [created, ...prev]);
      setAnnounceTitle("");
      setAnnounceBody("");
      setShowAnnounceForm(false);
    } catch {
      Alert.alert("Couldn't post announcement", "Please try again in a moment.");
    } finally {
      setPosting(false);
    }
  };
  const submitClaim = async () => {
    setClaiming(true);
    try {
      await communityService.requestOrganizationClaim(data.id, claimNote.trim() || undefined);
      setClaimSent(true);
      setShowClaimForm(false);
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit claim request",
        e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setClaiming(false);
    }
  };
  const myExistingReview = reviews.find((r) => r.authorId === user?.id);
  const openReviewForm = () => {
    setMyRating(myExistingReview?.rating || 0);
    setReviewBody(myExistingReview?.body || "");
    setShowReviewForm(true);
  };
  const submitReview = async () => {
    if (!myRating) return;
    setSubmittingReview(true);
    try {
      await communityService.submitReview(data.id, { rating: myRating, body: reviewBody.trim() || undefined });
      const refreshed = await communityService.organizationReviews(data.id);
      setReviews(refreshed.items);
      setAverageRating(refreshed.averageRating);
      setReviewCount(refreshed.count);
      setShowReviewForm(false);
    } catch (e: any) {
      Alert.alert(
        "Couldn't submit your review",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };
  const canManageTeam = kind === "team" && ["owner", "manager", "captain"].includes(teamRole || "");
  const decideApplication = async (id: string, status: "approved" | "declined") => {
    setDecidingApplicationId(id);
    try {
      await communityService.decideTeamApplication(id, status);
      setTeamApplications((prev) => prev.filter((a) => a.id !== id));
      if (status === "approved") communityService.teamRoster(data.id).then(setTeamRoster).catch(() => {});
    } catch {
      Alert.alert("Couldn't update this application", "Please try again in a moment.");
    } finally {
      setDecidingApplicationId(null);
    }
  };
  const upgradeTeamPro = async () => {
    try {
      const url = await billingService.startCheckout("monthly");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn't start checkout", "Please try again in a moment.");
    }
  };
  const requireProToSchedule = (): boolean => {
    if (practicesOwnerIsPro) return true;
    if (teamRole === "owner") {
      Alert.alert(
        "Team scheduling is a Pro feature",
        "Scheduling practices for your team requires PBG Pro — $4/mo or $24/yr.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Upgrade", onPress: upgradeTeamPro },
        ],
      );
    } else {
      Alert.alert(
        "Team scheduling is a Pro feature",
        "This team's owner needs an active PBG Pro subscription to unlock scheduling. Ask them to upgrade.",
      );
    }
    return false;
  };
  const openScheduleForm = () => {
    if (!requireProToSchedule()) return;
    setShowScheduleForm(true);
  };
  const requireProToCreateGearOrder = (): boolean => {
    if (gearOrdersOwnerIsPro) return true;
    if (teamRole === "owner") {
      Alert.alert(
        "Team gear orders are a Pro feature",
        "Running gear orders for your team requires PBG Pro — $4/mo or $24/yr.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Upgrade", onPress: upgradeTeamPro },
        ],
      );
    } else {
      Alert.alert(
        "Team gear orders are a Pro feature",
        "This team's owner needs an active PBG Pro subscription to unlock gear orders. Ask them to upgrade.",
      );
    }
    return false;
  };
  const openGearOrderForm = () => {
    if (!requireProToCreateGearOrder()) return;
    setShowGearOrderForm(true);
  };
  const submitGearOrder = async () => {
    const items = goItems
      .map((i) => ({
        name: i.name.trim(),
        priceCents: i.price.trim() ? Math.round(Number(i.price) * 100) : undefined,
        variantOptions: i.sizes.trim() ? i.sizes.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      }))
      .filter((i) => i.name);
    if (!goTitle.trim() || !items.length) return;
    let closesAt: string | undefined;
    if (goClosesAt.trim()) {
      const d = new Date(goClosesAt);
      if (Number.isNaN(d.getTime())) {
        Alert.alert("Check the date", "Closes-by needs a valid date, e.g. \"Aug 1, 2026\".");
        return;
      }
      closesAt = d.toISOString();
    }
    setCreatingGearOrder(true);
    try {
      const { order } = await communityService.createTeamGearOrder(data.id, {
        title: goTitle.trim(),
        description: goDescription.trim() || undefined,
        closesAt,
        items,
      });
      setGearOrders((prev) => [{ ...order, itemCount: items.length }, ...prev]);
      setGoTitle("");
      setGoDescription("");
      setGoClosesAt("");
      setGoItems([{ name: "", price: "", sizes: "" }]);
      setShowGearOrderForm(false);
    } catch (e: any) {
      Alert.alert(
        "Couldn't create gear order",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setCreatingGearOrder(false);
    }
  };
  const submitPractice = async () => {
    if (!practiceTitle.trim() || !practiceStart.trim() || !practiceEnd.trim()) return;
    const startsAt = new Date(practiceStart);
    const endsAt = new Date(practiceEnd);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      Alert.alert("Check the dates", "Start and end need to be valid dates, e.g. \"Aug 1, 2026 6:00 PM\".");
      return;
    }
    setScheduling(true);
    try {
      const created = await communityService.createTeamPractice(data.id, {
        title: practiceTitle.trim(),
        description: practiceDescription.trim() || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setPractices((prev) => [...prev, created].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
      setPracticeTitle("");
      setPracticeStart("");
      setPracticeEnd("");
      setPracticeDescription("");
      setShowScheduleForm(false);
    } catch (e: any) {
      Alert.alert(
        "Couldn't schedule practice",
        e?.response?.data?.error?.message || e?.response?.data?.message || "Please try again in a moment.",
      );
    } finally {
      setScheduling(false);
    }
  };
  const togglePracticeRsvp = async (practiceId: string) => {
    setPracticeRsvpBusy(practiceId);
    try {
      await communityService.rsvp(practiceId, practiceGoing[practiceId] ? "not_going" : "going");
      setPracticeGoing((prev) => ({ ...prev, [practiceId]: !prev[practiceId] }));
    } catch {
      Alert.alert("Couldn't update", "Please try again in a moment.");
    } finally {
      setPracticeRsvpBusy(null);
    }
  };
  const isTournamentOrganizer = kind === "event" && data.eventType === "tournament" && data.organizerId === user?.id;
  const myEntryTeamId = myManagedTeam && ["owner", "manager", "captain"].includes(myManagedTeam.role) ? myManagedTeam.id : null;
  const alreadyRegistered = !!(tournamentData && myEntryTeamId && tournamentData.entries.some((e) => e.teamId === myEntryTeamId));
  const teamName = (entryId?: string) => (entryId ? tournamentData?.entries.find((e) => e.id === entryId)?.teamName || "TBD" : "TBD");
  const registerForTournament = async () => {
    if (!tournamentData || !myEntryTeamId) return;
    setRegisteringTournament(true);
    try {
      const entry = await communityService.registerTournamentTeam(tournamentData.tournament.id, myEntryTeamId);
      setTournamentData((prev) => (prev ? { ...prev, entries: [...prev.entries, { ...entry, teamName: myManagedTeam?.name }] } : prev));
    } catch (e: any) {
      Alert.alert("Couldn't register", e?.response?.data?.message || "Please try again in a moment.");
    } finally {
      setRegisteringTournament(false);
    }
  };
  const startTheTournament = async () => {
    if (!tournamentData) return;
    setStartingTournament(true);
    try {
      const result = await communityService.startTournament(tournamentData.tournament.id);
      setTournamentData(result);
    } catch (e: any) {
      Alert.alert("Couldn't start tournament", e?.response?.data?.message || "Please try again in a moment.");
    } finally {
      setStartingTournament(false);
    }
  };
  const reportResult = async (matchId: string) => {
    const scores = scoreInputs[matchId];
    const a = Number(scores?.a), b = Number(scores?.b);
    if (!scores || Number.isNaN(a) || Number.isNaN(b) || a === b) {
      Alert.alert("Enter valid scores", "Both scores must be numbers and can't be tied.");
      return;
    }
    setReportingMatchId(matchId);
    try {
      const result = await communityService.reportTournamentMatch(matchId, a, b);
      setTournamentData(result);
    } catch (e: any) {
      Alert.alert("Couldn't report result", e?.response?.data?.message || "Please try again in a moment.");
    } finally {
      setReportingMatchId(null);
    }
  };
  const submitHostTournament = async () => {
    if (!hostTitle.trim() || !hostStart.trim() || !hostEnd.trim()) return;
    const startsAt = new Date(hostStart);
    const endsAt = new Date(hostEnd);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      Alert.alert("Check the dates", "Start and end need to be valid dates, e.g. \"Aug 1, 2026 6:00 PM\".");
      return;
    }
    setHosting(true);
    try {
      await communityService.createTournament({
        organizationId: data.id,
        title: hostTitle.trim(),
        description: hostDescription.trim() || undefined,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        maxTeams: hostMaxTeams.trim() ? Number(hostMaxTeams.trim()) : undefined,
      });
      setHostTitle("");
      setHostDescription("");
      setHostStart("");
      setHostEnd("");
      setHostMaxTeams("");
      setHostSent(true);
      setShowHostForm(false);
    } catch (e: any) {
      Alert.alert("Couldn't submit tournament", e?.response?.data?.message || "Please try again in a moment.");
    } finally {
      setHosting(false);
    }
  };
  const amenities: string[] = Array.isArray((data.details as any)?.amenities) ? (data.details as any).amenities : [];
  const hours: string | undefined = (data.details as any)?.hours;
  const openDirections = () => {
    const query =
      data.latitude != null && data.longitude != null
        ? `${data.latitude},${data.longitude}`
        : [data.address, data.city, data.region, data.country].filter(Boolean).join(", ");
    if (!query) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  };
  return (
    <ScrollView style={s.page} contentContainerStyle={s.content}>
      {(data.images?.[0] || data.logoUrl) && (
        <Image source={{ uri: data.images?.[0] || data.logoUrl }} style={s.banner} />
      )}
      <Text style={[s.kicker, { color: accent }]}>{kind?.toUpperCase()}</Text>
      <View style={s.titleRow}>
        <Text style={s.title}>{data.name || data.title}</Text>
        {kind === "field" && (
          <Pressable
            style={[
              s.followBtn,
              { borderColor: hexToRgba(accent, 0.4) },
              isFollowing && { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={toggleFollow}
            disabled={followBusy}
          >
            {followBusy ? (
              <ActivityIndicator size="small" color={isFollowing ? "#10140D" : accent} />
            ) : (
              <Text style={[s.followBtnText, { color: accent }, isFollowing && s.followBtnTextActive]}>
                {isFollowing ? "Following" : "Follow"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
      {kind === "field" && typeof data.followerCount === "number" && (
        <Text style={s.followerCount}>
          {data.followerCount} follower{data.followerCount === 1 ? "" : "s"}
        </Text>
      )}
      {kind === "field" && data.claimedById === user?.id && (
        <Pressable style={s.manageLink} onPress={() => navigation.navigate("EditField", { slug })}>
          <Text style={[s.manageLinkText, { color: accent }]}>Manage listing →</Text>
        </Pressable>
      )}
      <Text style={s.place}>{location}</Text>
      <Text style={s.body}>{data.description}</Text>
      {kind === "event" && (
        <View style={s.rsvpRow}>
          <RsvpButton
            label="GOING"
            active={rsvpStatus === "going"}
            busy={rsvpBusy}
            onPress={() => rsvp("going")}
          />
          <RsvpButton
            label="INTERESTED"
            active={rsvpStatus === "interested"}
            busy={rsvpBusy}
            onPress={() => rsvp("interested")}
          />
          <RsvpButton
            label="CAN'T GO"
            active={rsvpStatus === "not_going"}
            busy={rsvpBusy}
            onPress={() => rsvp("not_going")}
          />
        </View>
      )}
      <View style={s.card}>
        <Text style={s.label}>DETAILS</Text>
        {data.type && <Text style={s.detail}>TYPE · {data.type}</Text>}
        {data.teamType && (
          <Text style={s.detail}>PLAY STYLE · {data.teamType}</Text>
        )}
        {data.eventType && (
          <Text style={s.detail}>FORMAT · {data.eventType}</Text>
        )}
        {kind === "event" && data.costCents != null && (
          <Text style={s.detail}>
            COST ·{" "}
            {data.costCents === 0
              ? "Free"
              : `$${(data.costCents / 100).toFixed(2)}`}
          </Text>
        )}
        {kind === "event" && data.capacity != null && (
          <Text style={s.detail}>CAPACITY · {data.capacity} players</Text>
        )}
        {kind === "event" && data.registrationUrl && (
          <Pressable style={[s.directionsBtn, { borderColor: accent }]} onPress={() => Linking.openURL(data.registrationUrl)}>
            <Text style={[s.directionsBtnText, { color: accent }]}>GET TICKETS ↗</Text>
          </Pressable>
        )}
        {kind === "field" && data.address && (
          <Text style={s.detail}>ADDRESS · {data.address}</Text>
        )}
        {kind === "field" && hours && (
          <Text style={s.detail}>HOURS · {hours}</Text>
        )}
        {kind === "field" && data.websiteUrl && (
          <Text style={s.detail}>WEBSITE · {data.websiteUrl}</Text>
        )}
        {kind === "field" && data.phoneNumber && (
          <Text style={s.detail}>PHONE · {data.phoneNumber}</Text>
        )}
        {kind === "field" && data.contactEmail && (
          <Text style={s.detail}>EMAIL · {data.contactEmail}</Text>
        )}
        {data.isVerified && <Text style={[s.verified, { color: accent }]}>✓ VERIFIED</Text>}
        {data.isRecruiting && (
          <Text style={s.recruiting}>RECRUITING PLAYERS</Text>
        )}
        {kind === "field" && (data.latitude != null || data.address) && (
          <Pressable style={[s.directionsBtn, { borderColor: accent }]} onPress={openDirections}>
            <Text style={[s.directionsBtnText, { color: accent }]}>GET DIRECTIONS</Text>
          </Pressable>
        )}
      </View>

      {kind === "event" && data.organizerId === user?.id && eventAttendees && (
        <View style={s.card}>
          <Text style={s.label}>ATTENDEES</Text>
          {!eventAttendees.length ? (
            <Text style={s.emptyAnnounce}>No RSVPs yet.</Text>
          ) : (
            <>
              <Text style={s.place}>
                {eventAttendees.filter((a) => a.status === "going").length} going
                {data.capacity != null ? ` of ${data.capacity}` : ""} ·{" "}
                {eventAttendees.filter((a) => a.status === "interested").length} interested
              </Text>
              {eventAttendees.map((a) => (
                <View key={a.userId} style={s.eventRow}>
                  <Text style={s.eventTitle} numberOfLines={1}>{a.userName}</Text>
                  <Text style={[s.eventDate, { color: a.status === "going" ? accent : "#75817B" }]}>
                    {a.status.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {kind === "field" && amenities.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>AMENITIES</Text>
          <View style={s.amenityWrap}>
            {amenities.map((a) => (
              <View
                key={a}
                style={[s.amenityTag, { backgroundColor: hexToRgba(accent, 0.1), borderColor: hexToRgba(accent, 0.3) }]}
              >
                <Text style={[s.amenityTagText, { color: accent }]}>{AMENITY_LABELS[a] || a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {kind === "field" && fieldEvents.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>UPCOMING EVENTS HERE</Text>
          {fieldEvents.map((e) => (
            <View key={e.id} style={s.eventRow}>
              <Text style={s.eventTitle} numberOfLines={1}>{e.title}</Text>
              <Text style={[s.eventDate, { color: accent }]}>
                {new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {kind === "field" && (
        <View style={s.card}>
          <View style={s.announceHeader}>
            <Text style={s.label}>
              REVIEWS{averageRating != null ? ` · ${averageRating}★ (${reviewCount})` : ""}
            </Text>
            {user && (
              <Pressable onPress={() => (showReviewForm ? setShowReviewForm(false) : openReviewForm())}>
                <Text style={[s.announceToggle, { color: accent }]}>
                  {showReviewForm ? "Cancel" : myExistingReview ? "Edit your review" : "+ Write a review"}
                </Text>
              </Pressable>
            )}
          </View>
          {showReviewForm && (
            <View style={s.announceForm}>
              <View style={s.starRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setMyRating(n)}>
                    <Text style={{ fontSize: 28, color: n <= myRating ? accent : "#3B4645" }}>★</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="What was your experience? (optional)"
                placeholderTextColor="#5A655F"
                value={reviewBody}
                onChangeText={setReviewBody}
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={[s.postBtn, { backgroundColor: accent }, (!myRating || submittingReview) && s.postBtnDisabled]}
                onPress={submitReview}
                disabled={!myRating || submittingReview}
              >
                {submittingReview ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Submit review</Text>}
              </Pressable>
            </View>
          )}
          {!reviews.length ? (
            <Text style={s.emptyAnnounce}>No reviews yet.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={s.announceRow}>
                <View style={s.announceHeader}>
                  <Text style={s.announceTitle}>{r.authorName}</Text>
                  <Text style={{ color: accent, fontWeight: "900" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Text>
                </View>
                {!!r.body && <Text style={s.announceBody}>{r.body}</Text>}
                <Text style={s.announceTime}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {kind === "field" && !data.claimedById && (
        <View style={[s.card, { borderColor: hexToRgba(accent, 0.35) }]}>
          <Text style={s.label}>IS THIS YOUR FIELD?</Text>
          <Text style={s.claimBody}>
            Claim this listing to manage it as a free storefront — post announcements, keep hours and contact
            info current, and promote events straight to the players who follow you.
          </Text>
          {claimSent ? (
            <Text style={[s.claimSentText, { color: accent }]}>Claim request sent — an admin will review it shortly.</Text>
          ) : showClaimForm ? (
            <View style={s.announceForm}>
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="Tell us how you're connected to this field (optional)"
                placeholderTextColor="#5A655F"
                value={claimNote}
                onChangeText={setClaimNote}
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={[s.postBtn, { backgroundColor: accent }, claiming && s.postBtnDisabled]}
                onPress={submitClaim}
                disabled={claiming}
              >
                {claiming ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Submit claim request</Text>}
              </Pressable>
            </View>
          ) : (
            <Pressable style={[s.postBtn, { backgroundColor: accent }]} onPress={() => setShowClaimForm(true)}>
              <Text style={s.postBtnText}>Claim this field</Text>
            </Pressable>
          )}
        </View>
      )}

      {kind === "field" && data.claimedById === user?.id && (
        <View style={s.card}>
          <View style={s.announceHeader}>
            <Text style={s.label}>HOST A TOURNAMENT</Text>
            <Pressable onPress={() => setShowHostForm((v) => !v)}>
              <Text style={[s.announceToggle, { color: accent }]}>{showHostForm ? "Cancel" : "+ New tournament"}</Text>
            </Pressable>
          </View>
          {hostSent && (
            <Text style={[s.claimSentText, { color: accent }]}>Tournament is live — teams can register now, and you can start the bracket from its event page once they do.</Text>
          )}
          {showHostForm && (
            <View style={s.announceForm}>
              <TextInput
                style={s.input}
                placeholder="Tournament name"
                placeholderTextColor="#5A655F"
                value={hostTitle}
                onChangeText={setHostTitle}
              />
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="Description (optional)"
                placeholderTextColor="#5A655F"
                value={hostDescription}
                onChangeText={setHostDescription}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={s.input}
                placeholder="Starts — e.g. Aug 1, 2026 9:00 AM"
                placeholderTextColor="#5A655F"
                value={hostStart}
                onChangeText={setHostStart}
              />
              <TextInput
                style={s.input}
                placeholder="Ends — e.g. Aug 2, 2026 5:00 PM"
                placeholderTextColor="#5A655F"
                value={hostEnd}
                onChangeText={setHostEnd}
              />
              <TextInput
                style={s.input}
                placeholder="Max teams (optional)"
                placeholderTextColor="#5A655F"
                keyboardType="number-pad"
                value={hostMaxTeams}
                onChangeText={setHostMaxTeams}
              />
              <Pressable
                style={[
                  s.postBtn,
                  { backgroundColor: accent },
                  (!hostTitle.trim() || !hostStart.trim() || !hostEnd.trim() || hosting) && s.postBtnDisabled,
                ]}
                onPress={submitHostTournament}
                disabled={!hostTitle.trim() || !hostStart.trim() || !hostEnd.trim() || hosting}
              >
                {hosting ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Submit for review</Text>}
              </Pressable>
            </View>
          )}
        </View>
      )}

      {kind === "event" && data.eventType === "tournament" && tournamentData && (
        <View style={s.card}>
          <Text style={s.label}>BRACKET</Text>
          <Text style={s.place}>
            {tournamentData.entries.length} team{tournamentData.entries.length === 1 ? "" : "s"} registered
            {tournamentData.tournament.maxTeams ? ` of ${tournamentData.tournament.maxTeams}` : ""}
          </Text>
          {tournamentData.tournament.status === "registration_open" && (
            <View style={{ marginTop: 12 }}>
              {myEntryTeamId && !alreadyRegistered && (
                <Pressable
                  style={[s.postBtn, { backgroundColor: accent }, registeringTournament && s.postBtnDisabled]}
                  onPress={registerForTournament}
                  disabled={registeringTournament}
                >
                  {registeringTournament ? (
                    <ActivityIndicator size="small" color="#10140D" />
                  ) : (
                    <Text style={s.postBtnText}>Register {myManagedTeam?.name}</Text>
                  )}
                </Pressable>
              )}
              {alreadyRegistered && <Text style={s.matchPending}>Your team is registered.</Text>}
              {isTournamentOrganizer && (
                <Pressable
                  style={[s.directionsBtn, { borderColor: accent, marginTop: 10 }]}
                  onPress={startTheTournament}
                  disabled={startingTournament || tournamentData.entries.length < 2}
                >
                  {startingTournament ? (
                    <ActivityIndicator size="small" color={accent} />
                  ) : (
                    <Text style={[s.directionsBtnText, { color: accent }]}>
                      {tournamentData.entries.length < 2 ? "NEED 2+ TEAMS TO START" : "START TOURNAMENT"}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          )}
          {tournamentData.matches.length > 0 &&
            Object.entries(
              tournamentData.matches.reduce((acc: Record<number, TournamentMatch[]>, m) => {
                (acc[m.round] ||= []).push(m);
                return acc;
              }, {}),
            )
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, roundMatches]) => (
                <View key={round} style={{ marginTop: 16 }}>
                  <Text style={s.roundLabel}>ROUND {round}</Text>
                  {roundMatches.map((m) => {
                    const isBye = m.status === "completed" && m.teamAScore == null;
                    const canReport = isTournamentOrganizer && m.status === "ready";
                    return (
                      <View key={m.id} style={s.matchRow}>
                        <Text style={s.matchTeams}>
                          {teamName(m.teamAEntryId)} vs {teamName(m.teamBEntryId)}
                        </Text>
                        {m.status === "completed" ? (
                          <Text style={[s.matchResult, { color: accent }]}>
                            {isBye ? "BYE" : `${m.teamAScore}–${m.teamBScore}`} · {teamName(m.winnerEntryId)} won
                          </Text>
                        ) : canReport ? (
                          <View style={s.scoreRow}>
                            <TextInput
                              style={s.scoreInput}
                              keyboardType="number-pad"
                              placeholder="A"
                              placeholderTextColor="#5A655F"
                              value={scoreInputs[m.id]?.a || ""}
                              onChangeText={(v) => setScoreInputs((prev) => ({ ...prev, [m.id]: { a: v, b: prev[m.id]?.b || "" } }))}
                            />
                            <TextInput
                              style={s.scoreInput}
                              keyboardType="number-pad"
                              placeholder="B"
                              placeholderTextColor="#5A655F"
                              value={scoreInputs[m.id]?.b || ""}
                              onChangeText={(v) => setScoreInputs((prev) => ({ ...prev, [m.id]: { a: prev[m.id]?.a || "", b: v } }))}
                            />
                            <Pressable
                              style={[s.postBtn, { backgroundColor: accent }, reportingMatchId === m.id && s.postBtnDisabled]}
                              onPress={() => reportResult(m.id)}
                              disabled={reportingMatchId === m.id}
                            >
                              {reportingMatchId === m.id ? (
                                <ActivityIndicator size="small" color="#10140D" />
                              ) : (
                                <Text style={s.postBtnText}>Report</Text>
                              )}
                            </Pressable>
                          </View>
                        ) : (
                          <Text style={s.matchPending}>{m.status === "ready" ? "Awaiting result" : "Pending"}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
        </View>
      )}

      {kind === "team" && (
        <View style={s.card}>
          <Text style={s.label}>ROSTER · {teamRoster.length}</Text>
          {!teamRoster.length ? (
            <Text style={s.emptyAnnounce}>No members yet.</Text>
          ) : (
            teamRoster.map((m) => (
              <View key={m.userId} style={s.eventRow}>
                <Text style={s.eventTitle} numberOfLines={1}>{m.userName}</Text>
                <Text style={[s.eventDate, { color: accent }]}>{m.role.toUpperCase()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {canManageTeam && teamApplications.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>PENDING APPLICATIONS · {teamApplications.length}</Text>
          {teamApplications.map((a) => (
            <View key={a.id} style={s.eventRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.eventTitle} numberOfLines={1}>{a.userName}</Text>
                {!!a.message && <Text style={[s.body, { fontSize: 12, marginTop: 2 }]} numberOfLines={2}>{a.message}</Text>}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={[s.rsvpBtn, { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => decideApplication(a.id, "approved")}
                  disabled={decidingApplicationId === a.id}
                >
                  {decidingApplicationId === a.id ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={[s.rsvpBtnText, s.rsvpBtnTextActive]}>APPROVE</Text>}
                </Pressable>
                <Pressable style={s.rsvpBtn} onPress={() => decideApplication(a.id, "declined")} disabled={decidingApplicationId === a.id}>
                  <Text style={s.rsvpBtnText}>DECLINE</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {kind === "team" && teamRole && (
        <View style={s.card}>
          <View style={s.announceHeader}>
            <Text style={s.label}>TEAM SCHEDULE</Text>
            {canManageTeam && (
              <Pressable onPress={() => (showScheduleForm ? setShowScheduleForm(false) : openScheduleForm())}>
                <Text style={[s.announceToggle, { color: accent }]}>{showScheduleForm ? "Cancel" : "+ Schedule practice"}</Text>
              </Pressable>
            )}
          </View>
          {canManageTeam && showScheduleForm && (
            <View style={s.announceForm}>
              <TextInput
                style={s.input}
                placeholder="Title (e.g. Tuesday scrimmage)"
                placeholderTextColor="#5A655F"
                value={practiceTitle}
                onChangeText={setPracticeTitle}
              />
              <TextInput
                style={s.input}
                placeholder="Starts — e.g. Aug 1, 2026 6:00 PM"
                placeholderTextColor="#5A655F"
                value={practiceStart}
                onChangeText={setPracticeStart}
              />
              <TextInput
                style={s.input}
                placeholder="Ends — e.g. Aug 1, 2026 8:00 PM"
                placeholderTextColor="#5A655F"
                value={practiceEnd}
                onChangeText={setPracticeEnd}
              />
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="Details (optional)"
                placeholderTextColor="#5A655F"
                value={practiceDescription}
                onChangeText={setPracticeDescription}
                multiline
                numberOfLines={3}
              />
              <Pressable
                style={[
                  s.postBtn,
                  { backgroundColor: accent },
                  (!practiceTitle.trim() || !practiceStart.trim() || !practiceEnd.trim() || scheduling) && s.postBtnDisabled,
                ]}
                onPress={submitPractice}
                disabled={!practiceTitle.trim() || !practiceStart.trim() || !practiceEnd.trim() || scheduling}
              >
                {scheduling ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Schedule</Text>}
              </Pressable>
            </View>
          )}
          {!practices.length ? (
            <Text style={s.emptyAnnounce}>No practices scheduled yet.</Text>
          ) : (
            practices.map((p) => (
              <View key={p.id} style={s.eventRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={[s.eventDate, { color: accent }]}>
                    {new Date(p.startsAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </Text>
                </View>
                <Pressable
                  style={[s.rsvpBtn, practiceGoing[p.id] && { backgroundColor: accent, borderColor: accent }]}
                  onPress={() => togglePracticeRsvp(p.id)}
                  disabled={practiceRsvpBusy === p.id}
                >
                  {practiceRsvpBusy === p.id ? (
                    <ActivityIndicator size="small" color="#10140D" />
                  ) : (
                    <Text style={[s.rsvpBtnText, practiceGoing[p.id] && s.rsvpBtnTextActive]}>
                      {practiceGoing[p.id] ? "GOING" : "I'M GOING"}
                    </Text>
                  )}
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}

      {kind === "team" && teamRole && (
        <View style={s.card}>
          <View style={s.announceHeader}>
            <Text style={s.label}>GEAR ORDERS</Text>
            {canManageTeam && (
              <Pressable onPress={() => (showGearOrderForm ? setShowGearOrderForm(false) : openGearOrderForm())}>
                <Text style={[s.announceToggle, { color: accent }]}>{showGearOrderForm ? "Cancel" : "+ New order"}</Text>
              </Pressable>
            )}
          </View>
          {canManageTeam && showGearOrderForm && (
            <View style={s.announceForm}>
              <Text style={s.disclaimer}>
                Your captain collects payment separately — this isn't a checkout. No money moves through PBGearbag for gear orders.
              </Text>
              <TextInput
                style={s.input}
                placeholder="Order title (e.g. 2026 Team Jerseys)"
                placeholderTextColor="#5A655F"
                value={goTitle}
                onChangeText={setGoTitle}
              />
              <TextInput
                style={[s.input, s.inputMultiline]}
                placeholder="Details (optional)"
                placeholderTextColor="#5A655F"
                value={goDescription}
                onChangeText={setGoDescription}
                multiline
                numberOfLines={2}
              />
              <TextInput
                style={s.input}
                placeholder="Picks close by — e.g. Aug 1, 2026 (optional)"
                placeholderTextColor="#5A655F"
                value={goClosesAt}
                onChangeText={setGoClosesAt}
              />
              <Text style={s.label}>ITEMS</Text>
              {goItems.map((item, idx) => (
                <View key={idx} style={s.gearItemRow}>
                  <TextInput
                    style={s.input}
                    placeholder="Item name"
                    placeholderTextColor="#5A655F"
                    value={item.name}
                    onChangeText={(v) => setGoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, name: v } : it)))}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Price (optional)"
                    placeholderTextColor="#5A655F"
                    value={item.price}
                    keyboardType="decimal-pad"
                    onChangeText={(v) => setGoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, price: v } : it)))}
                  />
                  <TextInput
                    style={s.input}
                    placeholder="Sizes, comma-separated (optional)"
                    placeholderTextColor="#5A655F"
                    value={item.sizes}
                    onChangeText={(v) => setGoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, sizes: v } : it)))}
                  />
                  {goItems.length > 1 && (
                    <Pressable onPress={() => setGoItems((prev) => prev.filter((_, i) => i !== idx))}>
                      <Text style={{ color: "#75817B", fontSize: 11 }}>Remove item</Text>
                    </Pressable>
                  )}
                </View>
              ))}
              <Pressable onPress={() => setGoItems((prev) => [...prev, { name: "", price: "", sizes: "" }])}>
                <Text style={{ color: accent, fontSize: 12, fontWeight: "900" }}>+ Add item</Text>
              </Pressable>
              <Pressable
                style={[
                  s.postBtn,
                  { backgroundColor: accent },
                  (!goTitle.trim() || !goItems.some((i) => i.name.trim()) || creatingGearOrder) && s.postBtnDisabled,
                ]}
                onPress={submitGearOrder}
                disabled={!goTitle.trim() || !goItems.some((i) => i.name.trim()) || creatingGearOrder}
              >
                {creatingGearOrder ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Create order</Text>}
              </Pressable>
            </View>
          )}
          {!gearOrders.length ? (
            <Text style={s.emptyAnnounce}>No gear orders yet.</Text>
          ) : (
            gearOrders.map((o) => (
              <Pressable key={o.id} style={s.eventRow} onPress={() => navigation.navigate("TeamGearOrder", { orderId: o.id })}>
                <View style={{ flex: 1 }}>
                  <Text style={s.eventTitle} numberOfLines={1}>{o.title}</Text>
                  <Text style={[s.eventDate, { color: o.status === "open" ? accent : "#75817B" }]}>
                    {o.status.toUpperCase()} · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}

      <View style={s.card}>
        <View style={s.announceHeader}>
          <Text style={s.label}>ANNOUNCEMENTS</Text>
          {canAnnounce && (
            <Pressable onPress={() => setShowAnnounceForm((v) => !v)}>
              <Text style={[s.announceToggle, { color: accent }]}>{showAnnounceForm ? "Cancel" : "+ Post"}</Text>
            </Pressable>
          )}
        </View>
        {canAnnounce && showAnnounceForm && (
          <View style={s.announceForm}>
            <TextInput
              style={s.input}
              placeholder="Title"
              placeholderTextColor="#5A655F"
              value={announceTitle}
              onChangeText={setAnnounceTitle}
            />
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="What's going on?"
              placeholderTextColor="#5A655F"
              value={announceBody}
              onChangeText={setAnnounceBody}
              multiline
              numberOfLines={3}
            />
            <Pressable
              style={[
                s.postBtn,
                { backgroundColor: accent },
                (!announceTitle.trim() || !announceBody.trim() || posting) && s.postBtnDisabled,
              ]}
              onPress={postAnnouncement}
              disabled={!announceTitle.trim() || !announceBody.trim() || posting}
            >
              {posting ? <ActivityIndicator size="small" color="#10140D" /> : <Text style={s.postBtnText}>Post</Text>}
            </Pressable>
          </View>
        )}
        {!announcements.length ? (
          <Text style={s.emptyAnnounce}>No announcements yet.</Text>
        ) : (
          announcements.map((a) => (
            <View key={a.id} style={s.announceRow}>
              <Text style={s.announceTitle}>{a.title}</Text>
              <Text style={s.announceBody}>{a.body}</Text>
              <Text style={s.announceTime}>{new Date(a.createdAt).toLocaleDateString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#0A0E0F" },
  content: { width: "94%", maxWidth: 760, alignSelf: "center", padding: 22 },
  center: {
    flex: 1,
    backgroundColor: "#0A0E0F",
    alignItems: "center",
    justifyContent: "center",
  },
  banner: { width: "100%", height: 180, borderRadius: 14, backgroundColor: "#121819", marginBottom: 18 },
  kicker: {
    color: DEFAULT_ACCENT,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  title: { color: "#F3F1E8", fontSize: 34, fontWeight: "900", marginTop: 8 },
  place: { color: "#77827D", marginTop: 7 },
  body: { color: "#B8C1BC", fontSize: 15, lineHeight: 23, marginTop: 22 },
  rsvpRow: { flexDirection: "row", gap: 8, marginTop: 20, flexWrap: "wrap" },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: "#3B4645",
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 11,
    minWidth: 90,
    alignItems: "center",
  },
  rsvpBtnText: { color: "#D6DDDA", fontSize: 10, fontWeight: "900" },
  rsvpBtnTextActive: { color: "#10140D" },
  card: {
    marginTop: 25,
    backgroundColor: "#121819",
    borderWidth: 1,
    borderColor: "#293431",
    borderRadius: 14,
    padding: 18,
  },
  label: {
    color: "#75817B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  detail: {
    color: "#D1D9D3",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#29322F",
  },
  verified: { color: DEFAULT_ACCENT, fontWeight: "900", marginTop: 13 },
  recruiting: { color: "#E8743B", fontWeight: "900", marginTop: 13 },
  directionsBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: DEFAULT_ACCENT,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  directionsBtnText: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  followBtn: {
    borderWidth: 1,
    borderColor: hexToRgba(DEFAULT_ACCENT, 0.4),
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
  },
  followBtnText: { color: DEFAULT_ACCENT, fontSize: 12, fontWeight: "900" },
  followBtnTextActive: { color: "#10140D" },
  followerCount: { color: "#75817B", fontSize: 12, marginTop: 6 },
  manageLink: { marginTop: 8 },
  manageLinkText: { fontSize: 12, fontWeight: "900" },
  starRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  announceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  announceToggle: { color: DEFAULT_ACCENT, fontSize: 12, fontWeight: "900" },
  announceForm: { marginTop: 10, marginBottom: 16, gap: 10 },
  input: {
    backgroundColor: "#171c20",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#364047",
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  postBtn: { alignSelf: "flex-start", backgroundColor: DEFAULT_ACCENT, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 11 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: "#10150d", fontWeight: "900", fontSize: 13 },
  emptyAnnounce: { color: "#68737d", fontSize: 13, fontStyle: "italic" },
  announceRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  announceTitle: { color: "#F3F1E8", fontSize: 14, fontWeight: "800" },
  announceBody: { color: "#B8C1BC", fontSize: 13, marginTop: 4, lineHeight: 19 },
  announceTime: { color: "#5A655F", fontSize: 10, marginTop: 6 },
  amenityWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityTag: {
    backgroundColor: hexToRgba(DEFAULT_ACCENT, 0.1),
    borderWidth: 1,
    borderColor: hexToRgba(DEFAULT_ACCENT, 0.3),
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  amenityTagText: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "800" },
  eventRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  eventTitle: { color: "#F3F1E8", fontSize: 13, fontWeight: "800", flex: 1, marginRight: 10 },
  eventDate: { color: DEFAULT_ACCENT, fontSize: 11, fontWeight: "900" },
  claimBody: { color: "#B8C1BC", fontSize: 13, lineHeight: 19, marginBottom: 14 },
  claimSentText: { color: DEFAULT_ACCENT, fontSize: 13, fontWeight: "800" },
  disclaimer: { color: "#75817B", fontSize: 11, lineHeight: 16, marginBottom: 4, fontStyle: "italic" },
  gearItemRow: { gap: 8, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  roundLabel: { color: "#75817B", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 8 },
  matchRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#29322F" },
  matchTeams: { color: "#F3F1E8", fontSize: 13, fontWeight: "800" },
  matchResult: { fontSize: 12, fontWeight: "900", marginTop: 4 },
  matchPending: { color: "#68737d", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  scoreRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  scoreInput: {
    backgroundColor: "#171c20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#364047",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 56,
    textAlign: "center",
  },
});
