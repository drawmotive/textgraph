import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import { zhCN } from '../language-packs/index.js';
import { readFile } from 'node:fs/promises';

test('local runtime resolves unique root names independently of group and decoration order',
  { skip: !process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME }, async () => {
    const runtime = await initializeTextGraph();
    const containers = 'Shopping { browse -> checkout }\nBackend { payment -> saved }';
    const references = 'checkout -> payment\ncheckout: Place an order\npayment(fill success): Take payment';
    try {
      for (const source of [containers + '\n' + references, references + '\n' + containers]) {
        assert.equal((await runtime.validate(source)).valid, true, source);
        const result = await runtime.renderPng(source);
        assert.equal(result.success, true, JSON.stringify(result.diagnostics));
        assert.ok(result.png.length > 0);
      }
      for (const source of [
        'Shopping { browse -> checkout\ncheckout -> confirmation }\ncheckout: Place an order',
        'Shopping { checkout\nbrowse -> checkout }\ncheckout(fill primary): Place an order',
        'Shopping { browse(ellipse) -> checkout }\ncheckout: Place an order',
        'Outer { Shopping { browse -> checkout } }\ncheckout -> payment',
        containers + '\ncheckout -> Backend.payment',
        containers + '\nShopping.checkout -> payment',
        'Shopping { browse(ellipse) ->(dashed primary) checkout : Submit order }\ncheckout: Place an order',
      ]) {
        assert.equal((await runtime.validate(source)).valid, true, source);
      }
      for (const source of [
        'Shopping { checkout: Place an order }',
        'Shopping { checkout(fill primary) }',
        'Shopping { plain text }',
      ]) {
        assert.equal((await runtime.validate(source)).valid, false, source);
      }
      assert.equal((await runtime.validate(containers + '\n' + references)).valid, true);
    } finally { await runtime.dispose(); }
  });

test('local runtime keeps repeated group node names local and requires prefixes for ambiguous root names',
  { skip: !process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME }, async () => {
    const runtime = await initializeTextGraph();
    const groups = ['Review { submit -> done }', 'Delivery { pack -> done }'];
    const references = 'Review.done -> pack\nReview.done: Approved\nDelivery.done: Delivered';
    try {
      for (const ordered of [groups, groups.toReversed()]) {
        const structure = ordered.join('\n');
        assert.equal((await runtime.validate(structure)).valid, true, structure);
        for (const source of [structure + '\n' + references, references + '\n' + structure]) {
          assert.equal((await runtime.validate(source)).valid, true, source);
          const rendered = await runtime.renderPng(source);
          assert.equal(rendered.success, true, JSON.stringify(rendered.diagnostics));
          assert.ok(rendered.png.length > 0);
        }
        for (const ambiguous of ['done -> pack', 'done: Complete', 'done(fill success)', 'done, pack(primary)']) {
          for (const source of [structure + '\n' + ambiguous, ambiguous + '\n' + structure]) {
            const result = await runtime.validate(source);
            assert.equal(result.valid, false, source);
            const messages = result.diagnostics.map(item => item.message).join('\n');
            assert.match(messages, /Review\.done/);
            assert.match(messages, /Delivery\.done/);
          }
        }
      }
      assert.equal((await runtime.validate('Review { submit -> done\ndone -> submit }\nDelivery { pack -> done }')).valid, true);
      assert.equal((await runtime.validate('Outer { A\nInner { A -> B } }\nOuter.A -> Inner.A')).valid, true);
      assert.equal((await runtime.validate(groups.join('\n') + '\nReview.done, Delivery.done(primary)')).valid, true);
      const example = await readFile(new URL('../examples/repeated-names.textgraph', import.meta.url), 'utf8');
      assert.equal((await runtime.renderPng(example)).success, true);
    } finally { await runtime.dispose(); }
  });

