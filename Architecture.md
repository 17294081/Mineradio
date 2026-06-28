# Mineradio macOS 架构设计文档（Software Architect）

> **生成时间**：2026-06-28  
> **Agent**: Software Architect（架构设计阶段）  
> **输入**: `Project_Analysis.md`（Project Manager 产出）  
> **目标**：将 Mineradio 从 Windows 独占迁移到 Windows + macOS 双平台  
> **约束**：不写代码，只输出架构设计。后续 Developer Agent 按此文档实施。

---

## 一、架构总览

### 1.1 核心设计原则

1. **前端零改动**：`public/` 下的所有 Web 前端（HTML/CSS/JS/Three.js/GSAP）完全复用，不做任何修改。
2. **后端逻辑复用**：`server.js` 和 `dj-analyzer.js` 的业务逻辑完全复用，仅做路径抽象。
3. **主进程平台化**：`desktop/main.js` 引入**平台抽象层**，将 Windows 专属行为与跨平台逻辑分离。
4. **构建双轨并行**：Windows（NSIS）和 macOS（dmg/zip）两条构建线独立配置，互不干扰。
5. **最小改动优先**：能不拆分的就不拆分，能条件化的就不重写，优先降低回归风险。

### 1.2 平台架构对比

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Mineradio 双平台架构                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────┐        ┌─────────────────────────┐            │
│   │      Windows 构建线      │        │       macOS 构建线       │            │
│   │  ┌─────────────────┐   │        │   ┌─────────────────┐   │            │
│   │  │  electron-builder│   │        │   │  electron-builder│   │            │
│   │  │   target: nsis   │   │        │   │  target: dmg,zip │   │            │
│   │  └─────────────────┘   │        │   └─────────────────┘   │            │
│   │         │              │        │          │              │            │
│   │  ┌──────▼──────┐       │        │   ┌──────▼──────┐       │            │
│   │  │ after-pack  │       │        │   │  after-sign   │       │            │
│   │  │  rcedit.exe │       │        │   │   notarize    │       │            │
│   │  └─────────────┘       │        │   └─────────────┘       │            │
│   │         │              │        │          │              │            │
│   │  ┌──────▼──────┐       │        │   ┌──────▼──────┐       │            │
│   │  │ Mineradio-  │       │        │   │ Mineradio.  │       │            │
│   │  │ x.x.x-Setup │       │        │   │ app (zip)   │       │            │
│   │  │    .exe     │       │        │   │   Mineradio-│       │            │
│   │  └─────────────┘       │        │   │ x.x.x.dmg   │       │            │
│   └─────────────────────────┘        │   └─────────────┘       │            │
│                                        └─────────────────────────┘            │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        共享运行时（跨平台）                           │   │
│   │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌────────┐  │   │
│   │  │  public/    │   │  server.js  │   │dj-analyzer.js│   │platform│  │   │
│   │  │ index.html  │   │   (paths)   │   │   (audio)   │   │(抽象层)│  │   │
│   │  │ desktop-    │   │             │   │             │   │        │  │   │
│   │  │ lyrics.html │   │             │   │             │   │        │  │   │
│   │  │ wallpaper.  │   │             │   │             │   │        │  │   │
│   │  │ html        │   │             │   │             │   │        │  │   │
│   │  └─────────────┘   └─────────────┘   └─────────────┘   └────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      平台化主进程（desktop/）                         │   │
│   │  ┌─────────────────────────────────────────────────────────────┐   │   │
│   │  │  main.js — 主进程入口，按平台条件化分支：                      │   │   │
│   │  │   • Windows: 全局热键、桌面快捷方式、WorkerW 壁纸嵌入          │   │   │
│   │  │   • macOS:   应用菜单、Dock 行为、桌面壁纸窗口、热键适配        │   │   │
│   │  └─────────────────────────────────────────────────────────────┘   │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  ┌─────────────────────┐│   │
│   │  │preload.js│  │menu.js  │  │hotkeys.js   │  │ windows/             ││   │
│   │  │(共享)   │  │(macOS)  │  │(平台化)     │  │  • main-window.js    ││   │
│   │  │         │  │(新增)   │  │(新增)       │  │  • lyrics-window.js  ││   │
│   │  │         │  │         │  │             │  │  • wallpaper-window.js││   │
│   │  └─────────┘  └─────────┘  └─────────────┘  └─────────────────────┘│   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、模块分析：复用 vs 重写 vs 抽象 vs 新增 vs 删除

### 2.1 可直接复用（零改动）

| 模块 | 文件 | 复用理由 | 验证方式 |
|---|---|---|---|
| **主界面** | `public/index.html` | 纯 Web 技术（HTML/CSS/JS），Three.js/GSAP 均跨平台 | 在 macOS Electron 中直接加载验证 |
| **桌面歌词 UI** | `public/desktop-lyrics.html` | 纯 Web 技术，Canvas 2D 渲染 | 同上 |
| **壁纸渲染** | `public/wallpaper.html` | 纯 Web 技术，Canvas 2D 粒子 | 同上 |
| **前端库** | `public/vendor/*` | Three.js r128、GSAP 3.15、music-tempo 均支持 macOS Chromium | 官方文档确认 |
| **预加载脚本** | `desktop/preload.js`, `overlay-preload.js` | `contextBridge` 和 `ipcRenderer` 跨平台 | Electron API 跨平台 |
| **HTTP 服务逻辑** | `server.js` 中路由/业务逻辑 | Node.js 原生 `http` 模块跨平台 | 功能测试 |
| **音频分析** | `dj-analyzer.js` | 纯 JavaScript，算法无平台依赖 | 需验证 `mpg123-decoder` 的 macOS 二进制 |
| **第三方库** | `NeteaseCloudMusicApi` | 本身跨平台 Node.js 库 | 官方确认 |
| **用户存档** | `public/default-user-fx-archive.json` | 纯 JSON 数据 | 直接复用 |
| **IPC 通道定义** | `desktop/main.js` 中 `ipcMain.handle` 列表 | 业务逻辑跨平台，仅实现侧平台化 | 接口保持不变 |

