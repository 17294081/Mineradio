/**
 * Mineradio — Main Window Factory
 *
 * @module desktop/windows/main-window
 */

const { BrowserWindow, shell } = require('electron');
const { PLATFORM } = require('../../platform');

function createMainWindow(options) {
  const {
    bounds,
    preloadPath,
    iconPath,
    appName,
  } = options || {};

  const winOptions = {
    ...bounds,
    minWidth: 960,
    minHeight: 540,
    show: false,
    frame: false,
    fullscreen: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    autoHideMenuBar: true,
    title: appName || 'Mineradio',
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  };

  if (PLATFORM.isMac) {
    winOptions.titleBarStyle = 'hidden';
    winOptions.visualEffectState = 'active';
    winOptions.roundedCorners = true;
  }

  const win = new BrowserWindow(winOptions);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

module.exports = { createMainWindow };
