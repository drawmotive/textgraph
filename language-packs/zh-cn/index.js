/** Adds Simplified Chinese fallback coverage to a TextGraph instance. */
export const zhCN = Object.freeze({
  fonts: Object.freeze([Object.freeze({
    family: 'NotoSansSC-Regular',
    source: new URL('./fonts/NotoSansSC-Regular.ttf', import.meta.url),
  })]),
  fallbackFamilies: Object.freeze(['NotoSansSC-Regular']),
});
