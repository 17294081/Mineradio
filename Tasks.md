# Mineradio macOS 迁移任务拆分（Tech Lead）

> **生成时间**：2026-06-28  
> **Agent**: Tech Lead（任务拆分阶段）  
> **输入**: `Project_Analysis.md` + `Architecture.md`  
> **目标**：将架构设计拆分为独立、可测试、可 Review 的小任务  
> **原则**：每个任务代码修改量可控，有明确的验收标准

---

## 任务总览

| 编号 | 任务名称 | 优先级 | 工作量 | 前置依赖 |
|---|---|---|---|---|
| T01 | 创建 `platform/index.js` 平台检测模块 | P0 | 0.5h | 无 | ✅ **已完成** |
| T02 | 创建 `platform/paths.js` 跨平台路径管理 | P0 | 1h | T01 | ✅ **已完成** |
| T03 | 创建 `platform/chromium-switches.js` GPU 开关 | P0 | 0.5h | T01 |
| T04 | 创建 `platform/shortcuts.js` 快捷方式抽象 | P0 | 0.5h | T01 |
| T05 | 改造 `server.js` 路径 — Cookie/缓存/更新目录 | P0 | 2h | T02 |
| T06 | 改造 `desktop/main.js` 路径 — 引入 platform/paths | P0 | 1h | T02 |
| T07 | 新增 `package.json` macOS 构建配置 | P0 | 1h | 无 |
| T08 | 准备 `build/icon.icns` macOS 图标 | P0 | 0.5h | 无 |
| T09 | 提取 `desktop/windows/main-window.js` | P1 | 2h | T06 |
| T10 | 提取 `desktop/windows/lyrics-window.js` | P1 | 2h | T06 |
| T11 | 提取 `desktop/windows/wallpaper-window.js` | P1 | 2h | T06 |
| T12 | 创建 `desktop/menu.js` macOS 应用菜单 | P1 | 1.5h | 无 |
| T13 | 创建 `desktop/hotkeys.js` 跨平台热键管理 | P1 | 1.5h | 无 |
| T14 | 改造 `main.js` GPU 开关 — 引入 platform/chromium-switches | P1 | 1h | T03, T09~T11 |
| T15 | 移除 Windows 专属代码 — 快捷方式/AppUserModelId/PowerShell | P1 | 1h | T04, T09~T11 |
| T16 | 创建 `build/mac/entitlements.plist` | P2 | 0.5h | 无 |
| T17 | 创建 `build/mac/notarize.js` 公证脚本 | P2 | 1h | T16 |
| T18 | 验证 macOS 本地构建 `npm run build:mac:dir` | P2 | 1h | T07, T08, T16 |
| T19 | 配置 GitHub Actions 双平台 CI/CD | P2 | 2h | T17, T18 |
| T20 | 验证 `mpg123-decoder` macOS 二进制支持 | P3 | 0.5h | 无 |
| T21 | macOS 状态栏图标（Tray Icon） | P3 | 0.5h | 无 |
| T22 | macOS Dock 菜单 | P3 | 0.5h | 无 |
| T23 | 更新 README / CHANGELOG 构建文档 | P3 | 1h | T19 |

---

## P0 — 基础层任务（阻塞后续所有工作）

---

### T01: 创建 `platform/index.js` 平台检测模块

**目标**：创建平台抽象层的入口文件，提供统一的平台检测常量。

**涉及文件**：
- 新增：`platform/index.js`

**代码变更**：
```javascript
const os = require('os');

const platformName = os.platform();

const PLATFORM = {
  isWin: platformName === 'win32',
  isMac: platformName === 'darwin',
  isLinux: platformName === 'linux',
};

module.exports = {
  PLATFORM,
  platformName,
};
```

**预计工作量**：0.5 小时

**依赖任务**：无

**验收标准**：
- [ ] 文件创建成功
- [ ] `require('./platform')` 在任何平台都能正确返回 `{ isWin, isMac, isLinux }`
- [ ] 在 Windows 上 `isWin === true`，其他为 `false`
- [ ] 在 macOS 上 `isMac === true`，其他为 `false`
- [ ] 单元测试：手动运行 `node -e "console.log(require('./platform'))"` 验证输出

---

