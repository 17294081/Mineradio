/**
 * Mineradio — Platform Detection Module
 *
 * Provides cross-platform constants for Windows / macOS / Linux.
 * All platform-specific branching should reference this module.
 *
 * @module platform/index
 */

const os = require('os');

const platformName = os.platform();

const PLATFORM = Object.freeze({
  isWin: platformName === 'win32',
  isMac: platformName === 'darwin',
  isLinux: platformName === 'linux',
});

module.exports = {
  PLATFORM,
  platformName,
};
