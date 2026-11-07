import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Disc3,
  ExternalLink,
  Eye,
  Gamepad2,
  MapPin,
  Pause,
  Play,
  Repeat,
  Send,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { MemberProfile, SocialLinkItem } from '../types/profile';
import { BADGE_META, PLATFORM_META } from '../utils/platformIcons';
import { studioAudio } from '../utils/synthAudio';
import { BackgroundShaderCanvas, CursorTrailCanvas } from './CanvasEffects';
import { DiscordPresenceCard } from './DiscordPresenceCard';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(20, 18, 16, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const DossierRenderer: React.FC<{
  profile: MemberProfile;
  previewMode?: boolean;
  onBackToRoster?: () => void;
  onOpenCustomizer?: () => void;
  onSocialTriggered?: (link: SocialLinkItem) => void;
}> = ({
  profile,
  previewMode = false,
  onBackToRoster,
  onOpenCustomizer,
  onSocialTriggered,
}) => {
  const { visuals, splash } = profile;
  const [splashDismissed, setSplashDismissed] = useState(!splash.enabled || previewMode);
  const [activeTab, setActiveTab] = useState<'overview' | 'widgets'>('overview');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [syncedDiscordAvatar, setSyncedDiscordAvatar] = useState<string | null>(null);

  // Audio Deck State
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(Boolean(profile.audioShuffle));
  const [loopOn, setLoopOn] = useState(profile.audioLoop !== false);
  const [volume, setVolume] = useState(profile.defaultVolume ?? 0.4);

  // 3D Tilt State
  const [tiltTransform, setTiltTransform] = useState(
    'perspective(1100px) rotateX(0deg) rotateY(0deg)'
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setSplashDismissed(!profile.splash.enabled || previewMode);
    setActiveTab('overview');
    setSyncedDiscordAvatar(null);
    setShuffleOn(Boolean(profile.audioShuffle));
    setLoopOn(profile.audioLoop !== false);
    if (!previewMode) {
      studioAudio.stop();
      setIsPlaying(false);
    }
    return () => {
      if (!previewMode) {
        studioAudio.stop();
      }
    };
  }, [
    profile.handle,
    profile.splash.enabled,
    profile.audioShuffle,
    profile.audioLoop,
    previewMode,
  ]);

  // Inject uploaded custom font (.ttf/.otf/.woff) dynamically via FontFace API
  useEffect(() => {
    if (!visuals.customFontUrl) return;
    const familyName = visuals.customFontName || `AtelierCustom_${profile.handle}`;
    const fontFace = new FontFace(familyName, `url(${visuals.customFontUrl})`);
    fontFace
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
      })
      .catch(() => {});
  }, [visuals.customFontUrl, visuals.customFontName, profile.handle]);

  // Animated Browser <title> + Favicon + OpenGraph meta tags in full-page mode
  useEffect(() => {
    if (previewMode) return;
    const baseTitle =
      profile.metadata.websiteTitle || `${profile.displayName} (@${profile.handle}) — Atelier`;
    document.title = baseTitle;

    const favEl = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    const prevHref = favEl?.href || '/favicon.svg';
    if (favEl && profile.metadata.faviconUrl) {
      favEl.href = profile.metadata.faviconUrl;
    }

    if (!visuals.animatedTitle) {
      return () => {
        document.title = 'ATELIER // Club Dossier & Profile Studio';
        if (favEl) favEl.href = prevHref;
      };
    }

    const padded = `${baseTitle}   //   `;
    let offset = 0;
    const timer = window.setInterval(() => {
      offset = (offset + 1) % padded.length;
      document.title = padded.slice(offset) + padded.slice(0, offset);
    }, 260);

    return () => {
      window.clearInterval(timer);
      document.title = 'ATELIER // Club Dossier & Profile Studio';
      if (favEl) favEl.href = prevHref;
    };
  }, [
    previewMode,
    profile.metadata.websiteTitle,
    profile.metadata.faviconUrl,
    profile.displayName,
    profile.handle,
    visuals.animatedTitle,
  ]);

  // Typewriter Bio Loop (with Typing Speed, Deletion Speed, and Pause Duration)
  const [typedBio, setTypedBio] = useState(profile.bioLines[0] || '');
  useEffect(() => {
    const lines = profile.bioLines.filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setTypedBio('');
      return;
    }
    if (!profile.typewriterEnabled) {
      setTypedBio(lines.join(' · '));
      return;
    }

    let lineIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId = 0;
    const pauseMs = Math.max(300, profile.pauseDurationMs ?? 1800);

    const tick = () => {
      const currentFull = lines[lineIndex % lines.length];
      if (!deleting) {
        charIndex += 1;
        setTypedBio(currentFull.slice(0, charIndex));
        if (charIndex >= currentFull.length) {
          deleting = true;
          timeoutId = window.setTimeout(tick, pauseMs);
          return;
        }
        timeoutId = window.setTimeout(tick, Math.max(18, profile.typewriterSpeedMs || 48));
      } else {
        charIndex -= 1;
        setTypedBio(currentFull.slice(0, Math.max(0, charIndex)));
        if (charIndex <= 0) {
          deleting = false;
          lineIndex = (lineIndex + 1) % lines.length;
          timeoutId = window.setTimeout(tick, 300);
          return;
        }
        timeoutId = window.setTimeout(tick, Math.max(12, profile.deletionSpeedMs || 26));
      }
    };

    timeoutId = window.setTimeout(tick, 220);
    return () => window.clearTimeout(timeoutId);
  }, [
    profile.bioLines,
    profile.typewriterEnabled,
    profile.typewriterSpeedMs,
    profile.deletionSpeedMs,
    profile.pauseDurationMs,
  ]);

  const currentTrack = profile.audioTracks[trackIdx % Math.max(1, profile.audioTracks.length)];

  const stepTrack = (delta: number) => {
    const total = profile.audioTracks.length;
    if (!total) return;
    let next = (trackIdx + delta + total) % total;
    if (shuffleOn && total > 1) {
      next = Math.floor(Math.random() * total);
      if (next === trackIdx) next = (trackIdx + 1) % total;
    }
    setTrackIdx(next);
    const track = profile.audioTracks[next];
    if (track) {
      studioAudio.setVolume(volume);
      studioAudio.playTrack(track.audioUrl, loopOn ? undefined : () => stepTrack(1));
      setIsPlaying(true);
    }
  };

  const handleEnterSplash = () => {
    setSplashDismissed(true);
    if (videoRef.current) {
      void videoRef.current.play().catch(() => {});
    }
    if (profile.audioEnabled && currentTrack) {
      studioAudio.setVolume(volume);
      studioAudio.setMuted(isMuted);
      studioAudio.playTrack(currentTrack.audioUrl, loopOn ? undefined : () => stepTrack(1));
      setIsPlaying(true);
    }
  };

  const toggleAudioPlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      studioAudio.stop();
      setIsPlaying(false);
    } else {
      studioAudio.setVolume(volume);
      studioAudio.setMuted(isMuted);
      studioAudio.playTrack(currentTrack.audioUrl, loopOn ? undefined : () => stepTrack(1));
      setIsPlaying(true);
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!visuals.tiltEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    const max = visuals.tiltMaxDeg || 6;
    const rotY = (nx * max * 2).toFixed(2);
    const rotX = (-ny * max * 2).toFixed(2);
    setTiltTransform(`perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg)`);
  };

  const handleCardMouseLeave = () => {
    setTiltTransform('perspective(1100px) rotateX(0deg) rotateY(0deg)');
  };

  const triggerSocial = (link: SocialLinkItem) => {
    onSocialTriggered?.(link);
    if (link.mode === 'text') {
      void navigator.clipboard?.writeText(link.value);
      setCopiedId(link.id);
      setToastMsg(`Copied ${link.label}: ${link.value}`);
      window.setTimeout(() => {
        setCopiedId(null);
        setToastMsg(null);
      }, 2400);
    } else {
      window.open(link.value, '_blank', 'noopener,noreferrer');
    }
  };

  const cardBackground = useMemo(() => {
    const alpha = Math.max(0, Math.min(1, visuals.profileOpacity / 100));
    if (alpha === 0) return 'transparent';
    const baseHex = visuals.swapBoxColors ? visuals.accentColor : visuals.backgroundColor;
    const c1 = hexToRgba(baseHex, alpha);
    if (visuals.gradientEnabled) {
      const c2 = hexToRgba(visuals.gradientSecondaryColor || '#1e1a16', alpha);
      return `linear-gradient(145deg, ${c1} 0%, ${c2} 100%)`;
    }
    return c1;
  }, [
    visuals.profileOpacity,
    visuals.swapBoxColors,
    visuals.accentColor,
    visuals.backgroundColor,
    visuals.gradientEnabled,
    visuals.gradientSecondaryColor,
  ]);

  const activeFontFamily = visuals.customFontUrl
    ? `'${visuals.customFontName || `AtelierCustom_${profile.handle}`}', ${visuals.fontFamily}`
    : visuals.fontFamily;

  const sparkleColor =
    visuals.usernameEffect === 'gold-sparkles'
      ? '#d4913d'
      : visuals.usernameEffect === 'crimson-sparkles'
      ? '#e04f33'
      : '#f2ece1';

  const glowSpread = visuals.glowIntensity ?? 18;
  const avatarSrc = syncedDiscordAvatar || profile.avatarUrl;
  const enabledBadges = profile.badges.filter((b) => b.enabled);
  const splashAlpha = Math.max(0.25, Math.min(0.98, (splash.opacity ?? 76) / 100));

  const entryClass =
    visuals.entryAnimation === 'fade-rise'
      ? 'entry-fade-rise'
      : visuals.entryAnimation === 'editorial-unfold'
      ? 'entry-editorial-unfold'
      : visuals.entryAnimation === 'scale-snap'
      ? 'entry-scale-snap'
      : '';

  return (
    <div
      className="dossier-viewport"
      style={{
        minHeight: previewMode ? '100%' : '100vh',
        position: 'relative',
        backgroundColor: visuals.backgroundColor,
        fontFamily: activeFontFamily,
        color: visuals.textColor,
        cursor: visuals.customCursorUrl ? `url(${visuals.customCursorUrl}), auto` : undefined,
      }}
    >
      {/* Layer 1: Full-Viewport Background Media */}
      {profile.backgroundMediaType === 'video' && profile.backgroundMediaUrl && (
        <video
          ref={videoRef}
          src={profile.backgroundMediaUrl}
          className={`dossier-bg-media ${visuals.backgroundEffect === 'blurred' ? 'blurred-wall' : ''}`}
          style={previewMode ? { position: 'absolute' } : undefined}
          loop
          muted
          playsInline
          autoPlay={previewMode || !splash.enabled}
        />
      )}
      {profile.backgroundMediaType === 'image' && profile.backgroundMediaUrl && (
        <img
          src={profile.backgroundMediaUrl}
          alt=""
          className={`dossier-bg-media ${visuals.backgroundEffect === 'blurred' ? 'blurred-wall' : ''}`}
          style={previewMode ? { position: 'absolute' } : undefined}
        />
      )}
      <div
        className="dossier-bg-vignette"
        style={previewMode ? { position: 'absolute' } : undefined}
      />

      {/* Layer 2: Real-Time Atmospheric Canvas Shader & Cursor Trails */}
      <BackgroundShaderCanvas effect={visuals.backgroundEffect} contained={previewMode} />
      <CursorTrailCanvas
        trail={visuals.cursorTrail}
        accentColor={visuals.accentColor}
        contained={previewMode}
      />

      {/* Click-to-Enter Splash Screen */}
      {!previewMode && splash.enabled && (
        <div
          className={`splash-overlay ${splashDismissed ? 'dismissed' : ''}`}
          style={{
            background: `rgba(11, 10, 8, ${splashAlpha})`,
            fontFamily: splash.fontFamily || activeFontFamily,
            backdropFilter: `blur(${splash.blurAmount}px)`,
            WebkitBackdropFilter: `blur(${splash.blurAmount}px)`,
            transform:
              splashDismissed && splash.transitionStyle === 'zoom'
                ? 'scale(1.12)'
                : 'scale(1)',
            transition:
              'opacity 0.55s var(--ease-out-expo), transform 0.55s var(--ease-out-expo), visibility 0.55s',
          }}
          onClick={handleEnterSplash}
          role="button"
          tabIndex={0}
          id={`splash-enter-${profile.handle}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleEnterSplash();
          }}
        >
          <div className="splash-frame">
            <div className="splash-index">
              {profile.memberNumber} // @{profile.handle}
            </div>
            <h2 className="splash-prompt">{splash.promptText}</h2>
            <div className="splash-sub">{splash.subText}</div>
          </div>
        </div>
      )}

      {/* Subtle Floating Club Navigation Chrome */}
      {!previewMode && (
        <div className="dossier-floating-bar">
          {onBackToRoster && (
            <button
              type="button"
              id="btn-back-club-roster"
              className="floating-chip"
              onClick={onBackToRoster}
            >
              <ArrowLeft size={13} /> Club Roster
            </button>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {splash.enabled && splashDismissed && (
              <button
                type="button"
                id="btn-replay-splash"
                className="floating-chip"
                onClick={() => setSplashDismissed(false)}
              >
                Replay Splash
              </button>
            )}
            {onOpenCustomizer && (
              <button
                type="button"
                id="btn-customize-this-member"
                className="floating-chip"
                onClick={onOpenCustomizer}
              >
                <Sliders size={13} /> Customize @{profile.handle}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Layer 3: Glassmorphic Profile Container across 4 Structural Layouts */}
      <div className="dossier-card-stage">
        <article
          className={`dossier-card layout-${visuals.layout} ${entryClass}`}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            background: cardBackground,
            backdropFilter: visuals.profileBlur > 0 ? `blur(${visuals.profileBlur}px)` : 'none',
            WebkitBackdropFilter:
              visuals.profileBlur > 0 ? `blur(${visuals.profileBlur}px)` : 'none',
            border:
              visuals.borderWidth > 0
                ? `${visuals.borderWidth}px solid ${visuals.borderColor}`
                : 'none',
            borderRadius: `${visuals.borderRadius}px`,
            transform: visuals.tiltEnabled ? tiltTransform : undefined,
            fontSize: `${visuals.fontSizeScale}rem`,
            letterSpacing: `${visuals.letterSpacingEm}em`,
            boxShadow:
              visuals.profileOpacity === 0 && visuals.borderWidth === 0
                ? 'none'
                : '0 28px 75px rgba(0,0,0,0.55)',
          }}
        >
          {visuals.layout !== 'sleek' && profile.bannerUrl && (
            <div style={{ padding: visuals.bannerRadius > 0 ? '0.65rem 0.65rem 0' : 0 }}>
              <img
                src={profile.bannerUrl}
                alt=""
                className="dossier-banner"
                style={{ borderRadius: `${visuals.bannerRadius}px` }}
              />
            </div>
          )}

          <div className="dossier-inner">
            {visuals.layout === 'modern' && (
              <div className="modern-tab-strip">
                <button
                  type="button"
                  id="tab-dossier-overview"
                  className={`modern-tab-trigger ${activeTab === 'overview' ? 'active' : ''}`}
                  style={{ color: visuals.textColor }}
                  onClick={() => setActiveTab('overview')}
                >
                  01 // Profile Dossier
                </button>
                <button
                  type="button"
                  id="tab-dossier-widgets"
                  className={`modern-tab-trigger ${activeTab === 'widgets' ? 'active' : ''}`}
                  style={{ color: visuals.textColor }}
                  onClick={() => setActiveTab('widgets')}
                >
                  02 // Live Widgets
                </button>
              </div>
            )}

            {/* SLEEK HORIZONTAL LAYOUT */}
            {visuals.layout === 'sleek' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '1.35rem',
                  alignItems: 'center',
                }}
              >
                <div className="avatar-frame-wrap">
                  <img
                    src={avatarSrc}
                    alt={profile.displayName}
                    className="dossier-avatar-img"
                    style={{
                      width: 108,
                      height: 108,
                      borderRadius: `${visuals.avatarRadius}%`,
                    }}
                  />
                  {profile.discord.avatarDecoration !== 'none' && (
                    <span
                      className={`avatar-deco-ring ${profile.discord.avatarDecoration}`}
                      style={{ borderRadius: `${visuals.avatarRadius}%` }}
                    />
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: visuals.accentColor,
                    }}
                  >
                    {profile.memberNumber} · {profile.clubRole}
                  </div>
                  <div className="username-wrap" style={{ marginTop: '0.15rem' }}>
                    <h1
                      className={
                        visuals.usernameEffect === 'chromatic-sparkles' ? 'username-chromatic' : ''
                      }
                      style={{
                        margin: 0,
                        fontSize: '1.85em',
                        lineHeight: 1.08,
                        textShadow:
                          visuals.glowUsername || visuals.usernameEffect === 'warm-halation'
                            ? `0 0 ${glowSpread}px ${hexToRgba(visuals.accentColor, 0.7)}`
                            : 'none',
                      }}
                    >
                      {profile.displayName}
                    </h1>
                  </div>

                  {enabledBadges.length > 0 && (
                    <div className="badges-cluster" style={{ display: 'flex' }}>
                      {enabledBadges.map((b) => {
                        const meta = BADGE_META[b.key] || BADGE_META.custom;
                        const IconComp = meta.icon;
                        const badgeTint = visuals.monochromeBadges
                          ? visuals.accentColor
                          : meta.defaultColor;
                        return (
                          <span
                            key={b.id}
                            className="badge-chip"
                            title={b.tooltip}
                            style={{
                              color: badgeTint,
                              boxShadow: visuals.glowBadges
                                ? `0 0 ${Math.round(glowSpread * 0.8)}px ${hexToRgba(badgeTint, 0.45)}`
                                : 'none',
                            }}
                          >
                            {b.customIconUrl ? (
                              <img
                                src={b.customIconUrl}
                                alt=""
                                style={{ width: 13, height: 13, objectFit: 'contain' }}
                              />
                            ) : (
                              <IconComp size={13} />
                            )}
                            {b.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <p style={{ margin: '0.65rem 0 0', opacity: 0.88, fontSize: '0.92em' }}>
                    {typedBio}
                    {profile.typewriterEnabled && <span className="typewriter-caret" />}
                  </p>
                </div>
              </div>
            ) : (
              activeTab === 'overview' && (
                <div style={{ textAlign: 'center' }}>
                  <div
                    className={`avatar-frame-wrap ${
                      profile.bannerUrl && visuals.layout !== 'modern' ? 'pull-up' : ''
                    }`}
                  >
                    <img
                      src={avatarSrc}
                      alt={profile.displayName}
                      className="dossier-avatar-img"
                      style={{
                        borderRadius: `${visuals.avatarRadius}%`,
                        border: `2px solid ${hexToRgba(visuals.accentColor, 0.45)}`,
                      }}
                    />
                    {profile.discord.avatarDecoration !== 'none' && (
                      <span
                        className={`avatar-deco-ring ${profile.discord.avatarDecoration}`}
                        style={{ borderRadius: `${visuals.avatarRadius}%` }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: visuals.accentColor,
                    }}
                  >
                    {profile.memberNumber} // {profile.clubRole}
                  </div>

                  <div className="username-wrap" style={{ marginTop: '0.2rem' }}>
                    <h1
                      className={
                        visuals.usernameEffect === 'chromatic-sparkles' ? 'username-chromatic' : ''
                      }
                      style={{
                        margin: 0,
                        fontFamily:
                          visuals.fontFamily.includes('Serif') ||
                          visuals.fontFamily.includes('Newsreader')
                            ? visuals.fontFamily
                            : 'var(--font-serif)',
                        fontWeight: 400,
                        fontSize: '2.35em',
                        lineHeight: 1.04,
                        textShadow:
                          visuals.glowUsername || visuals.usernameEffect === 'warm-halation'
                            ? `0 0 ${glowSpread}px ${hexToRgba(visuals.accentColor, 0.72)}`
                            : 'none',
                      }}
                    >
                      {profile.displayName}
                    </h1>
                    {visuals.usernameEffect.includes('sparkles') && (
                      <div className="sparkle-layer" aria-hidden="true">
                        <span
                          className="sparkle-glyph"
                          style={{ top: '-2px', left: '-8px', color: sparkleColor }}
                        >
                          ✦
                        </span>
                        <span
                          className="sparkle-glyph"
                          style={{
                            bottom: '2px',
                            right: '-10px',
                            color: sparkleColor,
                            animationDelay: '0.8s',
                          }}
                        >
                          ✦
                        </span>
                        <span
                          className="sparkle-glyph"
                          style={{
                            top: '-6px',
                            right: '18%',
                            color: sparkleColor,
                            animationDelay: '1.5s',
                          }}
                        >
                          ✧
                        </span>
                      </div>
                    )}
                  </div>

                  {enabledBadges.length > 0 && (
                    <div>
                      <div className="badges-cluster">
                        {enabledBadges.map((b) => {
                          const meta = BADGE_META[b.key] || BADGE_META.custom;
                          const IconComp = meta.icon;
                          const badgeTint = visuals.monochromeBadges
                            ? visuals.accentColor
                            : meta.defaultColor;
                          return (
                            <span
                              key={b.id}
                              className="badge-chip"
                              title={b.tooltip}
                              style={{
                                color: badgeTint,
                                boxShadow: visuals.glowBadges
                                  ? `0 0 ${Math.round(glowSpread * 0.8)}px ${hexToRgba(badgeTint, 0.45)}`
                                  : 'none',
                              }}
                            >
                              {b.customIconUrl ? (
                                <img
                                  src={b.customIconUrl}
                                  alt=""
                                  style={{ width: 13, height: 13, objectFit: 'contain' }}
                                />
                              ) : (
                                <IconComp size={13} />
                              )}
                              {b.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p
                    style={{
                      margin: '0.85rem auto 0',
                      maxWidth: '44ch',
                      fontSize: '0.95em',
                      opacity: 0.88,
                      minHeight: '1.6em',
                    }}
                  >
                    {typedBio}
                    {profile.typewriterEnabled && <span className="typewriter-caret" />}
                  </p>

                  <div
                    style={{
                      marginTop: '0.75rem',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '1.1rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      opacity: 0.72,
                    }}
                  >
                    {profile.location && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={12} style={{ color: visuals.accentColor }} />
                        {profile.location}
                      </span>
                    )}
                    {!visuals.hideViews && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Eye size={12} style={{ color: visuals.accentColor }} />
                        {profile.analytics.uniqueViews.toLocaleString()} views
                      </span>
                    )}
                  </div>
                </div>
              )
            )}

            {/* MODERN LAYOUT SECOND TAB: RICH WIDGETS (Spotify, YouTube, Discord Server, Telegram, Roblox, Community) */}
            {visuals.layout === 'modern' && activeTab === 'widgets' ? (
              <div className="widgets-grid">
                {profile.widgets.spotify.enabled && (
                  <div className="live-widget-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Disc3 size={26} style={{ color: '#56b870', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          {profile.widgets.spotify.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', opacity: 0.72 }}>
                          {profile.widgets.spotify.subtitle}
                        </div>
                      </div>
                    </div>
                    <a
                      href={profile.widgets.spotify.embedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial"
                      style={{ fontSize: '0.68rem', padding: '0.38rem 0.7rem' }}
                    >
                      Listen <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {profile.widgets.youtube.enabled && (
                  <div className="live-widget-card">
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.66rem',
                          color: visuals.accentColor,
                          textTransform: 'uppercase',
                        }}
                      >
                        YouTube // {profile.widgets.youtube.subscribers}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: '0.15rem' }}>
                        {profile.widgets.youtube.channelName}
                      </div>
                      <div style={{ fontSize: '0.76rem', opacity: 0.75 }}>
                        {profile.widgets.youtube.featuredTitle}
                      </div>
                    </div>
                    <a
                      href={profile.widgets.youtube.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial"
                      style={{ fontSize: '0.68rem', padding: '0.38rem 0.7rem' }}
                    >
                      Watch <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {profile.widgets.discordServer.enabled && (
                  <div className="live-widget-card">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                        {profile.widgets.discordServer.serverName}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          opacity: 0.8,
                          marginTop: '0.2rem',
                        }}
                      >
                        <span style={{ color: '#6ab065' }}>
                          ● {profile.widgets.discordServer.onlineCount} online
                        </span>
                        <span>
                          <Users size={11} style={{ verticalAlign: 'middle' }} />{' '}
                          {profile.widgets.discordServer.memberCount} members
                        </span>
                      </div>
                    </div>
                    <a
                      href={profile.widgets.discordServer.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial primary"
                      style={{ fontSize: '0.68rem', padding: '0.38rem 0.75rem' }}
                    >
                      Join
                    </a>
                  </div>
                )}

                {profile.widgets.telegram?.enabled && (
                  <div className="live-widget-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <Send size={20} style={{ color: '#54a9eb', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                          {profile.widgets.telegram.channelTitle}
                        </div>
                        <div style={{ fontSize: '0.74rem', opacity: 0.72 }}>
                          Telegram · {profile.widgets.telegram.membersLabel}
                        </div>
                      </div>
                    </div>
                    <a
                      href={profile.widgets.telegram.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial"
                      style={{ fontSize: '0.68rem', padding: '0.38rem 0.7rem' }}
                    >
                      Channel <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {profile.widgets.roblox?.enabled && (
                  <div className="live-widget-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <Gamepad2 size={20} style={{ color: visuals.accentColor, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                          {profile.widgets.roblox.username}
                        </div>
                        <div style={{ fontSize: '0.74rem', opacity: 0.72 }}>
                          Roblox · {profile.widgets.roblox.creationsLabel}
                        </div>
                      </div>
                    </div>
                    <a
                      href={profile.widgets.roblox.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial"
                      style={{ fontSize: '0.68rem', padding: '0.38rem 0.7rem' }}
                    >
                      Profile <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {profile.widgets.communityCard.enabled && (
                  <div className="live-widget-card">
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: visuals.accentColor,
                        }}
                      >
                        {profile.widgets.communityCard.platformLabel} ·{' '}
                        {profile.widgets.communityCard.metric}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginTop: '0.1rem' }}>
                        {profile.widgets.communityCard.handle}
                      </div>
                      <div style={{ fontSize: '0.76rem', opacity: 0.75 }}>
                        {profile.widgets.communityCard.summary}
                      </div>
                    </div>
                    <a
                      href={profile.widgets.communityCard.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-editorial"
                      style={{ fontSize: '0.68rem', padding: '0.38rem 0.7rem' }}
                    >
                      Open <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <>
                <DiscordPresenceCard
                  config={profile.discord}
                  profileAvatarUrl={profile.avatarUrl}
                  accentColor={visuals.accentColor}
                  onAvatarSynced={setSyncedDiscordAvatar}
                />

                {visuals.layout === 'simplistic' ? (
                  <div className="simplistic-btn-stack">
                    {profile.links.map((link) => {
                      const meta = PLATFORM_META[link.platform] || PLATFORM_META.website;
                      const IconComp = meta.icon;
                      const iconHex = visuals.monochromeIcons
                        ? visuals.iconColor
                        : meta.brandColor;
                      return (
                        <button
                          key={link.id}
                          type="button"
                          className="simplistic-link-btn"
                          onClick={() => triggerSocial(link)}
                          style={{
                            border: `${Math.max(1, visuals.borderWidth)}px solid ${visuals.borderColor}`,
                            borderRadius: `${visuals.borderRadius}px`,
                            color: visuals.textColor,
                            boxShadow: visuals.glowSocials
                              ? `0 0 ${glowSpread}px ${hexToRgba(iconHex, 0.35)}`
                              : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ color: iconHex, display: 'inline-flex' }}>
                              {link.customIconUrl ? (
                                <img
                                  src={link.customIconUrl}
                                  alt=""
                                  style={{ width: 20, height: 20, objectFit: 'contain' }}
                                />
                              ) : (
                                <IconComp size={19} />
                              )}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                {link.label}
                              </div>
                              {link.subtext && (
                                <div style={{ fontSize: '0.75rem', opacity: 0.68 }}>
                                  {link.subtext}
                                </div>
                              )}
                            </div>
                          </div>
                          <span style={{ opacity: 0.65 }}>
                            {copiedId === link.id ? (
                              <Check size={15} />
                            ) : link.mode === 'text' ? (
                              <Copy size={14} />
                            ) : (
                              <ExternalLink size={14} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="social-icons-row"
                    style={{
                      justifyContent: visuals.layout === 'sleek' ? 'flex-start' : 'center',
                    }}
                  >
                    {profile.links.map((link) => {
                      const meta = PLATFORM_META[link.platform] || PLATFORM_META.website;
                      const IconComp = meta.icon;
                      const iconHex = visuals.monochromeIcons
                        ? visuals.iconColor
                        : meta.brandColor;
                      return (
                        <button
                          key={link.id}
                          type="button"
                          className="social-icon-btn"
                          title={
                            link.mode === 'text'
                              ? `${link.label} (Click to copy: ${link.value})`
                              : `${link.label} (${link.value})`
                          }
                          onClick={() => triggerSocial(link)}
                          style={{
                            color: iconHex,
                            boxShadow: visuals.glowSocials
                              ? `0 0 ${glowSpread}px ${hexToRgba(iconHex, 0.5)}`
                              : 'none',
                          }}
                        >
                          {copiedId === link.id ? (
                            <Check size={17} />
                          ) : link.customIconUrl ? (
                            <img
                              src={link.customIconUrl}
                              alt={link.label}
                              style={{ width: 20, height: 20, objectFit: 'contain' }}
                            />
                          ) : (
                            <IconComp size={18} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </article>
      </div>

      {/* Layer 5: Floating Multi-Track Audio Manager Widget */}
      {profile.audioEnabled && profile.showAudioWidget && currentTrack && (
        <div
          className="audio-deck-widget"
          style={
            previewMode
              ? { position: 'absolute', bottom: '0.9rem', right: '0.9rem' }
              : undefined
          }
        >
          <img
            src={currentTrack.coverUrl || profile.avatarUrl}
            alt={currentTrack.title}
            className={`audio-cover-art ${isPlaying ? 'playing' : ''}`}
          />
          <div className="audio-track-meta">
            <div className="audio-track-title">{currentTrack.title}</div>
            <div className="audio-track-artist">{currentTrack.artist}</div>
          </div>

          <div className="audio-deck-controls">
            {profile.audioTracks.length > 1 && (
              <button
                type="button"
                className="deck-icon-btn"
                onClick={() => setShuffleOn((s) => !s)}
                title={shuffleOn ? 'Shuffle On' : 'Shuffle Off'}
                style={
                  shuffleOn
                    ? { borderColor: visuals.accentColor, color: visuals.accentColor }
                    : undefined
                }
              >
                <Shuffle size={12} />
              </button>
            )}
            {profile.audioTracks.length > 1 && (
              <button
                type="button"
                className="deck-icon-btn"
                onClick={() => stepTrack(-1)}
                title="Previous Track"
              >
                <SkipBack size={13} />
              </button>
            )}
            <button
              type="button"
              className="deck-icon-btn"
              onClick={toggleAudioPlay}
              title={isPlaying ? 'Pause Audio' : 'Play Audio'}
              style={
                isPlaying
                  ? { borderColor: visuals.accentColor, color: visuals.accentColor }
                  : undefined
              }
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            </button>
            {profile.audioTracks.length > 1 && (
              <button
                type="button"
                className="deck-icon-btn"
                onClick={() => stepTrack(1)}
                title="Next Track"
              >
                <SkipForward size={13} />
              </button>
            )}
            <button
              type="button"
              className="deck-icon-btn"
              onClick={() => setLoopOn((l) => !l)}
              title={loopOn ? 'Loop Track On' : 'Auto-Advance Playlist'}
              style={
                loopOn
                  ? { borderColor: visuals.accentColor, color: visuals.accentColor }
                  : undefined
              }
            >
              <Repeat size={12} />
            </button>
            <button
              type="button"
              className="deck-icon-btn"
              onClick={() => {
                const nextMute = !isMuted;
                setIsMuted(nextMute);
                studioAudio.setMuted(nextMute);
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={isMuted ? 0 : volume}
              aria-label="Audio Volume"
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                setIsMuted(v === 0);
                studioAudio.setMuted(v === 0);
                studioAudio.setVolume(v);
              }}
              className="studio-range"
              style={{ width: 52 }}
            />
          </div>
        </div>
      )}

      {toastMsg && <div className="editorial-toast">{toastMsg}</div>}
    </div>
  );
};