### 2.2 需要平台抽象（条件化改造，不改业务逻辑）

| 模块 | 文件 | 平台差异点 | 抽象方案 |
|---|---|---|---|
| **路径管理** | `server.js` | Windows 硬编码 `D:\\MineradioCache\\beatmaps` | 引入 `platform/paths.js`，按 `process.platform` 返回不同路径 |
| **Cookie 路径** | `server.js` + `main.js` | 环境变量 `COOKIE_FILE` 指向 Windows 风格路径 | 统一使用 `app.getPath('userData')` + `path.join()` |
| **TLS CA 合并** | `server.js` | `tls.getCACertificates('system')` 在 macOS 上行为正常但来源不同 | 保留现有逻辑，macOS 上从 Keychain 获取（Node.js 18.13+ 自动支持） |
| **更新下载目录** | `server.js` + `main.js` | `getUpdateDownloadDir()` 使用 Windows 风格 | 统一使用 `app.getPath('userData')` |
| **GPU 性能开关** | `desktop/main.js` | `use-angle=d3d11` 等 Windows 专属 Chromium 开关 | 提取为 `platform/chromium-switches.js`，按平台返回不同开关数组 |
| **单实例锁** | `desktop/main.js` | `requestSingleInstanceLock()` 在 macOS 上行为正常，但 Dock 点击需额外处理 | 保留现有逻辑，macOS 上 `app.on('activate')` 已处理 |
| **应用退出** | `desktop/main.js` | `app.on('window-all-closed')` 在 Windows 上退出，在 macOS 上保持运行 | 已有条件判断 `process.platform !== 'darwin'` |
| **窗口图标** | `desktop/main.js` | `icon: APP_ICON_ICO`（Windows `.ico`） | 按平台选择 `.ico` / `.icns` / `.png` |
| **文件对话框** | `desktop/main.js` | `dialog.showSaveDialog` / `showOpenDialog` 跨平台 | 直接复用 |
| **外部链接** | `desktop/main.js` | `shell.openExternal` 跨平台 | 直接复用 |

### 2.3 必须重写

| 模块 | 原文件 | 重写原因 | 重写方案 |
|---|---|---|---|
| **构建配置** | `package.json` `build` | 只有 `win` 配置，无 `mac` | 新增 `build.mac` 配置（dmg + zip），保留 `build.win` |
| **打包后处理** | `build/after-pack.js` | 调用 `rcedit-x64.exe` 修改 Windows PE 文件 | 新增 `build/mac/after-sign.js`：调用 `electron-notarize` 进行公证 |
| **安装器** | `build/installer.nsh` | NSIS 是 Windows 独占安装器 | 废弃。macOS 使用 electron-builder 内置 dmg 生成（配置 `build.mac` 即可） |
| **应用菜单** | 无 | macOS 要求应用必须有标准菜单栏（`Menu`） | 新增 `desktop/menu.js`：使用 `Menu.buildFromTemplate` 创建标准 macOS 菜单（Mineradio / Edit / View / Window / Help） |
| **壁纸嵌入** | `desktop/main.js` `attachWallpaperToWorkerW` | 使用 PowerShell 调用 `user32.dll` 的 `FindWindow`/`SetParent` 将窗口嵌入 Windows 桌面背景层（WorkerW） | macOS 上无法嵌入桌面背景层。使用 `BrowserWindow` 的 `type: 'desktop'`（Electron 在 macOS 上创建 `kCGDesktopWindowLevel` 窗口），移除所有 PowerShell/Win32 调用 |
| **歌词中键检测** | `desktop/main.js` `startDesktopLyricsMousePoller` | 使用 PowerShell 调用 `GetAsyncKeyState` 检测全局中键点击 | macOS 没有全局鼠标按钮检测 API。改为使用 `globalShortcut` 注册一个 macOS 友好的快捷键（如 `Cmd+Option+L`）来切换歌词锁定状态 |
| **桌面快捷方式** | `desktop/main.js` `ensureDesktopShortcut` | 使用 `shell.writeShortcutLink` 创建 `.lnk` 文件 | macOS 没有"桌面快捷方式"概念。macOS 上 `.app` 本身可通过拖拽到 Dock 创建快捷方式。此功能在 macOS 上**完全废弃** |
| **更新安装** | `desktop/main.js` `mineradio-open-update-installer` + `server.js` 更新逻辑 | 下载并执行 `.exe` 安装包 | macOS 上更新机制完全重写：下载 `.zip` 或 `.dmg`，解压/挂载后替换 `.app` 包。建议使用 `electron-updater` 替代自定义逻辑 |
| **应用模型 ID** | `desktop/main.js` `app.setAppUserModelId` | Windows 专属 API（任务栏分组标识） | macOS 上不需要。`bundleId` 由 `build.mac.appId` 控制 |

### 2.4 需要新增

