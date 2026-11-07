export type ProfileLayout = 'default' | 'modern' | 'simplistic' | 'sleek';

export type BackgroundEffect =
  | 'none'
  | 'rain'
  | 'snow'
  | 'stars'
  | 'blurred'
  | 'vhs-grain';

export type UsernameEffect =
  | 'none'
  | 'gold-sparkles'
  | 'bone-sparkles'
  | 'crimson-sparkles'
  | 'chromatic-sparkles'
  | 'warm-halation';

export type CursorTrailEffect =
  | 'none'
  | 'fairy-dust'
  | 'snowflakes'
  | 'ghost-cursor'
  | 'ink-dots'
  | 'bubbles';

export type EntryAnimation = 'fade-rise' | 'editorial-unfold' | 'scale-snap' | 'none';

export type SocialPlatform =
  | 'github'
  | 'gitlab'
  | 'discord'
  | 'steam'
  | 'valorant'
  | 'namemc'
  | 'twitch'
  | 'kick'
  | 'youtube'
  | 'spotify'
  | 'soundcloud'
  | 'applemusic'
  | 'lastfm'
  | 'x'
  | 'instagram'
  | 'tiktok'
  | 'threads'
  | 'reddit'
  | 'telegram'
  | 'signal'
  | 'snapchat'
  | 'linkedin'
  | 'facebook'
  | 'vk'
  | 'patreon'
  | 'kofi'
  | 'buymeacoffee'
  | 'payhip'
  | 'cashapp'
  | 'email'
  | 'website'
  | 'bitcoin'
  | 'ethereum'
  | 'solana'
  | 'xrp'
  | 'litecoin'
  | 'monero';

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  subtext?: string;
  /** URL when mode === 'link', or handle/tag/address string when mode === 'text' */
  value: string;
  mode: 'link' | 'text';
  customIconUrl?: string;
  clicks?: number;
}

export type BadgeKey =
  | 'founder'
  | 'verified'
  | 'premium'
  | 'core-member'
  | 'design-lead'
  | 'systems-architect'
  | 'sound-lab'
  | 'image-host'
  | 'server-booster'
  | 'donor'
  | 'gifter'
  | 'helper'
  | 'bug-hunter'
  | 'domain-legend'
  | 'og'
  | '1m-users'
  | 'custom';

export interface ProfileBadge {
  id: string;
  key: BadgeKey;
  label: string;
  tooltip: string;
  enabled: boolean;
  customIconUrl?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  /** Uploaded .mp3/.aac URL or built-in Web Audio preset ('synth:darkroom' | 'synth:kyoto' | 'synth:tape-loop' | 'synth:oscillator') */
  audioUrl: string;
}

export interface DiscordConfig {
  enabled: boolean;
  /** Optional Discord Snowflake ID for live Lanyard WebSocket/REST sync */
  discordUserId: string;
  useLanyardApi: boolean;
  syncAvatar: boolean;
  avatarDecoration: 'none' | 'brass-orbit' | 'vermilion-seal' | 'scanline-frame';
  fallbackUsername: string;
  fallbackStatus: 'online' | 'idle' | 'dnd' | 'offline';
  fallbackCustomStatus: string;
  fallbackActivityName: string;
  fallbackActivityDetails: string;
  fallbackActivityElapsed: string;
  fallbackSpotifyTrack?: string;
}

export interface SecondTabWidgets {
  spotify: {
    enabled: boolean;
    title: string;
    subtitle: string;
    embedUrl: string;
  };
  youtube: {
    enabled: boolean;
    channelName: string;
    subscribers: string;
    featuredTitle: string;
    channelUrl: string;
  };
  discordServer: {
    enabled: boolean;
    serverName: string;
    onlineCount: number;
    memberCount: number;
    inviteUrl: string;
  };
  telegram?: {
    enabled: boolean;
    channelTitle: string;
    membersLabel: string;
    inviteUrl: string;
  };
  roblox?: {
    enabled: boolean;
    username: string;
    creationsLabel: string;
    profileUrl: string;
  };
  communityCard: {
    enabled: boolean;
    platformLabel: string;
    handle: string;
    summary: string;
    metric: string;
    url: string;
  };
}

export interface ProfileVisuals {
  layout: ProfileLayout;
  /** 0 to 100 */
  profileOpacity: number;
  /** 0 to 40 px */
  profileBlur: number;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
  gradientEnabled: boolean;
  gradientSecondaryColor: string;
  swapBoxColors: boolean;
  glowUsername: boolean;
  glowSocials: boolean;
  glowBadges: boolean;
  /** Glow spread radius in px (6 to 36) */
  glowIntensity?: number;
  monochromeIcons: boolean;
  monochromeBadges: boolean;
  animatedTitle: boolean;
  hideViews: boolean;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  avatarRadius: number;
  bannerRadius: number;
  backgroundEffect: BackgroundEffect;
  usernameEffect: UsernameEffect;
  cursorTrail: CursorTrailEffect;
  customCursorUrl: string;
  tiltEnabled: boolean;
  tiltMaxDeg: number;
  entryAnimation: EntryAnimation;
  fontFamily: string;
  customFontUrl: string;
  customFontName: string;
  fontSizeScale: number;
  letterSpacingEm: number;
}

export interface SplashConfig {
  enabled: boolean;
  promptText: string;
  subText: string;
  blurAmount: number;
  opacity?: number;
  fontFamily?: string;
  transitionStyle?: 'fade' | 'zoom';
}

