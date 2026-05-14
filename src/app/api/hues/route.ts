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
      hue REAL NOT NULL,
      touched_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Spalte nachtraeglich hinzufuegen falls Tabelle schon existiert
  await sql`
    ALTER TABLE poem_hues
    ADD COLUMN IF NOT EXISTS touched_at TIMESTAMPTZ NOT NULL DEFAULT now()
  `;
}

export async function GET() {
  try {
    const sql = getDb();
    await ensureTable();
    const rows = await sql`SELECT poem_id, hue, touched_at FROM poem_hues`;
    const result: Record<string, { hue: number; touchedAt: string }> = {};
    for (const row of rows) {
      result[row.poem_id as string] = {
        hue: row.hue as number,
        touchedAt: (row.touched_at as Date).toISOString(),
      };
    }
    return NextResponse.json(result);
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
      INSERT INTO poem_hues (poem_id, hue, touched_at)
      VALUES (${poemId}, ${hue}, now())
      ON CONFLICT (poem_id)
      DO UPDATE SET hue = ${hue}, touched_at = now()
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
