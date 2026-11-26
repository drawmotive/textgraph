/** JavaScript module the bridge's JSImports bind to; it must match `HostModule` in the C# bridge. */
export const nativeHostModule = 'drawmotive-textgraph-host';

/**
 * Splits one configure/install font batch into the JSON descriptors and the byte arrays the host
 * writes into native memory. WASM linear memory never shrinks, so fonts never travel inside JSON:
 * the bridge allocates each final Skia block and asks the host to fill it through `copyFontBytes`.
 */
export function encodeFontBatch(entries) {
  return { fonts: entries.map(({ bytes, ...font }) => ({ ...font, byteLength: bytes.length })), data: entries.map(entry => entry.bytes) };
}

/**
 * Serves the bridge's synchronous host imports for exactly one `Execute` call at a time.
 * Memory views alias WASM linear memory only during the import callback, so fonts are copied in
 * with `set` and a PNG is copied out with `slice` before the call returns. The returned native
 * response pairs the JSON envelope with any payload delivered during that call.
 */
export function createNativeHost(enableInventory = false) {
  let fonts;
  let output;
  let readInventoryFont;
  const inventoryBytes = new Map();
  const accept = (key, value) => {
    if (!output || output.png !== undefined || output.svg !== undefined) throw new Error('Native output arrived outside one export call');
    output[key] = value;
  };
  return {
    imports: {
      copyFontBytes(index, view) {
        const bytes = fonts?.[index];
        if (!(bytes instanceof Uint8Array) || bytes.length !== view.length) throw new Error(`Font ${index} does not match its native buffer`);
        view.set(bytes);
      },
      ...(enableInventory ? {
        async loadInventoryFont(path, sha256) {
          if (!readInventoryFont) throw new Error('No inventory request is active');
          const bytes = await readInventoryFont(path, sha256);
          inventoryBytes.set(path, bytes);
          return bytes.length;
        },
        copyInventoryFont(path, view) {
          const bytes = inventoryBytes.get(path);
          if (bytes?.length !== view.length) throw new Error('Inventory font does not match its native buffer');
          inventoryBytes.delete(path);
          view.set(bytes);
        },
      } : {}),
      acceptPng(view) { accept('png', view.slice()); },
      acceptSvg(text) { accept('svg', text); },
    },
    run(call, data) {
      if (output || readInventoryFont) throw new Error('Native host is already serving an export call');
      fonts = data;
      output = {};
      try {
        const json = call();
        return Object.freeze({ json, ...output });
      } finally { fonts = output = undefined; }
    },
    // Keep on-demand buffers available only while the matching async native call is active.
    async runInventory(call, readFont) {
      if (output || readInventoryFont) throw new Error('Native host is already serving an export call');
      readInventoryFont = readFont;
      try { return await call(); }
      finally {
        readInventoryFont = undefined;
        inventoryBytes.clear();
      }
    },
  };
}
