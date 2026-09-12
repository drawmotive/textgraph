import { execFile, spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
const exec = promisify(execFile);

/** Pass release arguments directly to executables, including npm on Windows. */
export async function command(executable, args, cwd, { interactive = false } = {}) {
  if (executable === "npm" && (process.env.npm_execpath || process.platform === "win32")) {
    const cli = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
    args = [cli, ...args];
    executable = process.execPath;
  }
  if (interactive) {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, { cwd, stdio: "inherit", shell: false });
      child.on("error", reject);
      child.on("close", code => code === 0 ? resolve({ stdout: "" }) : reject(new Error(`npm publication exited with code ${code}`)));
    });
  }
  try {
    return await exec(executable, args, { cwd, maxBuffer: 16 * 1024 * 1024 });
  } catch (error) {
    throw new Error(`${path.basename(executable)} failed: ${error.stderr || error.stdout || error.message}`, { cause: error });
  }
}
