import React, { useMemo, useState } from 'react';
import { BarChart3, ExternalLink, Eye, Globe, MousePointerClick, Percent } from 'lucide-react';
import type { MemberProfile } from '../types/profile';
import { PLATFORM_META } from '../utils/platformIcons';

const COUNTRY_COORDS: Record<string, { x: number; y: number }> = {
  US: { x: 185, y: 122 },
  CA: { x: 175, y: 88 },
  GB: { x: 372, y: 98 },
  FR: { x: 382, y: 112 },
  DE: { x: 398, y: 102 },
  CH: { x: 394, y: 114 },
  NL: { x: 388, y: 98 },
  SE: { x: 406, y: 74 },
  IN: { x: 545, y: 158 },
  JP: { x: 658, y: 128 },
  AU: { x: 645, y: 245 },
  BR: { x: 265, y: 220 },
};

export const AnalyticsDashboard: React.FC<{
  members: MemberProfile[];
  activeHandle: string;
  onSelectMember: (handle: string) => void;
  onOpenDossier: (handle: string) => void;
}> = ({ members, activeHandle, onSelectMember, onOpenDossier }) => {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const member = members.find((m) => m.handle === activeHandle) || members[0];

  const stats = member?.analytics;

  const avgDailyViews = useMemo(() => {
    if (!stats?.dailyViews?.length) return 0;
    const sum = stats.dailyViews.reduce((acc, d) => acc + d.views, 0);
    return Math.round(sum / stats.dailyViews.length);
  }, [stats]);

  const ctrPct = useMemo(() => {
    if (!stats || !stats.totalViews) return '0.0';
    return ((stats.totalClicks / stats.totalViews) * 100).toFixed(1);
  }, [stats]);

  const sortedSocials = useMemo(() => {
    if (!stats?.socialClicks) return [];
    return Object.entries(stats.socialClicks).sort((a, b) => b[1] - a[1]);
  }, [stats]);

  if (!member || !stats) return null;

  const maxBar = Math.max(1, ...stats.dailyViews.map((d) => d.views));
  const maxSocial = Math.max(1, ...sortedSocials.map(([, c]) => c));
  const maxCountry = Math.max(1, ...stats.countries.map((c) => c.count));

  return (
    <main className="page-shell">
      {/* Analytics Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1.25rem',
          flexWrap: 'wrap',
          paddingBottom: '1.75rem',
          borderBottom: '1px solid var(--rule-medium)',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <div className="masthead-kicker">DOSSIER TELEMETRY // VISITOR ANALYTICS</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.2rem, 4vw, 3.3rem)',
              fontWeight: 400,
              lineHeight: 1.02,
              margin: 0,
            }}
          >
            Analytics — @{member.handle}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            id="select-analytics-member"
            className="studio-select"
            style={{ width: 'auto' }}
            value={member.handle}
            onChange={(e) => onSelectMember(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.handle} value={m.handle}>
                @{m.handle} — {m.displayName}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-editorial primary"
            onClick={() => onOpenDossier(member.handle)}
          >
            Open Live Dossier <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Ledger Cards */}
      <section className="analytics-kpi-grid" aria-label="Key Performance Metrics">
        <div className="kpi-card">
          <div className="kpi-label">
            <Eye size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Total Profile Views
          </div>
          <div className="kpi-value">{stats.totalViews.toLocaleString()}</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--ink-muted)',
              marginTop: '0.25rem',
            }}
          >
            {stats.uniqueViews.toLocaleString()} unique visitors
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <BarChart3 size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Average Daily Views
          </div>
          <div className="kpi-value">{avgDailyViews.toLocaleString()}</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--accent-sage)',
              marginTop: '0.25rem',
            }}
          >
            7-day rolling mean
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <MousePointerClick size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Total Link Clicks
          </div>
          <div className="kpi-value">{stats.totalClicks.toLocaleString()}</div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--ink-muted)',
              marginTop: '0.25rem',
            }}
          >
            URL opens + clipboard copies
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <Percent size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Click-Through Rate (CTR)
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {ctrPct}%
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--ink-muted)',
              marginTop: '0.25rem',
            }}
          >
            Interactions per dossier view
          </div>
        </div>
      </section>

      {/* Daily Views/Clicks Chart + Device Breakdown */}
      <section className="analytics-two-col">
        <div className="kpi-card">
          <div className="kpi-label" style={{ marginBottom: '1rem' }}>
            7-DAY TRAFFIC & INTERACTION CADENCE
          </div>
          <svg
            viewBox="0 0 560 200"
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
            role="img"
            aria-label="7-day views and clicks bar chart"
          >
            {stats.dailyViews.map((day, i) => {
              const colW = 56;
              const gap = 22;
              const x = 16 + i * (colW + gap);
              const viewH = Math.max(6, (day.views / maxBar) * 145);
              const clickH = Math.max(3, (day.clicks / maxBar) * 145);
              return (
                <g key={day.date}>
                  <rect
                    x={x}
                    y={162 - viewH}
                    width={26}
                    height={viewH}
                    rx={3}
                    fill="#f2ece1"
                    fillOpacity={0.85}
                  />
                  <rect
                    x={x + 29}
                    y={162 - clickH}
                    width={22}
                    height={clickH}
                    rx={3}
                    fill="#e04f33"
                  />
                  <text
                    x={x + 25}
                    y={182}
                    textAnchor="middle"
                    fill="#857c6f"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {day.date}
                  </text>
                  <text
                    x={x + 13}
                    y={156 - viewH}
                    textAnchor="middle"
                    fill="#b5ab9c"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {day.views}
                  </text>
                </g>
              );
            })}
          </svg>
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--ink-secondary)',
              marginTop: '0.4rem',
            }}
          >
            <span>■ Bone: Views</span>
            <span style={{ color: 'var(--accent-vermilion)' }}>■ Vermilion: Link Clicks</span>
          </div>
        </div>

        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="kpi-label">VISITOR DEVICE BREAKDOWN</div>
          {(
            [
              ['Desktop Workstations', stats.devices.desktop, '#f2ece1'],
              ['Mobile Handsets', stats.devices.mobile, '#e04f33'],
              ['Tablets & Readers', stats.devices.tablet, '#d4913d'],
            ] as [string, number, string][]
          ).map(([label, pct, color]) => (
            <div key={label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  marginBottom: '0.3rem',
                }}
              >
                <span>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</span>
              </div>
              <div
                style={{
                  height: 7,
                  borderRadius: 99,
                  background: 'var(--bg-inset)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                  }}
                />
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: '0.5rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid var(--rule-subtle)',
            }}
          >
            <div className="kpi-label" style={{ marginBottom: '0.6rem' }}>
              TOP REFERRER SOURCES
            </div>
            {stats.referrers.map((ref) => (
              <div
                key={ref.source}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.32rem 0',
                  fontSize: '0.82rem',
                  borderBottom: '1px solid var(--rule-subtle)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)' }}>{ref.source}</span>
                <span style={{ color: 'var(--ink-secondary)' }}>{ref.count} visits</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Visitor World Map + Most Clicked Socials */}
      <section className="analytics-two-col">
        <div className="kpi-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.85rem',
            }}
          >
            <span className="kpi-label">
              <Globe size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              VISITOR COUNTRIES ATLAS
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-amber)',
              }}
            >
              {hoveredCountry || 'Hover beacon to inspect region'}
            </span>
          </div>

          <div
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid var(--rule-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
            }}
          >
            <svg
              viewBox="0 0 780 320"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="World map of profile visitors"
            >
              {/* Stylized Minimalist Continental Silhouettes */}
              <g fill="#23201c" stroke="rgba(242,236,225,0.12)" strokeWidth="1">
                {/* North America */}
                <path d="M75,65 L230,60 L255,125 L195,165 L145,155 L95,115 Z" />
                {/* South America */}
                <path d="M215,180 L285,188 L298,245 L255,302 L225,265 Z" />
                {/* Europe */}
                <path d="M350,65 L445,60 L458,118 L362,126 Z" />
                {/* Africa */}
                <path d="M358,136 L455,138 L468,215 L418,278 L372,225 Z" />
                {/* Asia */}
                <path d="M458,64 L682,72 L695,168 L535,185 L468,132 Z" />
                {/* Oceania */}
                <path d="M602,218 L690,218 L698,272 L612,276 Z" />
              </g>

              {/* Active Country Telemetry Beacons */}
              {stats.countries.map((c) => {
                const pt = COUNTRY_COORDS[c.code] || { x: 390, y: 150 };
                const r = 5 + (c.count / maxCountry) * 9;
                return (
                  <g
                    key={c.code}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() =>
                      setHoveredCountry(`${c.name} (${c.code}): ${c.count} visitors`)
                    }
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={r + 5}
                      fill="rgba(224, 79, 51, 0.22)"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={r}
                      fill="#e04f33"
                      stroke="#f2ece1"
                      strokeWidth="1.2"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - r - 5}
                      textAnchor="middle"
                      fill="#f2ece1"
                      fontSize="10"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {c.code}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.65rem',
              marginTop: '0.85rem',
            }}
          >
            {stats.countries.map((c) => (
              <span
                key={c.code}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.55rem',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--rule-subtle)',
                  borderRadius: 4,
                }}
              >
                {c.code} · {c.name}: <strong>{c.count}</strong>
              </span>
            ))}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label" style={{ marginBottom: '1rem' }}>
            MOST CLICKED SOCIAL PLATFORMS
          </div>
          {sortedSocials.length === 0 ? (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
              No social link clicks recorded yet. Click any icon on `/@{member.handle}` to test live
              tracking!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {sortedSocials.map(([platform, count]) => {
                const meta =
                  PLATFORM_META[platform as keyof typeof PLATFORM_META] ||
                  PLATFORM_META.website;
                const IconComp = meta.icon;
                return (
                  <div key={platform}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.84rem',
                        marginBottom: '0.3rem',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                        }}
                      >
                        <IconComp size={15} />
                        {meta.label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                        {count} clicks
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 99,
                        background: 'var(--bg-inset)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${(count / maxSocial) * 100}%`,
                          height: '100%',
                          background: 'var(--accent-amber)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};
