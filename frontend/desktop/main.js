const { app, BrowserWindow, shell, ipcMain, Tray, Menu, session } = require("electron");
const path = require("path");
const http = require("http");
const os = require("os");
const crypto = require("crypto");
const fs = require("fs");
const { spawn, exec } = require("child_process");

// Set dedicated app name and userData to avoid lock conflicts with other electron apps
app.name = "ASCEND";
const userDataDir = path.join(app.getPath("appData"), "ASCEND");
app.setPath("userData", userDataDir);

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;
let tray = null;
let isQuitting = false;
let heartbeatInterval = null;

const BACKEND_DIR = path.resolve(__dirname, "../../backend");
const FRONTEND_DIR = path.resolve(__dirname, "../../frontend");
const PYTHON_PATH = path.join(BACKEND_DIR, "venv/Scripts/python.exe");

const BACKEND_HEALTH_URL = "http://127.0.0.1:8000/health";
const FRONTEND_URL = "http://localhost:3000";
const ICON_PATH = path.join(__dirname, "icon.ico");

// Single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Machine Hardware Fingerprint
function getOrCreateDeviceId() {
  const deviceFile = path.join(userDataDir, "device_id.json");
  try {
    if (fs.existsSync(deviceFile)) {
      const data = JSON.parse(fs.readFileSync(deviceFile, "utf8"));
      if (data.deviceId) return data.deviceId;
    }
  } catch (e) {}

  const newId = "ascend-win-" + crypto.randomBytes(8).toString("hex");
  try {
    fs.mkdirSync(userDataDir, { recursive: true });
    fs.writeFileSync(deviceFile, JSON.stringify({ deviceId: newId, created: new Date().toISOString() }), "utf8");
  } catch (e) {}
  return newId;
}

const MACHINE_DEVICE_ID = getOrCreateDeviceId();

function checkHttpReady(url, timeoutMs = 45000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const tryConnect = () => {
      http
        .get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(true);
          } else {
            retry();
          }
        })
        .on("error", () => {
          retry();
        });
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        resolve(false);
      } else {
        setTimeout(tryConnect, 600);
      }
    };

    tryConnect();
  });
}

function startBackend() {
  console.log("[ASCEND-JARVIS] Launching Python backend service...");
  try {
    const compiledExe = path.join(BACKEND_DIR, "dist/jarvis_backend/jarvis_backend.exe");
    const useCompiled = fs.existsSync(compiledExe);

    if (useCompiled) {
      console.log("[ASCEND-JARVIS] Using compiled standalone jarvis_backend.exe");
      backendProcess = spawn(compiledExe, [], {
        cwd: path.dirname(compiledExe),
        stdio: "pipe",
        windowsHide: true,
      });
    } else {
      backendProcess = spawn(
        PYTHON_PATH,
        ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        {
          cwd: BACKEND_DIR,
          stdio: "pipe",
          windowsHide: true,
          env: {
            ...process.env,
            PYTHONIOENCODING: "utf-8",
          },
        }
      );
    }

    backendProcess.stdout?.on("data", (data) => {
      console.log(`[JARVIS Backend] ${data.toString().trim()}`);
    });

    backendProcess.stderr?.on("data", (data) => {
      console.error(`[JARVIS Backend ERR] ${data.toString().trim()}`);
    });

    backendProcess.on("close", (code) => {
      console.log(`[JARVIS Backend] exited with code ${code}`);
      backendProcess = null;
    });
  } catch (err) {
    console.error("[ASCEND-JARVIS] Failed to spawn backend:", err);
  }
}

function startFrontend() {
  console.log("[ASCEND-JARVIS] Launching Next.js frontend service...");
  try {
    const isWindows = process.platform === "win32";
    const npmCmd = isWindows ? "npm.cmd" : "npm";

    frontendProcess = spawn(npmCmd, ["start"], {
      cwd: FRONTEND_DIR,
      stdio: "pipe",
      shell: isWindows,
      windowsHide: true,
      env: {
        ...process.env,
        PORT: "3000",
      },
    });

    frontendProcess.stdout?.on("data", (data) => {
      console.log(`[ASCEND Frontend] ${data.toString().trim()}`);
    });

    frontendProcess.stderr?.on("data", (data) => {
      console.error(`[ASCEND Frontend ERR] ${data.toString().trim()}`);
    });

    frontendProcess.on("close", (code) => {
      console.log(`[ASCEND Frontend] exited with code ${code}`);
      frontendProcess = null;
    });
  } catch (err) {
    console.error("[ASCEND-JARVIS] Failed to spawn frontend:", err);
  }
}

function showBlockedScreen(reason) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const blockedHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ASCEND // Hardware Installation Blocked</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #03020A;
      color: #E8EEFF;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; overflow: hidden; user-select: none; text-align: center;
    }
    .shield-icon {
      font-size: 54px; color: #EF4444; margin-bottom: 16px;
      text-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
    }
    h1 { font-size: 20px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #FFFFFF; }
    p { margin-top: 10px; font-size: 13px; color: #94A3B8; max-width: 480px; line-height: 1.6; }
    .hwid { margin-top: 18px; font-family: monospace; font-size: 11px; color: #A855F7; background: rgba(168,85,247,0.1); padding: 6px 14px; border-radius: 6px; border: 1px solid rgba(168,85,247,0.3); }
    .reason { margin-top: 12px; font-size: 12px; color: #EF4444; font-weight: 600; }
  </style>
</head>
<body>
  <div class="shield-icon">🛡️</div>
  <h1>Installation Firewalled</h1>
  <p>This desktop machine has been blocked by the ASCEND Owner Control Centre.</p>
  <div class="reason">Reason: ${reason || "Administrative Policy Block"}</div>
  <div class="hwid">DEVICE ID: ${MACHINE_DEVICE_ID}</div>
</body>
</html>`;
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(blockedHTML)}`).catch(() => {});
}

function pingDesktopHeartbeat() {
  const postData = JSON.stringify({
    device_id: MACHINE_DEVICE_ID,
    hostname: os.hostname(),
    os_version: `${os.type()} ${os.release()}`,
    app_version: "1.0.0",
  });

  const req = http.request(
    "http://127.0.0.1:8000/api/v1/desktop/heartbeat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    },
    (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try {
          const data = JSON.parse(raw);
          if (data.is_blocked) {
            showBlockedScreen(data.blocked_reason);
          }
        } catch (e) {}
      });
    }
  );
  req.on("error", () => {});
  req.write(postData);
  req.end();
}

