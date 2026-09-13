const source = document.querySelector('#source');
const button = document.querySelector('#render');
const status = document.querySelector('#status');
const image = document.querySelector('#diagram');
const worker = new Worker(new URL('./renderer.js', import.meta.url), { type: 'module' });
let imageUrl;

function render() {
  button.disabled = true;
  status.textContent = 'Rendering in Worker…';
  worker.postMessage({ type: 'render', source: source.value });
}

worker.onmessage = ({ data }) => {
  if (data.type === 'ready') {
    render();
    return;
  }
  button.disabled = false;
  if (data.type === 'error') {
    image.hidden = true;
    status.textContent = data.message;
    return;
  }
  const nextUrl = URL.createObjectURL(new Blob([data.png], { type: 'image/png' }));
  image.src = nextUrl;
  image.hidden = false;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = nextUrl;
  status.textContent = `Rendered ${data.width} × ${data.height} PNG in Worker`;
};
worker.onerror = event => {
  status.textContent = event.message;
  button.disabled = true;
};
button.addEventListener('click', render);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  worker.terminate();
});
