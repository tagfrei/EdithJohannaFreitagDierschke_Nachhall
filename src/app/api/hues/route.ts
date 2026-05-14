import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();
const KV_KEY = 'poem-hues';

export async function GET() {
  try {
    const hues = await redis.hgetall<Record<string, number>>(KV_KEY);
    return NextResponse.json(hues ?? {});
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
    await redis.hset(KV_KEY, { [poemId]: hue });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