### T02: 创建 `platform/paths.js` 跨平台路径管理

**目标**：封装所有文件系统路径，消除 `server.js` 和 `main.js` 中的硬编码 Windows 路径。

**涉及文件**：
- 新增：`platform/paths.js`

**代码变更**：提供以下函数：
- `getBeatMapCacheDir()` — 节奏分析缓存目录
- `getCookieFile()` — 网易云 Cookie 文件路径
- `getQQCookieFile()` — QQ 音乐 Cookie 文件路径
- `getUpdateDownloadDir()` — 更新下载目录
- `getUpdatePatchBackupDir()` — 补丁备份目录
- `getUpdateWorkDir()` — 更新工作目录

**路径对照表**：

| 函数 | Windows 返回值 | macOS 返回值 |
|---|---|---|
| `getBeatMapCacheDir()` | `D:\\MineradioCache\\beatmaps` | `~/Library/Caches/Mineradio/beatmaps` |
| `getCookieFile()` | `<userData>\\.cookie` | `<userData>/.cookie` |
| `getQQCookieFile()` | `<userData>\\.qq-cookie` | `<userData>/.qq-cookie` |
| `getUpdateDownloadDir()` | `<userData>\\updates\\downloads` | `<userData>/updates/downloads` |
| `getUpdatePatchBackupDir()` | `<userData>\\updates\\backups\\patches` | `<userData>/updates/backups/patches` |
| `getUpdateWorkDir()` | `<userData>\\updates` | `<userData>/updates` |

**预计工作量**：1 小时

**依赖任务**：T01

**验收标准**：
- [ ] 所有函数在 Windows 上返回反斜杠路径，macOS/Linux 上返回斜杠路径
- [ ] 所有函数使用 `path.join()` 而非字符串拼接
- [ ] `getBeatMapCacheDir()` 在 Windows 上保持 `D:\\MineradioCache\\beatmaps` 以兼容旧版本
- [ ] 在 macOS 上路径以 `~/Library/Application Support/Mineradio/` 或 `~/Library/Caches/Mineradio/` 开头
- [ ] 提供测试脚本验证每个函数的返回值

---

### T03: 创建 `platform/chromium-switches.js` GPU 开关

**目标**：将 Windows 专属 Chromium GPU 开关抽象为按平台返回的配置。

**涉及文件**：
- 新增：`platform/chromium-switches.js`

**代码变更**：提供 `getChromiumSwitches()` 函数：

```javascript
// Windows 配置（保留现有）
const WIN_SWITCHES = [
  ['autoplay-policy', 'no-user-gesture-required'],
  ['ignore-gpu-blocklist', null],
  ['enable-gpu-rasterization', null],
  ['enable-oop-rasterization', null],
  ['enable-zero-copy', null],
  ['enable-accelerated-2d-canvas', null],
  ['disable-background-timer-throttling', null],
  ['disable-renderer-backgrounding', null],
  ['disable-backgrounding-occluded-windows', null],
  ['force_high_performance_gpu', null],
  ['use-angle', 'd3d11'],
];

// macOS 配置（新增）
const MAC_SWITCHES = [
  ['autoplay-policy', 'no-user-gesture-required'],
  ['ignore-gpu-blocklist', null],
  ['enable-gpu-rasterization', null],
  ['enable-oop-rasterization', null],
  ['enable-zero-copy', null],
  ['enable-accelerated-2d-canvas', null],
  ['disable-background-timer-throttling', null],
  ['disable-renderer-backgrounding', null],
  ['disable-backgrounding-occluded-windows', null],
  ['force_high_performance_gpu', null],
  // 注意：macOS 不使用 use-angle，Metal 是默认后端
];

function getChromiumSwitches() {
  const { isWin } = require('./index');
  return isWin ? WIN_SWITCHES : MAC_SWITCHES;
}
```

**预计工作量**：0.5 小时

**依赖任务**：T01

**验收标准**：
- [ ] Windows 返回的配置包含 `use-angle: d3d11`
- [ ] macOS 返回的配置不包含 `use-angle`
- [ ] 通用开关（如 `autoplay-policy`、`ignore-gpu-blocklist`）双平台一致
- [ ] 函数返回格式便于 `app.commandLine.appendSwitch()` 批量调用
- [ ] 提供测试脚本验证双平台返回值