| 模块 | 文件 | 说明 |
|---|---|---|
| **平台抽象层** | `platform/index.js` | 平台检测常量 + 统一接口导出 |
| **跨平台路径** | `platform/paths.js` | 封装所有文件系统路径，按平台返回不同值 |
| **Chromium 开关** | `platform/chromium-switches.js` | 按平台返回 GPU/性能相关的 Chromium 命令行开关 |
| **macOS 应用菜单** | `desktop/menu.js` | `Menu.buildFromTemplate` 创建标准 macOS 菜单 |
| **跨平台热键** | `desktop/hotkeys.js` | 封装 `globalShortcut` 注册逻辑，处理平台差异（如 macOS 使用 `Cmd` 而非 `Ctrl`） |
| **窗口工厂** | `desktop/windows/main-window.js` | 主窗口创建逻辑提取，平台化窗口参数（macOS 需 `visualEffectState`/`vibrancy`） |
| **歌词窗口工厂** | `desktop/windows/lyrics-window.js` | 桌面歌词窗口创建逻辑提取，macOS 需 `type: 'panel'` 或 `type: 'toolbar'` + `visualEffectState` |
| **壁纸窗口工厂** | `desktop/windows/wallpaper-window.js` | 壁纸窗口创建逻辑提取，macOS 使用 `type: 'desktop'` |
| **macOS 图标** | `build/icon.icns` | macOS 应用图标（需从 `.png` 或 `.ico` 转换） |
| **沙盒权限** | `build/mac/entitlements.plist` | macOS 沙盒权限配置（如果需要上架 Mac App Store） |
| **公证脚本** | `build/mac/notarize.js` | 使用 `@electron/notarize` 或 `notarytool` 进行公证 |
| **CI 构建** | `.github/workflows/build.yml` | GitHub Actions 双平台自动构建（Windows + macOS） |

### 2.5 需要删除/废弃

| 模块 | 文件 | 说明 |
|---|---|---|
| **`rcedit` 依赖** | `package.json` devDependencies | macOS 不需要修改 PE 文件资源 |
| **`winCodeSign` 配置** | `package.json` `build.toolsets` | Windows 代码签名工具，macOS 不需要 |
| **NSIS 安装器资源** | `build/installerHeader.bmp`, `build/installerSidebar.bmp` | macOS 不使用 NSIS，这些资源对 macOS 构建无意义 |
| **PowerShell 脚本** | `desktop/main.js` 中的 PowerShell 调用 | 所有 `powershell.exe` 调用（WorkerW 嵌入、鼠标检测）在 macOS 上不可行 |
| **Win32 API 调用** | `desktop/main.js` 中的 `nativeWindowHandleDecimal` | 用于获取 HWND 传给 PowerShell，macOS 上无意义 |
| **Windows 专属 `.lnk` 逻辑** | `desktop/main.js` `shell.writeShortcutLink` / `shell.readShortcutLink` | macOS 无快捷方式文件 |

---

## 三、平台抽象层设计（Platform Abstraction Layer）

### 3.1 抽象层目标

将 Windows 和 macOS 的差异点集中在 `platform/` 目录下，**`desktop/main.js` 和 `server.js` 不再直接判断 `process.platform`，而是通过 `platform/` 模块获取平台化的行为**。

### 3.2 抽象层接口定义

```
platform/
├── index.js              # 平台常量 + 统一导出
├── paths.js              # 所有文件系统路径
├── chromium-switches.js  # Chromium 命令行开关
├── shortcuts.js          # 桌面快捷方式（Windows 实现 / macOS 空实现）
├── certificates.js       # TLS 证书管理（当前为透传，预留扩展）
└── README.md             # 抽象层设计说明
```

#### `platform/index.js` — 平台检测

- 导出 `PLATFORM` 常量：`{ isWin, isMac, isLinux }`
- 导出 `platformName`: `'win32'` / `'darwin'` / `'linux'`
- 作为所有平台模块的入口

#### `platform/paths.js` — 路径管理

**接口清单**：

| 函数 | Windows 返回值 | macOS 返回值 | 说明 |
|---|---|---|---|
| `getBeatMapCacheDir()` | `D:\\MineradioCache\\beatmaps`（保留兼容） | `~/Library/Caches/Mineradio/beatmaps` | 节奏分析缓存目录 |
| `getCookieFile()` | `app.getPath('userData')\\.cookie` | `~/Library/Application Support/Mineradio/.cookie` | 网易云 Cookie 文件 |
| `getQQCookieFile()` | `app.getPath('userData')\\.qq-cookie` | `~/Library/Application Support/Mineradio/.qq-cookie` | QQ 音乐 Cookie 文件 |
| `getUpdateDownloadDir()` | `app.getPath('userData')\\updates\\downloads` | `~/Library/Application Support/Mineradio/updates/downloads` | 更新下载目录 |
| `getUpdatePatchBackupDir()` | `app.getPath('userData')\\updates\\backups\\patches` | `~/Library/Application Support/Mineradio/updates/backups/patches` | 补丁备份目录 |
| `getUpdateWorkDir()` | `app.getPath('userData')\\updates` | `~/Library/Application Support/Mineradio/updates` | 更新工作目录 |

**设计原则**：
- 所有路径使用 `path.join()` 拼接，不使用字符串拼接
- macOS 上优先使用 `app.getPath('userData')`（等价于 `~/Library/Application Support/<appId>`）
- 保留 Windows 原有路径以维持向后兼容

#### `platform/chromium-switches.js` — GPU/性能开关

**Windows 配置**（保留现有）：
```
autoplay-policy: no-user-gesture-required
ignore-gpu-blocklist
enable-gpu-rasterization
enable-oop-rasterization
enable-zero-copy
enable-accelerated-2d-canvas
disable-background-timer-throttling
disable-renderer-backgrounding
disable-backgrounding-occluded-windows
force_high_performance_gpu
use-angle: d3d11
```

