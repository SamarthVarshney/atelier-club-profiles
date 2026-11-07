import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, Layers, Sliders, Users } from 'lucide-react';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ClubDirectory } from './components/ClubDirectory';
import { CustomizerStudio, type StudioTab } from './components/CustomizerStudio';
import { DossierRenderer } from './components/DossierRenderer';
import { TemplatesMarketplace } from './components/TemplatesMarketplace';
import {
  INITIAL_CLUB_SETTINGS,
  INITIAL_MEMBERS,
  INITIAL_TEMPLATES,
  createNewMemberDossier,
} from './data/seedData';
import type {
  ClubSettings,
  CommunityTemplate,
  MemberProfile,
  SocialLinkItem,
} from './types/profile';

type RouteState =
  | { view: 'directory' }
  | { view: 'customize'; tab: StudioTab }
  | { view: 'templates' }
  | { view: 'analytics' }
  | { view: 'dossier'; handleOrAlias: string };

const LOCAL_CACHE_KEY = 'atelier_club_state_v1';

function parseLocationToRoute(pathname: string): RouteState {
  const clean = decodeURIComponent(pathname || '/').replace(/\/+$/, '') || '/';
  if (clean === '/') return { view: 'directory' };
  if (clean === '/customize') return { view: 'customize', tab: 'assets' };
  if (clean === '/premium/layout') return { view: 'customize', tab: 'layout' };
  if (clean === '/premium/metadata') return { view: 'customize', tab: 'seo' };
  if (clean === '/templates') return { view: 'templates' };
  if (clean === '/analytics') return { view: 'analytics' };
  if (clean.startsWith('/@')) {
    return { view: 'dossier', handleOrAlias: clean.slice(2).toLowerCase() };
  }
  if (clean.startsWith('/u/')) {
    return { view: 'dossier', handleOrAlias: clean.slice(3).toLowerCase() };
  }
  // Direct /[username] route
  const slug = clean.slice(1).toLowerCase();
  if (slug && !slug.includes('/')) {
    return { view: 'dossier', handleOrAlias: slug };
  }
  return { view: 'directory' };
}