---

### T04: 创建 `platform/shortcuts.js` 桌面快捷方式抽象

**目标**：将 Windows 桌面快捷方式功能抽象，macOS 上返回"不支持"。

**涉及文件**：
- 新增：`platform/shortcuts.js`

**代码变更**：提供以下函数：
- `shouldCreateDesktopShortcut()` — 是否应创建桌面快捷方式
- `createDesktopShortcut(exePath)` — 创建桌面快捷方式
- `readDesktopShortcut()` — 读取桌面快捷方式

**预计工作量**：0.5 小时

**依赖任务**：T01

**验收标准**：
- [ ] Windows 上 `shouldCreateDesktopShortcut()` 返回 `true`
- [ ] macOS 上 `shouldCreateDesktopShortcut()` 返回 `false`
- [ ] Windows 上 `createDesktopShortcut()` 调用 `shell.writeShortcutLink`
- [ ] macOS 上 `createDesktopShortcut()` 返回 `{ ok: false, skipped: true, reason: 'PLATFORM_NOT_SUPPORTED' }`
- [ ] 不破坏现有 Windows 快捷方式创建逻辑

---

### T05: 改造 `server.js` 路径 — Cookie/缓存/更新目录

**目标**：将 `server.js` 中所有硬编码 Windows 路径替换为 `platform/paths.js` 调用。

**涉及文件**：
- 修改：`server.js`
- 读取：`platform/paths.js`（T02 产出）

**需要修改的代码点**：
1. `BEATMAP_CACHE_DIR = 'D:\\MineradioCache\\beatmaps'` → `getBeatMapCacheDir()`
2. `.cookie` 文件路径 → `getCookieFile()`
3. `.qq-cookie` 文件路径 → `getQQCookieFile()`
4. 更新下载目录 → `getUpdateDownloadDir()`
5. 补丁备份目录 → `getUpdatePatchBackupDir()`
6. 更新工作目录 → `getUpdateWorkDir()`

**预计工作量**：2 小时

**依赖任务**：T02

**验收标准**：
- [ ] `server.js` 中不再出现任何硬编码的 `D:\\` 路径
- [ ] `server.js` 中不再出现任何字符串拼接的 `\\.cookie` 或 `\\qq-cookie`
- [ ] Windows 上运行 `npm start`，Cookie 文件仍写入到原有位置（向后兼容）
- [ ] macOS 上运行 `npm start`，Cookie 文件写入到 `~/Library/Application Support/Mineradio/`
- [ ] 节奏缓存目录在 macOS 上创建在 `~/Library/Caches/Mineradio/beatmaps`
- [ ] 所有涉及文件 IO 的 API 路由在 macOS 上正常工作

---

### T06: 改造 `desktop/main.js` 路径 — 引入 platform/paths

**目标**：将 `main.js` 中涉及文件路径的代码替换为 `platform/paths.js` 调用。

**涉及文件**：
- 修改：`desktop/main.js`
- 读取：`platform/paths.js`（T02 产出）

**需要修改的代码点**：
1. `COOKIE_FILE` 环境变量或默认值
2. `QQ_COOKIE_FILE` 环境变量或默认值
3. `UPDATE_DOWNLOAD_DIR` 环境变量或默认值
4. `UPDATE_PATCH_BACKUP_DIR` 环境变量或默认值

**预计工作量**：1 小时

**依赖任务**：T02

**验收标准**：
- [ ] `main.js` 中不再出现任何硬编码的 Windows 路径
- [ ] Windows 上 Electron 启动正常，所有路径行为不变
- [ ] macOS 上 Electron 启动正常，路径指向正确位置
- [ ] 登录窗口（网易云/QQ）在 macOS 上正常创建 Session 分区

---

### T07: 新增 `package.json` macOS 构建配置

**目标**：在 `package.json` 中添加 macOS 构建配置和构建脚本。

**涉及文件**：
- 修改：`package.json`