**macOS 配置**（新增）：
```
autoplay-policy: no-user-gesture-required
ignore-gpu-blocklist
enable-gpu-rasterization
enable-oop-rasterization
enable-zero-copy
enable-accelerated-2d-canvas
disable-background-timer-throttling
disable-renderer-backgrounding
disable-backgrounding-occluded-windows
// 注意：macOS 不使用 use-angle，Metal 是默认后端
// 可添加：enable-features=AcceleratedVideoDecodeMacOS
```

**关键差异**：
- macOS 移除 `use-angle=d3d11`（D3D11 是 Windows 专属）
- macOS 默认使用 Metal 后端，无需显式配置
- `force_high_performance_gpu` 在 macOS 上可用（强制使用独立 GPU），保留

#### `platform/shortcuts.js` — 桌面快捷方式

| 函数 | Windows 行为 | macOS 行为 |
|---|---|---|
| `shouldCreateDesktopShortcut()` | 返回 `true`（如果未设置环境变量禁用） | 返回 `false`（macOS 无此概念） |
| `createDesktopShortcut()` | 使用 `shell.writeShortcutLink` 创建 `.lnk` | 返回 `{ ok: false, skipped: true, reason: 'PLATFORM_NOT_SUPPORTED' }` |
| `readDesktopShortcut()` | 使用 `shell.readShortcutLink` 读取 `.lnk` | 返回 `{ ok: false, skipped: true }` |

### 3.3 主进程平台化设计

#### `desktop/main.js` 的改造策略

当前 `main.js` 约 1500 行，包含所有窗口创建、IPC 处理、平台逻辑。改造后结构：

```
desktop/
├── main.js                 # 主进程入口（生命周期、IPC 注册、事件监听）
│   # 精简为：app.ready、窗口管理、IPC 路由、生命周期事件
├── preload.js              # 共享（不变）
├── overlay-preload.js      # 共享（不变）
├── menu.js                 # 【新增】macOS 应用菜单（Windows 上为无操作）
├── hotkeys.js              # 【新增】跨平台热键管理
├── windows/
│   ├── main-window.js      # 【新增】主窗口创建（平台化参数）
│   ├── lyrics-window.js    # 【新增】桌面歌词窗口创建（平台化参数）
│   └── wallpaper-window.js # 【新增】壁纸窗口创建（平台化参数）
```

**主窗口平台差异**：

| 参数 | Windows | macOS |
|---|---|---|
| `frame` | `false` | `false`（保留） |
| `transparent` | `true` | `true`（保留） |
| `titleBarStyle` | 未设置 | `'hidden'` 或 `'hiddenInset'`（macOS 需要控制标题栏） |
| `visualEffectState` | 未设置 | `'active'`（确保透明窗口正确渲染） |
| `vibrancy` | 未设置 | 可选 `'under-window'` 或 `'appearance-based'`（如果启用毛玻璃效果） |
| `trafficLightPosition` | 未设置 | 可自定义交通灯位置（如果启用标题栏） |
| `roundedCorners` | 未设置 | `true`（macOS 默认圆角窗口） |

**桌面歌词窗口平台差异**：

| 参数 | Windows | macOS |
|---|---|---|
| `frame` | `false` | `false` |
| `transparent` | `true` | `true` |
| `type` | 未设置 | `'panel'` 或 `'toolbar'`（使窗口成为浮动面板） |
| `hasShadow` | `false` | `false` |
| `skipTaskbar` | `true` | `true` |
| `focusable` | `false` | `false` |
| `visualEffectState` | 未设置 | `'active'` |
| `level` | 未设置（`alwaysOnTop`） | `floating` + `alwaysOnTop`（macOS 窗口层级管理） |
| `collectionBehavior` | 未设置 | `['moveToActiveSpace', 'transient']`（确保歌词窗口跟随空间切换） |

**壁纸窗口平台差异**：

| 参数 | Windows | macOS |
|---|---|---|
| `frame` | `false` | `false` |
| `transparent` | `false` | `false`（或 `true`，取决于设计） |
| `type` | 未设置 | `'desktop'`（关键：创建 `kCGDesktopWindowLevel` 窗口） |
| `hasShadow` | `false` | `false` |
| `skipTaskbar` | `true` | `true` |
| `focusable` | `false` | `false` |
| `movable` | `false` | `false` |
| `resizable` | `false` | `false` |
| `ignoreMouseEvents` | `true` | `true` |
| `attachToWorkerW` | 有（PowerShell + Win32） | 无（`type: 'desktop'` 自动处理） |

### 3.4 macOS 应用菜单设计（`desktop/menu.js`）

macOS 要求应用必须有标准菜单栏。菜单结构：

```
Mineradio
├── About Mineradio
├── Preferences...          (Cmd+,) — 可映射到设置面板
├── ───────────────────
├── Services
├── ───────────────────
├── Hide Mineradio           (Cmd+H)
├── Hide Others              (Cmd+Option+H)
├── Show All
├── ───────────────────
├── Quit Mineradio           (Cmd+Q)

Edit
├── Undo                     (Cmd+Z)
├── Redo                     (Cmd+Shift+Z)
├── ───────────────────
├── Cut                      (Cmd+X)
├── Copy                     (Cmd+C)
├── Paste                    (Cmd+V)
├── Select All               (Cmd+A)

View
├── Reload                   (Cmd+R)
├── Toggle Full Screen       (Ctrl+Cmd+F)
├── ───────────────────
├── Toggle Developer Tools   (Cmd+Option+I)

Window
├── Minimize                 (Cmd+M)
├── Close                    (Cmd+W)
├── ───────────────────
├── Bring All to Front

Help
├── Mineradio Help
├── ───────────────────
├── Report an Issue
```

