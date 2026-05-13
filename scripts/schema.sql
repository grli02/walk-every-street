CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE streets (
  id BIGSERIAL PRIMARY KEY,
  osm_id BIGINT,
  name TEXT,
  highway_type TEXT,
  geom GEOMETRY(LineString, 4326)
);

CREATE INDEX streets_geom_idx ON streets USING GIST (geom);
CREATE INDEX streets_osm_idx ON streets (osm_id);

CREATE TABLE walks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  filename TEXT,
  geom GEOMETRY(LineString, 4326),
  distance_m FLOAT
);

CREATE TABLE walked_streets (
  walk_id UUID REFERENCES walks(id),
  street_id BIGINT REFERENCES streets(id),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (walk_id, street_id)
);
