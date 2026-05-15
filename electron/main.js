'use strict';
const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path      = require('path');
const net       = require('net');
const http      = require('http');

let mainWindow   = null;
let flaskProcess = null;
let flaskPort    = 5000;

// ── Find an available TCP port ────────────────────────────────────────────────
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

// ── Poll until Flask responds ─────────────────────────────────────────────────
function waitForServer(port, maxMs = 20000) {
  const start = Date.now();
  return new Promise((resolve) => {
    function probe() {
      if (Date.now() - start > maxMs) { resolve(false); return; }
      const req = http.get(`http://127.0.0.1:${port}/`, res => {
        res.destroy();
        resolve(true);
      });
      req.on('error', () => setTimeout(probe, 600));
      req.setTimeout(800, () => { req.destroy(); setTimeout(probe, 600); });
    }
    probe();
  });
}

// ── Start the Flask/Python backend ───────────────────────────────────────────
function startFlask(port) {
  const isPacked = app.isPackaged;
  let cmd, args, opts;

  if (isPacked) {
    // Production: PyInstaller bundle placed in resources/server/
    const exe = process.platform === 'win32' ? 'coilms_server.exe' : 'coilms_server';
    cmd  = path.join(process.resourcesPath, 'server', exe);
    args = [];
    // Store the SQLite DB in the user's AppData folder so it survives updates
    // and isn't blocked by Program Files write restrictions.
    const dataDir = app.getPath('userData');
    const dbPath  = path.join(dataDir, 'database.sqlite3');
    opts = {
      env: {
        ...process.env,
        PORT:         String(port),
        ELECTRON_RUN: '1',
        DATABASE_URL: `sqlite:///${dbPath}`,
        INSTANCE_PATH: dataDir,
      },
    };
  } else {
    // Development: run flask directly from the project root
    const python = process.platform === 'win32' ? 'python' : 'python3';
    cmd  = python;
    args = ['-m', 'flask', 'run', '--port', String(port), '--no-debugger'];
    opts = {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, FLASK_APP: 'app.py', PORT: String(port) },
    };
  }

  flaskProcess = spawn(cmd, args, { ...opts, stdio: 'pipe' });
  flaskProcess.stdout.on('data', d => process.stdout.write('[Flask] ' + d));
  flaskProcess.stderr.on('data', d => process.stderr.write('[Flask] ' + d));
  flaskProcess.on('error', err => console.error('[Flask] spawn error:', err.message));
}

// ── Create the Electron window ────────────────────────────────────────────────
async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width:    1280,
    height:   820,
    minWidth:  960,
    minHeight: 640,
    title:    'CoilMS',
    icon:     path.join(__dirname, '..', 'frontend', 'static', 'icons', 'icon-192.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
    },
  });

  // Inject API base before any page script runs
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(
      `window.__ELECTRON__ = true; window.__COILMS_API__ = 'http://127.0.0.1:${port}';`
    );
  });

  // Open external links in the system browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) Menu.setApplicationMenu(null);

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  flaskPort = await findFreePort();
  startFlask(flaskPort);

  const ready = await waitForServer(flaskPort);
  if (!ready) {
    console.error('[Electron] Flask server did not start in time — exiting.');
    app.quit();
    return;
  }

  await createWindow(flaskPort);

  app.on('activate', async () => {
    if (!mainWindow) await createWindow(flaskPort);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (flaskProcess) {
    flaskProcess.kill('SIGTERM');
    flaskProcess = null;
  }
});
