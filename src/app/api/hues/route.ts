import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

function getDb() {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? '';
  return neon(url);
}

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS poem_hues (
      poem_id TEXT PRIMARY KEY,
      hue REAL NOT NULL
    )
  `;
}

export async function GET() {
  try {
    const sql = getDb();
    await ensureTable();
    const rows = await sql`SELECT poem_id, hue FROM poem_hues`;
    const hues: Record<string, number> = {};
    for (const row of rows) {
      hues[row.poem_id as string] = row.hue as number;
    }
    return NextResponse.json(hues);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const { poemId, hue } = await request.json();
    if (typeof poemId !== 'string' || typeof hue !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    const sql = getDb();
    await ensureTable();
    await sql`
      INSERT INTO poem_hues (poem_id, hue)
      VALUES (${poemId}, ${hue})
      ON CONFLICT (poem_id)
      DO UPDATE SET hue = ${hue}
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
