import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  ExternalLink,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ASSET_UPLOAD_SLOTS,
  CURATED_EDITORIAL_FONTS,
  type AudioTrack,
  type BackgroundEffect,
  type BadgeKey,
  type CursorTrailEffect,
  type EntryAnimation,
  type MemberProfile,
  type ProfileBadge,
  type ProfileLayout,
  type SocialLinkItem,
  type SocialPlatform,
  type UsernameEffect,
} from '../types/profile';
import { mediaAsset } from '../data/seedData';
import { BADGE_META, PLATFORM_META } from '../utils/platformIcons';
import { DossierRenderer } from './DossierRenderer';

export type StudioTab = 'assets' | 'visuals' | 'effects' | 'layout' | 'socials' | 'seo';

const EDITORIAL_SWATCHES = [
  { name: 'Vermilion', accent: '#e04f33', bg: '#12100e', text: '#f2ece1' },
  { name: 'Tungsten Amber', accent: '#d4913d', bg: '#11100d', text: '#f4efe6' },
  { name: 'Archival Sage', accent: '#7d9b76', bg: '#0e110e', text: '#f0ede4' },
  { name: 'Terracotta Clay', accent: '#c96442', bg: '#161210', text: '#f5eee6' },
  { name: 'Warm Bone Ink', accent: '#f2ece1', bg: '#0b0a09', text: '#f2ece1' },
];