export function App() {
  const [club, setClub] = useState<ClubSettings>(INITIAL_CLUB_SETTINGS);
  const [members, setMembers] = useState<MemberProfile[]>(INITIAL_MEMBERS);
  const [templates, setTemplates] = useState<CommunityTemplate[]>(INITIAL_TEMPLATES);
  const [activeHandle, setActiveHandle] = useState<string>(INITIAL_MEMBERS[0].handle);
  const [route, setRoute] = useState<RouteState>(() =>
    parseLocationToRoute(window.location.pathname)
  );

  const navigate = useCallback((path: string, nextRoute?: RouteState) => {
    window.history.pushState({}, '', path);
    setRoute(nextRoute || parseLocationToRoute(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(parseLocationToRoute(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Hydrate from persistent backend API (/api/state -> /api/seed) with localStorage fallback
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = (await res.json()) as {
            initialized: boolean;
            club?: ClubSettings;
            members?: MemberProfile[];
            templates?: CommunityTemplate[];
          };
          if (!data.initialized) {
            const seededRes = await fetch('/api/seed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                club: INITIAL_CLUB_SETTINGS,
                members: INITIAL_MEMBERS,
                templates: INITIAL_TEMPLATES,
              }),
            });
            const seeded = (await seededRes.json()) as {
              club: ClubSettings;
              members: MemberProfile[];
              templates: CommunityTemplate[];
            };
            if (!cancelled && seeded.members?.length) {
              setClub(seeded.club);
              setMembers(seeded.members);
              setTemplates(seeded.templates);
            }
            return;
          }
          if (!cancelled) {
            if (data.club) setClub(data.club);
            if (data.members?.length) setMembers(data.members);
            if (data.templates?.length) setTemplates(data.templates);
          }
          return;
        }
      } catch {
        // Static deployment fallback (e.g., GitHub Pages / Vercel static)
        const cached = localStorage.getItem(LOCAL_CACHE_KEY);
        if (cached && !cancelled) {
          try {
            const parsed = JSON.parse(cached) as {
              club: ClubSettings;
              members: MemberProfile[];
              templates: CommunityTemplate[];
            };
            if (parsed.club) setClub(parsed.club);
            if (parsed.members?.length) setMembers(parsed.members);
            if (parsed.templates?.length) setTemplates(parsed.templates);
          } catch {
            // ignore corrupt local cache
          }
        }
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep localStorage synced for static portability
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({ club, members, templates }));
    } catch {
      // ignore storage quota
    }
  }, [club, members, templates]);

  // Resolve member for `/@handle`, `/[username]`, or Page Aliases
  const resolvedDossierMember = useMemo(() => {
    if (route.view !== 'dossier') return null;
    const target = route.handleOrAlias.trim().toLowerCase();
    return (
      members.find(
        (m) =>
          m.handle === target ||
          m.aliases.some((a) => a.trim().toLowerCase() === target)
      ) || null
    );
  }, [route, members]);

  // Record view telemetry when opening a live member dossier
  useEffect(() => {
    if (route.view !== 'dossier' || !resolvedDossierMember) return;
    const handle = resolvedDossierMember.handle;
    const isMobile = window.innerWidth < 768 ? 'mobile' : 'desktop';

    setMembers((prev) =>
      prev.map((m) =>
        m.handle === handle
          ? {
              ...m,
              analytics: {
                ...m.analytics,
                totalViews: m.analytics.totalViews + 1,
                uniqueViews: m.analytics.uniqueViews + 1,
              },
            }
          : m
      )
    );

    void fetch('/api/telemetry/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        device: isMobile,
        referrer: document.referrer ? new URL(document.referrer).hostname : 'Club Roster',
      }),
    }).catch(() => {});
  }, [route, resolvedDossierMember?.handle]);

  const handleSaveMember = async (
    updated: MemberProfile
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        return { ok: false, error: err.error || 'Failed to save profile' };
      }
      const data = (await res.json()) as { members: MemberProfile[] };
      if (data.members) setMembers(data.members);
      return { ok: true };
    } catch {
      setMembers((prev) => {
        const idx = prev.findIndex((m) => m.handle === updated.handle);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      return { ok: true };
    }
  };

  const handleCreateMember = async (params: {
    handle: string;
    displayName: string;
    clubRole: string;
    department: MemberProfile['department'];
    templateId: string;
    editPin: string;
  }) => {
    const tpl = templates.find((t) => t.id === params.templateId) || templates[0];
    const created = createNewMemberDossier({
      handle: params.handle,
      displayName: params.displayName,
      clubRole: params.clubRole,
      department: params.department,
      memberIndex: members.length + 1,
      template: tpl,
      editPin: params.editPin,
    });
    await handleSaveMember(created);
    setActiveHandle(created.handle);
    navigate('/customize', { view: 'customize', tab: 'assets' });
  };

  const handleUpdateClub = async (nextClub: ClubSettings) => {
    setClub(nextClub);
    void fetch('/api/club', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextClub),
    }).catch(() => {});
  };

  const handleApplyTemplate = async (tpl: CommunityTemplate, targetHandle: string) => {
    const found = members.find((m) => m.handle === targetHandle);
    if (!found) return;
    const updated: MemberProfile = {
      ...found,
      visuals: structuredClone(tpl.visuals),
      splash: structuredClone(tpl.splash),
      backgroundMediaUrl: tpl.backgroundMediaUrl,
      backgroundMediaType: tpl.backgroundMediaType,
    };
    await handleSaveMember(updated);
    setTemplates((prev) =>
      prev.map((t) => (t.id === tpl.id ? { ...t, usesCount: t.usesCount + 1 } : t))
    );
    void fetch('/api/templates/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId: tpl.id }),
    }).catch(() => {});
  };

  const handlePublishTemplate = async (tpl: CommunityTemplate) => {
    setTemplates((prev) => [tpl, ...prev]);
    void fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tpl),
    }).catch(() => {});
  };

  const handleSocialTriggered = (memberHandle: string, link: SocialLinkItem) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.handle !== memberHandle) return m;
        return {
          ...m,
          analytics: {
            ...m.analytics,
            totalClicks: m.analytics.totalClicks + 1,
            socialClicks: {
              ...m.analytics.socialClicks,
              [link.platform]: (m.analytics.socialClicks[link.platform] || 0) + 1,
            },
          },
        };
      })
    );
    void fetch('/api/telemetry/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle: memberHandle,
        linkId: link.id,
        platform: link.platform,
      }),
    }).catch(() => {});
  };

  // Full-Viewport Public Dossier Route (/@handle or /[username])
  if (route.view === 'dossier') {
    if (!resolvedDossierMember) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div className="atelier-grain-overlay" />
          <div className="masthead-kicker">404 // UNCLAIMED HANDLE</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.8rem',
              margin: '0.2rem 0 0.8rem',
              fontWeight: 400,
            }}
          >
            /@{route.handleOrAlias} is available
          </h1>
          <p style={{ color: 'var(--ink-secondary)', marginBottom: '1.5rem' }}>
            No club member has claimed this handle or alias yet.
          </p>
          <button
            type="button"
            className="btn-editorial primary"
            onClick={() => navigate('/', { view: 'directory' })}
          >
            Return to Club Roster & Claim Handle
          </button>
        </div>
      );
    }

    return (
      <DossierRenderer
        profile={resolvedDossierMember}
        onBackToRoster={() => navigate('/', { view: 'directory' })}
        onOpenCustomizer={() => {
          setActiveHandle(resolvedDossierMember.handle);
          navigate('/customize', { view: 'customize', tab: 'assets' });
        }}
        onSocialTriggered={(lnk) =>
          handleSocialTriggered(resolvedDossierMember.handle, lnk)
        }
      />
    );
  }

  return (
    <div>
      <div className="atelier-grain-overlay" aria-hidden="true" />

      {/* Top Architectural Studio Navigation Bar */}
      <header className="studio-topbar">
        <button
          type="button"
          id="nav-brand-home"
          className="brand-lockup"
          onClick={() => navigate('/', { view: 'directory' })}
        >
          <span className="brand-wordmark">
            <span className="brand-mark-dot" />
            {club.clubName}
          </span>
          <span className="brand-edition">DOSSIER ENGINE</span>
        </button>

        <nav className="studio-nav-links" aria-label="Primary Navigation">
          <button
            type="button"
            id="nav-club-roster"
            className={`nav-tab-btn ${route.view === 'directory' ? 'active' : ''}`}
            onClick={() => navigate('/', { view: 'directory' })}
          >
            <Users size={14} /> Roster ({members.length})
          </button>
          <button
            type="button"
            id="nav-customize-studio"
            className={`nav-tab-btn ${route.view === 'customize' ? 'active' : ''}`}
            onClick={() => navigate('/customize', { view: 'customize', tab: 'assets' })}
          >
            <Sliders size={14} /> Studio (`/customize`)
          </button>
          <button
            type="button"
            id="nav-templates-gallery"
            className={`nav-tab-btn ${route.view === 'templates' ? 'active' : ''}`}
            onClick={() => navigate('/templates', { view: 'templates' })}
          >
            <Layers size={14} /> Templates
          </button>
          <button
            type="button"
            id="nav-analytics-telemetry"
            className={`nav-tab-btn ${route.view === 'analytics' ? 'active' : ''}`}
            onClick={() => navigate('/analytics', { view: 'analytics' })}
          >
            <BarChart3 size={14} /> Analytics
          </button>
          <button
            type="button"
            id="nav-preview-active-dossier"
            className="btn-editorial primary"
            style={{ marginLeft: '0.35rem', padding: '0.44rem 0.85rem' }}
            onClick={() =>
              navigate(`/@${activeHandle}`, {
                view: 'dossier',
                handleOrAlias: activeHandle,
              })
            }
          >
            <Eye size={13} /> Live /@{activeHandle}
          </button>
        </nav>
      </header>

      {route.view === 'directory' && (
        <ClubDirectory
          club={club}
          members={members}
          templates={templates}
          onOpenDossier={(h) => {
            setActiveHandle(h);
            navigate(`/@${h}`, { view: 'dossier', handleOrAlias: h });
          }}
          onCustomizeMember={(h) => {
            setActiveHandle(h);
            navigate('/customize', { view: 'customize', tab: 'assets' });
          }}
          onOpenAnalytics={(h) => {
            setActiveHandle(h);
            navigate('/analytics', { view: 'analytics' });
          }}
          onCreateMember={handleCreateMember}
          onUpdateClub={handleUpdateClub}
        />
      )}

      {route.view === 'customize' && (
        <CustomizerStudio
          members={members}
          activeHandle={activeHandle}
          initialTab={route.tab}
          onSelectMember={setActiveHandle}
          onSaveMember={handleSaveMember}
          onOpenLiveDossier={(h) =>
            navigate(`/@${h}`, { view: 'dossier', handleOrAlias: h })
          }
        />
      )}

      {route.view === 'templates' && (
        <TemplatesMarketplace
          templates={templates}
          members={members}
          activeHandle={activeHandle}
          onSelectMember={setActiveHandle}
          onApplyTemplate={handleApplyTemplate}
          onPublishTemplate={handlePublishTemplate}
        />
      )}

      {route.view === 'analytics' && (
        <AnalyticsDashboard
          members={members}
          activeHandle={activeHandle}
          onSelectMember={setActiveHandle}
          onOpenDossier={(h) =>
            navigate(`/@${h}`, { view: 'dossier', handleOrAlias: h })
          }
        />
      )}
    </div>
  );
}

export default App;