export interface ProfileMetadata {
  websiteTitle: string;
  metaDescription: string;
  faviconUrl: string;
  ogBannerUrl: string;
  userInfoOverlay: boolean;
}

export interface ProfileAnalyticsData {
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  dailyViews: { date: string; views: number; clicks: number }[];
  devices: { desktop: number; mobile: number; tablet: number };
  referrers: { source: string; count: number }[];
  countries: { code: string; name: string; count: number }[];
  socialClicks: Record<string, number>;
}

export interface MemberProfile {
  handle: string;
  aliases: string[];
  editPin?: string;
  displayName: string;
  clubRole: string;
  department: 'Engineering' | 'Design' | 'Sound & Media' | 'Systems' | 'Research';
  memberNumber: string;
  location: string;
  joinedAt: string;
  avatarUrl: string;
  bannerUrl: string;
  backgroundMediaUrl: string;
  backgroundMediaType: 'image' | 'video' | 'none';
  bioLines: string[];
  typewriterEnabled: boolean;
  typewriterSpeedMs: number;
  deletionSpeedMs: number;
  pauseDurationMs?: number;
  splash: SplashConfig;
  visuals: ProfileVisuals;
  audioEnabled: boolean;
  showAudioWidget: boolean;
  audioShuffle?: boolean;
  audioLoop?: boolean;
  defaultVolume: number;
  audioTracks: AudioTrack[];
  discord: DiscordConfig;
  widgets: SecondTabWidgets;
  links: SocialLinkItem[];
  badges: ProfileBadge[];
  metadata: ProfileMetadata;
  analytics: ProfileAnalyticsData;
}

export interface CommunityTemplate {
  id: string;
  name: string;
  authorHandle: string;
  description: string;
  tags: string[];
  visibility: 'public' | 'unlisted' | 'private';
  usesCount: number;
  previewBannerUrl: string;
  visuals: ProfileVisuals;
  splash: SplashConfig;
  backgroundMediaUrl: string;
  backgroundMediaType: 'image' | 'video' | 'none';
}

export interface ClubSettings {
  clubName: string;
  clubSubhead: string;
  manifesto: string;
  foundedYear: string;
  chapterCode: string;
}

export const ASSET_UPLOAD_SLOTS = [
  {
    id: 'background',
    label: 'Background Canvas',
    accept: '.png,.jpg,.jpeg,.gif,.webp,.mp4,.m4v,.webm,.mov,.mkv',
    maxMb: 100,
    description: 'Full-viewport looping video or darkroom photography wallpaper',
  },
  {
    id: 'audio',
    label: 'Audio Track (.mp3 / .aac)',
    accept: '.mp3,.aac,audio/mpeg,audio/aac',
    maxMb: 10,
    description: 'Adds a synced track to your profile tape deck playlist',
  },
  {
    id: 'avatar',
    label: 'Profile Avatar',
    accept: '.png,.jpg,.jpeg,.gif,.webp',
    maxMb: 5,
    description: 'Static portrait print or animated GIF avatar',
  },
  {
    id: 'banner',
    label: 'Profile Header Banner',
    accept: '.png,.jpg,.jpeg,.gif,.webp',
    maxMb: 10,
    description: 'Top architectural header inside the dossier card',
  },
  {
    id: 'cursor',
    label: 'Custom Pointer',
    accept: '.cur,.png,.jpg,.jpeg,.gif,.webp',
    maxMb: 5,
    description: 'Overrides the OS cursor across your entire dossier',
  },
  {
    id: 'font',
    label: 'Custom Typeface',
    accept: '.ttf,.otf,.woff,.woff2',
    maxMb: 5,
    description: 'Uploads and injects your own .ttf/.otf/.woff font via FontFace API',
  },
  {
    id: 'cover',
    label: 'Album Art / Link Icon',
    accept: '.png,.jpg,.jpeg,.gif,.webp',
    maxMb: 10,
    description: 'Custom cover sleeve for the audio player or custom link icon',
  },
  {
    id: 'metadata',
    label: 'Favicon & OpenGraph Card',
    accept: '.png,.jpg,.jpeg,.gif,.ico,.svg',
    maxMb: 10,
    description: 'Social embed banner for Discord, X, and search engines',
  },
  {
    id: 'badge',
    label: 'Bespoke Club Badge',
    accept: '.png,.jpg,.jpeg,.gif,.webp,.svg',
    maxMb: 10,
    description: 'Custom emblem icon for your personal badge slot',
  },
] as const;

export const CURATED_EDITORIAL_FONTS = [
  { label: 'Plus Jakarta Sans (Clean Studio)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Instrument Serif (Editorial Zine)', value: "'Instrument Serif', Georgia, serif" },
  { label: 'Syne (Avant-Garde Display)', value: "'Syne', sans-serif" },
  { label: 'Newsreader (Literary Press)', value: "'Newsreader', Georgia, serif" },
  { label: 'Fraunces (Warm Old-Style Serif)', value: "'Fraunces', Georgia, serif" },
  { label: 'JetBrains Mono (Technical Dossier)', value: "'JetBrains Mono', monospace" },
  { label: 'Space Mono (Analog Tape)', value: "'Space Mono', monospace" },
  { label: 'Archivo (Swiss Grotesque)', value: "'Archivo', sans-serif" },
  { label: 'Playfair Display (High-Contrast)', value: "'Playfair Display', Georgia, serif" },
];
