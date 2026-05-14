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
      level INTEGER NOT NULL DEFAULT 1,
      touched_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Spalten nachtraeglich hinzufuegen falls Tabelle schon existiert
  await sql`ALTER TABLE poem_hues ADD COLUMN IF NOT EXISTS touched_at TIMESTAMPTZ NOT NULL DEFAULT now()`;
  await sql`ALTER TABLE poem_hues ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1`;
}

// Zerfallsrate: alle 3 Tage sinkt das Level um 1
const DECAY_DAYS = 3;
const MAX_LEVEL = 10;

function effectiveLevel(storedLevel: number, touchedAt: Date): number {
  const daysSince = (Date.now() - touchedAt.getTime()) / (1000 * 60 * 60 * 24);
  const decay = Math.floor(daysSince / DECAY_DAYS);
  return Math.max(0, storedLevel - decay);
}

export async function GET() {
  try {
    const sql = getDb();
    await ensureTable();
    const rows = await sql`SELECT poem_id, hue, level, touched_at FROM poem_hues`;
    const result: Record<string, { hue: number; level: number }> = {};
    for (const row of rows) {
      const lvl = effectiveLevel(row.level as number, new Date(row.touched_at as string));
      if (lvl > 0 || row.hue !== undefined) {
        result[row.poem_id as string] = {
          hue: row.hue as number,
          level: lvl,
        };
      }
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
    // Aktuelles Level holen, effektives Level berechnen, +1 drauf
    const existing = await sql`SELECT level, touched_at FROM poem_hues WHERE poem_id = ${poemId}`;
    let newLevel = 1;
    if (existing.length > 0) {
      const current = effectiveLevel(
        existing[0].level as number,
        new Date(existing[0].touched_at as string)
      );
      newLevel = Math.min(MAX_LEVEL, current + 1);
    }
    await sql`
      INSERT INTO poem_hues (poem_id, hue, level, touched_at)
      VALUES (${poemId}, ${hue}, ${newLevel}, now())
      ON CONFLICT (poem_id)
      DO UPDATE SET hue = ${hue}, level = ${newLevel}, touched_at = now()
    `;
    return NextResponse.json({ ok: true, level: newLevel });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
