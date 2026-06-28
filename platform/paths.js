/**
 * Mineradio — Cross-Platform Path Management
 *
 * Replaces all hardcoded paths (e.g., D:\MineradioCache\beatmaps) and
 * string-concatenated paths with platform-aware path.join().
 *
 * @module platform/paths
 */

const path = require('path');
const { app } = require('electron');
const { PLATFORM } = require('./index');

let _app = null;

function setApp(electronApp) {
  _app = electronApp;
}

function getApp() {
  if (_app) return _app;
  try { return require('electron').app; } catch (_) {}
  return null;
}

function userData() {
  const a = getApp();
  return a ? a.getPath('userData') : '';
}

function getBeatMapCacheDir() {
  if (PLATFORM.isWin) {
    return 'D:\\MineradioCache\\beatmaps';
  }
  if (PLATFORM.isMac) {
    return path.join(require('os').homedir(), 'Library', 'Caches', 'Mineradio', 'beatmaps');
  }
  return path.join(require('os').homedir(), '.cache', 'mineradio', 'beatmaps');
}

function cookieFile() {
  return path.join(userData(), '.cookie');
}

function qqCookieFile() {
  return path.join(userData(), '.qq-cookie');
}

function updateWorkDir() {
  return path.join(userData(), 'updates');
}

function updateDownloadDir() {
  return path.join(updateWorkDir(), 'downloads');
}

function updatePatchBackupDir() {
  return path.join(updateWorkDir(), 'backups', 'patches');
}

function legacyQQCookieFile(projectRoot) {
  return path.join(projectRoot, '.qq-cookie');
}

function serverEntry(projectRoot) {
  return path.join(projectRoot, 'server.js');
}

function preloadScript(desktopDir) {
  return path.join(desktopDir, 'preload.js');
}

function overlayPreloadScript(desktopDir) {
  return path.join(desktopDir, 'overlay-preload.js');
}

function desktopLyricsHtml(port) {
  return `http://127.0.0.1:${port}/desktop-lyrics.html`;
}

function wallpaperHtml(port) {
  return `http://127.0.0.1:${port}/wallpaper.html`;
}

function buildIcon(projectRoot) {
  if (PLATFORM.isWin) {
    return path.join(projectRoot, 'build', 'icon.ico');
  }
  if (PLATFORM.isMac) {
    return path.join(projectRoot, 'build', 'icon.icns');
  }
  return path.join(projectRoot, 'build', 'icon.png');
}

function desktopShortcutPath() {
  const a = getApp();
  if (!a) return '';
  return path.join(a.getPath('desktop'), 'Mineradio.lnk');
}

function packageJson(projectRoot) {
  return path.join(projectRoot, 'package.json');
}

module.exports = {
  setApp,
  getApp,
  userData,
  getBeatMapCacheDir,
  cookieFile,
  qqCookieFile,
  updateWorkDir,
  updateDownloadDir,
  updatePatchBackupDir,
  legacyQQCookieFile,
  serverEntry,
  preloadScript,
  overlayPreloadScript,
  desktopLyricsHtml,
  wallpaperHtml,
  buildIcon,
  desktopShortcutPath,
  packageJson,
};
