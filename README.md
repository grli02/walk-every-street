# Walk Every Street

A full-stack web app that tracks which streets you have walked in Frederiksberg. Upload a GPX file from any run or walk, and the app matches your route against OpenStreetMap road data using PostGIS spatial queries.

<img width="707" height="486" alt="Skærmbillede 2026-05-13 114438" src="https://github.com/user-attachments/assets/070f4128-8ec4-45ec-8e46-87586014728e" />

## How it works

1. GPX file is uploaded and parsed into a LineString geometry
2. PostGIS `ST_DWithin` matches the route against all street segments within 15 meters
3. Matched streets are stored and visualized on a Leaflet map
4. Coverage percentage is calculated across all uploaded walks

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Leaflet.js |
| Backend | Next.js API Routes |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Geodata | OpenStreetMap via Overpass API |

## Database schema
streets        - OSM road segments (LineString geometry)

walks          - uploaded GPX files (LineString geometry)

walked_streets - many-to-many: which streets each walk covered

## Local setup

**Requirements:** Node.js 20+, PostgreSQL 16, PostGIS 3.4

```bash
# 1. Clone and install
git clone https://github.com/grli02/walk-every-street
cd walk-every-street
npm install

# 2. Create database
createdb walk_every_street
psql walk_every_street -c "CREATE EXTENSION postgis;"

# 3. Run schema
psql walk_every_street -f scripts/schema.sql

# 4. Import street data
curl "https://overpass.kumi.systems/api/interpreter" \
  --data '[out:json];way["highway"~"^(residential|primary|secondary|tertiary|footway|path|cycleway)$"](55.664,12.480,55.690,12.540);out geom;' \
  -o streets.json
node scripts/import-streets.js streets.json

# 5. Configure environment
cp .env.example .env.local
# Edit .env.local with your database credentials

# 6. Start
npm run dev
```
