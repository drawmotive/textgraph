import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readVerifiedFontAsset } from '../src/runtime/font-cache.js';

const bytes = new Uint8Array([1, 2, 3]);
const hash = value => createHash('sha256').update(value).digest('hex');
const item = { asset: { path: 'font.ttf', bytes: bytes.length, sha256: hash(bytes) }, url: new URL('https://fonts.test/font.ttf') };

function cacheFixture(t, entries = new Map()) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  t.after(() => { if (original) Object.defineProperty(globalThis, 'caches', original); else delete globalThis.caches; });
  const cache = {
    async match(key) { return entries.get(key)?.clone(); },
    async put(key, response) { entries.set(key, response.clone()); },
    async delete(key) { return entries.delete(key); },
  };
  Object.defineProperty(globalThis, 'caches', { configurable: true, get: () => ({ open: async () => cache }) });
  return entries;
}

test('verified font bytes persist across readers and use a content-versioned URL', async t => {
  const entries = cacheFixture(t);
  let reads = 0;
  const read = async resource => {
    reads++;
    assert.equal(resource.url.searchParams.get('v'), item.asset.sha256);
    return new Response(bytes);
  };
  assert.deepEqual(await readVerifiedFontAsset(item, {}, read), bytes);
  assert.deepEqual(await readVerifiedFontAsset(item, {}, () => assert.fail('Cache miss')), bytes);
  assert.equal(reads, 1);
  assert.equal(entries.size, 1);
});

test('font revisions invalidate cached bytes and corrupt cache entries are repaired', async t => {
  const entries = cacheFixture(t);
  await readVerifiedFontAsset(item, {}, async () => new Response(bytes));
  const key = [...entries.keys()][0];
  entries.set(key, new Response(new Uint8Array([0])));
  let reads = 0;
  await readVerifiedFontAsset(item, {}, async () => { reads++; return new Response(bytes); });
  const revised = new Uint8Array([4, 5]);
  await readVerifiedFontAsset({ ...item, asset: { ...item.asset, bytes: revised.length, sha256: hash(revised) } }, {}, async () => { reads++; return new Response(revised); });
  assert.equal(reads, 2);
  assert.equal(entries.size, 2);
});

test('storage denial does not break fonts and corrupt downloads never enter the cache', async t => {
  const entries = cacheFixture(t);
  await assert.rejects(readVerifiedFontAsset(item, {}, async () => new Response(new Uint8Array([0]))), { code: 'ASSET_INTEGRITY_MISMATCH' });
  assert.equal(entries.size, 0);
  Object.defineProperty(globalThis, 'caches', { configurable: true, get: () => { throw new Error('Storage denied'); } });
  assert.deepEqual(await readVerifiedFontAsset(item, {}, async () => new Response(bytes)), bytes);
});

test('local fonts remain authoritative and are checked on every read', async t => {
  cacheFixture(t);
  const local = { ...item, url: new URL('file:///font.ttf') };
  await readVerifiedFontAsset(local, {}, async () => new Response(bytes));
  await assert.rejects(readVerifiedFontAsset(local, {}, async () => new Response(new Uint8Array([0]))), { code: 'ASSET_INTEGRITY_MISMATCH' });
});

test('failed cache reads and writes fall back without hiding source integrity errors', async t => {
  cacheFixture(t);
  Object.defineProperty(globalThis, 'caches', { configurable: true, get: () => ({ open: async () => ({
    match: async () => { throw new Error('Read failed'); },
    put: async () => { throw new Error('Quota exceeded'); },
  }) }) });
  assert.deepEqual(await readVerifiedFontAsset(item, {}, async () => new Response(bytes)), bytes);
  await assert.rejects(readVerifiedFontAsset(item, {}, async () => new Response(new Uint8Array([0]))), { code: 'ASSET_INTEGRITY_MISMATCH' });
});

test('cancellation during cache lookup prevents font download', async t => {
  cacheFixture(t);
  const controller = new AbortController();
  Object.defineProperty(globalThis, 'caches', { configurable: true, get: () => ({ open: async () => ({
    match: async () => { controller.abort(); },
  }) }) });
  await assert.rejects(readVerifiedFontAsset(item, { signal: controller.signal }, () => assert.fail('Aborted download')), { name: 'AbortError' });
});