export const CustomizerStudio: React.FC<{
  members: MemberProfile[];
  activeHandle: string;
  initialTab?: StudioTab;
  onSelectMember: (handle: string) => void;
  onSaveMember: (updated: MemberProfile) => Promise<{ ok: boolean; error?: string }>;
  onOpenLiveDossier: (handle: string) => void;
}> = ({
  members,
  activeHandle,
  initialTab = 'assets',
  onSelectMember,
  onSaveMember,
  onOpenLiveDossier,
}) => {
  const sourceMember = members.find((m) => m.handle === activeHandle) || members[0];
  const [draft, setDraft] = useState<MemberProfile>(sourceMember);
  const [tab, setTab] = useState<StudioTab>(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusNote, setStatusNote] = useState<string>('');
  const [dragLinkIdx, setDragLinkIdx] = useState<number | null>(null);
  const [dragBadgeIdx, setDragBadgeIdx] = useState<number | null>(null);
  const [directBgUrl, setDirectBgUrl] = useState('');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (sourceMember) {
      setDraft(structuredClone(sourceMember));
      setSaveState('idle');
      setStatusNote('');
    }
  }, [sourceMember]);

  if (!draft) return null;

  const updateVisuals = <K extends keyof MemberProfile['visuals']>(
    key: K,
    value: MemberProfile['visuals'][K]
  ) => {
    setDraft((prev) => ({
      ...prev,
      visuals: { ...prev.visuals, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaveState('saving');
    const res = await onSaveMember(draft);
    if (res.ok) {
      setSaveState('saved');
      setStatusNote(`Saved @${draft.handle} to club roster.`);
      window.setTimeout(() => setSaveState('idle'), 2400);
    } else {
      setSaveState('error');
      setStatusNote(res.error || 'Could not save member profile.');
    }
  };

  const handleAssetUpload = async (slotId: string, file: File | undefined) => {
    if (!file) return;
    const slotMeta = ASSET_UPLOAD_SLOTS.find((s) => s.id === slotId);
    if (slotMeta && file.size > slotMeta.maxMb * 1024 * 1024) {
      setStatusNote(`File exceeds ${slotMeta.maxMb}MB limit for ${slotMeta.label}.`);
      return;
    }

    const applyUploadedAsset = (
      uploadedUrl: string,
      inferredType?: 'image' | 'video' | 'audio' | 'font'
    ) => {
      const isVid =
        inferredType === 'video' ||
        file.type.startsWith('video/') ||
        /\.(mp4|m4v|webm|mov|mkv)$/i.test(file.name);
      setDraft((prev) => {
        const next = structuredClone(prev);
        if (slotId === 'background') {
          next.backgroundMediaUrl = uploadedUrl;
          next.backgroundMediaType = isVid ? 'video' : 'image';
        } else if (slotId === 'avatar') {
          next.avatarUrl = uploadedUrl;
        } else if (slotId === 'banner') {
          next.bannerUrl = uploadedUrl;
        } else if (slotId === 'cursor') {
          next.visuals.customCursorUrl = uploadedUrl;
        } else if (slotId === 'font') {
          const cleanFont = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '');
          next.visuals.customFontUrl = uploadedUrl;
          next.visuals.customFontName = cleanFont || 'MemberUploadedFont';
        } else if (slotId === 'audio') {
          next.audioTracks.push({
            id: `trk-${Date.now()}`,
            title: file.name.replace(/\.[^.]+$/, ''),
            artist: prev.displayName,
            coverUrl: prev.avatarUrl,
            audioUrl: uploadedUrl,
          });
          next.audioEnabled = true;
        } else if (slotId === 'cover') {
          if (next.audioTracks[0]) next.audioTracks[0].coverUrl = uploadedUrl;
        } else if (slotId === 'metadata') {
          next.metadata.ogBannerUrl = uploadedUrl;
          if (file.name.endsWith('.ico') || file.name.endsWith('.svg')) {
            next.metadata.faviconUrl = uploadedUrl;
          }
        } else if (slotId === 'badge') {
          next.badges.push({
            id: `bdg-${Date.now()}`,
            key: 'custom',
            label: 'Custom Badge',
            tooltip: `${prev.displayName} Custom Emblem`,
            enabled: true,
            customIconUrl: uploadedUrl,
          });
        }
        return next;
      });
      setStatusNote(`Uploaded ${file.name} (${slotId}). Click Save to publish.`);
    };

    const fallbackToClientMedia = () => {
      if (file.size > 4 * 1024 * 1024) {
        applyUploadedAsset(URL.createObjectURL(file));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          applyUploadedAsset(reader.result);
        }
      };
      reader.readAsDataURL(file);
    };

    setStatusNote(`Uploading ${file.name} to ${slotId} slot...`);
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      fallbackToClientMedia();
      return;
    }

    try {
      const res = await fetch(
        `/api/upload?slot=${encodeURIComponent(slotId)}&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          body: file,
        }
      );
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      if (!isJson) {
        fallbackToClientMedia();
        return;
      }
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        mediaType?: 'image' | 'video' | 'audio' | 'font';
      };
      if (!res.ok || !data.url) {
        setStatusNote(data.error || 'Upload failed.');
        return;
      }
      applyUploadedAsset(data.url, data.mediaType);
    } catch {
      fallbackToClientMedia();
    }
  };

  const exportProfileJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.handle}-atelier-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProfileJson = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as MemberProfile;
        setDraft({
          ...parsed,
          handle: draft.handle,
        });
        setStatusNote(`Imported JSON configuration into @${draft.handle}.`);
      } catch {
        setStatusNote('Invalid JSON dossier file.');
      }
    };
    reader.readAsText(file);
  };

  const moveItem = <T,>(arr: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = [...arr];
    const [picked] = copy.splice(from, 1);
    copy.splice(to, 0, picked);
    return copy;
  };

  return (
    <div
      className="customizer-workspace"
      style={
        sidebarCollapsed
          ? { gridTemplateColumns: '0px 1fr' }
          : undefined
      }
    >
      {/* Left Collapsible Control Column */}
      <aside
        className="customizer-sidebar"
        aria-label="Profile Customizer Controls"
        style={
          sidebarCollapsed
            ? { width: 0, overflow: 'hidden', borderRight: 'none' }
            : undefined
        }
      >
        <div className="customizer-member-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flex: 1 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--ink-muted)',
                textTransform: 'uppercase',
              }}
            >
              Editing:
            </span>
            <select
              id="select-customizer-member"
              className="studio-select"
              style={{ maxWidth: 195, padding: '0.38rem 0.6rem', fontSize: '0.82rem' }}
              value={draft.handle}
              onChange={(e) => onSelectMember(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.handle} value={m.handle}>
                  @{m.handle} — {m.displayName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              id="btn-save-dossier"
              className="btn-editorial primary"
              onClick={handleSave}
            >
              {saveState === 'saved' ? <Check size={14} /> : <Save size={14} />}
              {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
            </button>
            <button
              type="button"
              id="btn-open-live-from-studio"
              className="btn-editorial"
              title="Open Full-Viewport Live Dossier"
              onClick={() => onOpenLiveDossier(draft.handle)}
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {statusNote && (
          <div
            style={{
              padding: '0.45rem 1.25rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(212, 145, 61, 0.12)',
              color: 'var(--accent-amber)',
              borderBottom: '1px solid var(--rule-subtle)',
            }}
          >
            {statusNote}
          </div>
        )}

        <nav className="customizer-subtabs" aria-label="Customizer Sections">
          {(
            [
              ['assets', '1. Assets'],
              ['visuals', '2. Glass & Ink'],
              ['effects', '3. FX & Audio'],
              ['layout', '4. Layouts'],
              ['socials', '5. Links & Live'],
              ['seo', '6. SEO & JSON'],
            ] as [StudioTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              id={`studio-tab-${id}`}
              className={`subtab-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="customizer-panel-body">
          {/* TAB 1: IDENTITY, SPLASH & 9-SLOT DRAG-AND-DROP ASSET UPLOADER */}
          {tab === 'assets' && (
            <>
              <section className="panel-section">
                <h3 className="panel-section-title">Member Identity & Page Aliases</h3>
                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Display Name</label>
                    <input
                      className="studio-input"
                      value={draft.displayName}
                      onChange={(e) =>
                        setDraft({ ...draft, displayName: e.target.value })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Club Role</label>
                    <input
                      className="studio-input"
                      value={draft.clubRole}
                      onChange={(e) => setDraft({ ...draft, clubRole: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Location Pin</label>
                    <input
                      className="studio-input"
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Page Aliases (comma-sep)</label>
                    <input
                      className="studio-input"
                      placeholder="e.g. pres, sam"
                      value={draft.aliases.join(', ')}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          aliases: e.target.value
                            .split(',')
                            .map((s) => s.trim().toLowerCase())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Click-to-Enter Splash Screen</h3>
                <div className="toggle-row">
                  <span className="field-label">Enable Synchronized Splash Gate</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.splash.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        splash: { ...draft.splash, enabled: !draft.splash.enabled },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Splash Headline</label>
                    <input
                      className="studio-input"
                      value={draft.splash.promptText}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          splash: { ...draft.splash, promptText: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Transition Style</label>
                    <select
                      className="studio-select"
                      value={draft.splash.transitionStyle || 'fade'}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          splash: {
                            ...draft.splash,
                            transitionStyle: e.target.value as 'fade' | 'zoom',
                          },
                        })
                      }
                    >
                      <option value="fade">Smooth Dissolve</option>
                      <option value="zoom">Cinema Zoom Out</option>
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Splash Sub-caption</label>
                  <input
                    className="studio-input"
                    value={draft.splash.subText}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        splash: { ...draft.splash, subText: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Splash Gate Typeface</label>
                  <select
                    className="studio-select"
                    value={draft.splash.fontFamily || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        splash: { ...draft.splash, fontFamily: e.target.value },
                      })
                    }
                  >
                    <option value="">Inherit Editorial Display Font</option>
                    {CURATED_EDITORIAL_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-row-2">
                  <div className="field-group">
                    <div className="field-label">
                      <span>Splash Blur</span>
                      <span className="field-mono-val">{draft.splash.blurAmount}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={36}
                      className="studio-range"
                      value={draft.splash.blurAmount}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          splash: { ...draft.splash, blurAmount: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <div className="field-label">
                      <span>Splash Opacity</span>
                      <span className="field-mono-val">{draft.splash.opacity ?? 76}%</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={98}
                      className="studio-range"
                      value={draft.splash.opacity ?? 76}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          splash: { ...draft.splash, opacity: Number(e.target.value) },
                        })
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">9-Slot Drag-and-Drop Asset Uploader</h3>
                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Wallpaper Preset</label>
                    <select
                      className="studio-select"
                      value={draft.backgroundMediaUrl}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          backgroundMediaUrl: e.target.value,
                          backgroundMediaType: e.target.value ? 'image' : 'none',
                        })
                      }
                    >
                      <option value={mediaAsset('banner-darkroom.jpg')}>35mm Darkroom Desk</option>
                      <option value={mediaAsset('banner-kyoto.jpg')}>Kyoto Brutalist Rain</option>
                      <option value="">Solid Obsidian (No Image)</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Portrait Preset</label>
                    <select
                      className="studio-select"
                      value={draft.avatarUrl}
                      onChange={(e) => setDraft({ ...draft, avatarUrl: e.target.value })}
                    >
                      <option value={mediaAsset('avatar-founder.jpg')}>Risograph Technologist</option>
                      <option value={mediaAsset('avatar-design.jpg')}>Linocut Rangefinder</option>
                      <option value={mediaAsset('avatar-sound.jpg')}>Vacuum Tube Synth</option>
                      <option value={mediaAsset('avatar-systems.jpg')}>Oscilloscope Blueprint</option>
                    </select>
                  </div>
                </div>

                {/* Direct Media URL Input */}
                <div style={{ display: 'flex', gap: '0.45rem' }}>
                  <input
                    className="studio-input"
                    placeholder="Or paste direct .mp4 / .gif / .jpg background URL..."
                    value={directBgUrl}
                    onChange={(e) => setDirectBgUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-editorial"
                    onClick={() => {
                      if (!directBgUrl.trim()) return;
                      const isVid = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(directBgUrl);
                      setDraft({
                        ...draft,
                        backgroundMediaUrl: directBgUrl.trim(),
                        backgroundMediaType: isVid ? 'video' : 'image',
                      });
                      setStatusNote('Applied direct background media URL.');
                    }}
                  >
                    Apply URL
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {ASSET_UPLOAD_SLOTS.map((slot) => (
                    <div
                      key={slot.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dropped = e.dataTransfer.files?.[0];
                        if (dropped) void handleAssetUpload(slot.id, dropped);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.55rem 0.7rem',
                        background: 'var(--bg-inset)',
                        border: '1px dashed var(--rule-medium)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {slot.label}{' '}
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.67rem',
                              color: 'var(--ink-muted)',
                            }}
                          >
                            (max {slot.maxMb}MB · drop file)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.71rem', color: 'var(--ink-muted)' }}>
                          {slot.description}
                        </div>
                      </div>
                      <label className="btn-editorial" style={{ flexShrink: 0 }}>
                        <Upload size={12} /> Upload
                        <input
                          type="file"
                          accept={slot.accept}
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            void handleAssetUpload(slot.id, e.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* TAB 2: GLASSMORPHISM, PALETTE & GLOW CONTROLS */}
          {tab === 'visuals' && (
            <>
              <section className="panel-section">
                <h3 className="panel-section-title">Glassmorphism (Opacity & Blur)</h3>
                <div className="field-group">
                  <div className="field-label">
                    <span>Profile Card Opacity</span>
                    <span className="field-mono-val">{draft.visuals.profileOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    className="studio-range"
                    value={draft.visuals.profileOpacity}
                    onChange={(e) => updateVisuals('profileOpacity', Number(e.target.value))}
                  />
                </div>

                <div className="field-group">
                  <div className="field-label">
                    <span>Backdrop Blur</span>
                    <span className="field-mono-val">{draft.visuals.profileBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    className="studio-range"
                    value={draft.visuals.profileBlur}
                    onChange={(e) => updateVisuals('profileBlur', Number(e.target.value))}
                  />
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Editorial Pigment Palette</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {EDITORIAL_SWATCHES.map((sw) => (
                    <button
                      key={sw.name}
                      type="button"
                      className="btn-editorial"
                      style={{ fontSize: '0.67rem', padding: '0.32rem 0.55rem' }}
                      onClick={() => {
                        updateVisuals('accentColor', sw.accent);
                        updateVisuals('backgroundColor', sw.bg);
                        updateVisuals('textColor', sw.text);
                        updateVisuals('iconColor', sw.accent);
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: sw.accent,
                        }}
                      />
                      {sw.name}
                    </button>
                  ))}
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Accent Pigment</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={draft.visuals.accentColor}
                        onChange={(e) => updateVisuals('accentColor', e.target.value)}
                      />
                      <span className="field-mono-val">{draft.visuals.accentColor}</span>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Card Surface Base</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={draft.visuals.backgroundColor}
                        onChange={(e) => updateVisuals('backgroundColor', e.target.value)}
                      />
                      <span className="field-mono-val">{draft.visuals.backgroundColor}</span>
                    </div>
                  </div>
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Typography Ink</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={draft.visuals.textColor}
                        onChange={(e) => updateVisuals('textColor', e.target.value)}
                      />
                      <span className="field-mono-val">{draft.visuals.textColor}</span>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Social Icon Ink</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={draft.visuals.iconColor}
                        onChange={(e) => updateVisuals('iconColor', e.target.value)}
                      />
                      <span className="field-mono-val">{draft.visuals.iconColor}</span>
                    </div>
                  </div>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Enable Multi-Stop Card Gradient</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.visuals.gradientEnabled ? 'on' : ''}`}
                    onClick={() =>
                      updateVisuals('gradientEnabled', !draft.visuals.gradientEnabled)
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                {draft.visuals.gradientEnabled && (
                  <div className="field-group">
                    <label className="field-label">Gradient Secondary Stop</label>
                    <div className="color-picker-wrap">
                      <input
                        type="color"
                        value={draft.visuals.gradientSecondaryColor}
                        onChange={(e) =>
                          updateVisuals('gradientSecondaryColor', e.target.value)
                        }
                      />
                      <span className="field-mono-val">
                        {draft.visuals.gradientSecondaryColor}
                      </span>
                    </div>
                  </div>
                )}

                <div className="toggle-row">
                  <span className="field-label">Swap Box Colors (Accent Card Fill)</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.visuals.swapBoxColors ? 'on' : ''}`}
                    onClick={() =>
                      updateVisuals('swapBoxColors', !draft.visuals.swapBoxColors)
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Glow Spread, Monochrome & Tab Bar</h3>
                <div className="field-group">
                  <div className="field-label">
                    <span>Glow Spread Radius</span>
                    <span className="field-mono-val">
                      {draft.visuals.glowIntensity ?? 18}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={36}
                    className="studio-range"
                    value={draft.visuals.glowIntensity ?? 18}
                    onChange={(e) =>
                      updateVisuals('glowIntensity', Number(e.target.value))
                    }
                  />
                </div>
                {(
                  [
                    ['glowUsername', 'Glow Shadow on Username'],
                    ['glowSocials', 'Glow Shadow on Social Icons'],
                    ['glowBadges', 'Glow Shadow on Role Badges'],
                    ['monochromeIcons', 'Monochrome Social Icons'],
                    ['animatedTitle', 'Animated Browser <title> Marquee'],
                    ['hideViews', 'Hide Profile Views Counter'],
                  ] as [keyof MemberProfile['visuals'], string][]
                ).map(([key, label]) => (
                  <div key={key} className="toggle-row">
                    <span className="field-label">{label}</span>
                    <button
                      type="button"
                      className={`switch-pill ${draft.visuals[key] ? 'on' : ''}`}
                      onClick={() => updateVisuals(key, !draft.visuals[key] as never)}
                    >
                      <span className="switch-knob" />
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* TAB 3: SHADERS, TYPEWRITER, CUSTOM FONTS & MULTI-TRACK AUDIO */}
          {tab === 'effects' && (
            <>
              <section className="panel-section">
                <h3 className="panel-section-title">Canvas Shaders, Cursor & 3D Tilt</h3>
                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Background Shader</label>
                    <select
                      className="studio-select"
                      value={draft.visuals.backgroundEffect}
                      onChange={(e) =>
                        updateVisuals('backgroundEffect', e.target.value as BackgroundEffect)
                      }
                    >
                      <option value="none">None</option>
                      <option value="rain">Parallax Rain</option>
                      <option value="snow">Drifting Snow</option>
                      <option value="stars">Night Sky / Stars</option>
                      <option value="blurred">Blurred Wallpaper</option>
                      <option value="vhs-grain">VHS / CRT Scanline Grain</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Username Shader</label>
                    <select
                      className="studio-select"
                      value={draft.visuals.usernameEffect}
                      onChange={(e) =>
                        updateVisuals('usernameEffect', e.target.value as UsernameEffect)
                      }
                    >
                      <option value="none">Clean Editorial</option>
                      <option value="gold-sparkles">Gold Sparkles</option>
                      <option value="bone-sparkles">Bone White Sparkles</option>
                      <option value="crimson-sparkles">Vermilion Sparkles</option>
                      <option value="chromatic-sparkles">Chromatic Shimmer</option>
                      <option value="warm-halation">Warm Film Halation</option>
                    </select>
                  </div>
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Cursor Trail Physics</label>
                    <select
                      className="studio-select"
                      value={draft.visuals.cursorTrail}
                      onChange={(e) =>
                        updateVisuals('cursorTrail', e.target.value as CursorTrailEffect)
                      }
                    >
                      <option value="none">Default OS Pointer</option>
                      <option value="fairy-dust">Fairy Dust / Gold Sparks</option>
                      <option value="ink-dots">Trailing Ink Dots</option>
                      <option value="ghost-cursor">Ghost Cursor</option>
                      <option value="snowflakes">Snowflakes</option>
                      <option value="bubbles">Bubble Trails</option>
                    </select>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Card Entry Motion</label>
                    <select
                      className="studio-select"
                      value={draft.visuals.entryAnimation}
                      onChange={(e) =>
                        updateVisuals('entryAnimation', e.target.value as EntryAnimation)
                      }
                    >
                      <option value="editorial-unfold">Editorial Unfold</option>
                      <option value="fade-rise">Fade & Rise</option>
                      <option value="scale-snap">Scale Snap</option>
                      <option value="none">Instant</option>
                    </select>
                  </div>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Interactive 3D Perspective Card Tilt</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.visuals.tiltEnabled ? 'on' : ''}`}
                    onClick={() => updateVisuals('tiltEnabled', !draft.visuals.tiltEnabled)}
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Bespoke Typography & Custom Font</h3>
                <div className="field-group">
                  <label className="field-label">Curated Editorial Typeface</label>
                  <select
                    className="studio-select"
                    value={draft.visuals.fontFamily}
                    onChange={(e) => {
                      updateVisuals('fontFamily', e.target.value);
                      updateVisuals('customFontUrl', '');
                    }}
                  >
                    {CURATED_EDITORIAL_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <div className="field-label">
                      <span>Font Scale</span>
                      <span className="field-mono-val">{draft.visuals.fontSizeScale}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.85}
                      max={1.2}
                      step={0.02}
                      className="studio-range"
                      value={draft.visuals.fontSizeScale}
                      onChange={(e) =>
                        updateVisuals('fontSizeScale', Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="field-group">
                    <div className="field-label">
                      <span>Letter Spacing</span>
                      <span className="field-mono-val">{draft.visuals.letterSpacingEm}em</span>
                    </div>
                    <input
                      type="range"
                      min={-0.04}
                      max={0.08}
                      step={0.01}
                      className="studio-range"
                      value={draft.visuals.letterSpacingEm}
                      onChange={(e) =>
                        updateVisuals('letterSpacingEm', Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Typewriter Bio Engine</h3>
                <div className="toggle-row">
                  <span className="field-label">Looping Typewriter Bio</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.typewriterEnabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({ ...draft, typewriterEnabled: !draft.typewriterEnabled })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
                <div className="field-group">
                  <label className="field-label">Bio Lines (one phrase per line)</label>
                  <textarea
                    rows={3}
                    className="studio-textarea"
                    value={draft.bioLines.join('\n')}
                    onChange={(e) =>
                      setDraft({ ...draft, bioLines: e.target.value.split('\n') })
                    }
                  />
                </div>
                <div className="field-row-2">
                  <div className="field-group">
                    <div className="field-label">
                      <span>Type Speed</span>
                      <span className="field-mono-val">{draft.typewriterSpeedMs}ms</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      className="studio-range"
                      value={draft.typewriterSpeedMs}
                      onChange={(e) =>
                        setDraft({ ...draft, typewriterSpeedMs: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="field-group">
                    <div className="field-label">
                      <span>Delete Speed</span>
                      <span className="field-mono-val">{draft.deletionSpeedMs}ms</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={80}
                      className="studio-range"
                      value={draft.deletionSpeedMs}
                      onChange={(e) =>
                        setDraft({ ...draft, deletionSpeedMs: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="field-group">
                  <div className="field-label">
                    <span>Pause Duration Between Lines</span>
                    <span className="field-mono-val">
                      {draft.pauseDurationMs ?? 1800}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={4000}
                    step={100}
                    className="studio-range"
                    value={draft.pauseDurationMs ?? 1800}
                    onChange={(e) =>
                      setDraft({ ...draft, pauseDurationMs: Number(e.target.value) })
                    }
                  />
                </div>
              </section>

              <section className="panel-section">
                <div className="panel-section-title">
                  <span>Multi-Track Audio Manager</span>
                  <button
                    type="button"
                    className="btn-editorial"
                    style={{ fontSize: '0.66rem', padding: '0.25rem 0.55rem' }}
                    onClick={() => {
                      const nextTrack: AudioTrack = {
                        id: `trk-${Date.now()}`,
                        title: 'Analog Tape Loop',
                        artist: draft.displayName,
                        coverUrl: draft.avatarUrl,
                        audioUrl: 'synth:tape-loop',
                      };
                      setDraft({
                        ...draft,
                        audioTracks: [...draft.audioTracks, nextTrack],
                      });
                    }}
                  >
                    <Plus size={11} /> Add Track
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Show Audio Player Widget</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.showAudioWidget ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({ ...draft, showAudioWidget: !draft.showAudioWidget })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="field-row-2">
                  <div className="toggle-row">
                    <span className="field-label">Shuffle Playlist</span>
                    <button
                      type="button"
                      className={`switch-pill ${draft.audioShuffle ? 'on' : ''}`}
                      onClick={() =>
                        setDraft({ ...draft, audioShuffle: !draft.audioShuffle })
                      }
                    >
                      <span className="switch-knob" />
                    </button>
                  </div>
                  <div className="toggle-row">
                    <span className="field-label">Loop Track</span>
                    <button
                      type="button"
                      className={`switch-pill ${draft.audioLoop !== false ? 'on' : ''}`}
                      onClick={() =>
                        setDraft({ ...draft, audioLoop: draft.audioLoop === false })
                      }
                    >
                      <span className="switch-knob" />
                    </button>
                  </div>
                </div>

                {draft.audioTracks.map((trk, idx) => (
                  <div
                    key={trk.id}
                    style={{
                      padding: '0.65rem',
                      background: 'var(--bg-inset)',
                      border: '1px solid var(--rule-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      gap: '0.45rem',
                    }}
                  >
                    <input
                      className="studio-input"
                      placeholder="Track Title"
                      value={trk.title}
                      onChange={(e) => {
                        const list = [...draft.audioTracks];
                        list[idx] = { ...trk, title: e.target.value };
                        setDraft({ ...draft, audioTracks: list });
                      }}
                    />
                    <select
                      className="studio-select"
                      style={{ maxWidth: 165 }}
                      value={trk.audioUrl}
                      onChange={(e) => {
                        const list = [...draft.audioTracks];
                        list[idx] = { ...trk, audioUrl: e.target.value };
                        setDraft({ ...draft, audioTracks: list });
                      }}
                    >
                      <option value="synth:darkroom">Synth: Darkroom</option>
                      <option value="synth:kyoto">Synth: Kyoto</option>
                      <option value="synth:tape-loop">Synth: 4-Track Tape</option>
                      <option value="synth:oscillator">Synth: 432Hz Sine</option>
                      {!trk.audioUrl.startsWith('synth:') && (
                        <option value={trk.audioUrl}>Uploaded Audio</option>
                      )}
                    </select>
                    <button
                      type="button"
                      className="btn-editorial ghost"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          audioTracks: draft.audioTracks.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* TAB 4: THE FOUR PROFILE LAYOUTS & SECOND-TAB LIVE WIDGETS */}
          {tab === 'layout' && (
            <>
              <section className="panel-section">
                <h3 className="panel-section-title">Structural Profile Wireframe</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {(
                    [
                      ['default', 'Default Card', 'Classic vertical dossier + icon row'],
                      ['modern', 'Modern (2-Tab)', 'Unlocks live Second-Tab embeds'],
                      ['simplistic', 'Simplistic', 'Wide editorial Linktree buttons'],
                      ['sleek', 'Sleek Horizontal', 'Compact studio credential badge'],
                    ] as [ProfileLayout, string, string][]
                  ).map(([id, title, desc]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => updateVisuals('layout', id)}
                      style={{
                        textAlign: 'left',
                        padding: '0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        border:
                          draft.visuals.layout === id
                            ? '1px solid var(--accent-vermilion)'
                            : '1px solid var(--rule-subtle)',
                        background:
                          draft.visuals.layout === id
                            ? 'var(--accent-vermilion-soft)'
                            : 'var(--bg-inset)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>{desc}</div>
                    </button>
                  ))}
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <div className="field-label">
                      <span>Card Corner Radius</span>
                      <span className="field-mono-val">{draft.visuals.borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      className="studio-range"
                      value={draft.visuals.borderRadius}
                      onChange={(e) => updateVisuals('borderRadius', Number(e.target.value))}
                    />
                  </div>
                  <div className="field-group">
                    <div className="field-label">
                      <span>Avatar Radius</span>
                      <span className="field-mono-val">{draft.visuals.avatarRadius}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      className="studio-range"
                      value={draft.visuals.avatarRadius}
                      onChange={(e) => updateVisuals('avatarRadius', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="field-row-2">
                  <div className="field-group">
                    <div className="field-label">
                      <span>Border Width</span>
                      <span className="field-mono-val">{draft.visuals.borderWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={4}
                      className="studio-range"
                      value={draft.visuals.borderWidth}
                      onChange={(e) => updateVisuals('borderWidth', Number(e.target.value))}
                    />
                  </div>
                  <div className="field-group">
                    <div className="field-label">
                      <span>Banner Radius</span>
                      <span className="field-mono-val">{draft.visuals.bannerRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      className="studio-range"
                      value={draft.visuals.bannerRadius}
                      onChange={(e) => updateVisuals('bannerRadius', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label className="field-label">Card Border Color</label>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      value={
                        /^#[0-9a-fA-F]{6}$/.test(draft.visuals.borderColor)
                          ? draft.visuals.borderColor
                          : '#3d3730'
                      }
                      onChange={(e) => updateVisuals('borderColor', e.target.value)}
                    />
                    <input
                      className="studio-input"
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}
                      value={draft.visuals.borderColor}
                      onChange={(e) => updateVisuals('borderColor', e.target.value)}
                      placeholder="#3d3730 or rgba(242, 236, 225, 0.22)"
                    />
                  </div>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Second-Tab Widgets (Modern Layout)</h3>
                <div className="toggle-row">
                  <span className="field-label">Spotify Track / Playlist Widget</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.widgets.spotify.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        widgets: {
                          ...draft.widgets,
                          spotify: {
                            ...draft.widgets.spotify,
                            enabled: !draft.widgets.spotify.enabled,
                          },
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">YouTube Channel Widget</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.widgets.youtube.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        widgets: {
                          ...draft.widgets,
                          youtube: {
                            ...draft.widgets.youtube,
                            enabled: !draft.widgets.youtube.enabled,
                          },
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Discord Server Invite Widget</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.widgets.discordServer.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        widgets: {
                          ...draft.widgets,
                          discordServer: {
                            ...draft.widgets.discordServer,
                            enabled: !draft.widgets.discordServer.enabled,
                          },
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Telegram Channel Card</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.widgets.telegram?.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        widgets: {
                          ...draft.widgets,
                          telegram: {
                            enabled: !draft.widgets.telegram?.enabled,
                            channelTitle:
                              draft.widgets.telegram?.channelTitle || 'Atelier Dispatches',
                            membersLabel:
                              draft.widgets.telegram?.membersLabel || '640 subscribers',
                            inviteUrl:
                              draft.widgets.telegram?.inviteUrl || 'https://t.me',
                          },
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Roblox Profile Card</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.widgets.roblox?.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        widgets: {
                          ...draft.widgets,
                          roblox: {
                            enabled: !draft.widgets.roblox?.enabled,
                            username: draft.widgets.roblox?.username || `@${draft.handle}`,
                            creationsLabel:
                              draft.widgets.roblox?.creationsLabel || '3 published worlds',
                            profileUrl:
                              draft.widgets.roblox?.profileUrl || 'https://roblox.com',
                          },
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">GitHub Organization Summary Card</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.widgets.communityCard.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        widgets: {
                          ...draft.widgets,
                          communityCard: {
                            ...draft.widgets.communityCard,
                            enabled: !draft.widgets.communityCard.enabled,
                          },
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
              </section>
            </>
          )}

          {/* TAB 5: 37 SOCIAL PLATFORMS, 17 BADGES & LANYARD WEBSOCKET DISCORD */}
          {tab === 'socials' && (
            <>
              <section className="panel-section">
                <div className="panel-section-title">
                  <span>37 Social Platforms (Drag to Reorder)</span>
                  <button
                    type="button"
                    id="btn-add-social-link"
                    className="btn-editorial"
                    style={{ fontSize: '0.66rem', padding: '0.25rem 0.55rem' }}
                    onClick={() => {
                      const item: SocialLinkItem = {
                        id: `lnk-${Date.now()}`,
                        platform: 'github',
                        label: 'GitHub',
                        subtext: 'Click to open',
                        value: 'https://github.com',
                        mode: 'link',
                        clicks: 0,
                      };
                      setDraft({ ...draft, links: [...draft.links, item] });
                    }}
                  >
                    <Plus size={11} /> Add Platform
                  </button>
                </div>

                {draft.links.map((lnk, idx) => (
                  <div
                    key={lnk.id}
                    className="draggable-row"
                    draggable
                    onDragStart={() => setDragLinkIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragLinkIdx !== null && dragLinkIdx !== idx) {
                        setDraft({
                          ...draft,
                          links: moveItem(draft.links, dragLinkIdx, idx),
                        });
                      }
                      setDragLinkIdx(null);
                    }}
                    style={{ flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <GripVertical size={14} style={{ color: 'var(--ink-muted)' }} />
                      <select
                        className="studio-select"
                        style={{ maxWidth: 135, padding: '0.32rem 0.45rem', fontSize: '0.78rem' }}
                        value={lnk.platform}
                        onChange={(e) => {
                          const list = [...draft.links];
                          const p = e.target.value as SocialPlatform;
                          list[idx] = {
                            ...lnk,
                            platform: p,
                            label: PLATFORM_META[p]?.label || lnk.label,
                          };
                          setDraft({ ...draft, links: list });
                        }}
                      >
                        {(Object.keys(PLATFORM_META) as SocialPlatform[]).map((p) => (
                          <option key={p} value={p}>
                            {PLATFORM_META[p].label}
                          </option>
                        ))}
                      </select>

                      <select
                        className="studio-select"
                        style={{ maxWidth: 130, padding: '0.32rem 0.45rem', fontSize: '0.76rem' }}
                        value={lnk.mode}
                        onChange={(e) => {
                          const list = [...draft.links];
                          list[idx] = { ...lnk, mode: e.target.value as 'link' | 'text' };
                          setDraft({ ...draft, links: list });
                        }}
                      >
                        <option value="link">Link Mode (URL)</option>
                        <option value="text">Text Mode (Copy)</option>
                      </select>

                      <button
                        type="button"
                        className="deck-icon-btn"
                        onClick={() =>
                          setDraft({ ...draft, links: moveItem(draft.links, idx, idx - 1) })
                        }
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        className="deck-icon-btn"
                        onClick={() =>
                          setDraft({ ...draft, links: moveItem(draft.links, idx, idx + 1) })
                        }
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        className="deck-icon-btn"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            links: draft.links.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="field-row-2">
                      <input
                        className="studio-input"
                        style={{ padding: '0.36rem 0.55rem', fontSize: '0.8rem' }}
                        placeholder="Button Label"
                        value={lnk.label}
                        onChange={(e) => {
                          const list = [...draft.links];
                          list[idx] = { ...lnk, label: e.target.value };
                          setDraft({ ...draft, links: list });
                        }}
                      />
                      <input
                        className="studio-input"
                        style={{ padding: '0.36rem 0.55rem', fontSize: '0.8rem' }}
                        placeholder={
                          lnk.mode === 'text' ? 'Tag / ID / Wallet to Copy' : 'https://...'
                        }
                        value={lnk.value}
                        onChange={(e) => {
                          const list = [...draft.links];
                          list[idx] = { ...lnk, value: e.target.value };
                          setDraft({ ...draft, links: list });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>

              <section className="panel-section">
                <div className="panel-section-title">
                  <span>Badges Locker (17 Obtainable Badges)</span>
                  <button
                    type="button"
                    className="btn-editorial"
                    style={{ fontSize: '0.66rem', padding: '0.25rem 0.55rem' }}
                    onClick={() => {
                      const nextBadge: ProfileBadge = {
                        id: `bdg-${Date.now()}`,
                        key: 'premium',
                        label: 'Premium',
                        tooltip: 'Studio Edition Badge',
                        enabled: true,
                      };
                      setDraft({ ...draft, badges: [...draft.badges, nextBadge] });
                    }}
                  >
                    <Plus size={11} /> Add Badge
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Monochrome Badges</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.visuals.monochromeBadges ? 'on' : ''}`}
                    onClick={() =>
                      updateVisuals('monochromeBadges', !draft.visuals.monochromeBadges)
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                {draft.badges.map((bdg, idx) => (
                  <div
                    key={bdg.id}
                    className="draggable-row"
                    draggable
                    onDragStart={() => setDragBadgeIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragBadgeIdx !== null && dragBadgeIdx !== idx) {
                        setDraft({
                          ...draft,
                          badges: moveItem(draft.badges, dragBadgeIdx, idx),
                        });
                      }
                      setDragBadgeIdx(null);
                    }}
                  >
                    <GripVertical size={14} style={{ color: 'var(--ink-muted)' }} />
                    <input
                      type="checkbox"
                      checked={bdg.enabled}
                      onChange={(e) => {
                        const list = [...draft.badges];
                        list[idx] = { ...bdg, enabled: e.target.checked };
                        setDraft({ ...draft, badges: list });
                      }}
                    />
                    <select
                      className="studio-select"
                      style={{ maxWidth: 130, padding: '0.3rem 0.45rem', fontSize: '0.76rem' }}
                      value={bdg.key}
                      onChange={(e) => {
                        const list = [...draft.badges];
                        list[idx] = { ...bdg, key: e.target.value as BadgeKey };
                        setDraft({ ...draft, badges: list });
                      }}
                    >
                      {(Object.keys(BADGE_META) as BadgeKey[]).map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <input
                      className="studio-input"
                      style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                      value={bdg.label}
                      onChange={(e) => {
                        const list = [...draft.badges];
                        list[idx] = { ...bdg, label: e.target.value };
                        setDraft({ ...draft, badges: list });
                      }}
                    />
                  </div>
                ))}
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Live Discord (Lanyard WebSocket + REST)</h3>
                <div className="toggle-row">
                  <span className="field-label">Show Discord Rich Presence Card</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.discord.enabled ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        discord: { ...draft.discord, enabled: !draft.discord.enabled },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div className="toggle-row">
                  <span className="field-label">Connect Live Lanyard Socket & REST API</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.discord.useLanyardApi ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        discord: {
                          ...draft.discord,
                          useLanyardApi: !draft.discord.useLanyardApi,
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                {draft.discord.useLanyardApi && (
                  <>
                    <div className="field-group">
                      <label className="field-label">Discord User Snowflake ID</label>
                      <input
                        className="studio-input"
                        placeholder="e.g. 94490510688792576"
                        value={draft.discord.discordUserId}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            discord: { ...draft.discord, discordUserId: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="toggle-row">
                      <span className="field-label">Auto-Sync Discord Avatar to Profile</span>
                      <button
                        type="button"
                        className={`switch-pill ${draft.discord.syncAvatar ? 'on' : ''}`}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            discord: {
                              ...draft.discord,
                              syncAvatar: !draft.discord.syncAvatar,
                            },
                          })
                        }
                      >
                        <span className="switch-knob" />
                      </button>
                    </div>
                  </>
                )}

                <div className="field-row-2">
                  <div className="field-group">
                    <label className="field-label">Avatar Decoration Frame</label>
                    <select
                      className="studio-select"
                      value={draft.discord.avatarDecoration}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          discord: {
                            ...draft.discord,
                            avatarDecoration:
                              e.target.value as MemberProfile['discord']['avatarDecoration'],
                          },
                        })
                      }
                    >
                      <option value="none">None</option>
                      <option value="brass-orbit">Brass Orbit Ring</option>
                      <option value="vermilion-seal">Vermilion Studio Seal</option>
                      <option value="scanline-frame">Architectural Double Rule</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Status Indicator</label>
                    <select
                      className="studio-select"
                      value={draft.discord.fallbackStatus}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          discord: {
                            ...draft.discord,
                            fallbackStatus:
                              e.target.value as MemberProfile['discord']['fallbackStatus'],
                          },
                        })
                      }
                    >
                      <option value="online">Online</option>
                      <option value="idle">Idle</option>
                      <option value="dnd">Do Not Disturb</option>
                      <option value="offline">Offline</option>
                    </select>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* TAB 6: METADATA, OPENGRAPH OVERLAY PREVIEW & JSON PORTABILITY */}
          {tab === 'seo' && (
            <>
              <section className="panel-section">
                <h3 className="panel-section-title">SEO & OpenGraph Social Card</h3>
                <div className="field-group">
                  <label className="field-label">Browser & Embed Title</label>
                  <input
                    className="studio-input"
                    value={draft.metadata.websiteTitle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        metadata: { ...draft.metadata, websiteTitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Embed Description</label>
                  <textarea
                    rows={2}
                    className="studio-textarea"
                    value={draft.metadata.metaDescription}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        metadata: { ...draft.metadata, metaDescription: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="toggle-row">
                  <span className="field-label">Dynamic User Info Overlay on Embed</span>
                  <button
                    type="button"
                    className={`switch-pill ${draft.metadata.userInfoOverlay ? 'on' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        metadata: {
                          ...draft.metadata,
                          userInfoOverlay: !draft.metadata.userInfoOverlay,
                        },
                      })
                    }
                  >
                    <span className="switch-knob" />
                  </button>
                </div>

                <div
                  style={{
                    background: '#0b0a09',
                    border: '1px solid var(--rule-medium)',
                    borderLeft: `3px solid ${draft.visuals.accentColor}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.8rem',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.66rem',
                      color: 'var(--ink-muted)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    atelier.club/@{draft.handle}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#e8a86b' }}>
                    {draft.metadata.websiteTitle}
                  </div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--ink-secondary)',
                      margin: '0.2rem 0 0.6rem',
                    }}
                  >
                    {draft.metadata.metaDescription}
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      height: 118,
                      borderRadius: 4,
                      overflow: 'hidden',
                      backgroundImage: `url(${draft.metadata.ogBannerUrl || draft.bannerUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {draft.metadata.userInfoOverlay && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(10, 9, 8, 0.58)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.85rem',
                        }}
                      >
                        <img
                          src={draft.avatarUrl}
                          alt=""
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            objectFit: 'cover',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                            {draft.displayName}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              opacity: 0.8,
                            }}
                          >
                            @{draft.handle} · {draft.clubRole}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="panel-section">
                <h3 className="panel-section-title">Portable Config (JSON Export / Import)</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                  Export your dossier configuration as a `.json` file to commit via GitHub PR or
                  back up locally.
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    id="btn-export-json"
                    className="btn-editorial"
                    onClick={exportProfileJson}
                  >
                    <Download size={13} /> Export JSON
                  </button>
                  <label className="btn-editorial">
                    <Upload size={13} /> Import JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={(e) => importProfileJson(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </section>
            </>
          )}
        </div>
      </aside>

      {/* Right Live Interactive Split-Pane Preview */}
      <section className="customizer-preview-pane" aria-label="Live Dossier Preview">
        <div
          style={{
            padding: '0.55rem 1.15rem',
            borderBottom: '1px solid var(--rule-subtle)',
            background: 'var(--bg-paper)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--ink-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              id="btn-toggle-studio-sidebar"
              className="btn-editorial"
              style={{ padding: '0.28rem 0.6rem', fontSize: '0.67rem' }}
              onClick={() => setSidebarCollapsed((c) => !c)}
            >
              {sidebarCollapsed ? (
                <>
                  <PanelLeftOpen size={12} /> Show Controls
                </>
              ) : (
                <>
                  <PanelLeftClose size={12} /> Full Preview
                </>
              )}
            </button>
            <span>LIVE INTERACTIVE CANVAS // @{draft.handle}</span>
          </div>
          <span>
            LAYOUT: {draft.visuals.layout.toUpperCase()} · OPACITY:{' '}
            {draft.visuals.profileOpacity}% · BLUR: {draft.visuals.profileBlur}PX
          </span>
        </div>

        <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
          <DossierRenderer profile={draft} previewMode />
        </div>
      </section>
    </div>
  );
};
