/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const ts = require('typescript');
const { loadTypeScript } = require('./load-typescript.cjs');

// Execute the real component and committed effects. No runtime/provider requests.
function harness() {
  const actions = [], states = [], refs = [], effectSlots = [];
  let stateIndex, refIndex, effectIndex, effects, tree;
  const react = {
    useState: initial => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], update => { states[index] = typeof update === 'function' ? update(states[index]) : update; }];
    },
    useRef: initial => { const index = refIndex++; return refs[index] ?? (refs[index] = { current: initial }); },
    useEffect: (callback, dependencies) => {
      const index = effectIndex++;
      const previous = effectSlots[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) effects.push(callback);
      effectSlots[index] = dependencies;
    },
  };
  const variants = [
    ['1', 'Small', 'Grønn', false, '1990'], ['2', 'Large', 'Grønn', true, '1990'],
    ['3', 'Small', 'Blå', true, '2190'], ['4', 'Large', 'Blå', true, '2290'],
  ].map(([id, size, color, available, amount]) => ({
    id: `gid://shopify/ProductVariant/${id}`, available, price: { amount, currencyCode: 'NOK' },
    selectedOptions: [{ name: 'Størrelse', value: size }, { name: 'Farge', value: color }],
    image: id === '3' ? null : { url: `/variant-${id}.webp`, altText: `Variant ${id}`, width: 1000, height: 1500 },
  }));
  const tracking = {
    previewVariantId: variants[1].id,
    variants: Object.fromEntries(variants.map(variant => [variant.id, {
      href: `/produkter/test?variant=${variant.id.split('/').at(-1)}`,
      commerce: { currency: 'NOK', value: Number(variant.price.amount), items: [{
        item_id: variant.id, variant_id: variant.id, product_id: 'gid://shopify/Product/10',
        item_variant: variant.selectedOptions.map(option => option.value).join(' / '),
      }] },
    }])),
  };
  const mocks = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'next/image': { default: 'Image' }, 'next/link': { default: 'Link' },
    '@/components/ui/card': { CardTitle: 'CardTitle' },
    '@/components/commerce/AddToCart': { AddToCart: 'AddToCart' },
    '@/components/reservations/DunReservationButton': { DunReservationButton: 'DunReservationButton' },
    '@/lib/cart/client': { useCartState: () => ({ pending: false }) },
    '@/lib/catalog/modelPurchase': loadTypeScript('lib/catalog/modelPurchase.ts'),
    '@/lib/products/money': { formatMoney: money => money.amount },
    '@/lib/reservations/dun': { dunSelection: variant => ({ variantId: variant.id }) },
    '@/lib/tracking/browser-events': { emitStorefrontAction: (name, detail) => actions.push({ name, detail }) },
    './DeferredModelKlarna': { DeferredModelKlarna: 'DeferredModelKlarna' },
    './camping.module.css': { default: {} },
  };
  const source = fs.readFileSync('src/assets/components/catalog/ModelPurchaseControls.tsx', 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new vm.Script(code).runInContext(vm.createContext({ exports, crypto: webcrypto, require: name => {
    if (!(name in mocks)) throw new Error(`Unmocked: ${name}`);
    return mocks[name];
  } }));
  function render() {
    stateIndex = refIndex = effectIndex = 0; effects = [];
    tree = exports.ModelPurchaseControls({ product: { handle: 'test', title: 'Test product', variants }, waitlist: false, tracking,
      initialImage: { type: 'Image', props: { src: '/preview.webp' } }, initialPrice: '1990 – 2290', reviews: null, children: null });
    // Replay committed effects as Strict Mode does, retaining hook state/refs.
    effects.forEach(callback => { callback(); callback(); });
    return tree;
  }
  function walk(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(walk);
    return [node, ...walk(node.props?.children)];
  }
  const nodes = () => walk(tree);
  render();
  return { actions, variants, tree: () => tree, nodes,
    choose: value => { nodes().find(node => node.type === 'button' && (node.props.children === value || node.props.children?.[0] === value)).props.onClick(); render(); },
  };
}

test('inline choice commits one canonical variant selection and aligns both links, commerce, image, price and purchase IDs', () => {
  const h = harness();
  assert.equal(h.actions.length, 0, 'preview/hydration is not an explicit selection');
  h.choose('Large');
  assert.equal(h.actions.length, 0, 'partial choice cannot invent a selected variant');
  h.choose('Blå');
  const id = h.variants[3].id;
  assert.equal(h.tree().props['data-selected-variant'], id);
  assert.equal(h.tree().props['data-product-card'], id);
  const commerce = JSON.parse(h.tree().props['data-tracking-commerce']);
  assert.equal(commerce.items[0].variant_id, id);
  assert.equal(commerce.value, 2290);
  assert.ok(h.nodes().some(node => node.type === 'p' && node.props.children === '2290'));
  assert.ok(h.nodes().filter(node => node.type === 'Link').every(node => node.props.href === '/produkter/test?variant=4'));
  assert.equal(h.nodes().find(node => node.type === 'Image').props.src, '/variant-4.webp');
  assert.equal(h.nodes().find(node => node.type === 'AddToCart').props.variantId, id);
  assert.equal(h.nodes().find(node => node.type === 'DeferredModelKlarna').props.variantId, id);
  assert.equal(h.actions.length, 1, 'effect replay must not duplicate the committed change');
  assert.equal(h.actions[0].name, 'utekos:variant-selection-confirmed');
  assert.equal(h.actions[0].detail.variant_id, id);
  assert.equal(h.actions[0].detail.availability, 'available');
  h.choose('Blå'); h.choose('Large');
  assert.equal(h.actions.length, 1, 'choosing the same options is not another change');
});

test('subsequent choices keep missing-image links correct and report each new available or unavailable exact variant once', () => {
  const h = harness();
  h.choose('Large'); h.choose('Blå');
  h.choose('Small');
  assert.equal(h.actions.length, 2);
  assert.equal(h.actions[1].detail.variant_id, h.variants[2].id);
  assert.notEqual(h.actions[0].detail.interaction_id, h.actions[1].detail.interaction_id);
  assert.ok(h.nodes().filter(node => node.type === 'Link').every(node => node.props.href === '/produkter/test?variant=3'));
  assert.equal(h.nodes().find(node => node.type === 'Image').props.src, '/preview.webp', 'missing image keeps the factual preview');
  h.choose('Grønn');
  assert.equal(h.actions.length, 3);
  assert.equal(h.actions[2].detail.variant_id, h.variants[0].id);
  assert.equal(h.actions[2].detail.availability, 'unavailable');
  assert.equal(h.nodes().find(node => node.type === 'AddToCart').props.available, false);
  assert.equal(h.nodes().find(node => node.type === 'DeferredModelKlarna').props.disabled, true);
});
