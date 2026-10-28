'use client';

export async function completeKlarnaIdentity(idToken: string): Promise<string> {
  const response = await fetch('/api/identity/klarna/complete', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ idToken }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('Klarna-identiteten kunne ikke bekreftes. Prøv igjen.');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('returnTo' in result) ||
      typeof result.returnTo !== 'string' || !result.returnTo.startsWith('/') ||
      result.returnTo.startsWith('//')) throw new Error('Ugyldig innloggingssvar.');
  return result.returnTo;
}
