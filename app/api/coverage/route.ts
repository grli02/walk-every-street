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
        COUNT(DISTINCT ws.street_id) AS walked,
        (SELECT COUNT(*) FROM streets) AS total
      FROM walked_streets ws
    `);
    const { walked, total } = result.rows[0];
    const pct = ((walked / total) * 100).toFixed(1);
    return NextResponse.json({ walked, total, pct });
  } finally {
    await client.end();
  }
}
