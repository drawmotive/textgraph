import { TextGraph, TextGraphProvider } from '@drawmotive/textgraph/react';
import type { TextGraphProps } from '@drawmotive/textgraph/react';

const diagram = <TextGraphProvider options={{ resolveAsset: asset => new URL(`/textgraph/${asset.path}`, 'https://example.com') }}>
  <TextGraph source="A -> B" alt="Flow" className="diagram" style={{ maxWidth: '100%' }} renderOptions={{ scale: 3, dark: true }} loading={<span>Loading</span>} />
</TextGraphProvider>;
void diagram;
// @ts-expect-error source must be DSL text
const invalid: TextGraphProps = { source: 42 };
// @ts-expect-error component owns image source
const image: TextGraphProps = { source: 'A', src: 'unrelated.png' };
// @ts-expect-error component owns cancellation
const signal: TextGraphProps = { source: 'A', renderOptions: { signal: new AbortController().signal } };
void [invalid, image, signal];
// @ts-expect-error Dark rendering requires a boolean.
const dark: TextGraphProps = { source: 'A', renderOptions: { dark: 'true' } };
void dark;