**设计说明**：
- `Edit` 菜单必须存在，否则 macOS 原生文本编辑（如输入框的复制/粘贴）无法使用
- `Window` 菜单必须存在，否则 macOS 窗口管理（如 Mission Control）行为异常
- `View` 菜单中的 `Toggle Developer Tools` 仅在开发环境显示（`!app.isPackaged`）
- `Preferences` 可以映射到前端设置面板，通过 IPC 触发

### 3.5 全局热键平台化设计（`desktop/hotkeys.js`）

当前 Windows 热键配置（从 `configureMineradioGlobalHotkeys` 推断）：
- 播放/暂停：`MediaPlayPause`
- 下一首：`MediaNextTrack`
- 上一首：`MediaPreviousTrack`
- 可能还有其他自定义热键（通过前端配置）

**macOS 适配策略**：

| 热键 | Windows | macOS | 状态 |
|---|---|---|---|
| `MediaPlayPause` | 支持 | 支持 | 直接复用 |
| `MediaNextTrack` | 支持 | 支持 | 直接复用 |
| `MediaPreviousTrack` | 支持 | 支持 | 直接复用 |
| 自定义组合键（如 `Ctrl+Shift+M`） | 支持 | 需改为 `Cmd+Shift+M` | 平台化处理 |
| 歌词中键点击 | PowerShell 全局鼠标检测 | 不可用 | **改为 `Cmd+Option+L` 全局热键** |

**平台化接口**：

```javascript
// hotkeys.js
function normalizeAccelerator(accelerator, platform) {
  // 将通用快捷键转换为平台特定格式
  // 例如：将 'Ctrl+' 前缀在 macOS 上替换为 'Cmd+'
}

function registerGlobalHotkeys(bindings) {
  // 绑定前先 normalizeAccelerator
  // 注册失败时返回冲突信息（与现有逻辑一致）
}

function unregisterAllGlobalHotkeys() {
  // 统一注销所有热键
}
```

---

