/**
 * Mineradio — macOS Notarization Script
 *
 * Used by electron-builder after signing.
 * Requires environment variables:
 *   APPLE_ID              - Apple Developer ID email
 *   APPLE_APP_SPECIFIC_PASSWORD - App-specific password
 *   APPLE_TEAM_ID         - Apple Developer Team ID
 *
 * @module build/mac/notarize
 */

const { notarize } = require('@electron/notarize');

async function notarizeMacApp(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword) {
    console.warn('[notarize] APPLE_ID or APPLE_APP_SPECIFIC_PASSWORD not set, skipping notarization');
    return;
  }

  console.log(`[notarize] Notarizing ${appPath}...`);

  await notarize({
    appPath,
    appleId,
    appleIdPassword,
    teamId,
  });

  console.log('[notarize] Notarization complete');
}

module.exports = notarizeMacApp;
