'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const StreetMap = dynamic(() => import('./StreetMap'), { ssr: false });

type Coverage = { walked: number; total: number; pct: string };
type MissingStreet = { name: string; highway_type: string; segments: number };
type Walk = { id: string; filename: string; uploaded_at: string; distance_m: number; streets_covered: number };

export default function Home() {
  const [coverage, setCoverage]   = useState<Coverage | null>(null);
  const [missing, setMissing]     = useState<MissingStreet[]>([]);
  const [walks, setWalks]         = useState<Walk[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [mapKey, setMapKey]       = useState(0);
  const fileRef                   = useRef<HTMLInputElement>(null);

  function reload() {
    fetch('/api/coverage').then(r => r.json()).then(setCoverage);
    fetch('/api/missing').then(r => r.json()).then(setMissing);
    fetch('/api/walks').then(r => r.json()).then(setWalks);
  }

  useEffect(() => { reload(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      reload();
      setMapKey(k => k + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' });
  }

  function formatDistance(m: number) {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  }

  const pct    = coverage?.pct ?? '0.0';
  const walked = coverage?.walked ?? 0;
  const total  = coverage?.total ?? 0;

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="sidebar-section">
          <p className="app-name">Walk Every Street</p>
          <h1 className="city-name">Frederiksberg</h1>
        </div>

        <div className="sidebar-section">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="coverage-number">{pct}</span>
            <span className="coverage-unit">%</span>
          </div>
          <p className="coverage-sub">{walked} af {total} vejsegmenter</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="sidebar-section">
          <input
            ref={fileRef}
            id="gpx-upload"
            type="file"
            accept=".gpx"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="gpx-upload" className={`upload-btn${loading ? ' loading' : ''}`}>
            {loading ? '⟳  Analyserer...' : '↑  Upload GPX-fil'}
          </label>
          {error && <p className="error-box">{error}</p>}
        </div>

        {walks.length > 0 && (
          <div className="sidebar-section">
            <p className="label">Ture ({walks.length})</p>
            {walks.map(w => (
              <div key={w.id} className="walk-card">
                <p className="walk-card-title">
                  {w.filename.replace('.gpx', '').replace(/_/g, ' ')}
                </p>
                <div className="walk-card-meta">
                  <span>{formatDate(w.uploaded_at)}</span>
                  <span>{formatDistance(w.distance_m)}</span>
                  <span className="streets">{w.streets_covered} gader</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-scroll">
          <p className="label">Manglende gader</p>
          <div className="missing-list">
            {missing.map((s, i) => (
              <div key={i} className="missing-row">
                <div>
                  <p className="missing-name">{s.name}</p>
                  <p className="missing-type">{s.highway_type}</p>
                </div>
                <span className="missing-count">{s.segments}</span>
              </div>
            ))}
          </div>
        </div>

      </aside>

      <div className="map-panel">
        <StreetMap key={mapKey} />
      </div>

    </div>
  );
}
