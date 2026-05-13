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
        w.id,
        w.filename,
        w.uploaded_at,
        ROUND(w.distance_m) AS distance_m,
        COUNT(ws.street_id) AS streets_covered
      FROM walks w
      LEFT JOIN walked_streets ws ON ws.walk_id = w.id
      GROUP BY w.id
      ORDER BY w.uploaded_at DESC
    `);

    return NextResponse.json(result.rows);
  } finally {
    await client.end();
  }
}
