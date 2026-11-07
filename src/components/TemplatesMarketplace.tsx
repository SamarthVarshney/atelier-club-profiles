import React, { useMemo, useState } from 'react';
import { Check, Eye, Layers, Plus, Sparkles } from 'lucide-react';
import type { CommunityTemplate, MemberProfile } from '../types/profile';
import { DossierRenderer } from './DossierRenderer';

export const TemplatesMarketplace: React.FC<{
  templates: CommunityTemplate[];
  members: MemberProfile[];
  activeHandle: string;
  onSelectMember: (handle: string) => void;
  onApplyTemplate: (template: CommunityTemplate, targetHandle: string) => Promise<void>;
  onPublishTemplate: (tpl: CommunityTemplate) => Promise<void>;
}> = ({
  templates,
  members,
  activeHandle,
  onSelectMember,
  onApplyTemplate,
  onPublishTemplate,
}) => {
  const [selectedTag, setSelectedTag] = useState('All');
  const [previewTpl, setPreviewTpl] = useState<CommunityTemplate | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplTags, setTplTags] = useState('Editorial, Custom');
  const [tplVisibility, setTplVisibility] =
    useState<CommunityTemplate['visibility']>('public');

  const targetMember = members.find((m) => m.handle === activeHandle) || members[0];

  const allTags = useMemo(() => {
    const set = new Set<string>(['All']);
    for (const t of templates) {
      for (const tag of t.tags) set.add(tag);
    }
    return Array.from(set);
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (t.visibility === 'private' && t.authorHandle !== activeHandle) return false;
      if (selectedTag === 'All') return true;
      return t.tags.includes(selectedTag);
    });
  }, [templates, selectedTag, activeHandle]);

  const handleApply = async (tpl: CommunityTemplate) => {
    if (!targetMember) return;
    await onApplyTemplate(tpl, targetMember.handle);
    setAppliedId(tpl.id);
    window.setTimeout(() => setAppliedId(null), 2200);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMember || !tplName.trim()) return;
    const created: CommunityTemplate = {
      id: `tpl-${Date.now()}`,
      name: tplName.trim(),
      authorHandle: targetMember.handle,
      description:
        tplDesc.trim() ||
        `Exported studio configuration from @${targetMember.handle}.`,
      tags: tplTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      visibility: tplVisibility,
      usesCount: 1,
      previewBannerUrl: targetMember.bannerUrl || '/media/banner-darkroom.jpg',
      visuals: structuredClone(targetMember.visuals),
      splash: structuredClone(targetMember.splash),
      backgroundMediaUrl: targetMember.backgroundMediaUrl,
      backgroundMediaType: targetMember.backgroundMediaType,
    };
    await onPublishTemplate(created);
    setShowPublishModal(false);
    setTplName('');
    setTplDesc('');
  };

  return (
    <main className="page-shell">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '1.5rem',
          flexWrap: 'wrap',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--rule-medium)',
        }}
      >
        <div>
          <div className="masthead-kicker">TEMPLATES ENGINE // ONE-CLICK APPLY</div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.3rem, 4vw, 3.4rem)',
              fontWeight: 400,
              lineHeight: 1.02,
              margin: 0,
            }}
          >
            Club Theme Editions
          </h1>
          <p
            style={{
              color: 'var(--ink-secondary)',
              margin: '0.6rem 0 0',
              maxWidth: '58ch',
            }}
          >
            Live-preview curated architectural layouts on your own member data, apply palettes and
            shaders in one click, or publish your current theme for other club members.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--ink-muted)',
              }}
            >
              APPLY TO:
            </span>
            <select
              id="select-template-target-member"
              className="studio-select"
              style={{ width: 'auto' }}
              value={targetMember?.handle || ''}
              onChange={(e) => onSelectMember(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.handle} value={m.handle}>
                  @{m.handle} ({m.displayName})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            id="btn-publish-template"
            className="btn-editorial primary"
            onClick={() => setShowPublishModal(true)}
          >
            <Plus size={14} /> Export Current as Template
          </button>
        </div>
      </div>

      {/* Tag Filters */}
      <div className="roster-toolbar">
        <div className="dept-pills">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`dept-pill ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <section className="roster-grid">
        {visibleTemplates.map((tpl) => (
          <article key={tpl.id} className="roster-card">
            <div
              className="roster-card-banner"
              style={{
                height: 140,
                backgroundImage: `url(${tpl.previewBannerUrl})`,
              }}
            >
              <span className="roster-card-index">BY @{tpl.authorHandle}</span>
              <span className="roster-card-layout-tag">
                {tpl.visuals.layout} · {tpl.visibility}
              </span>
            </div>

            <div className="roster-card-body" style={{ paddingTop: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: tpl.visuals.accentColor,
                    flexShrink: 0,
                  }}
                />
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  {tpl.name}
                </h2>
              </div>

              <p className="roster-bio-snippet">{tpl.description}</p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  marginBottom: '1rem',
                }}
              >
                {tpl.tags.map((tg) => (
                  <span
                    key={tg}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.66rem',
                      padding: '0.16rem 0.45rem',
                      border: '1px solid var(--rule-subtle)',
                      borderRadius: 3,
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {tg}
                  </span>
                ))}
              </div>

              <div className="roster-card-footer">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--ink-muted)',
                  }}
                >
                  <Layers size={12} style={{ verticalAlign: 'middle' }} /> {tpl.usesCount} applies
                </span>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn-editorial"
                    style={{ fontSize: '0.7rem', padding: '0.38rem 0.65rem' }}
                    onClick={() => setPreviewTpl(tpl)}
                  >
                    <Eye size={12} /> Live Preview
                  </button>
                  <button
                    type="button"
                    className="btn-editorial primary"
                    style={{ fontSize: '0.7rem', padding: '0.38rem 0.75rem' }}
                    onClick={() => void handleApply(tpl)}
                  >
                    {appliedId === tpl.id ? (
                      <>
                        <Check size={12} /> Applied!
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} /> Apply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Live Preview Modal */}
      {previewTpl && targetMember && (
        <div className="modal-backdrop" onClick={() => setPreviewTpl(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 960,
              height: '82vh',
              background: 'var(--bg-obsidian)',
              border: '1px solid var(--rule-strong)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1.25rem',
                background: 'var(--bg-paper)',
                borderBottom: '1px solid var(--rule-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                PREVIEWING “{previewTpl.name}” ON @{targetMember.handle}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-editorial primary"
                  onClick={async () => {
                    await handleApply(previewTpl);
                    setPreviewTpl(null);
                  }}
                >
                  Apply to @{targetMember.handle}
                </button>
                <button
                  type="button"
                  className="btn-editorial ghost"
                  onClick={() => setPreviewTpl(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <DossierRenderer
                previewMode
                profile={{
                  ...targetMember,
                  visuals: previewTpl.visuals,
                  splash: previewTpl.splash,
                  backgroundMediaUrl: previewTpl.backgroundMediaUrl,
                  backgroundMediaType: previewTpl.backgroundMediaType,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Publish Template Modal */}
      {showPublishModal && targetMember && (
        <div className="modal-backdrop" onClick={() => setShowPublishModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.95rem',
                margin: '0 0 1rem',
                fontWeight: 400,
              }}
            >
              Export @{targetMember.handle} as Template
            </h2>
            <form
              onSubmit={handlePublish}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <div className="field-group">
                <label className="field-label">Template Name</label>
                <input
                  className="studio-input"
                  placeholder="e.g. Midnight Risograph Press"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea
                  rows={2}
                  className="studio-textarea"
                  value={tplDesc}
                  onChange={(e) => setTplDesc(e.target.value)}
                />
              </div>
              <div className="field-row-2">
                <div className="field-group">
                  <label className="field-label">Tags (comma-separated)</label>
                  <input
                    className="studio-input"
                    value={tplTags}
                    onChange={(e) => setTplTags(e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Visibility</label>
                  <select
                    className="studio-select"
                    value={tplVisibility}
                    onChange={(e) =>
                      setTplVisibility(e.target.value as CommunityTemplate['visibility'])
                    }
                  >
                    <option value="public">Public (Club Gallery)</option>
                    <option value="unlisted">Unlisted (Direct Share)</option>
                    <option value="private">Private (Personal Slot)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  className="btn-editorial ghost"
                  onClick={() => setShowPublishModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-editorial primary">
                  Publish Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
