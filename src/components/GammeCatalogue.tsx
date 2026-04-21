import React, { useState, useMemo, useEffect } from 'react';
import { FONDS, CONTRATS, SRI_DESCRIPTIONS, Fond } from '../data/gammeFinanciere';

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

/* ─────────────────────────── constants ─────────────────────────── */

const CLASSES = [
  "01 - Monétaire / Trésorerie",
  "02 - Obligataire Euro Court Terme",
  "03 - Obligataire Euro Diversifié",
  "04 - Obligataire Monde",
  "05 - Obligataire High Yield / Émergents",
  "06 - Actions Europe / Zone Euro",
  "07 - Actions Internationales",
  "08 - Actions Émergents / Asie",
  "09 - Actions Thématiques / Sectorielles",
  "10 - Diversifiés / Flexibles",
];

const SRI_PALETTE: Record<number, string> = {
  1: "#1a7a4a", 2: "#4a9e3f", 3: "#d4a017",
  4: "#e07b39", 5: "#d94f3d", 6: "#a83232", 7: "#6b1a1a",
};

type TabKey = 'contrat' | 'classe' | 'sri' | 'matrice' | 'methodologie';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'contrat', label: 'Par contrat' },
  { key: 'classe', label: 'Par classe' },
  { key: 'sri', label: 'Par profil de risque (SRI)' },
  { key: 'matrice', label: 'Matrice éligibilité' },
  { key: 'methodologie', label: 'Méthodologie' },
];

/* ─────────────────────────── mini components ─────────────────────────── */

function Stars({ value }: { value: number }) {
  return (
    <span style={{ color: '#f5a623', fontSize: 14, letterSpacing: 1 }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

function SriBadge({ value }: { value: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 22, height: 22, borderRadius: 4,
      backgroundColor: SRI_PALETTE[value],
      color: '#fff', fontSize: 11, fontWeight: 800,
      flexShrink: 0,
    }}>
      {value}
    </span>
  );
}

function SfdrBadge({ sfdr }: { sfdr: string }) {
  const num = sfdr.replace('Article ', '');
  const color = sfdr === 'Article 8' ? '#2563eb' : sfdr === 'Article 9' ? '#16a34a' : '#6b7280';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      border: `1px solid ${color}`, borderRadius: 20,
      color, fontSize: 11, fontWeight: 600, padding: '2px 8px',
    }}>
      Art. {num} SFDR
    </span>
  );
}

/* ─────────────────────────── Fund Modal ─────────────────────────── */