**代码变更**：
```json
{
  "scripts": {
    "build:mac": "electron-builder --mac dmg zip",
    "build:mac:dir": "electron-builder --mac dir"
  },
  "build": {
    "mac": {
      "category": "public.app-category.music",
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] }
      ],
      "icon": "build/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/mac/entitlements.plist",
      "entitlementsInherit": "build/mac/entitlements.plist"
    },
    "dmg": {
      "title": "Mineradio",
      "artifactName": "Mineradio-${version}.dmg",
      "contents": [
        { "x": 130, "y": 220 },
        { "x": 410, "y": 220, "type": "link", "path": "/Applications" },
        { "type": "file", "x": 130, "y": 220 }
      ]
    }
  }
}
```

**预计工作量**：1 小时

**依赖任务**：无

**验收标准**：
- [ ] `package.json` 中包含 `build.mac` 配置
- [ ] `package.json` 中包含 `build.dmg` 配置
- [ ] `scripts` 中包含 `build:mac` 和 `build:mac:dir`
- [ ] 现有 `build.win` 和 `build.nsis` 配置未被删除或破坏
- [ ] Windows 构建 `npm run build:win` 仍能正常工作

---

### T08: 准备 `build/icon.icns` macOS 图标

**目标**：生成 macOS 应用所需的 `.icns` 图标文件。

**涉及文件**：
- 新增：`build/icon.icns`
- 读取：`build/icon.png` 或 `build/icon.ico`

**操作步骤**：
1. 从 `build/icon.png`（1024x1024 最佳）或 `build/icon.ico` 提取源图
2. 使用 `iconutil` 或 `sips` 命令生成 `.icns`：
   ```bash
   mkdir icon.iconset
   sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
   sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
   sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
   sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
   sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
   sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
   sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
   sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
   sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
   sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
   iconutil -c icns icon.iconset -o build/icon.icns
   rm -rf icon.iconset
   ```

**预计工作量**：0.5 小时

**依赖任务**：无

**验收标准**：
- [ ] `build/icon.icns` 文件存在且大小大于 0
- [ ] 图标包含 16x16、32x32、128x128、256x256、512x512 及 @2x 版本
- [ ] 使用 `file build/icon.icns` 验证格式正确
- [ ] 图标视觉内容与 Windows 版本一致

---

## P1 — 核心功能适配任务

---

### T09: 提取 `desktop/windows/main-window.js`

**目标**：将主窗口（mainWindow）的创建逻辑从 `main.js` 提取到独立模块。

**涉及文件**：
- 新增：`desktop/windows/main-window.js`
- 修改：`desktop/main.js`

**提取内容**：
- `createMainWindow()` 函数（或 `main.js` 中的窗口创建代码块）
- 窗口参数配置（`width`、`height`、`frame`、`transparent` 等）
- 平台化参数：macOS 上添加 `titleBarStyle: 'hidden'`、`visualEffectState: 'active'`

**窗口参数对照**：

| 参数 | Windows | macOS |
|---|---|---|
| `frame` | `false` | `false` |
| `transparent` | `true` | `true` |
| `titleBarStyle` | 无 | `'hidden'` |
| `visualEffectState` | 无 | `'active'` |
| `roundedCorners` | 无 | `true` |

**预计工作量**：2 小时

**依赖任务**：T06

**验收标准**：
- [ ] `desktop/windows/main-window.js` 文件创建成功
- [ ] `main.js` 中通过 `require('./windows/main-window')` 调用创建窗口
- [ ] Windows 上主窗口外观和行为不变
- [ ] macOS 上主窗口正常显示，无边框，透明背景正常
- [ ] macOS 上窗口关闭后 Dock 图标仍保留（符合 macOS 习惯）

---

### T10: 提取 `desktop/windows/lyrics-window.js`

**目标**：将桌面歌词窗口的创建逻辑从 `main.js` 提取到独立模块。

**涉及文件**：
- 新增：`desktop/windows/lyrics-window.js`
- 修改：`desktop/main.js`

**提取内容**：
- `createDesktopLyricsWindow()` 函数
- 窗口参数配置（`transparent`、`alwaysOnTop`、`hasShadow` 等）
- 平台化参数：macOS 上添加 `type: 'panel'`、`visualEffectState: 'active'`
- **移除** `startDesktopLyricsMousePoller`（PowerShell 中键检测）

**窗口参数对照**：

