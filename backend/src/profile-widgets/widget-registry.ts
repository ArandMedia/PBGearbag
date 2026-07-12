// The plugin registry: every widget type a profile can attach lives here.
// Adding a new widget type is additive — a new entry here, plus a matching
// renderer component on the frontend keyed the same way. No changes needed
// to the widget instance model, endpoints, or existing widget types.
export interface WidgetConfigField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'list';
}

export interface WidgetDefinition {
  key: string;
  label: string;
  description: string;
  tags: string[];
  configFields: WidgetConfigField[];
}

export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  {
    key: 'loadout',
    label: 'Loadout Card',
    description: "Your playstyle's essential gear and how ready your bag is.",
    tags: ['universal'],
    configFields: [],
  },
  {
    key: 'stats',
    label: 'Stats Card',
    description: 'K/D, hit %, whatever matters in your format — enter it yourself or link out to wherever you already track it (a league site, PBLive, a scoreboard app).',
    tags: ['speedball', 'tournament', 'universal'],
    configFields: [
      { key: 'platform', label: 'Tracked on (e.g. PSP, NXL, Millennium, a local league)', type: 'text' },
      { key: 'profileUrl', label: 'Link to your stats/profile there', type: 'url' },
      { key: 'stats', label: 'Stats (shown alongside or instead of the link)', type: 'list' },
    ],
  },
  {
    key: 'team',
    label: 'Team Card',
    description: 'Your team roster card.',
    tags: ['speedball', 'tournament', 'universal'],
    configFields: [],
  },
  {
    key: 'upcoming_events',
    label: 'Upcoming Events',
    description: "Events you've RSVP'd going to.",
    tags: ['universal'],
    configFields: [],
  },
  {
    key: 'home_field',
    label: 'Home Field',
    description: 'Your home field and favorite position.',
    tags: ['universal'],
    configFields: [],
  },
  {
    key: 'achievements',
    label: 'Achievements',
    description: 'Badges and milestones you want to show.',
    tags: ['universal'],
    configFields: [{ key: 'items', label: 'Achievements', type: 'list' }],
  },
  {
    key: 'social_links',
    label: 'Social Links',
    description: 'Link out to your Instagram, YouTube, Twitch.',
    tags: ['media', 'universal'],
    configFields: [{ key: 'links', label: 'Links', type: 'list' }],
  },
  {
    key: 'bio_spotlight',
    label: 'Bio Spotlight',
    description: 'A longer highlighted write-up — your story, your setup philosophy, whatever.',
    tags: ['universal'],
    configFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body', type: 'textarea' },
    ],
  },
  {
    key: 'marketplace_picks',
    label: 'Marketplace Picks',
    description: 'Your active listings, front and center.',
    tags: ['universal'],
    configFields: [],
  },
  {
    key: 'woodsball_kit',
    label: 'Woodsball / Scenario Kit',
    description: 'Terrain, comfort, and endurance gear for long-format games.',
    tags: ['woodsball', 'scenario', 'big_game'],
    configFields: [],
  },
];

export const WIDGET_KEYS = new Set(WIDGET_DEFINITIONS.map((w) => w.key));
