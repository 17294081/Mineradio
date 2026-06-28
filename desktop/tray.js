/**
 * Mineradio — macOS Tray / Dock Integration
 *
 * Provides:
 * - Tray icon with context menu (macOS only)
 * - Dock context menu (macOS only)
 * - Tray click to show/hide main window
 *
 * @module desktop/tray
 */

const { Tray, Menu } = require('electron');
const { PLATFORM } = require('../platform');

let tray = null;

function createTray({ iconPath, onShow, onQuit }) {
  if (!PLATFORM.isMac) return null;
  if (tray) return tray;

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 Mineradio',
      click: () => onShow && onShow(),
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => onQuit && onQuit(),
    },
  ]);

  tray.setToolTip('Mineradio');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    onShow && onShow();
  });

  return tray;
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, destroyTray };
