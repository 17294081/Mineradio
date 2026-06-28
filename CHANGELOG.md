# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-29

### Added
- **macOS Support** — Full macOS port with native DMG and ZIP distribution
  - Dual-architecture builds: `x64` (Intel) and `arm64` (Apple Silicon)
  - Native macOS app menu with playback controls (`Cmd+Option+L` for lyrics)
  - Media key support: Play/Pause, Next, Previous
  - Platform-specific window configurations (`titleBarStyle: hidden`, `roundedCorners`, `visualEffectState`)
  - Wallpaper window uses `type: desktop` on macOS for desktop background integration
  - Desktop lyrics window uses `type: panel` with `moveToActiveSpace` behavior
- **Platform Abstraction Layer** (`platform/`)
  - `platform/index.js` — Runtime platform detection (`isWin`, `isMac`, `isLinux`)
  - `platform/paths.js` — Cross-platform path management (user data, cache, cookies, updates)
  - `platform/chromium-switches.js` — GPU and performance switches (platform-conditional)
  - `platform/shortcuts.js` — Desktop shortcut abstraction (Windows `.lnk`, no-op on macOS/Linux)
- **Window Factory Modules** (`desktop/windows/`)
  - `main-window.js` — Main BrowserWindow factory with macOS visual params
  - `lyrics-window.js` — Desktop lyrics overlay factory
  - `wallpaper-window.js` — Wallpaper background window factory
- **macOS Build & Distribution**
  - `build/mac/entitlements.plist` — Hardened Runtime entitlements
  - `build/mac/notarize.js` — Apple Notarization script (via `@electron/notarize`)
  - `build/icon.icns` — macOS application icon
  - GitHub Actions CI/CD: Windows (`windows-latest`) + macOS (`macos-latest`) dual-platform builds
- **Cross-Platform Hotkey Management** (`desktop/hotkeys.js`)
  - Extracted from `main.js` into reusable module
  - macOS default binding: `Cmd+Option+L` for desktop lyrics toggle

### Changed
- **Path system fully migrated** — All hardcoded Windows paths (`D:\MineradioCache\beatmaps`, `D:\MineradioUpdate`) replaced with cross-platform paths:
  - Windows: `%APPDATA%\Mineradio\` / `%LOCALAPPDATA%\Mineradio\`
  - macOS: `~/Library/Application Support/Mineradio/` / `~/Library/Caches/Mineradio/`
  - Linux: `~/.config/Mineradio/` / `~/.cache/Mineradio/`
- **`server.js`** — `beatCacheRootInfo()` now conditionally checks C: drive only on Windows; non-Windows platforms bypass the drive-space check
- **`desktop/main.js`** refactored:
  - GPU switches delegated to `platform/chromium-switches.js`
  - Global hotkeys delegated to `desktop/hotkeys.js`
  - Window creation delegated to `desktop/windows/*.js` factories
  - Windows-only code (PowerShell mouse polling, `WorkerW` wallpaper attach, `AppUserModelId`) now conditionally executes only on `process.platform === 'win32'`
  - Menu setup via `desktop/menu.js` on macOS
- **`package.json`** — Added `build.mac` and `build.dmg` configurations, plus `build:mac` / `build:mac:dir` npm scripts
- **`package.json`** — Added `@electron/notarize` as devDependency

### Fixed
- Removed all platform-incompatible operations from non-Windows runtime paths

### Known Issues / Verification Pending
- `mpg123-decoder` — Verified to be pure JavaScript + WebAssembly (no native binaries), should work on macOS out of the box. Full runtime validation pending on actual macOS hardware.
- macOS wallpaper `type: desktop` stability — Needs testing on macOS 14+ with real user interaction
- macOS Tray icon (`build/tray-icon-macTemplate.png`) — Code implemented in `desktop/tray.js`, icon asset needs designer-provided template PNG

## [1.1.1] - 2024

### Added
- Pure install release with unified default visual profile
- 3D playlist shelf, lyrics layer, user profile, and background performance policies

### Changed
- Default visual parameters sourced from built-in "default test" user save

## [1.1.0] - 2024

### Added
- Wallpaper galaxy homepage background
- Emily / default playback visual mode
- Cinematic beat visual system
- Long podcast and DJ track visual mode
- Lyrics stage, custom lyrics, lyrics position and visual controls
- Custom album cover upload and crop
- 3D playlist shelf with queue browsing
- NetEase Cloud Music integration (account, search, playlists, podcasts)
- QQ Music integration (search, login state, audio source fallback)
- GitHub Releases update detection and download

### Changed
- Previous versions' install packages deprecated; users advised to perform clean install with v1.1.1