function setupTray() {
  if (tray) return;
  try {
    tray = new Tray(ICON_PATH);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show ASCEND",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: "JARVIS AI Assistant",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.loadURL(`${FRONTEND_URL}/jarvis`);
          }
        },
      },
      {
        label: "App Hub & Integrations",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.loadURL(`${FRONTEND_URL}/app-hub`);
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit ASCEND",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray.setToolTip("ASCEND AI Operating System");
    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.warn("[ASCEND-Desktop] Could not initialize tray:", e);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "ASCEND // AI OPERATING SYSTEM",
    icon: ICON_PATH,
    backgroundColor: "#03020A",
    frame: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const CHROME_USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

  // Prevent Google's "403: disallowed_useragent" on OAuth endpoints
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["https://accounts.google.com/*", "https://*.firebaseapp.com/*", "https://*.googleapis.com/*"] },
    (details, callback) => {
      details.requestHeaders["User-Agent"] = CHROME_USER_AGENT;
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  // Allow Google/Firebase popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.includes("accounts.google.com") ||
      url.includes("firebaseapp.com/__/auth") ||
      url.includes("googleapis.com") ||
      url.includes("google.com/signin")
    ) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }

    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    setupTray();
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  const splashHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ASCEND // Initializing System</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #03020A;
      color: #E8EEFF;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; overflow: hidden; user-select: none;
    }
    .arc-glow {
      position: relative; width: 90px; height: 90px; border-radius: 50%;
      border: 2px dashed #A855F7; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 25px rgba(168, 85, 247, 0.4); animation: spin 8s linear infinite;
    }
    .arc-inner {
      width: 60px; height: 60px; border-radius: 50%; border: 2px solid #06B6D4;
      background: radial-gradient(circle, #A855F7 10%, #03020A 80%);
      box-shadow: 0 0 20px #A855F7; animation: pulse 2s ease-in-out infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { transform: scale(0.95); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
    h1 {
      margin-top: 24px; font-size: 18px; font-weight: 800; letter-spacing: 0.25em;
      text-transform: uppercase; color: #FFFFFF; text-shadow: 0 0 12px rgba(168, 85, 247, 0.6);
    }
    p { margin-top: 8px; font-size: 11px; letter-spacing: 0.15em; color: #06B6D4; font-family: monospace; }
  </style>
</head>
<body>
  <div class="arc-glow"><div class="arc-inner"></div></div>
  <h1>ASCEND</h1>
  <p id="status-msg">INITIALIZING SYSTEM ARCHITECTURE...</p>
</body>
</html>`;

  const updateSplashStatus = (msg) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(
          `const el = document.getElementById('status-msg'); if (el) el.innerText = ${JSON.stringify(msg)};`
        ).catch(() => {});
      }
    } catch (e) {}
  };

  try {
    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  } catch (splashErr) {}

  // 1. Verify / Start Backend
  updateSplashStatus("[ 1/3 ] INITIALIZING ASCEND LOCAL CORE...");
  const isBackendHealthyAlready = await checkHttpReady(BACKEND_HEALTH_URL, 1500);
  if (!isBackendHealthyAlready) {
    startBackend();
    await checkHttpReady(BACKEND_HEALTH_URL, 25000);
  }

  // 2. Register Device & Check Block
  pingDesktopHeartbeat();
  heartbeatInterval = setInterval(pingDesktopHeartbeat, 60000);

  // 3. Verify / Start Frontend
  updateSplashStatus("[ 2/3 ] STARTING INTERFACE CORE...");
  const isFrontendHealthyAlready = await checkHttpReady(FRONTEND_URL, 1500);
  if (!isFrontendHealthyAlready) {
    startFrontend();
    await checkHttpReady(FRONTEND_URL, 20000);
  }

  // 4. Load Main Portal (Dashboard)
  updateSplashStatus("[ 3/3 ] CONNECTING USER WORKSPACE...");
  try {
    const isLocalOnline = await checkHttpReady(FRONTEND_URL, 2000);
    const targetUrl = isLocalOnline ? `${FRONTEND_URL}/dashboard` : "https://ascend-app-alpha.vercel.app/dashboard";
    console.log(`[ASCEND-Desktop] Navigating to: ${targetUrl}`);
    await mainWindow.loadURL(targetUrl);
  } catch (err) {
    mainWindow.loadURL("https://ascend-app-alpha.vercel.app/dashboard").catch(() => {});
  }
}

function cleanup() {
  isQuitting = true;
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (backendProcess) {
    try {
      if (process.platform === "win32") {
        exec(`taskkill /pid ${backendProcess.pid} /T /F`);
      } else {
        backendProcess.kill();
      }
    } catch (e) {}
  }
  if (frontendProcess) {
    try {
      if (process.platform === "win32") {
        exec(`taskkill /pid ${frontendProcess.pid} /T /F`);
      } else {
        frontendProcess.kill();
      }
    } catch (e) {}
  }
}

app.whenReady().then(async () => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  cleanup();
});

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
