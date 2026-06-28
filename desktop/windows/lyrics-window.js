/**
 * Mineradio — Desktop Lyrics Window Factory
 *
 * @module desktop/windows/lyrics-window
 */

const { BrowserWindow } = require('electron');
const { PLATFORM } = require('../../platform');

function createLyricsWindow(options) {
  const {
    preloadPath,
    overlayUrl,
  } = options || {};

  const winOptions = {
    width: 920,
    height: 190,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: true,
    focusable: false,
    skipTaskbar: true,
    show: false,
    title: 'Mineradio Desktop Lyrics',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  };

  if (PLATFORM.isMac) {
    winOptions.type = 'panel';
    winOptions.collectionBehavior = ['moveToActiveSpace', 'transient'];
  }

  const win = new BrowserWindow(winOptions);

  try {
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (e) {
    console.warn('Desktop lyrics topmost setup skipped:', e.message);
  }

  return win;
}

module.exports = { createLyricsWindow };
