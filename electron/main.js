'use strict';
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const { spawn } = require('child_process');
const fs        = require('fs');
const path      = require('path');
const net       = require('net');
const http      = require('http');

let mainWindow    = null;
let loadingWindow = null;
let flaskProcess  = null;
let flaskPort     = 5000;
let logStream     = null;

// ── File logger (writes to %APPDATA%\CoilMS\app.log) ─────────────────────────
function initLogger() {
  const logDir  = app.getPath('userData');
  const logFile = path.join(logDir, 'app.log');
  try {
    fs.mkdirSync(logDir, { recursive: true });
    logStream = fs.createWriteStream(logFile, { flags: 'a' });
    log(`\n${'─'.repeat(60)}\nCoilMS started  ${new Date().toISOString()}\n`);
  } catch { /* non-fatal */ }
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  if (logStream) logStream.write(line + '\n');
}

// ── Loading splash window ─────────────────────────────────────────────────────
function showLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width:  420,
    height: 260,
    frame:  false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, '..', 'frontend', 'static', 'icons', 'icon-512.png'),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  loadingWindow.loadURL(`data:text/html,
    <html>
    <body style="margin:0;background:#0f172a;font-family:system-ui,sans-serif;
                 display:flex;flex-direction:column;align-items:center;
                 justify-content:center;height:100vh;color:#e2e8f0;">
      <div style="font-size:2.5rem;margin-bottom:12px;">⚙️</div>
      <div style="font-size:1.3rem;font-weight:700;color:#6366f1;margin-bottom:6px;">CoilMS</div>
      <div style="font-size:.85rem;color:#94a3b8;margin-bottom:24px;">Starting application…</div>
      <div style="width:200px;height:4px;background:#1e293b;border-radius:4px;overflow:hidden;">
        <div id="bar" style="height:100%;width:0%;background:#6366f1;
             animation:prog 15s linear forwards;">
        </div>
      </div>
      <style>@keyframes prog{to{width:90%}}</style>
    </body></html>`);
}

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
function waitForServer(port, maxMs = 40000) {
  const start = Date.now();
  return new Promise((resolve) => {
    function probe() {
      if (Date.now() - start > maxMs) { resolve(false); return; }
      const req = http.get(`http://127.0.0.1:${port}/`, res => {
        res.destroy();
        resolve(true);
      });
      req.on('error', () => setTimeout(probe, 800));
      req.setTimeout(1000, () => { req.destroy(); setTimeout(probe, 800); });
    }
    probe();
  });
}

// ── Start the Flask/Python backend ───────────────────────────────────────────
function startFlask(port) {
  const isPacked = app.isPackaged;
  let cmd, args, opts;

  if (isPacked) {
    const exe = process.platform === 'win32' ? 'coilms_server.exe' : 'coilms_server';
    cmd  = path.join(process.resourcesPath, 'server', exe);
    args = [];
    log(`Flask exe: ${cmd}`);

    const dataDir = app.getPath('userData');
    const dbPath  = path.join(dataDir, 'database.sqlite3');
    log(`Database : ${dbPath}`);

    opts = {
      env: {
        ...process.env,
        PORT:          String(port),
        ELECTRON_RUN:  '1',
        DATABASE_URL:  `sqlite:///${dbPath}`,
        INSTANCE_PATH: dataDir,
      },
    };
  } else {
    const python = process.platform === 'win32' ? 'python' : 'python3';
    cmd  = python;
    args = ['-m', 'flask', 'run', '--port', String(port), '--no-debugger'];
    opts = {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, FLASK_APP: 'app.py', PORT: String(port) },
    };
  }

  flaskProcess = spawn(cmd, args, { ...opts, stdio: 'pipe' });

  flaskProcess.stdout.on('data', d => log(`[Flask] ${d.toString().trim()}`));
  flaskProcess.stderr.on('data', d => log(`[Flask] ${d.toString().trim()}`));
  flaskProcess.on('error', err => log(`[Flask] spawn error: ${err.message}`));
  flaskProcess.on('exit',  code => log(`[Flask] exited with code ${code}`));
}

// ── Main application window ───────────────────────────────────────────────────
async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    820,
    minWidth:   960,
    minHeight:  640,
    title:     'CoilMS',
    show:      false,           // reveal only after page loads (avoids white flash)
    icon:      path.join(__dirname, '..', 'frontend', 'static', 'icons', 'icon-512.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
    },
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(
      `window.__ELECTRON__ = true; window.__COILMS_API__ = 'http://127.0.0.1:${port}';`
    );
    // Close splash and reveal the real window
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

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
  initLogger();
  showLoadingWindow();

  try {
    flaskPort = await findFreePort();
    log(`Starting Flask on port ${flaskPort}`);
    startFlask(flaskPort);

    const ready = await waitForServer(flaskPort, 40000);
    if (!ready) {
      const logPath = path.join(app.getPath('userData'), 'app.log');
      if (loadingWindow && !loadingWindow.isDestroyed()) loadingWindow.close();
      dialog.showErrorBox(
        'CoilMS — Failed to start',
        `The application server did not respond within 40 seconds.\n\n` +
        `Check the log file for details:\n${logPath}`
      );
      app.quit();
      return;
    }

    log('Flask is ready — opening window');
    await createWindow(flaskPort);

  } catch (err) {
    log(`Fatal error: ${err.message}`);
    if (loadingWindow && !loadingWindow.isDestroyed()) loadingWindow.close();
    dialog.showErrorBox('CoilMS — Error', err.message);
    app.quit();
  }

  app.on('activate', async () => {
    if (!mainWindow) await createWindow(flaskPort);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  log('App quitting — stopping Flask');
  if (flaskProcess) { flaskProcess.kill('SIGTERM'); flaskProcess = null; }
  if (logStream)    { logStream.end(); logStream = null; }
});
