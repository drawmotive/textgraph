import { spawn } from 'node:child_process';
import path from 'node:path';

// Build serially to keep verification resource usage predictable.
for (const sample of ['browser', 'react-vite', 'worker']) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
      cwd: path.join(import.meta.dirname, sample), stdio: 'inherit', shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${sample} build exited ${code}`)));
  });
}