test('local runtime resolves unique nested suffixes and qualified external endpoints for nodes and groups',
  { skip: !process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME }, async () => {
    const runtime = await initializeTextGraph();
    try {
      for (const source of [
        'Outer { Backend { payment -> saved } }\npayment -> saved\nBackend.payment: Take payment',
        'Outer { Backend { payment -> saved } }\nOuter.Backend.payment -> Backend.saved',
        'Left { Lane { A } }\nRight { Lane { B } }\nLane.A -> Lane.B',
        'Left { Lane { A } }\nRight { Lane { B } }\nLeft.Lane -> Right.Lane',
        'Outer { Inner { A } }\nstart -> Inner',
        'Left { A -> Right.B }\nRight { B }',
        'Left { A -> Right }\nRight { B }',
        'Left { A -> Outer.Right }\nOuter { Right { B } }',
        'Left { Lane { A }\nLane -> B }\nRight { Lane { C } }',
        'Left { Lane }\nRight { Lane { A } }\nLeft.Lane -> Right.Lane',
      ]) {
        assert.equal((await runtime.validate(source)).valid, true, source);
      }
      for (const source of [
        'Left { Lane { A } }\nRight { Lane { B } }\nLane -> exit',
        'Left { Lane }\nRight { Lane { A } }\nLane -> exit',
        'Left { Lane\nLane { A } }',
        'Left { A }\nLeft.missing -> A',
        'Left { A -> Right.missing }\nRight { B }',
        'Left { Right.B }\nRight { B }',
      ]) {
        assert.equal((await runtime.validate(source)).valid, false, source);
      }
    } finally { await runtime.dispose(); }
  });

test('local runtime supports scoped connections in anonymous and inline groups',
  { skip: !process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME }, async () => {
    const runtime = await initializeTextGraph();
    try {
      for (const source of [
        '{ Left { A -> B }\nRight { A -> C } }\nLeft.A -> Right.A',
        'start -> Review { A -> done }\nDelivery { B -> done }\nReview.done -> Delivery.done',
        'Outer { start -> Inner { A -> B } }\nInner.A -> B',
        'Outer { A -> { B -> C } }\nB -> C',
      ]) {
        const result = await runtime.renderPng(source);
        assert.equal(result.success, true, source + '\n' + JSON.stringify(result.diagnostics));
        assert.ok(result.png.length > 0);
      }
    } finally { await runtime.dispose(); }
  });

test('bundled native runtime retains display size when maxWidth reduces raster density', async () => {
  const runtime = await initializeTextGraph();
  try {
    const full = await runtime.renderPng('A -> B', { scale: 2 });
    const limited = await runtime.renderPng('A -> B', { scale: 2, maxWidth: 100 });
    assert.equal(full.success, true);
    assert.equal(limited.success, true);
    assert.equal(full.displayWidth, full.width / 2);
    assert.equal(full.displayHeight, full.height / 2);
    assert.equal(limited.width, 100);
    assert.ok(Math.abs(limited.displayWidth - full.displayWidth) < 0.001);
    assert.ok(Math.abs(limited.displayWidth / limited.displayHeight - limited.width / limited.height) < 0.000001);
  } finally { await runtime.dispose(); }
});

test('real Node runtime renders isolated PNGs with matching byte and base64 output', async () => {
  const runtime = await initializeTextGraph();
  try {
    assert.equal(typeof runtime.renderPng, 'function');
    const { PNG } = await import('pngjs');
    const first = await runtime.renderPng('A -> B');
    assert.equal(first.success, true, JSON.stringify(first.diagnostics));
    assert.ok(first.png instanceof Uint8Array);
    const decoded = PNG.sync.read(Buffer.from(first.png));
    assert.equal(decoded.width, first.width);
    assert.equal(decoded.height, first.height);
    let ink = 0;
    for (let i = 0; i < decoded.data.length; i += 4) {
      if (decoded.data[i] < 240 || decoded.data[i + 1] < 240 || decoded.data[i + 2] < 240) ink++;
    }
    assert.ok(ink > 100, 'PNG must contain visible diagram content');
    const encoded = await runtime.renderPng('A -> B', { encoding: 'base64' });
    assert.equal(encoded.success, true);
    assert.deepEqual(Buffer.from(encoded.png, 'base64'), Buffer.from(first.png));
    const enlarged = await runtime.renderPng('A -> B', { scale: 4 });
    assert.equal(enlarged.success, true);
    assert.ok(Math.abs(enlarged.width - first.width * 4) <= 3);
    assert.ok(Math.abs(enlarged.height - first.height * 4) <= 3);
    const logical = await runtime.renderPng('A -> B', { scale: 1 });
    assert.deepEqual(Buffer.from(logical.png), Buffer.from(first.png));
    const padded = await runtime.renderPng('A -> B', { padding: 20 });
    assert.equal(padded.width, first.width + 20);
    assert.equal(padded.height, first.height + 20);
    const limited = await runtime.renderPng('A -> B', { maxWidth: 100 });
    assert.equal(limited.width, 100);
    for (const source of ['', 'A ->', '(sequence) { A -> B }']) {
      const result = await runtime.renderPng(source);
      assert.equal(result.success, false, source);
      assert.ok(result.diagnostics.some(diagnostic => diagnostic.severity === 'error'));
    }
    await runtime.renderPng('C -> D -> E');
    const repeated = await runtime.renderPng('A -> B');
    assert.deepEqual(Buffer.from(repeated.png), Buffer.from(first.png));
    assert.equal((await runtime.validate('A -> B')).valid, true);
  } finally { await runtime.dispose(); }
});

