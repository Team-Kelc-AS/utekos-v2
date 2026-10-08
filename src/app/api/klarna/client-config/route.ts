import { connection, NextResponse } from 'next/server';
import { privateHeaders } from '@/lib/cart/request';
import { readPublicConfig } from '@/lib/klarna/server';

export async function GET() {
  await connection();
  try {
    return NextResponse.json(readPublicConfig(), { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: 'Klarna er midlertidig utilgjengelig.' }, { status: 503, headers: privateHeaders });
  }
}
