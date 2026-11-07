import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Edit3,
  Eye,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Users,
} from 'lucide-react';
import type {
  ClubSettings,
  CommunityTemplate,
  MemberProfile,
} from '../types/profile';

export const ClubDirectory: React.FC<{
  club: ClubSettings;
  members: MemberProfile[];
  templates: CommunityTemplate[];
  onOpenDossier: (handle: string) => void;
  onCustomizeMember: (handle: string) => void;
  onOpenAnalytics: (handle: string) => void;
  onCreateMember: (params: {
    handle: string;
    displayName: string;
    clubRole: string;
    department: MemberProfile['department'];
    templateId: string;
    editPin: string;
  }) => Promise<void>;
  onUpdateClub: (next: ClubSettings) => Promise<void>;
}> = ({
  club,
  members,
  templates,
  onOpenDossier,
  onCustomizeMember,
  onOpenAnalytics,
  onCreateMember,
  onUpdateClub,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClubEditModal, setShowClubEditModal] = useState(false);

  // Create Member Form State
  const [newHandle, setNewHandle] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDept, setNewDept] = useState<MemberProfile['department']>('Engineering');
  const [newTemplateId, setNewTemplateId] = useState(templates[0]?.id || '');
  const [newPin, setNewPin] = useState('');
  const [formError, setFormError] = useState('');

  // Club Masthead Edit State
  const [clubDraft, setClubDraft] = useState<ClubSettings>(club);

  const departments = ['All', 'Engineering', 'Design', 'Sound & Media', 'Systems', 'Research'];

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedDept !== 'All' && m.department !== selectedDept) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        m.displayName.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q) ||
        m.clubRole.toLowerCase().includes(q) ||
        m.aliases.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [members, selectedDept, query]);

  const totalViews = useMemo(
    () => members.reduce((acc, m) => acc + (m.analytics?.totalViews || 0), 0),
    [members]
  );
  const totalClicks = useMemo(
    () => members.reduce((acc, m) => acc + (m.analytics?.totalClicks || 0), 0),
    [members]
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newHandle.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleaned) {
      setFormError('Please enter a valid alphanumeric handle (e.g., alex-chen).');
      return;
    }
    if (
      members.some(
        (m) => m.handle === cleaned || m.aliases.map((a) => a.trim()).includes(cleaned)
      )
    ) {
      setFormError(`Handle "@${cleaned}" is already claimed by another club member.`);
      return;
    }
    setFormError('');
    await onCreateMember({
      handle: cleaned,
      displayName: newName || cleaned,
      clubRole: newRole || 'Club Member',
      department: newDept,
      templateId: newTemplateId,
      editPin: newPin.trim(),
    });
    setShowCreateModal(false);
    setNewHandle('');
    setNewName('');
    setNewRole('');
    setNewPin('');
  };

  return (
    <main className="page-shell">
      {/* Architectural Club Masthead */}
      <section className="editorial-masthead">
        <div>
          <div className="masthead-kicker">
            <span>{club.chapterCode}</span>
            <span>·</span>
            <span>{club.foundedYear}</span>
            <button
              type="button"
              id="btn-edit-club-masthead"
              className="btn-editorial ghost"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.65rem', marginLeft: '0.35rem' }}
              onClick={() => {
                setClubDraft(club);
                setShowClubEditModal(true);
              }}
            >
              <Edit3 size={11} /> Edit Club Info
            </button>
          </div>
          <h1 className="masthead-title">
            {club.clubName} — <em>Member Dossiers</em>
          </h1>
          <p className="masthead-manifesto">{club.manifesto}</p>
        </div>

        <aside className="masthead-ledger" aria-label="Club Roster Summary">
          <div className="ledger-stats-row">
            <div>
              <div className="ledger-stat-num">{members.length}</div>
              <div className="ledger-stat-label">Active Members</div>
            </div>
            <div>
              <div className="ledger-stat-num">{totalViews.toLocaleString()}</div>
              <div className="ledger-stat-label">Dossier Visits</div>
            </div>
            <div>
              <div className="ledger-stat-num">{totalClicks.toLocaleString()}</div>
              <div className="ledger-stat-label">Link Actions</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              id="btn-open-claim-handle"
              className="btn-editorial primary"
              style={{ flex: 1 }}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={15} /> Claim Member Handle
            </button>
            {members[0] && (
              <button
                type="button"
                id="btn-open-studio-default"
                className="btn-editorial"
                onClick={() => onCustomizeMember(members[0].handle)}
              >
                <Sliders size={14} /> Open Studio
              </button>
            )}
          </div>
        </aside>
      </section>

      {/* Department Filter & Search Toolbar */}
      <section className="roster-toolbar" aria-label="Filter Club Members">
        <div className="dept-pills">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              id={`filter-dept-${dept.toLowerCase().replace(/[^a-z]/g, '-')}`}
              className={`dept-pill ${selectedDept === dept ? 'active' : ''}`}
              onClick={() => setSelectedDept(dept)}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="search-box-wrap">
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            id="input-search-roster"
            type="search"
            className="studio-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search @handle, name, role, or alias..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Multi-Member Roster Grid */}
      <section className="roster-grid" aria-label="Club Member Profiles">
        {filteredMembers.map((member) => {
          const status = member.discord.fallbackStatus || 'online';
          return (
            <article key={member.handle} className="roster-card">
              <div
                className="roster-card-banner"
                style={{
                  backgroundImage: member.bannerUrl ? `url(${member.bannerUrl})` : undefined,
                  backgroundColor: member.visuals.backgroundColor,
                }}
              >
                <span className="roster-card-index">{member.memberNumber}</span>
                <span className="roster-card-layout-tag">{member.visuals.layout} layout</span>
              </div>

              <div className="roster-card-body">
                <div className="roster-avatar-row">
                  <img
                    src={member.avatarUrl}
                    alt={member.displayName}
                    className="roster-avatar"
                  />
                  <span className="roster-status-pill">
                    <span className={`status-dot ${status}`} />
                    {status}
                  </span>
                </div>

                <h2 className="roster-member-name">{member.displayName}</h2>
                <div className="roster-member-handle">
                  /@{member.handle}
                  {member.aliases.length > 0 && (
                    <span style={{ opacity: 0.65 }}>
                      {' '}
                      · aliases: {member.aliases.map((a) => `@${a.trim()}`).join(', ')}
                    </span>
                  )}
                </div>
                <div className="roster-role-line">{member.clubRole}</div>

                <p className="roster-bio-snippet">
                  {member.bioLines[0] || 'No bio configured yet.'}
                </p>

                <div className="roster-card-footer">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    <Eye size={13} />
                    {member.analytics.uniqueViews.toLocaleString()}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      id={`btn-analytics-${member.handle}`}
                      className="btn-editorial ghost"
                      style={{ padding: '0.38rem 0.55rem' }}
                      title="View Analytics"
                      onClick={() => onOpenAnalytics(member.handle)}
                    >
                      <BarChart3 size={13} />
                    </button>
                    <button
                      type="button"
                      id={`btn-customize-${member.handle}`}
                      className="btn-editorial"
                      style={{ padding: '0.38rem 0.65rem', fontSize: '0.7rem' }}
                      onClick={() => onCustomizeMember(member.handle)}
                    >
                      <Sliders size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      id={`btn-view-dossier-${member.handle}`}
                      className="btn-editorial primary"
                      style={{ padding: '0.38rem 0.75rem', fontSize: '0.7rem' }}
                      onClick={() => onOpenDossier(member.handle)}
                    >
                      Open <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {/* Add New Club Member Card */}
        <button
          type="button"
          id="card-create-new-member"
          className="roster-card"
          onClick={() => setShowCreateModal(true)}
          style={{
            minHeight: 330,
            borderStyle: 'dashed',
            borderColor: 'var(--rule-medium)',
            background: 'rgba(20, 18, 16, 0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          <Users size={28} style={{ color: 'var(--accent-amber)', marginBottom: '0.75rem' }} />
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.65rem',
              color: 'var(--ink-bone)',
            }}
          >
            New Member Dossier
          </div>
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--ink-muted)',
              maxWidth: '26ch',
              margin: '0.45rem 0 1rem',
            }}
          >
            Claim a `/@handle` for yourself or another club member and launch the live customizer.
          </p>
          <span className="btn-editorial">
            <Sparkles size={13} /> Create Profile
          </span>
        </button>
      </section>

      {/* Modal: Claim New Member Handle */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--accent-vermilion)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              ONBOARD CLUB MEMBER // NEW DOSSIER
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2rem',
                margin: '0.25rem 0 1rem',
                fontWeight: 400,
              }}
            >
              Claim Your Club Handle
            </h2>

            <form
              onSubmit={handleCreateSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
            >
              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="new-member-handle">
                    Member Handle (/@handle)
                  </label>
                  <input
                    id="new-member-handle"
                    className="studio-input"
                    placeholder="e.g. maya"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    required
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="new-member-name">
                    Full / Display Name
                  </label>
                  <input
                    id="new-member-name"
                    className="studio-input"
                    placeholder="e.g. Maya Patel"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="new-member-role">
                    Club Role / Title
                  </label>
                  <input
                    id="new-member-role"
                    className="studio-input"
                    placeholder="e.g. Hardware & Robotics Lead"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="new-member-dept">
                    Department
                  </label>
                  <select
                    id="new-member-dept"
                    className="studio-select"
                    value={newDept}
                    onChange={(e) =>
                      setNewDept(e.target.value as MemberProfile['department'])
                    }
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Sound & Media">Sound & Media</option>
                    <option value="Systems">Systems</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
              </div>

              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="new-member-template">
                    Starting Editorial Theme
                  </label>
                  <select
                    id="new-member-template"
                    className="studio-select"
                    value={newTemplateId}
                    onChange={(e) => setNewTemplateId(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="new-member-pin">
                    Optional Edit PIN
                  </label>
                  <input
                    id="new-member-pin"
                    type="password"
                    className="studio-input"
                    placeholder="Leave blank for open club edit"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                </div>
              </div>

              {formError && (
                <div style={{ color: 'var(--accent-vermilion)', fontSize: '0.82rem' }}>
                  {formError}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.6rem',
                  marginTop: '0.5rem',
                }}
              >
                <button
                  type="button"
                  className="btn-editorial ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" id="btn-submit-new-member" className="btn-editorial primary">
                  Create & Customize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Club Masthead */}
      {showClubEditModal && (
        <div className="modal-backdrop" onClick={() => setShowClubEditModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.95rem',
                margin: '0 0 1rem',
                fontWeight: 400,
              }}
            >
              Edit Club Identity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="field-group">
                <label className="field-label">Club Name</label>
                <input
                  className="studio-input"
                  value={clubDraft.clubName}
                  onChange={(e) =>
                    setClubDraft({ ...clubDraft, clubName: e.target.value })
                  }
                />
              </div>
              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label">Chapter / Index Code</label>
                  <input
                    className="studio-input"
                    value={clubDraft.chapterCode}
                    onChange={(e) =>
                      setClubDraft({ ...clubDraft, chapterCode: e.target.value })
                    }
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Founded Label</label>
                  <input
                    className="studio-input"
                    value={clubDraft.foundedYear}
                    onChange={(e) =>
                      setClubDraft({ ...clubDraft, foundedYear: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Club Manifesto / About</label>
                <textarea
                  className="studio-textarea"
                  rows={3}
                  value={clubDraft.manifesto}
                  onChange={(e) =>
                    setClubDraft({ ...clubDraft, manifesto: e.target.value })
                  }
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn-editorial ghost"
                  onClick={() => setShowClubEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-editorial primary"
                  onClick={async () => {
                    await onUpdateClub(clubDraft);
                    setShowClubEditModal(false);
                  }}
                >
                  Save Club Header
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
