'use server';

import { z } from 'zod';
import { singleLine, sendContactMessage } from '@/lib/contact';
import { getProduct } from '@/lib/shopify/getProduct';
import { optionParam } from '@/lib/products/variants';
import { recordAcceptedForm, submissionIdFromReceipt } from '@/lib/tracking/server-forms';
import { dunColors, dunSizes, dunReservationConsent, type DunReservationState } from './dun';

const schema = z.object({
  color: z.enum(dunColors),
  size: z.enum(dunSizes),
  firstName: singleLine(100).min(1, 'Skriv fornavnet ditt.'),
  lastName: singleLine(100).min(1, 'Skriv etternavnet ditt.'),
  email: singleLine(254).pipe(z.email('Skriv en gyldig e-postadresse.')),
  phone: singleLine(40).regex(/^\+?[\d ()-]+$/, 'Skriv et gyldig telefonnummer.').refine(value => {
    const digits = value.replace(/\D/g, '').length;
    return digits >= 8 && digits <= 15;
  }, 'Skriv et gyldig telefonnummer.'),
  consent: z.literal('yes', { error: 'Bekreft at vi kan holde av jakken og sende betalingslenken.' }),
  website: z.string().max(200),
});

export async function submitDunReservation(data: FormData): Promise<DunReservationState> {
  const failed: DunReservationState = { status: 'error', message: 'Vi fikk ikke registrert reservasjonen. Prøv igjen, eller kontakt kundeservice@utekos.no.' };
  const parsed = schema.safeParse(Object.fromEntries(['color', 'size', 'firstName', 'lastName', 'email', 'phone', 'consent', 'website'].map(name => [name, data.get(name) ?? ''])));
  if (!parsed.success) return { status: 'error', message: 'Kontroller feltene og prøv igjen.', errors: z.flattenError(parsed.error).fieldErrors };
  if (parsed.data.website) return failed;
  const { color, size, firstName, lastName, email, phone } = parsed.data;
  try {
    const product = await getProduct('utekos-dun');
    if (!product) return failed;
    const matches = product.variants.nodes.filter(variant =>
      variant.selectedOptions.some(option => optionParam(option.name) === 'farge' && option.value === color) &&
      variant.selectedOptions.some(option => optionParam(option.name) === 'storrelse' && option.value === size),
    );
    // Every reservation must resolve to exactly one real size/color variant.
    if (matches.length !== 1) return failed;
    const receipt = await sendContactMessage({
      replyTo: email,
      subject: `Reservasjon: Utekos Dun™ – ${color} / ${size}`,
      idempotencyPrefix: 'dun-reservation',
      text: [
        'Reservasjon av én Utekos Dun™. Oppfølging: hold av jakken og send uforpliktende betalingslenke på både SMS og e-post når den er på lager i uke 43.',
        `Farge: ${color}`, `Størrelse: ${size}`,
        `Variant: ${matches[0].id}`,
        `Fornavn: ${firstName}`, `Etternavn: ${lastName}`, `E-post: ${email}`, `Telefon: ${phone}`,
        `Samtykke: ${dunReservationConsent}`, 'Samtykkeversjon: dun-reservation-2026-10-09',
      ].join('\n'),
    });
    if (!receipt) return failed;
    await recordAcceptedForm(data, 'product_reservation_utekos_dun', submissionIdFromReceipt(receipt.receiptId));
    return { status: 'success' };
  } catch { return failed; }
}
