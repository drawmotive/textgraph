import { fontCatalog as metadata } from './catalog.js';

function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export const fontCatalog = freeze(metadata);

/** Descriptors carry actual coverage and identity so compatible renderers can defer font I/O. */
export function descriptor(id) {
  const font = fontCatalog.fonts.find(item => item.id === id);
  if (!font) throw new Error(`Unknown bundled font: ${id}`);
  return Object.freeze({
    fonts: Object.freeze([Object.freeze({ ...font, source: new URL(`./assets/${font.path}`, import.meta.url) })]),
    fallbackFamilies: Object.freeze([font.family]),
  });
}