function FundModal({ fond, onClose }: { fond: Fond; onClose: () => void }) {
  const width = useWindowWidth();
  const isMobile = width < 640;
  const classeLabel = fond.classe.replace(/^\d+ - /, '').toUpperCase();
  const avContrats = fond.contrats.map(k => CONTRATS[k]).filter(c => c?.type === 'AV');
  const capiContrats = fond.contrats.map(k => CONTRATS[k]).filter(c => c?.type === 'CAPI');
  const perContrats = fond.contrats.map(k => CONTRATS[k]).filter(c => c?.type === 'PER' || c?.type === 'PERP');

  // Close on backdrop click — stop propagation so card doesn't re-open the modal
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tagStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: 20,
    padding: '3px 12px',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 4,
  });

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,20,40,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: isMobile ? '16px 16px 0 0' : 16,
        width: '100%',
        maxWidth: isMobile ? '100%' : 560,
        maxHeight: isMobile ? '92vh' : '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        ...(isMobile ? { position: 'fixed', bottom: 0, left: 0, right: 0, margin: 0 } : {}),
      }}>
        {/* Modal header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2340 0%, #1e3a5f 100%)',
          padding: '20px 24px',
          position: 'relative',
        }}>
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            style={{
              position: 'absolute', top: 14, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              color: '#fff', width: 28, height: 28, borderRadius: '50%',
              fontSize: 16, lineHeight: '28px', textAlign: 'center', padding: 0,
            }}
          >×</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {fond.classe.split(' - ')[0]} · {classeLabel}
            </span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#fff', paddingRight: 32 }}>
            {fond.nom}
          </h2>
          <p style={{ margin: 0, fontSize: 12, color: '#93c5fd' }}>
            {fond.sg}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64a6dc', fontFamily: 'monospace' }}>
            ISIN {fond.isin} · {fond.cat_quantalys}
          </p>
        </div>

        {/* Score boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 1, background: '#e5e7eb' }}>
          {[
            { label: 'NOTE', value: <Stars value={fond.note} /> },
            { label: 'SCORE QUANTALYS', value: <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f' }}>{fond.score}/100</span> },
            { label: 'SRI', value: <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SriBadge value={fond.sri} /><span style={{ fontSize: 12, color: '#6b7280' }}>/ 7</span></span> },
            { label: 'SCORE COMPOSITE', value: <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f' }}>{fond.score_composite}</span> },
          ].map(box => (
            <div key={box.label} style={{ background: '#f8fafc', padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{box.label}</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{box.value}</div>
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* Métriques */}
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Métriques</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Perf cumulée 5A', value: fond.perf_5a !== null ? `${(fond.perf_5a * 100).toFixed(2)}%` : '—', green: fond.perf_5a !== null && fond.perf_5a > 0 },
              { label: 'Sharpe 3A', value: fond.sharpe_3a.toFixed(2), green: false },
              { label: 'Volatilité 3A', value: `${(fond.vol_3a * 100).toFixed(2)}%`, green: false },
              { label: 'Frais courants', value: `${(fond.frais * 100).toFixed(2)}%`, green: false },
              { label: 'Encours', value: `${fond.encours_m.toLocaleString('fr-FR')} M€`, green: false },
              { label: 'SFDR', value: fond.sfdr, green: false },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.green ? '#16a34a' : '#111827' }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Contrats */}
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Contrats éligibles ({fond.contrats.length})
          </h3>
          {avContrats.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>AV ({avContrats.length})</div>
              {avContrats.map(c => c && <span key={c.nom} style={tagStyle('#2563eb')}>{c.nom}</span>)}
            </div>
          )}
          {capiContrats.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>CAPI ({capiContrats.length})</div>
              {capiContrats.map(c => c && <span key={c.nom} style={tagStyle('#7c3aed')}>{c.nom}</span>)}
            </div>
          )}
          {perContrats.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 5 }}>PER ({perContrats.length})</div>
              {perContrats.map(c => c && <span key={c.nom} style={tagStyle('#059669')}>{c.nom}</span>)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────── Fund Card ─────────────────────────── */

function FundCard({ fond }: { fond: Fond }) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const width = useWindowWidth();
  const isMobile = width < 480;
  const contratCount = fond.contrats.length;
  const classeLabel = fond.classe.replace(/^\d+ - /, '').toUpperCase();

  return (
    <div
      onClick={() => setModalOpen(true)}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2563eb';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.12)';
        (e.currentTarget as HTMLDivElement).style.cursor = 'pointer';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
      }}
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        marginBottom: 16,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Card header */}
      <div style={{ padding: '16px 20px 0' }}>
        {/* Row 1: class + SRI  |  stars + score */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#2563eb',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {classeLabel}
            </span>
            <SriBadge value={fond.sri} />
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <Stars value={fond.note} />
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Score {fond.score}/100</div>
          </div>
        </div>

        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1d4ed8', lineHeight: 1.3 }}>
          {fond.nom}
        </h3>

        {/* Society + ISIN */}
        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6b7280' }}>
          <span style={{ color: '#374151', fontWeight: 500 }}>{fond.sg}</span>
          {' · ISIN '}
          <span style={{ fontFamily: 'monospace' }}>{fond.isin}</span>
        </p>
      </div>

      {/* Separator */}
      <div style={{ height: 1, background: '#f3f4f6', margin: '0 20px' }} />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0, padding: '12px 20px 0' }}>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Perf 5A</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: fond.perf_5a !== null && fond.perf_5a > 0 ? '#16a34a' : fond.perf_5a === null ? '#9ca3af' : '#dc2626' }}>
            {fond.perf_5a !== null ? `${(fond.perf_5a * 100).toFixed(2)}%` : '—'}
          </div>
        </div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Sharpe 3A</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{fond.sharpe_3a.toFixed(2)}</div>
        </div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Frais</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{(fond.frais * 100).toFixed(2)}%</div>
        </div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Encours</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{fond.encours_m.toLocaleString('fr-FR')} M€</div>
        </div>
      </div>

      {/* Eligible sur */}
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Éligible sur</div>
        <button
          onClick={e => { e.stopPropagation(); setOpen(!open); }}
          style={{ fontSize: 14, fontWeight: 600, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: open ? 'underline' : 'none' }}
        >
          {contratCount} contrat{contratCount > 1 ? 's' : ''}
          {' '}{open ? '▲' : '▼'}
        </button>
      </div>

      {/* Contrats expanded */}
      {open && (
        <div style={{ padding: '4px 20px 12px' }}>
          {fond.contrats.map(k => {
            const c = CONTRATS[k];
            if (!c) return null;
            const typeColor = c.type === 'AV' ? '#2563eb' : c.type === 'CAPI' ? '#7c3aed' : '#059669';
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: typeColor, borderRadius: 3, padding: '1px 5px' }}>{c.type}</span>
                <span style={{ fontSize: 12, color: '#374151' }}>{c.nom}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>— {c.assureur}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer: SFDR */}
      <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <SfdrBadge sfdr={fond.sfdr} />
        <span style={{ fontSize: 11, color: '#d1d5db' }}>#{fond.rang} · vol. {(fond.vol_3a * 100).toFixed(1)}%</span>
      </div>

      {/* Modal */}
      {modalOpen && <FundModal fond={fond} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

/* ─────────────────────────── Filters ─────────────────────────── */

interface FilterState {
  contrat: string;
  classes: string[];
  sris: number[];
}

function FiltersPanel({
  filters,
  onChange,
  fondCount,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  fondCount: number;
}) {
  const width = useWindowWidth();
  const isMobile = width < 640;
  function toggleClass(c: string) {
    const next = filters.classes.includes(c)
      ? filters.classes.filter(x => x !== c)
      : [...filters.classes, c];
    onChange({ ...filters, classes: next });
  }

  function toggleSri(s: number) {
    const next = filters.sris.includes(s)
      ? filters.sris.filter(x => x !== s)
      : [...filters.sris, s];
    onChange({ ...filters, sris: next });
  }

  const hasFilter = filters.contrat || filters.classes.length > 0 || filters.sris.length > 0;

  const contratOptions = Object.entries(CONTRATS)
    .sort((a, b) => a[1].nom.localeCompare(b[1].nom));

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      {/* Contrat row */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Contrat du client
        </div>
          <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={filters.contrat}
            onChange={e => onChange({ ...filters, contrat: e.target.value })}
            style={{
              flex: '1 1 260px', maxWidth: isMobile ? '100%' : 400, padding: '9px 12px',
              border: '1px solid #d1d5db', borderRadius: 8,
              fontSize: 13, color: '#374151', background: '#fff',
              outline: 'none', cursor: 'pointer', width: isMobile ? '100%' : undefined,
            }}
          >
            <option value="">— Tous les contrats (gamme complète) —</option>
            {contratOptions.map(([key, c]) => (
              <option key={key} value={key}>{c.nom} ({c.type} — {c.assureur})</option>
            ))}
          </select>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#1e3a5f', lineHeight: 1 }}>{fondCount}</span>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>fonds affichés</div>
          </div>
        </div>
      </div>

      {/* Classe row */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Classe d'actifs
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => onChange({ ...filters, classes: [] })}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filters.classes.length === 0 ? '1.5px solid #1e3a5f' : '1.5px solid #d1d5db',
              background: filters.classes.length === 0 ? '#1e3a5f' : '#fff',
              color: filters.classes.length === 0 ? '#fff' : '#374151',
            }}
          >
            Toutes
          </button>
          {CLASSES.map(c => {
            const active = filters.classes.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleClass(c)}
                style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: active ? '1.5px solid #2563eb' : '1.5px solid #d1d5db',
                  background: active ? '#eff6ff' : '#fff',
                  color: active ? '#1d4ed8' : '#374151',
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* SRI row */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Profil de risque (SRI)
          </div>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>1 = très faible · 7 = très élevé</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => onChange({ ...filters, sris: [] })}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: filters.sris.length === 0 ? '1.5px solid #1e3a5f' : '1.5px solid #d1d5db',
              background: filters.sris.length === 0 ? '#1e3a5f' : '#fff',
              color: filters.sris.length === 0 ? '#fff' : '#374151',
            }}
          >
            Tous niveaux
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map(s => {
            const active = filters.sris.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSri(s)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: active ? `1.5px solid ${SRI_PALETTE[s]}` : '1.5px solid #d1d5db',
                  background: active ? SRI_PALETTE[s] : '#fff',
                  color: active ? '#fff' : '#374151',
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: 3,
                  background: active ? 'rgba(255,255,255,0.3)' : SRI_PALETTE[s],
                  color: '#fff', fontSize: 10, fontWeight: 900,
                }}>
                  {s}
                </span>
                SRI {s}
              </button>
            );
          })}
          {hasFilter && (
            <button
              onClick={() => onChange({ contrat: '', classes: [], sris: [] })}
              style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1.5px solid #d1d5db', background: '#fff', color: '#6b7280',
              }}
            >
              ↻ Réinitialiser
            </button>
          )}
        </div>
        {!hasFilter && (
          <p style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
            Aucun filtre actif — gamme complète affichée
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab: Par contrat / Par classe ─────────────────────────── */

function TabFunds({ filters }: { filters: FilterState }) {
  const filtered = useMemo(() => {
    return FONDS.filter(fond => {
      if (filters.contrat && !fond.contrats.includes(filters.contrat)) return false;
      if (filters.classes.length > 0 && !filters.classes.includes(fond.classe)) return false;
      if (filters.sris.length > 0 && !filters.sris.includes(fond.sri)) return false;
      return true;
    });
  }, [filters]);

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <p style={{ fontWeight: 600, color: '#6b7280' }}>Aucun fonds correspondant aux filtres sélectionnés</p>
      </div>
    );
  }

  return (
    <div>
      {filtered.map(fond => <FundCard key={fond.isin} fond={fond} />)}
    </div>
  );
}