| 参数 | Windows | macOS |
|---|---|---|
| `frame` | `false` | `false` |
| `transparent` | `true` | `true` |
| `type` | 无 | `'panel'` |
| `hasShadow` | `false` | `false` |
| `visualEffectState` | 无 | `'active'` |
| `collectionBehavior` | 无 | `['moveToActiveSpace', 'transient']` |

**预计工作量**：2 小时

**依赖任务**：T06

**验收标准**：
- [ ] `desktop/windows/lyrics-window.js` 文件创建成功
- [ ] `main.js` 中通过 `require('./windows/lyrics-window')` 调用创建窗口
- [ ] Windows 上歌词窗口外观和行为不变
- [ ] macOS 上歌词窗口正常显示，透明、无边框、置顶
- [ ] macOS 上歌词窗口跟随桌面空间切换（Space）
- [ ] macOS 上不再使用 PowerShell 检测中键（改为全局热键或移除）

---

### T11: 提取 `desktop/windows/wallpaper-window.js`

**目标**：将壁纸窗口的创建逻辑从 `main.js` 提取到独立模块。

**涉及文件**：
- 新增：`desktop/windows/wallpaper-window.js`
- 修改：`desktop/main.js`

**提取内容**：
- `createWallpaperWindow()` 函数
- 窗口参数配置（`movable: false`、`resizable: false`、`ignoreMouseEvents: true` 等）
- 平台化参数：macOS 上使用 `type: 'desktop'`
- **移除** `attachWallpaperToWorkerW` 及所有 PowerShell/Win32 调用

**窗口参数对照**：

| 参数 | Windows | macOS |
|---|---|---|
| `frame` | `false` | `false` |
| `type` | 无 | `'desktop'` |
| `movable` | `false` | `false` |
| `resizable` | `false` | `false` |
| `ignoreMouseEvents` | `true` | `true` |
| `attachToWorkerW` | PowerShell + Win32 | 无（`type: 'desktop'` 自动处理） |

**预计工作量**：2 小时

**依赖任务**：T06

**验收标准**：
- [ ] `desktop/windows/wallpaper-window.js` 文件创建成功
- [ ] `main.js` 中通过 `require('./windows/wallpaper-window')` 调用创建窗口
- [ ] Windows 上壁纸窗口仍通过 WorkerW 嵌入桌面
- [ ] macOS 上壁纸窗口通过 `type: 'desktop'` 显示在桌面背景层
- [ ] macOS 上壁纸窗口不影响桌面图标点击
- [ ] 所有 PowerShell/Win32 调用已从壁纸逻辑中移除

---

### T12: 创建 `desktop/menu.js` macOS 应用菜单

**目标**：为 macOS 实现标准应用菜单栏。

**涉及文件**：
- 新增：`desktop/menu.js`
- 修改：`desktop/main.js`（macOS 上调用 `Menu.setApplicationMenu`）

**菜单结构**：
```
Mineradio
├── About Mineradio
├── Preferences... (Cmd+,)
├── ───────────────────
├── Services
├── ───────────────────
├── Hide Mineradio (Cmd+H)
├── Hide Others (Cmd+Option+H)
├── Show All
├── ───────────────────
├── Quit Mineradio (Cmd+Q)

Edit
├── Undo (Cmd+Z)
├── Redo (Cmd+Shift+Z)
├── ───────────────────
├── Cut (Cmd+X)
├── Copy (Cmd+C)
├── Paste (Cmd+V)
├── Select All (Cmd+A)

View
├── Reload (Cmd+R)
├── Toggle Full Screen (Ctrl+Cmd+F)
├── ───────────────────
├── Toggle Developer Tools (Cmd+Option+I) [开发环境]

Window
├── Minimize (Cmd+M)
├── Close (Cmd+W)
├── ───────────────────
├── Bring All to Front

Help
├── Mineradio Help
├── ───────────────────
├── Report an Issue
```

**预计工作量**：1.5 小时

**依赖任务**：无

**验收标准**：
- [ ] `desktop/menu.js` 文件创建成功
- [ ] macOS 上启动应用后，菜单栏显示标准菜单
- [ ] `Edit` 菜单支持输入框的复制/粘贴/全选
- [ ] `Window` 菜单支持最小化/关闭/前置窗口
- [ ] `View > Toggle Developer Tools` 仅在非打包环境显示
- [ ] Windows 上此文件无操作（不破坏现有行为）

