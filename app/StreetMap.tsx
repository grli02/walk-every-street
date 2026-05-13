'use client';

import { useEffect, useRef } from 'react';

export default function StreetMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current).setView([55.676, 12.510], 14);
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const res = await fetch('/api/streets');
      const geojson = await res.json();

      if (cancelled) return;

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

  return (
    <div ref={mapRef} style={{
      height: '500px',
      width: '100%',
      minWidth: '400px',
      borderRadius: '12px',
      zIndex: 0,
    }} />
  );
}
