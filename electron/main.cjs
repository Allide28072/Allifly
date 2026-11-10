/**
 * ALLIFLY 3D Space Explorer - Native Desktop Wrapper (Electron)
 * Launches high-performance hardware WebGL accelerated standalone window.
 */

const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const win = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(950, height),
    minWidth: 1024,
    minHeight: 640,
    title: 'ALLIFLY - 3D Space Explorer',
    backgroundColor: '#000000',
    icon: path.join(__dirname, '../public/favicon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
      spellcheck: false,
    },
  });

  // Load production dist if built, or local dev server
  const distIndex = path.join(__dirname, '../dist/index.html');
  const fs = require('fs');

  if (fs.existsSync(distIndex)) {
    win.loadFile(distIndex);
  } else {
    win.loadURL('http://localhost:3000');
  }

  // F11 fullscreen toggle
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

// Enable WebGL hardware flags
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