---

### T13: 创建 `desktop/hotkeys.js` 跨平台热键管理

**目标**：将全局热键逻辑提取到独立模块，处理 macOS 热键差异。

**涉及文件**：
- 新增：`desktop/hotkeys.js`
- 修改：`desktop/main.js`

**需要提供的函数**：
- `normalizeAccelerator(accelerator)` — 将通用快捷键转换为平台特定格式（如 `Ctrl+Shift+M` → macOS 上 `Cmd+Shift+M`）
- `registerGlobalHotkeys(bindings)` — 批量注册热键
- `unregisterAllGlobalHotkeys()` — 注销所有热键
- `getDefaultHotkeys()` — 获取默认热键配置

**热键对照**：

| 功能 | Windows 热键 | macOS 热键 |
|---|---|---|
| 播放/暂停 | `MediaPlayPause` | `MediaPlayPause` |
| 下一首 | `MediaNextTrack` | `MediaNextTrack` |
| 上一首 | `MediaPreviousTrack` | `MediaPreviousTrack` |
| 歌词锁定 | 鼠标中键 | `Cmd+Option+L` |

**预计工作量**：1.5 小时

**依赖任务**：无

**验收标准**：
- [ ] `desktop/hotkeys.js` 文件创建成功
- [ ] Windows 上热键行为与改造前完全一致
- [ ] macOS 上 `MediaPlayPause`/`MediaNextTrack`/`MediaPreviousTrack` 正常工作
- [ ] macOS 上歌词锁定热键 `Cmd+Option+L` 可注册且不与其他系统热键冲突
- [ ] 热键注册失败时返回错误信息（与现有逻辑一致）

---

### T14: 改造 `main.js` GPU 开关 — 引入 platform/chromium-switches

**目标**：将 `main.js` 中的 Chromium 命令行开关替换为 `platform/chromium-switches.js` 调用。

**涉及文件**：
- 修改：`desktop/main.js`
- 读取：`platform/chromium-switches.js`（T03 产出）

**需要修改的代码点**：
- 所有 `app.commandLine.appendSwitch()` 调用
- 移除硬编码的开关列表

**预计工作量**：1 小时

**依赖任务**：T03, T09~T11

**验收标准**：
- [ ] `main.js` 中不再出现硬编码的 Chromium 开关列表
- [ ] Windows 上仍包含 `use-angle: d3d11` 开关
- [ ] macOS 上不包含 `use-angle` 开关
- [ ] 双平台都包含 `autoplay-policy: no-user-gesture-required`
- [ ] 应用启动后，通过 `app.commandLine.hasSwitch()` 验证开关已正确应用

---

### T15: 移除 Windows 专属代码 — 快捷方式/AppUserModelId/PowerShell

**目标**：清理 `main.js` 中的 Windows 专属代码，通过平台抽象层处理。

**涉及文件**：
- 修改：`desktop/main.js`

**需要移除/条件的代码点**：
1. `app.setAppUserModelId('com.mineradio.desktop')` → 仅在 Windows 上执行
2. `ensureDesktopShortcut()` → 使用 `platform/shortcuts.js`
3. `attachWallpaperToWorkerW()` → 已移至 `wallpaper-window.js`（T11）
4. `startDesktopLyricsMousePoller()` → 移除 PowerShell 调用
5. `nativeWindowHandleDecimal` → 移除（仅用于 PowerShell）
6. `powershell.exe` 所有调用 → 移除或条件化

**预计工作量**：1 小时

**依赖任务**：T04, T09~T11

**验收标准**：
- [ ] `main.js` 中不再出现 `powershell.exe` 字符串
- [ ] `main.js` 中不再出现 `nativeWindowHandleDecimal`
- [ ] Windows 上 `app.setAppUserModelId` 仍被调用
- [ ] macOS 上 `app.setAppUserModelId` 不被调用
- [ ] Windows 上桌面快捷方式功能仍正常工作
- [ ] macOS 上桌面快捷方式功能返回 `skipped`

---

## P2 — 构建与发布任务

---

