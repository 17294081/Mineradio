/**
 * Mineradio — Desktop Shortcut Abstraction
 *
 * Windows: creates .lnk shortcuts via Electron shell API.
 * macOS: returns PLATFORM_NOT_SUPPORTED (Dock icon / Launchpad handles this).
 *
 * @module platform/shortcuts
 */

const { PLATFORM } = require('./index');

const PLATFORM_NOT_SUPPORTED = Object.freeze({
  ok: false,
  skipped: true,
  reason: 'PLATFORM_NOT_SUPPORTED',
});

function shouldEnsure({ env, isPackaged }) {
  if (!PLATFORM.isWin) return false;
  if (env && env.MINERADIO_NO_DESKTOP_SHORTCUT === '1') return false;
  return isPackaged || (env && env.MINERADIO_CREATE_DESKTOP_SHORTCUT === '1');
}

function create({ shell, fs, path, shortcutPath, target, iconPath, appUserModelId }) {
  if (!PLATFORM.isWin) return PLATFORM_NOT_SUPPORTED;

  try {
    const shortcut = {
      target,
      cwd: path.dirname(target),
      args: '',
      description: 'Mineradio desktop music player',
      icon: fs.existsSync(iconPath) ? iconPath : target,
      iconIndex: 0,
      appUserModelId: appUserModelId || 'com.mineradio.desktop',
    };

    if (fs.existsSync(shortcutPath) && shell.readShortcutLink) {
      try {
        const existing = shell.readShortcutLink(shortcutPath);
        if (existing && path.resolve(existing.target || '') === path.resolve(target) && String(existing.args || '') === '') {
          return { ok: true, path: shortcutPath, existing: true };
        }
      } catch (_) {}
      shell.writeShortcutLink(shortcutPath, 'replace', shortcut);
    } else {
      shell.writeShortcutLink(shortcutPath, 'create', shortcut);
    }
    return { ok: true, path: shortcutPath, created: true };
  } catch (e) {
    return { ok: false, error: e.message || 'DESKTOP_SHORTCUT_FAILED' };
  }
}

module.exports = {
  shouldEnsure,
  create,
  PLATFORM_NOT_SUPPORTED,
};