test('released native runtime renders inline groups and recovers after unmatched braces', { timeout: 30000 }, async () => {
  const runtime = await initializeTextGraph();
  try {
    for (const source of ['A -> {}', 'A -> {{x}}', 'A -> { B -> C }']) {
      const result = await runtime.renderPng(source);
      assert.equal(result.success, true, JSON.stringify(result.diagnostics));
      assert.ok(result.png.length > 0);
      assert.ok(result.width > 0 && result.height > 0);
    }
    const invalid = await runtime.renderPng('A -> {}}');
    assert.equal(invalid.success, false);
    assert.ok(invalid.diagnostics.some(item => item.code === 'TG_PARSE_ERROR'));
    assert.equal((await runtime.renderPng('A -> {}')).success, true);
  } finally { await runtime.dispose(); }
});

test('optional Chinese pack resolves missing glyphs without changing the default instance', async () => {
  const source = 'A: 开始\nB: 完成\nA -> B';
  const base = await initializeTextGraph({ languagePacks: [], fontAssets: { fallback: false } });
  const chinese = await initializeTextGraph({ languagePacks: [zhCN] });
  try {
    assert.equal(typeof base.renderPng, 'function');
    const missing = await base.renderPng(source);
    assert.ok(missing.diagnostics.some(item => item.stage === 'font'), JSON.stringify(missing));
    const rendered = await chinese.renderPng(source);
    assert.equal(rendered.success, true, JSON.stringify(rendered.diagnostics));
    assert.ok(!rendered.diagnostics.some(item => item.stage === 'font'), JSON.stringify(rendered.diagnostics));
    const again = await base.renderPng(source);
    assert.ok(again.diagnostics.some(item => item.stage === 'font'));
  } finally { await base.dispose(); await chinese.dispose(); }
});

test('bundled runtime renders backward flow mixed with relation edges in both axes', async () => {
  const runtime = await initializeTextGraph();
  try {
    for (const direction of ['vertical', 'horizontal']) {
      for (const disconnected of ['', '\naz1 -- az2']) {
        const source = `(${direction})\ngateway -> auth\nmetrics <- worker\ngateway <-> worker${disconnected}`;
        const result = await runtime.renderPng(source);
        assert.equal(result.success, true, `${source}\n${JSON.stringify(result.diagnostics)}`);
        assert.ok(result.png.length > 0);
        assert.ok(result.width > 0 && result.height > 0);
        assert.ok(!result.diagnostics.some(item => item.severity === 'error'));
      }
    }
  } finally { await runtime.dispose(); }
});

test('corrupt font data fails before configuration and rendering can retry after repair', async () => {
  let corrupt = true;
  let fontReads = 0;
  const runtime = await initializeTextGraph({
    resolveAsset: (asset, url) => asset.path.endsWith('.ttf') ? new URL(asset.path, 'https://fonts.invalid/') : url,
    fetch: async url => {
      fontReads++;
      const path = new URL(url).pathname.slice(1);
      return new Response(corrupt ? new Uint8Array([0]) : await readFile(new URL(`../generated/${path}`, import.meta.url)));
    },
  });
  try {
    assert.equal(typeof runtime.renderPng, 'function');
    assert.equal(fontReads, 0);
    await assert.rejects(runtime.renderPng('A -> B'), { code: 'ASSET_INTEGRITY_MISMATCH' });
    assert.equal((await runtime.validate('A -> B')).valid, true);
    corrupt = false;
    assert.equal((await runtime.renderPng('A -> B')).success, true);
  } finally { await runtime.dispose(); }
});