### T16: 创建 `build/mac/entitlements.plist`

**目标**：创建 macOS 代码签名所需的权限配置文件。

**涉及文件**：
- 新增：`build/mac/entitlements.plist`

**内容**：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key>
  <true/>
</dict>
</plist>
```

**预计工作量**：0.5 小时

**依赖任务**：无

**验收标准**：
- [ ] `build/mac/entitlements.plist` 文件存在
- [ ] XML 格式正确，可通过 `plutil -lint` 验证
- [ ] 包含 JIT 和未签名可执行内存权限（Electron 需要）

---

### T17: 创建 `build/mac/notarize.js` 公证脚本

**目标**：创建 macOS 应用公证脚本。

**涉及文件**：
- 新增：`build/mac/notarize.js`

**代码变更**：使用 `@electron/notarize`：
```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.mineradio.desktop',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

**预计工作量**：1 小时

**依赖任务**：T16

**验收标准**：
- [ ] `build/mac/notarize.js` 文件创建成功
- [ ] 仅在 `electronPlatformName === 'darwin'` 时执行
- [ ] 正确读取环境变量 `APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID`
- [ ] 返回 Promise，可被 electron-builder 正确调用

---

### T18: 验证 macOS 本地构建 `npm run build:mac:dir`

**目标**：在 macOS 环境（或 CI）上验证构建流程。

**涉及文件**：
- 执行命令：`npm run build:mac:dir`
- 读取产物：`dist/mac-unpacked/Mineradio.app`

**预计工作量**：1 小时

**依赖任务**：T07, T08, T16

**验收标准**：
- [ ] `npm run build:mac:dir` 命令执行成功，无报错
- [ ] 生成 `dist/mac-unpacked/Mineradio.app`
- [ ] `.app` 包内包含完整的 Resources、Frameworks、MacOS 目录
- [ ] `Mineradio.app/Contents/MacOS/Mineradio` 可执行文件存在
- [ ] 双击 `.app` 能启动应用（未签名状态下会提示安全警告，这是正常的）
- [ ] 应用能正常加载 `index.html` 并显示主界面
- [ ] 应用能正常启动后端服务（`server.js`）

---

### T19: 配置 GitHub Actions 双平台 CI/CD

**目标**：配置自动构建工作流，同时构建 Windows 和 macOS 版本。

**涉及文件**：
- 新增/修改：`.github/workflows/build.yml`

**工作流设计**：
```yaml
name: Build
on:
  push:
    tags: ['v*']
jobs:
  build-win:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:win
      - uses: actions/upload-artifact@v4
        with: { name: win-installer, path: dist/*.exe }

  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build:mac
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
      - uses: actions/upload-artifact@v4
        with: { name: mac-dmg, path: dist/*.dmg }
```

**预计工作量**：2 小时

**依赖任务**：T17, T18

**验收标准**：
- [ ] `.github/workflows/build.yml` 文件创建成功
- [ ] 推送 tag 时自动触发构建
- [ ] Windows 构建正常输出 `.exe` 安装包
- [ ] macOS 构建正常输出 `.dmg` 和 `.zip`
- [ ] macOS 构建产物已签名（`codesign -dv --verbose=4 dist/mac/Mineradio.app` 验证）
- [ ] macOS 构建产物已通过公证（`spctl -a -t exec -vv dist/mac/Mineradio.app` 验证）
- [ ] 构建产物作为 artifact 上传成功

---

## P3 — 优化与完善任务

---

### T20: 验证 `mpg123-decoder` macOS 二进制支持

**目标**：确认 `mpg123-decoder` 依赖是否包含 macOS 预编译二进制。

**涉及文件**：
- 检查：`node_modules/mpg123-decoder/` 目录

**验证步骤**：
1. 运行 `npm install`
2. 检查 `node_modules/mpg123-decoder/` 下是否有 `darwin-x64` / `darwin-arm64` 目录
3. 如果没有，尝试在 macOS 上运行 `node dj-analyzer.js` 测试

**预计工作量**：0.5 小时

**依赖任务**：无

**验收标准**：
- [ ] 确认 `mpg123-decoder` 在 macOS arm64 上能正常加载
- [ ] 确认 `mpg123-decoder` 在 macOS x64 上能正常加载
- [ ] 运行 `node dj-analyzer.js` 不报错
- [ ] 如果缺失 macOS 二进制，记录到风险清单，制定替代方案

