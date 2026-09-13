import { initializeTextGraph } from '@drawmotive/textgraph/browser';

const source = document.querySelector('#source');
const button = document.querySelector('#render');
const status = document.querySelector('#status');
const image = document.querySelector('#diagram');
let runtime;
let imageUrl;

async function render() {
  button.disabled = true;
  status.textContent = 'Rendering…';
  try {
    const result = await runtime.renderPng(source.value);
    if (!result.success) throw new Error(result.diagnostics.map(item => item.message).join('\n'));
    const nextUrl = URL.createObjectURL(new Blob([result.png], { type: 'image/png' }));
    image.src = nextUrl;
    image.hidden = false;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = nextUrl;
    status.textContent = `Rendered ${result.width} × ${result.height} PNG`;
  } catch (error) {
    image.hidden = true;
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

button.addEventListener('click', render);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  void runtime?.dispose();
});

try {
  runtime = await initializeTextGraph({
    resolveAsset: asset => new URL(`textgraph/${asset.path}`, new URL(import.meta.env.BASE_URL, location.origin)),
  });
  await render();
} catch (error) {
  status.textContent = error.message;
}
