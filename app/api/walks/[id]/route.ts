import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const db = () => new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT ?? '5432'),
});

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const client = db();
  await client.connect();

  try {
    await client.query('DELETE FROM walked_streets WHERE walk_id = $1', [id]);
    await client.query('DELETE FROM walks WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } finally {
    await client.end();
  }
}