---

### T21: macOS 状态栏图标（Tray Icon）

**目标**：为 macOS 准备状态栏图标（如果当前图标不适配）。

**涉及文件**：
- 新增：`build/tray-icon-macTemplate.png`（16x16 @2x 黑白模板图）

**预计工作量**：0.5 小时

**依赖任务**：无

**验收标准**：
- [ ] macOS 状态栏图标显示为简洁的模板图（黑白，随系统深色/浅色模式自动切换）
- [ ] 图标尺寸正确（16x16pt，提供 @2x 版本）
- [ ] 图标文件名以 `Template` 结尾（macOS 系统约定）

---

### T22: macOS Dock 菜单

**目标**：为 Dock 图标添加上下文菜单。

**涉及文件**：
- 修改：`desktop/main.js` 或 `desktop/menu.js`

**菜单项**：
- 播放/暂停
- 下一首
- 上一首
- 显示歌词
- ────
- 退出

**预计工作量**：0.5 小时

**依赖任务**：无

**验收标准**：
- [ ] 右键 Dock 图标显示上下文菜单
- [ ] 菜单项点击能触发对应功能（通过 IPC）
- [ ] 播放状态变化时菜单项文字同步更新

---

### T23: 更新 README / CHANGELOG 构建文档

**目标**：更新项目文档，添加 macOS 构建和使用说明。

**涉及文件**：
- 修改：`README.md`
- 修改：`CHANGELOG.md`

**README 新增内容**：
- macOS 系统要求（macOS 10.15+）
- macOS 安装说明（下载 `.dmg`，拖拽到 Applications）
- macOS 构建命令（`npm run build:mac`）
- macOS 已知限制（如：无桌面快捷方式、中键锁定改为快捷键）

**CHANGELOG 新增内容**：
- v1.2.0（假设版本）新增 macOS 支持

**预计工作量**：1 小时

**依赖任务**：T19

**验收标准**：
- [ ] README 中包含 macOS 下载入口
- [ ] README 中包含 macOS 安装步骤
- [ ] CHANGELOG 中记录 macOS 支持
- [ ] 文档中注明 macOS 版本需要 macOS 10.15 或更高版本
- [ ] 文档中注明 Apple Silicon 和 Intel Mac 均支持

---

## 任务依赖图

```
T01 ───┬─── T02 ───┬─── T05
       │           │
       │           └─── T06 ───┬─── T09 ───┬─── T14
       │                       │           │
       ├─── T03 ───────────────┤           ├─── T10 ───┤
       │                       │           │           │
       └─── T04 ───────────────┤           ├─── T11 ───┤
                               │                       │
                               └─── T15 ───────────────┘

T07 ─── T18 ─── T19
T08 ────┘       ↑
T16 ─── T17 ────┘

T20, T21, T22, T23 为独立任务（P3），无前置依赖
```

---

## 工作量汇总

| 阶段 | 任务数 | 总工作量 | 说明 |
|---|---|---|---|
| P0 基础层 | 8 | ~7h | 路径抽象、构建配置、图标准备 |
| P1 核心适配 | 7 | ~12h | 窗口提取、菜单、热键、清理 |
| P2 构建发布 | 4 | ~4.5h | 签名公证、本地构建验证、CI/CD |
| P3 优化完善 | 4 | ~2.5h | 验证、文档 |
| **总计** | **23** | **~26h** | 不含测试和 Review 时间 |

---

## Review 检查清单

每个任务提交 Review 时，请确认：

- [ ] **代码变更量**：单个 PR 不超过 300 行（纯新增文件除外）
- [ ] **测试验证**：提供手动测试截图或日志
- [ ] **向后兼容**：Windows 功能未被破坏
- [ ] **文档更新**：如有接口变更，更新对应文档
- [ ] **ADR 遵循**：符合 `Architecture.md` 中的架构决策

---

> **本任务拆分由 Tech Lead Agent 生成。**  
> 后续 Developer Agent 应按优先级顺序领取任务，每个任务完成后在此文件对应任务前打 `[x]` 标记。
