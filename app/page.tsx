'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const StreetMap = dynamic(() => import('./StreetMap'), { ssr: false });

export default function Home() {
  const [result, setResult] = useState<{
    walked: number;
    total: number;
    pct: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
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
    <main className="min-h-screen p-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Walk Every Street</h1>
      <p className="text-gray-500 mb-8">Upload en GPX-fil fra en tur i Frederiksberg</p>

      <input
        type="file"
        accept=".gpx"
        onChange={handleUpload}
        className="block w-full text-sm mb-6"
      />

      {loading && <p className="text-gray-500">Analyserer rute...</p>}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="text-5xl font-bold mb-1">{result.pct}%</div>
          <div className="text-gray-500 mb-2">af Frederiksberg dækket</div>
          <div className="text-sm text-gray-400">
            {result.walked} af {result.total} vejsegmenter gået
          </div>
        </div>
      )}

      <StreetMap key={mapKey} />
    </main>
  );
}
