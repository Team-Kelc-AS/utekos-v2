/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFile, mkdtemp, rm } = require('node:fs/promises');
const { spawnSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const path = require('node:path');
const pdfLib = require('pdf-lib');
const { PDFDocument } = pdfLib;
const { loadTypeScript } = require('./load-typescript.cjs');

const root = path.resolve(__dirname, '..');
const templatePath = path.join(root, 'public/images/kunnskap/forhandler-utfyllbar.pdf');
const values = {
  storeName: 'Ås & Øy friluft', location: 'Tromsø', name: 'Håkon Sæther',
  email: 'butikk@example.com', phone: '+47 12345678',
  message: 'Vi ønsker Utekos TechDown™ og Utekos Svale™ i butikken.\nKan dere sende informasjon om størrelser og farger?',
  privacy: 'on',
};

function formData() {
  const form = new FormData();
  for (const [name, value] of Object.entries(values)) form.set(name, value);
  return form;
}

test('real dealer PDF reaches the simulated provider with Norwegian fields, consent and stable retry identity', async () => {
  const templateBefore = await readFile(templatePath);
  const calls = [], accepted = [];
  const env = { RESEND_API_KEY: 'mock-only-key', CONTACT_FORM_SEND_TO_EMAIL: 'ordinary-contact@example.com' };
  const { submitDealerInquiry } = loadTypeScript('app/bli-forhandler/actions.ts', {
    env,
    globals: { process: { env, cwd: () => root } },
    mocks: {
      'node:fs/promises': { readFile },
      'node:path': path,
      'pdf-lib': pdfLib,
      '@pdf-lib/fontkit': { default: require('@pdf-lib/fontkit') },
      '@/lib/tracking/server-forms': {
        recordAcceptedDealerInquiry: async (form, fields) => {
          assert.ok(form instanceof FormData);
          accepted.push(JSON.parse(JSON.stringify(fields)));
          return undefined;
        },
      },
    },
    fetch: async (url, options) => {
      assert.equal(url, 'https://api.resend.com/emails');
      calls.push({ ...options, payload: JSON.parse(options.body) });
      return { ok: true, json: async () => ({ id: 'mock-pdf-receipt' }) };
    },
  });
  const { initialDealerInquiryState } = loadTypeScript('app/bli-forhandler/form-state.ts');
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await submitDealerInquiry(initialDealerInquiryState, formData());
    assert.equal(result.status, 'success');
    assert.equal(result.values.storeName, '');
    assert.equal(result.leadEvent, undefined, 'email receipt alone is not a verified canonical lead');
  }

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].payload.to, ['erling@utekos.no']);
  assert.equal(calls[0].payload.reply_to, values.email);
  assert.equal(calls[0].payload.attachments.length, 1);
  const attachment = calls[0].payload.attachments[0];
  assert.equal(attachment.filename, 'Utekos-forhandlerhenvendelse.pdf');
  assert.equal(attachment.content_type, 'application/pdf');
  const pdf = await PDFDocument.load(Buffer.from(attachment.content, 'base64'), { updateMetadata: false });
  assert.equal(pdf.getPageCount(), 8);
  const form = pdf.getForm();
  assert.equal(form.getFields().length, 7);
  for (const name of ['storeName', 'location', 'name', 'email', 'phone', 'message']) {
    assert.equal(form.getTextField(name).getText(), values[name], name);
  }
  assert.equal(form.getCheckBox('privacy').isChecked(), true);
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.equal(attachment.content, calls[1].payload.attachments[0].content);
  const { email, phone, name, storeName, location } = values;
  assert.deepEqual(accepted, Array.from({ length: 2 }, () => ({ receiptId: 'mock-pdf-receipt', email, phone, name, storeName, location })));
  assert.ok(accepted.every(fields => !Object.hasOwn(fields, 'message')), 'PDF message is absent from tracking arguments');

  const templateAfter = await readFile(templatePath);
  assert.ok(templateBefore.equals(templateAfter), 'shared template must not be modified by a submission');
  const blank = (await PDFDocument.load(templateAfter, { updateMetadata: false })).getForm();
  for (const name of ['storeName', 'location', 'name', 'email', 'phone', 'message']) {
    assert.ok(!blank.getTextField(name).getText(), `${name} must remain blank in the download`);
  }
  assert.equal(blank.getCheckBox('privacy').isChecked(), false);
});

