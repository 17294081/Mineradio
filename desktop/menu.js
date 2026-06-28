/**
 * Mineradio — macOS Application Menu
 *
 * @module desktop/menu
 */

const { Menu, app } = require('electron');
const { PLATFORM } = require('../platform');

function buildAppMenu(handlers) {
  if (!PLATFORM.isMac) return null;

  const template = [
    {
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: '退出 Mineradio',
          accelerator: 'Command+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: '播放',
      submenu: [
        {
          label: '播放/暂停',
          accelerator: 'MediaPlayPause',
          click: () => handlers.playPause && handlers.playPause(),
        },
        {
          label: '上一首',
          accelerator: 'MediaPreviousTrack',
          click: () => handlers.prevTrack && handlers.prevTrack(),
        },
        {
          label: '下一首',
          accelerator: 'MediaNextTrack',
          click: () => handlers.nextTrack && handlers.nextTrack(),
        },
        { type: 'separator' },
        {
          label: '桌面歌词',
          accelerator: 'Cmd+Option+L',
          click: () => handlers.toggleLyrics && handlers.toggleLyrics(),
        },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '访问官网',
          click: () => require('electron').shell.openExternal('https://github.com/XxHuberrr/Mineradio'),
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}

function setAppMenu(handlers) {
  const menu = buildAppMenu(handlers);
  if (menu) Menu.setApplicationMenu(menu);
}

module.exports = { buildAppMenu, setAppMenu };
