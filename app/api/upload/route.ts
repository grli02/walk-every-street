import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const db = () => new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? '5432'),
});

function parseGpx(xml: string): [number, number][] {
  const matches = [...xml.matchAll(/<trkpt lat="([^"]+)" lon="([^"]+)"/g)];
  return matches.map(m => [parseFloat(m[2]), parseFloat(m[1])]);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'Ingen fil' }, { status: 400 });

  const xml = await file.text();
  const coords = parseGpx(xml);
  if (coords.length < 2) {
    return NextResponse.json({ error: 'Ingen GPS-punkter fundet' }, { status: 400 });
  }

  const wkt = `LINESTRING(${coords.map(c => `${c[0]} ${c[1]}`).join(', ')})`;

  const client = db();
  await client.connect();

  try {
    const walkResult = await client.query(
      `INSERT INTO walks (filename, geom, distance_m)
       VALUES ($1, ST_GeomFromText($2, 4326), ST_Length(ST_GeomFromText($2, 4326)::geography))
       ON CONFLICT (filename) DO NOTHING
       RETURNING id`,
      [file.name, wkt]
    );

    if (walkResult.rows.length === 0) {
      return NextResponse.json({ error: 'En tur med dette filnavn er allerede uploadet' }, { status: 409 });
    }

    const walkId = walkResult.rows[0].id;

    await client.query(
      `INSERT INTO walked_streets (walk_id, street_id)
       SELECT $1, s.id
       FROM streets s
       WHERE ST_DWithin(s.geom::geography, ST_GeomFromText($2, 4326)::geography, 15)
       ON CONFLICT DO NOTHING`,
      [walkId, wkt]
    );

    const coverage = await client.query(
      `SELECT
        COUNT(DISTINCT ws.street_id) AS walked,
        (SELECT COUNT(*) FROM streets) AS total
       FROM walked_streets ws`
    );

    const { walked, total } = coverage.rows[0];
    const pct = ((walked / total) * 100).toFixed(1);

    return NextResponse.json({ walkId, walked, total, pct });
  } finally {
    await client.end();
  }
}