test('maximum-length fields produce readable continuation pages promptly without changing exact form values', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'utekos-dealer-pdf-'));
  const output = path.join(directory, 'filled.pdf');
  const longValues = {
    ...values, privacy: true,
    storeName: 'W'.repeat(150), location: 'Ø'.repeat(150), name: 'Æ'.repeat(100),
    email: `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(58)}.no`,
    phone: '1'.repeat(40),
    message: `${'Vi ønsker informasjon om størrelser, farger og levering. '.repeat(100)}`.slice(0, 4985) + ' SLUTTMERKE5000',
  };
  assert.equal(longValues.message.length, 5000);
  try {
    // A process deadline also stops synchronous font-layout regressions; an
    // ordinary async test timeout cannot interrupt a CPU-bound layout loop.
    const child = spawnSync(process.execPath, ['-e', `
      const fs = require('node:fs');
      const { loadTypeScript } = require('./tests/load-typescript.cjs');
      const { createDealerPdfAttachment } = loadTypeScript('lib/retailers/dealer-pdf.ts', {
        globals: { process: { cwd: () => process.cwd(), env: {} } },
        mocks: {
          'node:fs/promises': require('node:fs/promises'), 'node:path': require('node:path'),
          'pdf-lib': {
            ...require('pdf-lib'),
            PDFDocument: { load: async (...args) => {
              const doc = await require('pdf-lib').PDFDocument.load(...args);
              const insertPage = doc.insertPage.bind(doc);
              // pdf-lib uses instanceof Array; convert the VM helper's array
              // to the library's realm without altering the production path.
              doc.insertPage = (index, size) => insertPage(index, Array.isArray(size) ? Array.from(size) : size);
              return doc;
            } },
          }, '@pdf-lib/fontkit': { default: require('@pdf-lib/fontkit') },
        },
      });
      (async () => {
        const values = JSON.parse(fs.readFileSync(0, 'utf8'));
        const first = await createDealerPdfAttachment(values);
        const second = await createDealerPdfAttachment(values);
        if (first.content !== second.content) throw new Error('PDF retry bytes changed');
        const unbroken = await createDealerPdfAttachment({ ...values, message: 'W'.repeat(5000) });
        const unbrokenPdf = await require('pdf-lib').PDFDocument.load(Buffer.from(unbroken.content, 'base64'));
        if (unbrokenPdf.getForm().getTextField('message').getText() !== 'W'.repeat(5000)) throw new Error('Unbroken text changed');
        if (unbrokenPdf.getPageCount() <= 8) throw new Error('Unbroken text has no continuation');
        fs.writeFileSync(process.argv[1], Buffer.from(first.content, 'base64'));
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `, output], { cwd: root, input: JSON.stringify(longValues), encoding: 'utf8', timeout: 8000 });
    assert.ifError(child.error);
    assert.equal(child.status, 0, child.stderr);
    const bytes = await readFile(output);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    assert.ok(pdf.getPageCount() > 8, 'overflow must have printable continuation pages');
    for (const name of ['storeName', 'location', 'name', 'email', 'phone', 'message']) {
      assert.equal(pdf.getForm().getTextField(name).getText(), longValues[name], name);
    }
    assert.equal(pdf.getForm().getCheckBox('privacy').isChecked(), true);

    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loading = getDocument({ data: new Uint8Array(bytes) });
    const loaded = await loading.promise;
    const visible = [];
    for (let number = 8; number < loaded.numPages; number++) {
      const page = await loaded.getPage(number);
      const text = await page.getTextContent();
      const { width, height } = page.getViewport({ scale: 1 });
      for (const item of text.items.filter(item => 'str' in item)) {
        assert.ok(item.transform[4] >= 39, 'continuation text stays inside left margin');
        assert.ok(item.transform[4] + item.width <= width - 35, 'continuation text stays inside right margin');
        assert.ok(item.transform[5] >= 27 && item.transform[5] <= height - 40, 'continuation text stays inside page');
        if (item.str !== 'Forhandlerhenvendelse – fortsettelse' && !/^Side \d+$/u.test(item.str)) visible.push(item.str);
      }
    }
    const compact = visible.join('').replace(/\s/gu, '');
    for (const name of ['storeName', 'location', 'name', 'email', 'message']) {
      assert.ok(compact.includes(longValues[name].replace(/\s/gu, '')), `${name} must be readable in continuation pages`);
    }
    await loading.destroy();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
