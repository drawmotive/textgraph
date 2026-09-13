import React, { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TextGraph, TextGraphProvider } from '@drawmotive/textgraph/react';
import './style.css';

// Stable options keep one runtime alive while React updates the diagram source.
const options = {
  resolveAsset: asset => new URL(`textgraph/${asset.path}`, new URL(import.meta.env.BASE_URL, location.origin)),
};
const renderOptions = { maxWidth: 1000 };

function App() {
  const [source, setSource] = useState('A: Start\nB: Finish\nA -> B');
  return (
    <main>
      <h1>TextGraph in React</h1>
      <p>Edit the source to update the diagram.</p>
      <label htmlFor="source">Diagram source</label>
      <textarea id="source" rows={7} value={source} onChange={event => setSource(event.target.value)} />
      <TextGraphProvider options={options}>
        <TextGraph source={source} renderOptions={renderOptions} alt="Rendered diagram" />
      </TextGraphProvider>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
