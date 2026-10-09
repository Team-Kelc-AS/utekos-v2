/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const z = require('zod');
const { loadTypeScript } = require('./load-typescript.cjs');
const mini = require('zod/mini');
mini.config(require('zod/v4/locales/en.js').default());
const load = name => loadTypeScript(`lib/analytics/${name}.ts`, {
  mocks: { '@/lib/validation/zodMini': mini },
});
const { canonicalEventEnvelopeSchema: envelope } = load('canonicalEventEnvelope');
const { canonicalCommerceValueSchema: commerce, canonicalCommerceItemSchema: item } = load('canonicalCommerceItem');
// Classic definitions capture the pre-migration contracts, including check order.
const definitions = [
  ['formStartEvent', 'FormStart', 'form_start', z.strictObject({ form_id: z.string().min(1), form_name: z.string().min(1), field_category: z.string().min(1).optional() }), { form_id: 'form', form_name: 'Contact', field_category: 'email' }],
  ['formErrorEvent', 'FormError', 'form_error', z.strictObject({ attempt_id: z.string().min(1), form_id: z.string().min(1), error_category: z.string().min(1) }), { attempt_id: '1', form_id: 'form', error_category: 'invalid' }],
  ['heroInteractEvent', 'HeroInteract', 'hero_interact', z.strictObject({ cta_id: z.string().min(1), destination_path: z.string().min(1), click_sequence: z.number().int().positive() }), { cta_id: 'hero', destination_path: '/produkter', click_sequence: 1 }],
  ['sizeGuideViewEvent', 'SizeGuideView', 'size_guide_view', z.strictObject({ guide_id: z.string().min(1), open_sequence: z.number().int().positive() }), { guide_id: 'guide', open_sequence: 1 }],
  ['videoProgressEvent', 'VideoProgress', 'video_progress', z.strictObject({ video_id: z.string().min(1), milestone: z.union([10, 25, 50, 75, 90, 100].map(n => z.literal(n))), video_title: z.string().min(1), video_duration: z.number().finite().nonnegative(), video_current_time: z.number().finite().nonnegative(), video_percent: z.number().int().min(1).max(100) }), { video_id: 'video', milestone: 25, video_title: 'Video', video_duration: 100, video_current_time: 25, video_percent: 25 }],
  ['addToWishlistEvent', 'AddToWishlist', 'add_to_wishlist', z.strictObject({ ...commerce.shape, wishlist_mutation_id: z.string().min(1) }), null],
  ['interactWithAccordionEvent', 'InteractWithAccordion', 'interact_with_accordion', z.strictObject({ ...commerce.shape, accordion_id: z.string().min(1), accordion_title: z.string().min(1), interaction_sequence: z.number().int().positive(), interaction_type: z.literal('open'), items: z.array(item).length(1) }), null],
];
const commerceFixture = { currency: 'NOK', value: 80, gross_value: 100, tax_value: 20, items: [{ item_id: '1', product_id: '1', variant_id: '1', item_name: 'Product', product_handle: 'product', quantity: 1, unit_price: 80, gross_unit_price: 100, tax_amount: 20, tax_rate: .25, taxable: true, price_includes_tax: true, available_for_sale: true, currently_not_in_stock: false, quantity_available: 1, selected_options: [], collection_ids: [], collection_titles: [] }] };
definitions[5][4] = { ...commerceFixture, wishlist_mutation_id: '1' };
definitions[6][4] = { ...commerceFixture, accordion_id: 'details', accordion_title: 'Details', interaction_sequence: 1, interaction_type: 'open' };
const invalidValues = [undefined, null, '', ' ', 0, -1, 1, 1.5, 10, 25, 50, 75, 90, 100, 101, Number.MAX_SAFE_INTEGER + 1, Infinity, NaN, true, [], {}, 'invalid', 'https://example.com', '00000000-0000-0000-0000-000000000000'];
function normalize(result) {
  return structuredClone(result.success ? { success: true, data: result.data } : { success: false, issues: result.error.issues });
}
function compare(expected, actual, value) {
  assert.deepEqual(normalize(actual.safeParse(value)), normalize(expected.safeParse(value)));
}
function variants(valid) {
  const values = [valid, null, undefined, {}, { ...valid, unexpected: true }];
  for (const key of Object.keys(valid)) {
    const missing = { ...valid }; delete missing[key]; values.push(missing);
    if (Array.isArray(valid[key])) values.push({ ...valid, [key]: [...valid[key], ...valid[key]] });
    for (const value of invalidValues) values.push({ ...valid, [key]: value });
  }
  return values;
}
for (const [file, name, eventName, classicCustom, fixture] of definitions) {
  test(`${eventName}: Mini preserves parsed outputs and complete issues`, () => {
    const actual = load(file);
    for (const value of variants(fixture)) compare(classicCustom, actual[`canonical${name}CustomDataSchema`], value);
    const classic = z.strictObject({ ...envelope.shape, event_name: z.literal(eventName), source: z.literal('web'), page_url: z.string().url(), referrer_url: z.string().url().optional(), page_title: z.string().min(1), page_view_id: ['form_error', 'add_to_wishlist'].includes(eventName) ? z.string().uuid().optional() : z.string().uuid(), custom_data: classicCustom });
    const valid = { schema_version: 1, event_name: eventName, source: 'web', environment: 'production', event_id: '12345678-1234-4234-8234-123456789012', event_time: '2026-10-08T12:00:00Z', page_url: 'https://utekos.no/', referrer_url: 'https://example.com/', page_title: 'Utekos', page_view_id: '12345678-1234-4234-8234-123456789012', consent: { analytics: 'granted', marketing: 'denied', preferences: 'denied', source: 'cookiebot', version: '1' }, custom_data: fixture };
    assert.equal(actual[`canonical${name}Schema`].safeParse(valid).success, true);
    for (const value of variants(valid)) compare(classic, actual[`canonical${name}Schema`], value);
    for (const value of variants(fixture)) compare(classic, actual[`canonical${name}Schema`], { ...valid, custom_data: value });
  });
}
test('Meta protected values preserve regex, array limits, optional fields and strictness', () => {
  const value = z.string().regex(/^[a-f0-9]{64}\.[A-Za-z0-9_-]{8}$/u);
  const list = z.array(value).min(1).max(2);
  const classic = z.strictObject(Object.fromEntries(['city', 'country', 'email', 'first_name', 'last_name', 'phone', 'postal_code', 'state'].map(key => [key, list.optional()])));
  const actual = load('metaParameterBuilderUserData');
  const valid = 'a'.repeat(64) + '.abcdefgh';
  for (const entry of [...invalidValues, valid, valid.toUpperCase(), valid + 'x']) compare(value, actual.metaParameterBuilderProtectedValueSchema, entry);
  for (const entry of [...variants({ email: [valid] }), { email: [] }, { email: [valid, valid] }, { email: [valid, valid, valid] }, { email: ['bad'] }, { email: undefined }]) compare(classic, actual.metaParameterBuilderUserDataSchema, entry);
});
test('browser union preserves discriminator failures and parsed event output', () => {
  const { browserEventSchema } = loadTypeScript('lib/tracking/browser-schema.ts', { mocks: { '@/lib/validation/zodMini': mini } });
  const classic = z.discriminatedUnion('event_name', browserEventSchema.def.options);
  const valid = { schema_version: 1, event_name: 'page_view', source: 'web', environment: 'production', event_id: '12345678-1234-4234-8234-123456789012', event_time: '2026-10-08T12:00:00Z', page_url: 'https://utekos.no/', page_title: 'Utekos', page_view_id: '12345678-1234-4234-8234-123456789012', consent: { analytics: 'granted', marketing: 'denied', preferences: 'denied', source: 'cookiebot', version: '1' }, custom_data: {} };
  assert.equal(browserEventSchema.safeParse(valid).success, true);
  for (const value of [valid, null, undefined, {}, { event_name: 'unknown' }, ...definitions.map(([, , eventName, , fixture]) => ({ event_name: eventName, custom_data: fixture }))]) compare(classic, browserEventSchema, value);
});
test('browser runtime emits no classic Zod, lead schema or unused locales', async () => {
  const result = await esbuild.build({ entryPoints: ['src/lib/tracking/runtime.ts'], bundle: true, write: false, metafile: true, minify: true, format: 'esm', platform: 'browser', target: 'es2022' });
  const emitted = Object.values(result.metafile.outputs).flatMap(output => Object.entries(output.inputs).filter(([, info]) => info.bytesInOutput > 0).map(([file]) => file));
  assert.ok(emitted.some(file => file.includes('/mini/')));
  assert.deepEqual(emitted.filter(file => file.includes('/classic/')), []);
  assert.deepEqual(emitted.filter(file => file.includes('/locales/') && !file.endsWith('/en.js') && !file.endsWith('/index.js')), []);
  assert.ok(!emitted.includes('src/lib/analytics/generateLeadEvent.ts'));
});
