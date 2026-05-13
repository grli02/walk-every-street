'use client';

import { useEffect, useRef } from 'react';

export default function StreetMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapInstance.current) return;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!mapRef.current) return;

      const map = L.map(mapRef.current).setView([55.676, 12.510], 14);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const res = await fetch('/api/streets');
      const geojson = await res.json();

      L.geoJSON(geojson, {
        style: (feature) => ({
          color: feature?.properties.walked ? '#16a34a' : '#d1d5db',
          weight: feature?.properties.walked ? 3 : 1.5,
          opacity: feature?.properties.walked ? 0.9 : 0.5,
        }),
        onEachFeature: (feature, layer) => {
          if (feature.properties.name) {
            layer.bindPopup(feature.properties.name);
          }
        },
      }).addTo(map);
    }

    initMap();
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: '500px', width: '100%', borderRadius: '12px' }}
    />
  );
}
