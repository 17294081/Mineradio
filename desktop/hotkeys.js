/**
 * Mineradio — Cross-Platform Global Hotkey Management
 *
 * @module desktop/hotkeys
 */

const { globalShortcut } = require('electron');
const { PLATFORM } = require('../platform');

const registeredGlobalHotkeys = new Map();

function unregisterAll() {
  for (const accelerator of registeredGlobalHotkeys.keys()) {
    try { globalShortcut.unregister(accelerator); } catch (e) {}
  }
  registeredGlobalHotkeys.clear();
}

function configure(bindings = [], sendAction) {
  unregisterAll();
  const results = [];
  const seen = new Set();

  for (const item of Array.isArray(bindings) ? bindings : []) {
    const action = item && String(item.action || '').trim();
    const accelerator = item && String(item.accelerator || '').trim();
    if (!action || !accelerator || seen.has(accelerator)) continue;
    seen.add(accelerator);

    let registered = false;
    try {
      registered = globalShortcut.register(accelerator, () => {
        if (sendAction) sendAction(action);
      });
    } catch (error) {
      registered = false;
    }

    if (registered) {
      registeredGlobalHotkeys.set(accelerator, action);
      results.push({ action, accelerator, ok: true });
    } else {
      results.push({
        action,
        accelerator,
        ok: false,
        conflict: {
          sourceName: '系统 / 其他软件',
          sourceIcon: 'warning',
          reason: '该组合键已被占用或被系统保留',
        },
      });
    }
  }

  return { ok: true, results };
}

function getDefaultBindings() {
  const bindings = [
    { action: 'play-pause', accelerator: 'MediaPlayPause' },
    { action: 'next-track', accelerator: 'MediaNextTrack' },
    { action: 'prev-track', accelerator: 'MediaPreviousTrack' },
  ];

  if (PLATFORM.isMac) {
    bindings.push({ action: 'toggle-desktop-lyrics', accelerator: 'Cmd+Option+L' });
  }

  return bindings;
}

module.exports = {
  configure,
  unregisterAll,
  getDefaultBindings,
  registeredGlobalHotkeys,
};
