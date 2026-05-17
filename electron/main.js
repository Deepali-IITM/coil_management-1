'use strict';
const { app, BrowserWindow, shell, Menu, dialog } = require('electron');
const { spawn }  = require('child_process');
const crypto     = require('crypto');
const fs         = require('fs');
const path       = require('path');
const net        = require('net');
const http       = require('http');

let mainWindow    = null;
let loadingWindow = null;
let flaskProcess  = null;
let flaskPort     = 5000;
let logStream     = null;

// ── File logger ───────────────────────────────────────────────────────────────
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

// ── Persistent secret keys (generated once, stored in userData) ───────────────
// Secrets must survive app restarts so existing Flask-Security sessions stay valid.
function getOrCreateSecrets(dataDir) {
  const secretFile = path.join(dataDir, 'electron.secrets.json');
  try {
    if (fs.existsSync(secretFile)) {
      const s = JSON.parse(fs.readFileSync(secretFile, 'utf8'));
      if (s.secretKey && s.passwordSalt) return s;
    }
  } catch { /* regenerate */ }
  const s = {
    secretKey:    crypto.randomBytes(32).toString('hex'),
    passwordSalt: crypto.randomBytes(16).toString('hex'),
  };
  fs.writeFileSync(secretFile, JSON.stringify(s), { encoding: 'utf8', mode: 0o600 });
  return s;
}