## 四、模块关系（改造后）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Electron 主进程                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  main.js                                                            │    │
│  │  ├── 生命周期: app.whenReady, app.on('activate', 'window-all-closed')│    │
│  │  ├── IPC 路由: 注册所有 ipcMain.handle                              │    │
│  │  ├── 平台初始化: 加载 platform/, 应用 Chromium 开关                 │    │
│  │  ├── 菜单: 调用 menu.js (macOS 创建菜单, Windows 无操作)            │    │
│  │  ├── 热键: 调用 hotkeys.js 注册跨平台热键                            │    │
│  │  └── 窗口管理: 调用 windows/*.js 创建各窗口                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│  ┌───────────────────────────┼─────────────────────────────────────┐       │
│  │                           │                                     │       │
│  ▼                           ▼                                     ▼       │
│  ┌──────────┐          ┌──────────┐          ┌──────────────────┐        │
│  │ menu.js  │          │hotkeys.js│          │  windows/        │        │
│  │(macOS)   │          │(平台化)  │          │  • main-window   │        │
│  │ Menu API │          │globalShortcut│      │  • lyrics-window │        │
│  └──────────┘          └──────────┘          │  • wallpaper-win │        │
│                                              └──────────────────┘        │
│                                                     │                     │
│                              ┌──────────────────────┘                     │
│                              ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  platform/                                                          ││
│  │  ├── index.js — 平台常量                                             ││
│  │  ├── paths.js — 跨平台路径                                          ││
│  │  ├── chromium-switches.js — GPU 开关                                ││
│  │  └── shortcuts.js — 快捷方式（Windows 实现 / macOS 空实现）          ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  前端渲染层（public/ — 完全复用，零改动）                                    │
│  ├── index.html → 主窗口                                                  │
│  ├── desktop-lyrics.html → 桌面歌词窗口                                   │
│  └── wallpaper.html → 壁纸窗口                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  后端服务层（server.js + dj-analyzer.js — 逻辑复用，路径抽象）              │
│  ├── server.js                                                          │
│  │   └── 使用 platform/paths.js 获取跨平台路径                            │
│  │   └── 保留所有 API 路由、业务逻辑、更新机制                             │
│  └── dj-analyzer.js                                                     │
│      └── 纯算法，零改动                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 五、构建系统架构

### 5.1 `package.json` 构建配置改造

**新增 `build.mac` 配置**：

```json
{
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

**构建命令新增**：

```bash
# macOS 开发运行（与 Windows 共享 npm start）
npm start

# macOS 生产构建
npm run build:mac       # electron-builder --mac dmg zip
npm run build:mac:dir   # electron-builder --mac dir

# Windows 生产构建（保留原有）
npm run build:win       # electron-builder --win nsis
npm run build:win:dir   # electron-builder --win dir
```

### 5.2 签名与公证流程（macOS）

```
开发者机器/CI
│
├─ 1. 构建 .app
│   └─ electron-builder --mac dir
│
├─ 2. 代码签名
│   └─ electron-osx-sign
│       ├─ 使用 Apple Developer ID Application 证书
│       ├─ 签名所有二进制文件
│       └─ 注入 entitlements.plist
│
├─ 3. 公证（Notarization）
│   └─ @electron/notarize / notarytool
│       ├─ 提交 .app 到 Apple Notary Service
│       ├─ 等待 Apple 扫描（通常 1-5 分钟）
│       └─ 获取 notarization ticket
│
├─ 4. 装订（Staple）
│   └─ xcrun stapler staple Mineradio.app
│       └─ 将 notarization ticket 嵌入 .app
│
├─ 5. 打包 dmg
│   └─ electron-builder --mac dmg
│       └─ 将已签名+公证的 .app 打包为 .dmg
│
└─ 6. 发布
    └─ 上传 .dmg 和 .zip 到 GitHub Releases
```

**证书要求**：
- **Apple Developer ID Application** 证书（用于签名，非 MAS 上架证书）
- **Apple Developer ID Installer** 证书（可选，用于 .pkg 安装包）
- 如果不上架 Mac App Store，使用 Developer ID 证书即可
- 如果上架 MAS，需要额外配置 `provisioningProfile` 和 MAS 证书

**环境变量**（CI 或本地构建时设置）：
- `APPLE_ID` — Apple ID 邮箱
- `APPLE_APP_SPECIFIC_PASSWORD` — App-Specific Password
- `APPLE_TEAM_ID` — Apple Developer Team ID
- `CSC_LINK` / `CSC_KEY_PASSWORD` — 代码签名证书（可选，electron-builder 自动使用 Keychain 中的证书）

### 5.3 ASAR 策略决策

当前 `asar: false`（文件直接暴露，便于 Windows 快速补丁更新）。

**macOS 策略建议**：

| 方案 | 优点 | 缺点 | 建议 |
|---|---|---|---|
| **保持 `asar: false`** | 与 Windows 一致，补丁更新逻辑简单 | `.app` 体积略大（文件分散，无压缩） | **推荐**。双平台一致，降低维护复杂度 |
| **`asar: true` + `asarUnpack`** | 减小体积，加快启动 | 补丁更新需要处理 ASAR 解包，复杂度增加 | 不建议，除非体积是瓶颈 |
| **平台差异**：Win `false` / Mac `true` | 各平台最优 | 双平台维护成本增加，补丁逻辑分叉 | 不建议 |

**决策**：保持 `asar: false`（全平台一致）。

---

## 六、开发优先级（按依赖顺序排序）

### P0 — 阻塞后续所有工作的基础（必须先完成）

| 优先级 | 任务 | 说明 | 预估工作量 |
|---|---|---|---|
| P0-1 | **创建 `platform/` 抽象层** | `index.js` + `paths.js` + `chromium-switches.js` + `shortcuts.js` | 小 |
| P0-2 | **改造 `server.js` 路径** | 将所有硬编码 Windows 路径替换为 `platform/paths.js` 调用 | 中 |
| P0-3 | **改造 `desktop/main.js` 路径** | `COOKIE_FILE`、`QQ_COOKIE_FILE`、`UPDATE_*` 路径平台化 | 小 |
| P0-4 | **新增 `build.mac` 配置** | `package.json` 中添加 `build.mac` + `build.dmg` | 小 |
| P0-5 | **准备 macOS 图标** | 从 `icon.png` 或 `icon.ico` 生成 `icon.icns`（1024x1024） | 小 |

### P1 — 核心功能适配（影响用户体验）

| 优先级 | 任务 | 说明 | 预估工作量 |
|---|---|---|---|
| P1-1 | **提取窗口创建逻辑到 `desktop/windows/`** | 将主窗口/歌词窗口/壁纸窗口的创建逻辑从 `main.js` 提取到独立模块，并平台化参数 | 中 |
| P1-2 | **平台化桌面歌词窗口** | macOS 上使用 `type: 'panel'` + `visualEffectState` + 移除 PowerShell 中键检测 | 中 |
| P1-3 | **平台化壁纸窗口** | macOS 上使用 `type: 'desktop'`，移除 `attachWallpaperToWorkerW` 和 PowerShell 调用 | 中 |
| P1-4 | **新增 macOS 应用菜单** | `desktop/menu.js` 实现标准 macOS 菜单 | 小 |
| P1-5 | **平台化全局热键** | 提取热键逻辑到 `desktop/hotkeys.js`，处理 macOS 快捷键差异 | 小 |
| P1-6 | **平台化 GPU 开关** | 将 `CHROMIUM_PERFORMANCE_SWITCHES` 提取到 `platform/chromium-switches.js` | 小 |
| P1-7 | **废弃桌面快捷方式功能** | macOS 上 `ensureDesktopShortcut` 返回 `skipped` | 极小 |

### P2 — 构建与发布（影响分发）

| 优先级 | 任务 | 说明 | 预估工作量 |
|---|---|---|---|
| P2-1 | **新增 macOS 公证脚本** | `build/mac/notarize.js` + `build/mac/entitlements.plist` | 小 |
| P2-2 | **配置代码签名** | 获取 Apple Developer ID 证书，配置签名环境 | 中（外部依赖） |
| P2-3 | **验证 macOS 构建** | 在 macOS 环境运行 `npm run build:mac`，验证 `.app` 生成 | 小 |
| P2-4 | **验证公证流程** | 提交测试构建进行公证，验证通过 Gatekeeper | 小 |
| P2-5 | **macOS 更新机制** | 重写更新逻辑支持 `.zip`/`.dmg` 下载和替换（或引入 `electron-updater`） | 大 |
| P2-6 | **CI/CD 双平台构建** | GitHub Actions 配置 Windows + macOS 并行构建 | 中 |

### P3 — 优化与完善（不影响核心功能）

| 优先级 | 任务 | 说明 | 预估工作量 |
|---|---|---|---|
| P3-1 | **验证 `mpg123-decoder` 的 macOS 支持** | 确认预编译二进制包含 arm64/x64 | 小 |
| P3-2 | **macOS 托盘图标** | 准备 macOS 风格的状态栏图标（16x16@2x 模板图） | 小 |
| P3-3 | **Dock 菜单** | 为 Dock 图标添加右键菜单（最近播放、播放控制） | 小 |
| P3-4 | **Touch Bar 支持** | 为 MacBook Pro 添加 Touch Bar 播放控制（可选） | 小 |
| P3-5 | **macOS 深色模式适配** | 检测 `nativeTheme.shouldUseDarkColors`，适配前端主题 | 小 |
| P3-6 | **文档更新** | 更新 README、CHANGELOG、构建文档 | 小 |

---

## 七、风险评估

### 7.1 架构层面风险

| 风险等级 | 风险 | 影响 | 缓解措施 |
|---|---|---|---|
| **🔴 高** | **壁纸窗口在 macOS 上的行为不确定** | `type: 'desktop'` 在 macOS 上创建 `kCGDesktopWindowLevel` 窗口，但 Electron 对该类型的支持在 macOS 上不如 Windows 成熟。可能无法正确显示在桌面图标之下，或影响桌面图标点击。 | 先进行原型验证（P0 阶段快速测试）。如果 `type: 'desktop'` 不稳定，降级为`type: 'normal'` 窗口 + `alwaysOnTop: false` + 大尺寸覆盖桌面，或考虑完全在 macOS 上禁用壁纸功能。 |
| **🔴 高** | **桌面歌词中键检测缺失** | macOS 没有全局鼠标按钮检测 API。当前 Windows 上通过 PowerShell + `GetAsyncKeyState` 实现的中键锁定功能在 macOS 上完全不可用。 | 用全局热键（如 `Cmd+Option+L`）替代中键检测。在 UI 中更新提示文案（macOS 上显示快捷键而非"中键"）。 |
| **🟡 中** | **Electron 版本兼容性** | 当前使用 Electron 42.4.1（较新）。`type: 'desktop'`、`visualEffectState` 等 API 在不同 Electron 版本间行为可能变化。 | 在 P0 阶段快速验证目标 API 在当前版本上的行为。锁定 Electron 版本，升级时进行回归测试。 |
| **🟡 中** | **asar 与快速补丁的兼容性** | 当前 `asar: false` 支持快速补丁（直接替换文件）。如果未来改为 `asar: true`，补丁逻辑需要重写。 | 保持 `asar: false`（已在架构决策中确认）。macOS 更新机制设计时也基于文件直接替换。 |
| **🟡 中** | **更新机制完全重写** | macOS 不能执行 `.exe`，需要全新的下载/替换逻辑。如果引入 `electron-updater`，需要重构现有更新代码。 | 建议 P2 阶段引入 `electron-updater`（同时支持 Windows 和 macOS），统一双平台更新体验。但这是一个大工程，需要评估是否值得。 |
| **🟡 中** | **代码签名证书获取** | 需要 Apple Developer ID 证书（$99/年）。如果没有证书，macOS 用户需要在系统设置中手动允许运行（体验差）。 | 开发者需自行购买 Apple Developer Program。在 CI 中配置证书环境变量。 |
| **🟢 低** | **前端字体在 macOS 上的渲染差异** | 字体栈中已有 macOS 系统字体（`-apple-system`、`PingFang SC`），渲染差异可控。 | 在 macOS 上验证字体渲染效果，微调字重/间距。 |
| **🟢 低** | **文件系统大小写敏感** | macOS APFS 默认大小写不敏感，但引用路径一致性仍需注意。 | 代码中使用 `path.join()` 和 `require()`，避免硬编码大小写不一致的路径。 |
| **🟢 低** | **第三方库 `mpg123-decoder` 的 macOS 二进制** | 该库依赖预编译二进制。需确认包含 macOS arm64 和 x64 版本。 | 在 P0 阶段安装依赖时验证。如果缺失，可能需要自行编译或使用替代库。 |

### 7.2 决策点风险

| 决策 | 选项A | 选项B | 推荐 | 风险 |
|---|---|---|---|---|
| **更新机制** | 自定义（继续维护两套） | `electron-updater`（统一） | **B** | 引入新依赖，重构工作量大，但长期收益高 |
| **ASAR** | `false`（当前） | `true` | **A** | 保持与 Windows 一致，降低维护复杂度 |
| **壁纸功能** | 完全复刻（`type: 'desktop'`） | 降级为普通窗口/主窗口背景 | 先 **A** 验证，失败则 **B** | `type: 'desktop'` 可能不稳定 |
| **上架渠道** | 仅官网/GitHub | + Mac App Store | 先 **A** | MAS 上架需要额外审核、沙盒限制、30% 抽成。建议先不上架 MAS。 |
| **架构版本** | 单架构（arm64） | 通用（arm64 + x64） | **通用** | 通用构建体积翻倍，但覆盖所有 Mac 用户。如果只支持 Apple Silicon，丢失 Intel Mac 用户。 |

### 7.3 工作量估算（总）

| 阶段 | 工作量 | 说明 |
|---|---|---|
| P0 基础改造 | 1-2 天 | 路径抽象、构建配置、图标准备 |
| P1 核心适配 | 3-5 天 | 窗口平台化、菜单、热键、壁纸/歌词适配 |
| P2 构建发布 | 2-3 天 | 签名、公证、构建验证（不含证书获取时间） |
| P2 更新机制 | 3-5 天 | 如果选择自定义；如果选择 `electron-updater` 则 5-7 天 |
| P3 优化 | 2-3 天 | 托盘、Dock、Touch Bar、文档 |
| **总计** | **11-18 天** | 不含 Apple 证书申请（通常 1-3 天）和测试时间 |

---

## 八、关键架构决策记录（ADR）

### ADR-1：前端不引入框架，保持原生 HTML/CSS/JS

- **状态**：已确认（Project Manager 报告）
- **理由**：前端代码 27000+ 行，引入框架的重写成本极高。迁移目标是最小改动，前端零改动是首要原则。
- **影响**：后续前端维护仍保持原生方式，模块化通过文件拆分而非框架实现。

### ADR-2：引入 `platform/` 平台抽象层

- **状态**：建议采纳
- **理由**：将平台差异集中管理，避免 `main.js` 和 `server.js` 中散落 `if (process.platform === 'win32')` 判断。提高可维护性，为未来 Linux 支持预留扩展。
- **影响**：新增约 4 个文件，增加一层间接调用，但显著提升代码可维护性。

### ADR-3：保持 `asar: false`（全平台一致）

- **状态**：建议采纳
- **理由**：与 Windows 保持一致，简化补丁更新逻辑。`.app` 体积增加可控（当前项目不大）。
- **影响**：`.app` 包体积略大于 `asar: true`，但功能完全一致。

### ADR-4：macOS 壁纸使用 `type: 'desktop'` 窗口

- **状态**：建议采纳，但需验证
- **理由**：Electron 在 macOS 上支持 `type: 'desktop'`，创建 `kCGDesktopWindowLevel` 窗口。这是最接近 Windows WorkerW 嵌入的方案。
- **风险**：该 API 在 Electron 上的行为可能不如原生 AppKit 稳定。如果验证失败，降级为普通窗口。
- **验证方式**：P0 阶段快速原型测试。

### ADR-5：macOS 更新机制优先使用 `electron-updater`

- **状态**：建议采纳，P2 阶段实施
- **理由**：`electron-updater` 已处理 macOS 的签名验证、自动替换 `.app`、后台下载等复杂逻辑。自定义更新机制在 macOS 上需要处理大量边缘情况（权限、文件锁、签名验证）。
- **影响**：需要引入新依赖，重构现有更新代码。但长期维护成本更低，且 Windows 也可受益（统一更新体验）。
- **备选**：如果工作量过大，P2 阶段可以先实现自定义 zip 替换方案，后续再迁移到 `electron-updater`。

### ADR-6：不上架 Mac App Store（初期）

- **状态**：建议采纳
- **理由**：Mac App Store 审核严格，需要沙盒化、禁用 JIT、可能禁止某些 API（如 `globalShortcut`）。当前应用的网络代理、Cookie 管理、第三方 API 调用可能在 MAS 审核中被质疑。建议先通过官网/GitHub Releases 分发（Developer ID 签名 + 公证）。
- **影响**：用户需要手动下载 `.dmg`，不能通过 App Store 安装。但避免了 MAS 的限制和抽成。
- **后续**：如果未来决定上架 MAS，需要额外评估沙盒合规性。

---

## 九、附录

### 9.1 文件变更清单（架构改造后）

#### 新增文件

```
platform/
├── index.js
├── paths.js
├── chromium-switches.js
├── shortcuts.js
└── README.md

desktop/
├── menu.js
├── hotkeys.js
└── windows/
    ├── main-window.js
    ├── lyrics-window.js
    └── wallpaper-window.js

build/
├── icon.icns
└── mac/
    ├── entitlements.plist
    └── notarize.js

.github/workflows/build.yml
```

#### 修改文件

```
package.json                    # 新增 build.mac, build.dmg, scripts
server.js                       # 路径平台化

desktop/main.js                 # 提取窗口逻辑到 windows/，使用 platform/，添加 menu 调用
```

#### 删除/废弃文件（不影响 Windows 构建）

```
# 以下文件对 macOS 构建无意义，但保留以供 Windows 使用：
build/after-pack.js             # 仅 Windows 构建时执行
build/installer.nsh             # 仅 Windows 构建时执行
build/installerHeader.bmp       # 仅 Windows 构建时执行
build/installerSidebar.bmp      # 仅 Windows 构建时执行
```

### 9.2 依赖变更

#### 新增 devDependencies

```json
{
  "@electron/notarize": "^2.0.0",
  "electron-builder": "^26.15.3"  // 已存在，确保版本支持 macOS
}
```

#### 移除 devDependencies

```json
{
  "rcedit": "^5.0.2"  // macOS 不需要，但保留以供 Windows 构建
}
```

**说明**：`rcedit` 可以保留在 `devDependencies` 中（Windows 构建仍需要），但 macOS 构建流程不使用它。

### 9.3 参考资源

- [Electron macOS 文档](https://www.electronjs.org/docs/latest/tutorial/macos-dock)
- [Electron BrowserWindow 选项](https://www.electronjs.org/docs/latest/api/browser-window)
- [electron-builder macOS 配置](https://www.electron.build/configuration/mac)
- [Apple Developer ID 签名指南](https://developer.apple.com/developer-id/)
- [Electron Notarize 文档](https://github.com/electron/notarize)

---

> **本架构文档由 Software Architect Agent 生成。**  
> 后续 Developer Agent 应严格按照此文档的优先级和接口定义进行实施。  
> 实施过程中如发现架构问题，应在此文件末尾追加修正记录。
