'use client';

import { useEffect, useRef } from 'react';

function heatColor(count: number): string {
  if (count === 0) return 'transparent';
  if (count === 1) return '#86efac';
  if (count === 2) return '#4ade80';
  if (count === 3) return '#22c55e';
  if (count === 4) return '#f59e0b';
  return '#ef4444';
}

function heatWeight(count: number): number {
  if (count === 0) return 1;
  if (count <= 2) return 2.5;
  return 3.5;
}

export default function StreetMap() {
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([55.676, 12.510], 14);
      mapInstance.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);

      const res     = await fetch('/api/streets');
      const geojson = await res.json();

      if (cancelled) return;

      L.geoJSON(geojson, {
        style: (feature) => {
          const count = feature?.properties.walk_count ?? 0;
          return {
            color:   heatColor(count),
            weight:  heatWeight(count),
            opacity: count === 0 ? 0 : 0.85,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties.name) {
            const count = feature.properties.walk_count;
            const label = count > 0 ? `${feature.properties.name} (${count}x)` : feature.properties.name;
            layer.bindPopup(label);
          }
        },
      }).addTo(map);

      setTimeout(() => map.invalidateSize(), 200);
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
