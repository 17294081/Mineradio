/**
 * Mineradio — Platform-Specific Chromium Switches
 *
 * Provides GPU and performance switches that vary between Windows and macOS.
 * Windows retains use-angle: d3d11; macOS omits it.
 *
 * @module platform/chromium-switches
 */

const { PLATFORM } = require('./index');

const BASE_SWITCHES = [
  ['autoplay-policy', 'no-user-gesture-required'],
  ['ignore-gpu-blocklist'],
  ['enable-gpu-rasterization'],
  ['enable-oop-rasterization'],
  ['enable-zero-copy'],
  ['enable-accelerated-2d-canvas'],
  ['disable-background-timer-throttling'],
  ['disable-renderer-backgrounding'],
  ['disable-backgrounding-occluded-windows'],
  ['force_high_performance_gpu'],
];

const WINDOWS_SWITCHES = [
  ['use-angle', 'd3d11'],
];

function getSwitches() {
  const switches = [...BASE_SWITCHES];
  if (PLATFORM.isWin) {
    switches.push(...WINDOWS_SWITCHES);
  }
  return switches;
}

function apply(app) {
  const switches = getSwitches();
  for (const [name, value] of switches) {
    if (value == null) app.commandLine.appendSwitch(name);
    else app.commandLine.appendSwitch(name, value);
  }
}

module.exports = {
  getSwitches,
  apply,
  BASE_SWITCHES,
  WINDOWS_SWITCHES,
};