function TabParClasse({ filters }: { filters: FilterState }) {
  const filtered = useMemo(() => {
    return FONDS.filter(fond => {
      if (filters.contrat && !fond.contrats.includes(filters.contrat)) return false;
      if (filters.classes.length > 0 && !filters.classes.includes(fond.classe)) return false;
      if (filters.sris.length > 0 && !filters.sris.includes(fond.sri)) return false;
      return true;
    });
  }, [filters]);

  const grouped = useMemo(() => {
    const map = new Map<string, Fond[]>();
    filtered.forEach(f => {
      if (!map.has(f.classe)) map.set(f.classe, []);
      map.get(f.classe)!.push(f);
    });
    return map;
  }, [filtered]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  function toggle(c: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
        <p style={{ fontWeight: 600, color: '#6b7280' }}>Aucun fonds correspondant aux filtres sélectionnés</p>
      </div>
    );
  }

  return (
    <div>
      {CLASSES.map(classe => {
        const fonds = grouped.get(classe);
        if (!fonds || fonds.length === 0) return null;
        const isCollapsed = collapsed.has(classe);
        const avgContrats = (fonds.reduce((a, f) => a + f.contrats.length, 0) / fonds.length).toFixed(1);
        return (
          <div key={classe} style={{ marginBottom: 24 }}>
            {/* Section header */}
            <button
              onClick={() => toggle(classe)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '2px solid #1e3a5f', marginBottom: 12, textAlign: 'left',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e3a5f' }}>{classe}</h2>
              <span style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                {fonds.length} fonds · couverture moy. {avgContrats} contrats
                <span style={{ fontSize: 14, color: '#1e3a5f' }}>{isCollapsed ? '▸' : '▾'}</span>
              </span>
            </button>
            {!isCollapsed && fonds.map(fond => <FundCard key={fond.isin} fond={fond} />)}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Tab: Par SRI ─────────────────────────── */

function TabParSri({ filters }: { filters: FilterState }) {
  const filtered = useMemo(() => {
    return FONDS.filter(fond => {
      if (filters.contrat && !fond.contrats.includes(filters.contrat)) return false;
      if (filters.classes.length > 0 && !filters.classes.includes(fond.classe)) return false;
      if (filters.sris.length > 0 && !filters.sris.includes(fond.sri)) return false;
      return true;
    });
  }, [filters]);

  const grouped = useMemo(() => {
    const map = new Map<number, Fond[]>();
    filtered.forEach(f => {
      if (!map.has(f.sri)) map.set(f.sri, []);
      map.get(f.sri)!.push(f);
    });
    return map;
  }, [filtered]);

  return (
    <div>
      {/* Intro */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '16px 20px', marginBottom: 24,
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>
          Lecture par profil de risque (SRI)
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
          L'indicateur SRI classe chaque fonds de 1 (risque très faible) à 7 (risque très élevé). Cette vue groupe la gamme par niveau de risque, pour faciliter la construction d'une allocation alignée sur le profil client.
        </p>
      </div>

      {[1, 2, 3, 4, 5, 6].map(sri => {
        const fonds = grouped.get(sri);
        if (!fonds || fonds.length === 0) return null;
        const info = SRI_DESCRIPTIONS[sri];
        return (
          <div key={sri} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, borderBottom: '2px solid #f3f4f6', paddingBottom: 10 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: SRI_PALETTE[sri], color: '#fff', fontSize: 14, fontWeight: 900 }}>{sri}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{info.titre}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{info.desc}</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{fonds.length} fonds</span>
            </div>
            {fonds.map(fond => <FundCard key={fond.isin} fond={fond} />)}
          </div>
        );
      })}

      {/* SRI 7 note */}
      <div style={{ background: '#fef3cd', border: '1px solid #f5c842', borderRadius: 10, padding: '12px 16px', marginTop: 8 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
          <strong>SRI 7 non représenté</strong> — L'univers des contrats d'assurance-vie AC ne contient aucun fonds SRI 7. Pour un client ultra-offensif, orienter vers un compte-titres direct ou PEA.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab: Matrice ─────────────────────────── */

function TabMatrice({ filters }: { filters: FilterState }) {
  const contratKeys = useMemo(() => {
    if (filters.contrat) return [filters.contrat];
    return Object.keys(CONTRATS).sort();
  }, [filters.contrat]);

  const fonds = useMemo(() => {
    return FONDS.filter(fond => {
      if (filters.classes.length > 0 && !filters.classes.includes(fond.classe)) return false;
      if (filters.sris.length > 0 && !filters.sris.includes(fond.sri)) return false;
      return true;
    });
  }, [filters]);

  return (
    <div>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>Matrice d'éligibilité complète</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>✓ = fonds éligible sur le contrat · Faites défiler horizontalement</p>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, minWidth: '100%' }}>
          <thead>
            <tr style={{ background: '#1e3a5f', color: '#fff' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, minWidth: 200, position: 'sticky', left: 0, background: '#1e3a5f', zIndex: 1, borderRight: '1px solid #2d4f7c' }}>
                Fonds
              </th>
              {contratKeys.map(k => {
                const c = CONTRATS[k];
                const typeColor = c.type === 'AV' ? '#3b82f6' : c.type === 'CAPI' ? '#8b5cf6' : '#10b981';
                return (
                  <th key={k} style={{ padding: '8px 6px', textAlign: 'center', minWidth: 72, borderRight: '1px solid #2d4f7c' }}>
                    <span style={{ display: 'inline-block', background: typeColor, color: '#fff', borderRadius: 3, fontSize: 8, fontWeight: 800, padding: '1px 4px', marginBottom: 2 }}>{c.type}</span>
                    <div style={{ fontSize: 9, lineHeight: 1.3, color: '#cbd5e1', fontWeight: 500 }}>{c.nom.split(' ').slice(0, 3).join(' ')}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fonds.map((fond, idx) => (
              <tr key={fond.isin} style={{ background: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '8px 16px', borderRight: '1px solid #e5e7eb', position: 'sticky', left: 0, background: idx % 2 === 0 ? '#fff' : '#f9fafb', zIndex: 1 }}>
                  <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600 }}>{fond.classe.split(' - ')[0]}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{fond.nom}</div>
                </td>
                {contratKeys.map(k => (
                  <td key={k} style={{ padding: '8px 6px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                    {fond.contrats.includes(k)
                      ? <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>✓</span>
                      : <span style={{ color: '#e5e7eb', fontSize: 11 }}>·</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab: Méthodologie ─────────────────────────── */

function TabMethodologie() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#1e3a5f' }}>Méthodologie de sélection v2.1</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          La sélection part de <strong>l'éligibilité réelle</strong> sur les contrats partenaires, avec <strong>quotas SRI par classe</strong> pour une couverture équilibrée des profils de risque 1 à 6.
        </p>
      </div>

      {/* Universe */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Univers de sélection</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { val: '3 571', label: 'fonds éligibles ≥1 contrat AC' },
            { val: '717', label: 'après filtres qualité' },
            { val: '50', label: 'fonds retenus' },
          ].map(item => (
            <div key={item.val} style={{ textAlign: 'center', minWidth: 100 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e3a5f' }}>{item.val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality filters */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtres qualité</h3>
        {['Notation Quantalys ≥ 4★', 'Encours ≥ 50 M€', 'Fonds OPCVM/ETF (exclusion structurés, SCPI, actions directes)'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13, color: '#374151' }}>
            <span style={{ color: '#2563eb', fontWeight: 700 }}>■</span> {f}
          </div>
        ))}
      </div>

      {/* Score composite */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score composite</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { pct: '20%', label: 'Notation Quantalys' },
            { pct: '20%', label: 'Score Quantalys' },
            { pct: '20%', label: 'Performance 5A' },
            { pct: '15%', label: 'Sharpe 3A' },
            { pct: '10%', label: 'Frais (inversé)' },
            { pct: '10%', label: 'Encours' },
            { pct: '5%', label: 'Bonus SFDR' },
          ].map(item => (
            <div key={item.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#1e3a5f', minWidth: 36 }}>{item.pct}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quotas SRI */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quotas SRI par classe</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Classe</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', color: '#6b7280', fontWeight: 700 }}>Quotas SRI</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['01 Monétaire', '5 SRI 1'],
              ['02 Oblig. Euro CT', '2 SRI 1 · 3 SRI 2'],
              ['03 Oblig. Euro Div.', '1 SRI 1 · 3 SRI 2 · 1 SRI 3'],
              ['04 Oblig. Monde', '3 SRI 2 · 1 SRI 3 · 1 SRI 5'],
              ['05 HY / Émergents', '2 SRI 2 · 3 SRI 3'],
              ['06 Actions Europe', '1 SRI 3 · 4 SRI 4'],
              ['07 Actions Inter.', '1 SRI 3 · 3 SRI 4 · 1 SRI 5'],
              ['08 Émergents / Asie', '1 SRI 3 · 2 SRI 4 · 2 SRI 5'],
              ['09 Thématiques', '1 SRI 4 · 1 SRI 5 · 3 SRI 6'],
              ['10 Diversifiés', '1 SRI 2 · 3 SRI 3 · 1 SRI 4'],
            ].map(([classe, quotas], i) => (
              <tr key={classe} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '7px 8px', fontWeight: 600, color: '#374151' }}>{classe}</td>
                <td style={{ padding: '7px 8px', color: '#6b7280' }}>{quotas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 4 }}>
        Source : exports Quantalys des 29 contrats AC · Mise à jour : semestrielle
      </p>
    </div>
  );
}

/* ─────────────────────────── Main Export ─────────────────────────── */

export default function GammeCatalogue() {
  const [activeTab, setActiveTab] = useState<TabKey>('contrat');
  const [filters, setFilters] = useState<FilterState>({ contrat: '', classes: [], sris: [] });
  const width = useWindowWidth();
  const isMobile = width < 640;
  const pad = isMobile ? '0 12px' : '0 32px';
  const padContent = isMobile ? '16px 12px 24px' : '24px 32px 32px';

  const fondCount = useMemo(() => {
    return FONDS.filter(fond => {
      if (filters.contrat && !fond.contrats.includes(filters.contrat)) return false;
      if (filters.classes.length > 0 && !filters.classes.includes(fond.classe)) return false;
      if (filters.sris.length > 0 && !filters.sris.includes(fond.sri)) return false;
      return true;
    }).length;
  }, [filters]);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', marginBottom: 40 }}>
      {/* ─── Tabs ─── */}
      <div style={{
        background: '#fff',
        borderRadius: '16px 16px 0 0',
        borderBottom: '2px solid #e5e7eb',
        display: 'flex', gap: 0, padding: pad,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch' as any,
        scrollbarWidth: 'none' as any,
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: isMobile ? '12px 12px' : '14px 18px',
                whiteSpace: 'nowrap',
                background: 'transparent',
                color: isActive ? '#1e3a5f' : '#6b7280',
                border: 'none',
                borderBottom: isActive ? '3px solid #1e3a5f' : '3px solid transparent',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: -2,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#1e3a5f'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Content ─── */}
      <div style={{ background: '#f1f5f9', padding: padContent, border: '1px solid #e2e8f0', borderTop: 'none' }}>
        <FiltersPanel filters={filters} onChange={setFilters} fondCount={fondCount} />
        {activeTab === 'contrat' && <TabFunds filters={filters} />}
        {activeTab === 'classe' && <TabParClasse filters={filters} />}
        {activeTab === 'sri' && <TabParSri filters={filters} />}
        {activeTab === 'matrice' && <TabMatrice filters={filters} />}
        {activeTab === 'methodologie' && <TabMethodologie />}
      </div>

      {/* ─── Footer disclaimer ─── */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: isMobile ? '10px 12px' : '10px 32px', borderRadius: '0 0 16px 16px', border: '1px solid #e2e8f0' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
          ⚠️ Document réservé aux professionnels · Données arrêtées au 31/03/2026 · Performances passées non garanties · SFDR selon classification Quantalys
        </p>
      </div>
    </div>
  );
}
