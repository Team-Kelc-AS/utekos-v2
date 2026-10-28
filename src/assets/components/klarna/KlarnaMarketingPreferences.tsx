'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

type Interest = 'camping-og-bobil' | 'hytte' | 'terrasse' | 'glamping';
type Preferences = {
  emailMarketing: boolean;
  cartReminders: boolean;
  adMatching: boolean;
  comfyrobeSize: 'XS' | 'XL' | null;
  favoriteColor: 'Vargnatt' | 'Fjellblå' | 'Havdyp' | 'Fjellnatt' | null;
  interests: Interest[];
};
const empty: Preferences = {
  emailMarketing: false, cartReminders: false, adMatching: false,
  comfyrobeSize: null, favoriteColor: null, interests: [],
};
const interestLabels: Record<Interest, string> = {
  'camping-og-bobil': 'Camping og bobil', hytte: 'Hytte', terrasse: 'Terrasse', glamping: 'Glamping',
};
const interests = Object.keys(interestLabels) as Interest[];

async function requestPreferences(input: { action: 'state' } | ({ action: 'save' } & Preferences)) {
  const response = await fetch('/api/identity/klarna/prospect', {
    method: 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Preference request failed: ${response.status}`);
  return response.json() as Promise<{ profile?: Preferences | null; saved?: boolean }>;
}

export function KlarnaMarketingPreferences() {
  const [value, setValue] = useState<Preferences>(empty);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading');
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const editVersion = useRef(0);
  useEffect(() => {
    let active = true;
    void requestPreferences({ action: 'state' }).then(result => {
      if (active) {
        setValue(result.profile ?? empty);
        setOpen(result.profile === null || result.profile === undefined);
        setLoaded(true);
        setStatus('ready');
      }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  function changeValue(update: (current: Preferences) => Preferences) {
    editVersion.current++;
    setValue(update);
    setStatus(current => current === 'saving' ? current : 'ready');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;
    const savingVersion = editVersion.current;
    setStatus('saving');
    try {
      const result = await requestPreferences({ action: 'save', ...value });
      if (result.saved !== true) throw new Error('Preference save was not confirmed');
      setStatus(editVersion.current === savingVersion ? 'saved' : 'ready');
    } catch { setStatus('error'); }
  }

  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)} className="mt-3 rounded-lg border border-[var(--surface-border)] p-3 text-sm">
    <summary className="cursor-pointer font-semibold">Mine preferanser og samtykker</summary>
    {status === 'loading' && <p role="status" className="mt-3">Henter valgene dine …</p>}
    {!loaded && status === 'error' && <p role="alert" className="mt-3">Valgene kunne ikke hentes. Last siden på nytt og prøv igjen.</p>}
    {loaded && <form onSubmit={event => { void save(event); }} className="mt-3 space-y-4">
      <div>
        <label htmlFor="klarna-comfyrobe-size" className="block font-medium">Foretrukket Comfyrobe™-passform</label>
        <select id="klarna-comfyrobe-size" value={value.comfyrobeSize ?? ''}
          onChange={event => changeValue(current => ({ ...current, comfyrobeSize: event.target.value === 'XS' || event.target.value === 'XL' ? event.target.value : null }))}
          className="mt-1 w-full rounded border border-[var(--outline)] bg-[var(--surface-container)] p-2">
          <option value="">Ikke valgt</option><option value="XS">S/XS</option><option value="XL">L/XXL</option>
        </select>
      </div>
      <div>
        <label htmlFor="klarna-favorite-color" className="block font-medium">Favorittfarge fra utvalget vårt</label>
        <select id="klarna-favorite-color" value={value.favoriteColor ?? ''}
          onChange={event => changeValue(current => ({ ...current, favoriteColor:
            event.target.value === 'Vargnatt' || event.target.value === 'Fjellblå' ||
            event.target.value === 'Havdyp' || event.target.value === 'Fjellnatt' ? event.target.value : null }))}
          className="mt-1 w-full rounded border border-[var(--outline)] bg-[var(--surface-container)] p-2">
          <option value="">Ikke valgt</option>
          <option value="Vargnatt">Vargnatt</option><option value="Fjellblå">Fjellblå</option>
          <option value="Havdyp">Havdyp</option><option value="Fjellnatt">Fjellnatt</option>
        </select>
      </div>
      <fieldset>
        <legend className="font-medium">Dette er jeg interessert i</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {interests.map(interest => <label key={interest} className="flex items-center gap-2">
            <input type="checkbox" checked={value.interests.includes(interest)} onChange={event => changeValue(current => ({
              ...current, interests: event.target.checked ? [...current.interests, interest] : current.interests.filter(item => item !== interest),
            }))} />{interestLabels[interest]}
          </label>)}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-medium">Velg hvordan Utekos kan bruke opplysningene dine</legend>
        <label className="flex items-start gap-2"><input type="checkbox" checked={value.emailMarketing}
          onChange={event => changeValue(current => ({ ...current, emailMarketing: event.target.checked }))} />
          <span>Send meg tilbud og produktnyheter på e-post.</span></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={value.cartReminders}
          onChange={event => changeValue(current => ({ ...current, cartReminders: event.target.checked }))} />
          <span>Send meg påminnelse på e-post hvis jeg forlater handlekurven.</span></label>
        <label className="flex items-start gap-2"><input type="checkbox" checked={value.adMatching}
          onChange={event => changeValue(current => ({ ...current, adMatching: event.target.checked }))} />
          <span>Bruk opplysninger jeg deler via Klarna til å matche handlingene mine for annonser hos Meta, Google, Microsoft, Pinterest og Snapchat. Det kan omfatte hashet e-post, telefon, navn, fødselsdato og sted. Google kan få land og postnummer i klartekst ved adressematching.</span></label>
      </fieldset>
      <p className="text-xs opacity-80">Valgene er frivillige og kan endres her senere. Innlogging alene gir ikke markedsføringssamtykke. <a href="/personvern#klarna-innlogging" className="underline underline-offset-2">Les om personvern</a>.</p>
      <button type="submit" disabled={status === 'saving'} className="rounded bg-[#b44701] px-4 py-2 font-semibold text-[#f0eee9] disabled:opacity-60">
        {status === 'saving' ? 'Lagrer …' : 'Lagre valgene mine'}
      </button>
      {status === 'saved' && <p role="status">Valgene er lagret.</p>}
      {status === 'error' && <p role="alert">Valgene kunne ikke hentes eller lagres. Prøv igjen.</p>}
    </form>}
  </details>;
}
