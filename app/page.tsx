'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const StreetMap = dynamic(() => import('./StreetMap'), { ssr: false });

type Result = { walked: number; total: number; pct: string };
type MissingStreet = { name: string; highway_type: string; segments: number };

export default function Home() {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<MissingStreet[]>([]);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    fetch('/api/missing')
      .then(r => r.json())
      .then(setMissing);
  }, [result]);

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
      setResult(data);
      setMapKey(k => k + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ height: '100vh', padding: '1.5rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Walk Every Street</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>Frederiksberg</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {loading && <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Analyserer...</span>}
          {error && <span style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</span>}
          <input type="file" accept=".gpx" onChange={handleUpload} style={{ fontSize: '0.875rem' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StreetMap key={mapKey} />
        </div>

        <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result && (
            <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>{result.pct}%</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0' }}>af Frederiksberg dækket</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{result.walked} af {result.total} segmenter</div>
            </div>
          )}

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>
              Manglende gader
            </h2>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {missing.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{s.highway_type}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginLeft: '8px' }}>{s.segments} seg.</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
