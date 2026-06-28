/**
 * Mineradio — Wallpaper Window Factory
 *
 * @module desktop/windows/wallpaper-window
 */

const { BrowserWindow } = require('electron');
const { PLATFORM } = require('../../platform');

function createWallpaperWindow(options) {
  const {
    bounds,
    preloadPath,
    overlayUrl,
  } = options || {};

  const winOptions = {
    ...bounds,
    frame: false,
    transparent: false,
    backgroundColor: '#050608',
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: false,
    skipTaskbar: true,
    show: false,
    title: 'Mineradio Wallpaper',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  };

  if (PLATFORM.isMac) {
    winOptions.type = 'desktop';
    winOptions.movable = false;
    winOptions.minimizable = false;
    winOptions.closable = false;
  }

  const win = new BrowserWindow(winOptions);
  win.setIgnoreMouseEvents(true, { forward: true });

  return win;
}

module.exports = { createWallpaperWindow };
