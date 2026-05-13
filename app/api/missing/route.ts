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
      SELECT name, highway_type, COUNT(*) as segments
      FROM streets
      WHERE id NOT IN (SELECT street_id FROM walked_streets)
        AND name IS NOT NULL
      GROUP BY name, highway_type
      ORDER BY segments DESC
      LIMIT 50
    `);

    return NextResponse.json(result.rows);
  } finally {
    await client.end();
  }
}
