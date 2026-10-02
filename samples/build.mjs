import path from 'node:path';
import { command } from '../scripts/command.mjs';

// Build serially to keep verification resource usage predictable.
for (const sample of ['browser', 'react-vite', 'worker']) {
  await command('npm', ['run', 'build'], path.join(import.meta.dirname, sample), { interactive: true });
}
