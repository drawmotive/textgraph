/** Actual Unicode scalar coverage from the bundled font's cmap; inclusive ranges. */
export interface FontCatalogEntry {
  readonly id: string;
  readonly family: string;
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly languages: readonly string[];
  readonly coverage: readonly (readonly [number, number])[];
  readonly license: string;
}
export interface FontCatalog {
  readonly schemaVersion: 1;
  readonly fonts: readonly FontCatalogEntry[];
}
export interface LanguagePack {
  readonly fonts: readonly (FontCatalogEntry & { readonly source: URL })[];
  readonly fallbackFamilies: readonly string[];
}
/** Lightweight metadata; importing descriptors never reads font bytes. */
export declare const fontCatalog: FontCatalog;
export declare const fontCatalogUrl: URL;
export declare const fontAssetsUrl: URL;
export declare const zhCN: LanguagePack;
export declare const ja: LanguagePack;
export declare const emoji: LanguagePack;
export declare const languagePacks: readonly LanguagePack[];
