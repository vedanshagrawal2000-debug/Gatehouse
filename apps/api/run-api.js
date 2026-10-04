const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';
const apiDir = __dirname;

// Detect python executable in local venv or system
const venvPythonWin = path.join(apiDir, '.venv', 'Scripts', 'python.exe');
const venvPythonUnix = path.join(apiDir, '.venv', 'bin', 'python');

let pythonCmd = 'python';

if (isWindows && fs.existsSync(venvPythonWin)) {
  pythonCmd = venvPythonWin;
} else if (!isWindows && fs.existsSync(venvPythonUnix)) {
  pythonCmd = venvPythonUnix;
}

console.log(`[GATEHOUSE API] Launching FastAPI backend using: ${pythonCmd}`);

const args = ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8000', '--host', '0.0.0.0'];

const child = spawn(pythonCmd, args, {
  cwd: apiDir,
  stdio: 'inherit',
  shell: false,
});

child.on('error', (err) => {
  console.error('[GATEHOUSE API] Failed to start backend process:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== null) {
    process.exit(code);
  }
});
