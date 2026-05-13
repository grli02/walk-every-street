import { NextResponse } from 'next/server';
import { Client } from 'pg';

const db = () => new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? '5432'),
});

export async function GET() {
  const client = db();
  await client.connect();

  try {
    const result = await client.query(`
      SELECT
        s.id,
        s.name,
        s.highway_type,
        ST_AsGeoJSON(s.geom) AS geojson,
        CASE WHEN ws.street_id IS NOT NULL THEN true ELSE false END AS walked
      FROM streets s
      LEFT JOIN (
        SELECT DISTINCT street_id FROM walked_streets
      ) ws ON ws.street_id = s.id
    `);

    const features = result.rows.map(row => ({
      type: 'Feature',
      properties: {
        id: row.id,
        name: row.name,
        highway_type: row.highway_type,
        walked: row.walked,
      },
      geometry: JSON.parse(row.geojson),
    }));

    return NextResponse.json({
      type: 'FeatureCollection',
      features,
    });
  } finally {
    await client.end();
  }
}
