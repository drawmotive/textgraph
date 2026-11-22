import { defineConfig } from '@playwright/test';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  expect: { timeout: 30000 },
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({
    name: browserName, use: { browserName },
  })),
  webServer: ['browser', 'react-vite', 'worker'].map((sample, index) => ({
    command: `npm --prefix samples/${sample} run preview -- --port 0 --strictPort`,
    cwd: root,
    env: { NO_COLOR: '1', FORCE_COLOR: '0' },
    wait: { stdout: new RegExp(`(?<TEXTGRAPH_SAMPLE_URL_${index}>http://127[.]0[.]0[.]1:[0-9]+/)`) },
  })),
});