// ── Loading splash (uses a real HTML file — no data-URL encoding pitfalls) ────
function showLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width:  420,
    height: 260,
    frame:  false,
    resizable:    false,
    center:       true,
    alwaysOnTop:  true,
    backgroundColor: '#0f172a',   // prevents white flash before HTML loads
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  loadingWindow.loadFile(path.join(__dirname, 'loading.html'));
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
function waitForServer(port, maxMs = 60000) {
  const start = Date.now();
  return new Promise((resolve) => {
    function probe() {
      if (Date.now() - start > maxMs) { resolve(false); return; }
      const req = http.get(`http://127.0.0.1:${port}/`, res => {
        res.resume();   // drain the response so the socket closes cleanly
        if (res.statusCode < 500) {
          resolve(true);
        } else {
          // Flask returned 5xx — DB init probably still running; retry
          setTimeout(probe, 1000);
        }
      });
      req.on('error', () => setTimeout(probe, 800));
      req.setTimeout(2000, () => { req.destroy(); setTimeout(probe, 800); });
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
    cmd = path.join(process.resourcesPath, 'server', exe);

    // Fail fast if the bundled server is missing (bad build / corrupt install).
    if (!fs.existsSync(cmd)) {
      const msg =
        `Flask server not found:\n  ${cmd}\n\n` +
        `The application was not packaged correctly.\n` +
        `Please reinstall CoilMS from a fresh installer.`;
      log(`ERROR: ${msg}`);
      dialog.showErrorBox('CoilMS — Missing Server', msg);
      app.quit();
      return;
    }
    log(`Flask exe : ${cmd}`);

    const dataDir = app.getPath('userData');
    // SQLite URIs must use forward slashes on Windows
    const dbPath  = path.join(dataDir, 'database.sqlite3').split(path.sep).join('/');
    log(`Database  : ${dbPath}`);

    const secrets = getOrCreateSecrets(dataDir);

    opts = {
      env: {
        ...process.env,
        PORT:                   String(port),
        ELECTRON_RUN:           '1',
        DATABASE_URL:           `sqlite:///${dbPath}`,
        INSTANCE_PATH:          dataDir,
        SECRET_KEY:             secrets.secretKey,
        SECURITY_PASSWORD_SALT: secrets.passwordSalt,
        PYTHONUTF8:             '1',
        PYTHONIOENCODING:       'utf-8',
        PYTHONDONTWRITEBYTECODE: '1',
      },
    };
  } else {
    // Dev mode: run Flask directly
    const python = process.platform === 'win32' ? 'python' : 'python3';
    cmd  = python;
    args = ['-m', 'flask', 'run', '--port', String(port), '--no-debugger'];
    opts = {
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        FLASK_APP:    'app.py',
        ELECTRON_RUN: '1',
        PORT:         String(port),
      },
    };
  }

  flaskProcess = spawn(cmd, args || [], { ...opts, stdio: 'pipe' });

  flaskProcess.stdout.on('data', d => log(`[Flask] ${d.toString().trimEnd()}`));
  flaskProcess.stderr.on('data', d => log(`[Flask] ${d.toString().trimEnd()}`));
  flaskProcess.on('error', err => {
    log(`[Flask] spawn error: ${err.message}`);
    dialog.showErrorBox('CoilMS — Server Error', `Failed to start Flask:\n${err.message}`);
    app.quit();
  });
  flaskProcess.on('exit', code => {
    log(`[Flask] exited with code ${code}`);
    // If Flask dies unexpectedly while the window is open, alert the user.
    if (code !== 0 && code !== null && mainWindow && !mainWindow.isDestroyed()) {
      const logPath = path.join(app.getPath('userData'), 'app.log');
      dialog.showErrorBox(
        'CoilMS — Server Crashed',
        `The application server stopped unexpectedly (code ${code}).\n\n` +
        `Check the log for details:\n${logPath}`,
      );
    }
  });
}

// ── Main application window ───────────────────────────────────────────────────
async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width:        1280,
    height:       820,
    minWidth:      960,
    minHeight:     640,
    title:        'CoilMS',
    show:         false,           // revealed only after first successful load
    backgroundColor: '#f1f5f9',   // matches --content-bg; prevents white flash
    icon: path.join(__dirname, '..', 'frontend', 'static', 'icons', 'icon-512.png'),
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
    },
  });

  let firstLoad = true;

  function revealWindow() {
    if (!firstLoad) return;
    firstLoad = false;
    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    // Inject Electron context vars (port can differ on each launch).
    mainWindow.webContents.executeJavaScript(
      `window.__ELECTRON__ = true; window.__COILMS_API__ = 'http://127.0.0.1:${port}';`
    ).catch(() => {});
    revealWindow();
  });

  // If the page fails to load (network blip, Flask restart), retry once.
  let loadRetried = false;
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
    log(`[Window] Page load failed: ${errorCode} ${errorDesc}`);
    if (!loadRetried) {
      loadRetried = true;
      log('[Window] Retrying page load in 1 s…');
      setTimeout(() => {
        mainWindow.loadURL(`http://127.0.0.1:${port}/`).catch(err => {
          log(`[Window] Retry failed: ${err.message}`);
          revealWindow(); // show window so user sees the error page
        });
      }, 1000);
    } else {
      revealWindow(); // give up — show whatever is rendered
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Suppress the default menu bar in production builds.
  if (app.isPackaged) Menu.setApplicationMenu(null);

  try {
    await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  } catch (err) {
    // loadURL rejects if navigation was cancelled; did-fail-load handles the rest.
    log(`[Window] loadURL threw: ${err.message}`);
  }

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

    // Give Flask up to 60 s to initialise (DB creation can be slow on HDD).
    const ready = await waitForServer(flaskPort, 60000);
    if (!ready) {
      const logPath = path.join(app.getPath('userData'), 'app.log');
      if (loadingWindow && !loadingWindow.isDestroyed()) loadingWindow.close();
      dialog.showErrorBox(
        'CoilMS — Failed to Start',
        `The application server did not respond within 60 seconds.\n\n` +
        `Check the log file for details:\n${logPath}`,
      );
      app.quit();
      return;
    }

    log('Flask is ready — opening main window');
    await createWindow(flaskPort);

  } catch (err) {
    log(`Fatal error: ${err.stack || err.message}`);
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
  if (flaskProcess) {
    flaskProcess.removeAllListeners('exit'); // suppress crash dialog on intentional quit
    flaskProcess.kill('SIGTERM');
    flaskProcess = null;
  }
  if (logStream) { logStream.end(); logStream = null; }
});
