import { defineConfig } from 'vite';

// The runtime bootstrap uses dynamic ESM imports inside the module Worker.
export default defineConfig({ worker: { format: 'es' } });
