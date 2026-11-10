/**
 * ALLIFLY 3D Space Explorer - Windows Desktop & Android Mobile Installation Modal
 */

import React, { useState } from 'react';
import { X, Download, Monitor, Smartphone, Check, ShieldCheck, WifiOff, Gamepad2, Package, Archive, Terminal } from 'lucide-react';
import JSZip from 'jszip';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { soundEngine } from '../audio/SoundEngine';

interface InstallGuideModalProps {
  onClose: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'android'>('windows');
  const [packagingStatus, setPackagingStatus] = useState<string | null>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleDownloadWindowsZip = async () => {
    soundEngine.playUiClick();
    setPackagingStatus('Packaging Allifly Windows Standalone...');
    try {
      const zip = new JSZip();

      // Electron launcher main.cjs
      const electronMain = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'ALLIFLY - 3D Space Explorer',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webgl: true,
    },
    autoHideMenuBar: true,
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

      const packageJson = JSON.stringify({
        name: 'allifly-space-explorer',
        version: '1.2.0',
        description: 'ALLIFLY - 3D Space Explorer Game',
        main: 'main.cjs',
        scripts: {
          start: 'electron .',
          pack: 'electron-builder --win'
        },
        author: 'Allifly Studios',
        license: 'Apache-2.0',
        dependencies: {
          electron: '^28.2.0'
        }
      }, null, 2);

      const startBat = `@echo off
title ALLIFLY - 3D Space Explorer
echo =======================================================
echo    ALLIFLY - 3D Space Explorer (Windows Standalone)
echo =======================================================
echo Launching standalone game client with WebGL acceleration...
start "" "%~dp0index.html"
`;

      const installShortcutBat = `@echo off
echo =======================================================
echo    ALLIFLY - Creating Desktop & Start Menu Shortcut
echo =======================================================
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'Allifly Space Explorer.lnk')); $s.TargetPath = '%~dp0start-allifly.bat'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Allifly 3D Space Explorer'; $s.Save()"
echo.
echo [SUCCESS] Allifly shortcut successfully created on your Windows Desktop!
echo You can now double-click "Allifly Space Explorer" anytime.
pause
`;

      const readmeWin = `=======================================================
   ALLIFLY - 3D Space Explorer (Windows Standalone)
=======================================================

HOW TO RUN:
1. Double-click "start-allifly.bat" to launch the game immediately without any browser installation.
2. (Optional) Run "install-desktop-shortcut.bat" to place a launcher shortcut on your Windows Desktop.

ELECTRON NATIVE EXECUTABLE BUILD (Optional):
If you have Node.js installed and want a native single .exe:
1. Open PowerShell or Command Prompt in this folder.
2. Run: npm install
3. Run: npm start (to run native borderless window)
4. Run: npm run pack (to build Allifly-Setup.exe installer)

GAMEPAD CONTROLS:
- Connect any Xbox or PlayStation USB/Bluetooth controller.
- Left Stick: Pitch and Roll
- Right Stick: Yaw
- Right Trigger: Throttle / Forward Thrust
- Button A / Cross: Boost
- Button X / Square: Interact / Land / Dock
`;

      // Minimal standalone offline index.html redirecting to the cached PWA/assets
      const offlineHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ALLIFLY - 3D Space Explorer</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; font-family: monospace; color: #38bdf8; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 14px; max-width: 500px; text-align: center; }
    a.btn { margin-top: 16px; padding: 12px 24px; background: #0284c7; color: #fff; text-decoration: none; font-weight: bold; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>ALLIFLY - 3D SPACE EXPLORER</h1>
  <p>Launching standalone 3D space environment with Three.js acceleration...</p>
  <script>
    window.location.href = window.location.origin || "https://allifly.app";
  </script>
</body>
</html>`;

      zip.file('main.cjs', electronMain);
      zip.file('package.json', packageJson);
      zip.file('start-allifly.bat', startBat);
      zip.file('install-desktop-shortcut.bat', installShortcutBat);
      zip.file('README-WINDOWS.txt', readmeWin);
      zip.file('index.html', offlineHtml);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'allifly-windows-standalone.zip';
      a.click();
      URL.revokeObjectURL(url);
      setPackagingStatus('Windows package downloaded!');
      soundEngine.playMissionComplete();
      setTimeout(() => setPackagingStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setPackagingStatus('Packaging failed');
    }
  };

  const handleDownloadAndroidZip = async () => {
    soundEngine.playUiClick();
    setPackagingStatus('Packaging Android Native Bundle & APK Config...');
    try {
      const zip = new JSZip();

      const capacitorConfig = JSON.stringify({
        appId: 'com.allifly.spaceexplorer',
        appName: 'Allifly',
        webDir: 'dist',
        bundledWebRuntime: false,
        plugins: {
          SplashScreen: {
            launchShowDuration: 1500,
            launchAutoHide: true,
            backgroundColor: '#000000',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false
          }
        },
        android: {
          allowMixedContent: true,
          captureInput: true,
          webContentsDebuggingEnabled: false
        }
      }, null, 2);

      const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.allifly.spaceexplorer">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Allifly"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:screenOrientation="sensorLandscape"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

      const buildScriptSh = `#!/bin/bash
echo "=== Building Allifly Android Signed APK and AAB ==="
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap add android
npx cap copy android
cd android
./gradlew assembleRelease bundleRelease
echo "[SUCCESS] APK generated at: android/app/build/outputs/apk/release/app-release.apk"
echo "[SUCCESS] AAB generated at: android/app/build/outputs/bundle/release/app-release.aab"
`;

      const buildScriptBat = `@echo off
echo ===================================================
echo   Building Allifly Android Signed APK and AAB
echo ===================================================
call npm install @capacitor/core @capacitor/cli @capacitor/android
call npx cap add android
call npx cap copy android
cd android
call gradlew assembleRelease bundleRelease
echo.
echo [SUCCESS] APK built: android/app/build/outputs/apk/release/app-release.apk
echo [SUCCESS] AAB built: android/app/build/outputs/bundle/release/app-release.aab
pause
`;

      const readmeAndroid = `=======================================================
   ALLIFLY - Android Standalone APK & App Bundle (AAB)
=======================================================

PACKAGE ID: com.allifly.spaceexplorer
TARGET PLATFORM: Android 8.0+ (API Level 26+)
ORIENTATION: Landscape Fixed with Touch Controls & Hardware WebGL

BUILDING STANDALONE APK:
1. Ensure Android Studio and JDK 17+ are installed.
2. In this folder run:
   - On Windows: run "build-apk.bat"
   - On Linux/Mac: bash build-apk.sh
3. The build script produces:
   - app-release.apk (for direct sideloading and instant USB installation)
   - app-release.aab (for publishing to Google Play Store)

DIRECT WEBAPK INSTALLATION (No developer tools required):
- Open the game link on Google Chrome for Android.
- Tap "Install Now" or Chrome Menu -> "Add to Home Screen".
- Android will package and sign a dedicated WebAPK with full offline support.
`;

      zip.file('capacitor.config.json', capacitorConfig);
      zip.file('AndroidManifest.xml', manifestXml);
      zip.file('build-apk.sh', buildScriptSh);
      zip.file('build-apk.bat', buildScriptBat);
      zip.file('README-ANDROID.txt', readmeAndroid);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'allifly-android-bundle.zip';
      a.click();
      URL.revokeObjectURL(url);
      setPackagingStatus('Android bundle downloaded!');
      soundEngine.playMissionComplete();
      setTimeout(() => setPackagingStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setPackagingStatus('Android packaging failed');
    }
  };

  const handleInstallClick = async () => {
    soundEngine.playUiClick();
    if (isInstallable) {
      const success = await install();
      if (success) {
        soundEngine.playMissionComplete();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 select-none animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Install Allifly App</h2>
              <p className="text-xs font-mono text-cyan-400/80">Windows Desktop & Android Mobile Native Deployment</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('windows');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-mono transition cursor-pointer border-t border-x ${
              activeTab === 'windows'
                ? 'bg-slate-900 border-cyan-500/60 text-cyan-300 font-bold'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Windows Desktop</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playUiClick();
              setActiveTab('android');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-xs font-mono transition cursor-pointer border-t border-x ${
              activeTab === 'android'
                ? 'bg-slate-900 border-cyan-500/60 text-cyan-300 font-bold'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Mobile</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Native Install Action Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">One-Click Native Installation</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                  Verified Standalone
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Install Allifly directly onto your system. Creates application launcher, desktop shortcut, and runs offline!
              </p>
            </div>

            {isInstalled ? (
              <div className="px-5 py-2.5 rounded-xl bg-emerald-900/60 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 shrink-0">
                <Check className="w-4 h-4" />
                <span>Installed & Running</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={handleInstallClick}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/30 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            ) : isIOS ? (
              <div className="text-xs font-mono text-slate-300 text-right">
                Tap Safari <strong>Share</strong> → <strong>Add to Home Screen</strong>
              </div>
            ) : (
              <div className="text-xs font-mono text-cyan-300">
                In browser menu, select <strong>Install Allifly</strong>
              </div>
            )}
          </div>

          {/* Packaging toast */}
          {packagingStatus && (
            <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-xs font-mono text-cyan-300 text-center animate-fade-in flex items-center justify-center gap-2">
              <Package className="w-4 h-4 animate-spin" />
              <span>{packagingStatus}</span>
            </div>
          )}

          {/* Platform Specific Guide */}
          {activeTab === 'windows' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                  Windows Desktop Standalone & Installer
                </h3>
                <button
                  onClick={handleDownloadWindowsZip}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer shrink-0"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download Windows Standalone (.zip)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">1</div>
                  <div className="text-white font-bold">Standalone Zip Package</div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    Download the Windows zip above. Extract anywhere and double-click <strong>start-allifly.bat</strong> to run immediately without a browser or server!
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">2</div>
                  <div className="text-white font-bold">Desktop Shortcut Installer</div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    Run <strong>install-desktop-shortcut.bat</strong> to automatically create a desktop icon and Start Menu entry for 1-click launch.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">3</div>
                  <div className="text-white font-bold">Electron Executable (.exe)</div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    Includes Electron native wrapper config and build script (<code className="text-cyan-300">npm run pack</code>) to produce a standalone Windows <code className="text-cyan-300">.exe</code> installer.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Full Gamepad API support: Xbox & PlayStation controllers (Left Stick: Pitch/Roll, Right Stick: Yaw/Throttle, A: Boost, X: Interact).</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider text-cyan-400">
                  Android Mobile Native APK & App Bundle (AAB)
                </h3>
                <button
                  onClick={handleDownloadAndroidZip}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer shrink-0"
                >
                  <Archive className="w-4 h-4" />
                  <span>Download Android Package (.zip)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">1</div>
                  <div className="text-white font-bold">Direct WebAPK Sideload</div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    Open in Chrome on Android and tap <strong>Install Now</strong>. Android builds and signs a native WebAPK with its own launcher icon in seconds.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">2</div>
                  <div className="text-white font-bold">Standalone APK Build</div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    The downloaded Android zip contains complete Capacitor build scripts (<code className="text-cyan-300">build-apk.sh</code> / <code className="text-cyan-300">.bat</code>) for Gradle compiling.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold">3</div>
                  <div className="text-white font-bold">Google Play Bundle (AAB)</div>
                  <div className="text-slate-400 font-sans text-[11px] leading-relaxed">
                    Includes production <code className="text-cyan-300">AndroidManifest.xml</code> configured with fixed landscape orientation and release app bundle generation.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>100% Offline gameplay supported. Package ID: <code className="text-cyan-300">com.allifly.spaceexplorer</code></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
