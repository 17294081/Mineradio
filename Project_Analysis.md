# Mineradio 项目分析报告（Project Manager）

> **生成时间**：2026-06-28  
> **Agent**: Project Manager（项目分析阶段）  
> **用途**：供后续所有 Agent（架构师、开发、测试、部署等）参考  
> **禁止**：此报告仅用于信息同步，不要据此修改代码或开始开发。

---

## 一、项目简介

Mineradio 是一款面向 Windows 的沉浸式桌面音乐播放器，融合天气电台智能推荐、歌词舞台、粒子视觉特效、3D 歌单架与网易云/QQ 音乐双源接入，定位"接近现场感的私人音乐空间"。

- **版本**：v1.1.1（当前纯净安装发布版）  
- **作者**：XxHuberrr  
- **开源协议**：GPL-3.0  
- **GitHub**：`https://github.com/XxHuberrr/Mineradio`  
- **分发入口**：GitHub Releases + 蓝奏云（国内加速）  
- **安装包**：`Mineradio-1.1.1-Setup.exe`（NSIS 安装器，Windows x64 独占）

---

## 二、软件功能（完整清单）

| 功能模块 | 具体内容 |
|---|---|
| **音乐播放** | 网易云音乐搜索/播放/歌单/播客/DJ、QQ 音乐搜索/音源补充 |
| **天气电台** | 基于 Open-Meteo 的天气数据和地理位置，按 mood 生成播放队列 |
| **首页导航** | 天气电台、每日推荐、私人电台、继续听、听歌画像、我的歌单 |
| **歌词系统** | 逐行歌词显示、自定义歌词上传、歌词位置/颜色/视觉控制 |
| **桌面歌词** | 独立桌面歌词窗口（Electron BrowserWindow），支持拖拽、缩放、透明度、置顶 |
| **视觉特效** | 粒子舞台（Three.js）、银河壁纸（Canvas 2D）、节奏驱动的电影镜头系统 |
| **3D 歌单架** | 右键唤起 Three.js 3D 歌单架，浏览歌单队列（旋转书架 UI） |
| **用户系统** | 网易云扫码登录、QQ 音乐登录态、用户歌单、听歌画像、收藏/点赞 |
| **本地文件** | 自定义专辑封面上传与裁剪 |
| **更新机制** | GitHub Releases 自动检测、国内镜像下载、完整安装包/快速补丁双路径更新 |
| **用户存档** | 视觉预设（JSON）、参数配置、用户数据持久化（localStorage + 文件系统） |
| **播放控制** | 播放/暂停淡入淡出、音量控制、播放模式切换、试听检测、多 quality 音源探测 |
| **双源搜索** | 网易云 + QQ 音乐双源搜索，覆盖歌曲/专辑/歌手/歌单/播客 |
| **DJ 播客** | 专属 DJ 播客视觉模式，长音频节奏分析（BPM/节拍图） |
| **Wallpaper 背景** | 未播放状态保持银河粒子星空，播放后切入视觉主题 |
| **安全提示** | 旧版本（v1.0.10 及更早）安装包已标记为不建议安装，需隔离 |

---

## 三、目录结构（每个目录的职责）

```
Mineradio/
├── build/                          # 构建资源
│   ├── icon.ico / icon.png          # 应用图标（.exe 和任务栏）
│   ├── installer.nsh                # NSIS 安装器自定义脚本（目录页、安全卸载）
│   ├── installerHeader.bmp          # 安装器欢迎页顶部横幅
│   ├── installerSidebar.bmp         # 安装器左侧边栏图片
│   └── after-pack.js                # electron-builder 打包后钩子：注入 .exe 图标/版本
│
├── desktop/                          # Electron 主进程代码
│   ├── main.js                      # 主进程入口：窗口管理、生命周期、IPC、单实例、全局热键
│   ├── preload.js                   # 主窗口预加载脚本：暴露安全 IPC 通道
│   └── overlay-preload.js           # 桌面歌词窗口预加载脚本
│
├── public/                           # 前端静态资源（被 Electron 主进程加载）
│   ├── index.html                   # 主界面：单文件大前端（内嵌 CSS + JS，约 27000+ 行 HTML）
│   ├── desktop-lyrics.html          # 桌面歌词独立窗口界面
│   ├── wallpaper.html               # 银河粒子壁纸背景（Canvas 2D）
│   ├── default-user-fx-archive.json # 首次启动默认视觉存档
│   ├── assets/                      # 骷髅粒子数据（skull-decimation-points.bin）
│   └── vendor/                      # 第三方前端库（不通过 npm）
│       ├── three.r128.min.js        # Three.js 3D 引擎
│       ├── gsap.min.js              # GSAP 动画库
│       └── music-tempo.min.js       # 客户端节奏检测（Web Audio API）
│
├── docs/                             # 项目文档（非运行时必需）
│   ├── PROJECT_MEMORY.md            # 项目历史决策、发布记录、工作区整理
│   ├── INSTALLER_STYLE.md           # 安装器 UI 规范（中文极简白底黑字蓝点缀）
│   ├── DESKTOP_LYRICS_VISUAL.md     # 桌面歌词视觉设计文档
│   ├── GLASS_SVG_TEXTURE.md         # 玻璃质感 SVG 滤镜实现
│   ├── 3D_PLAYLIST_SHELF_MEMORY.md  # 3D 歌单架实现备忘
│   ├── QQ_MUSIC_INTERFACE_NOTES.md  # QQ 音乐接口逆向笔记
│   ├── SECURITY_REBUILD_2026-06-24.md # 安全重建记录
│   ├── RELEASE_NOTES_v1.1.0.md      # v1.1.0 发布说明
│   ├── SUPPORT.md                   # 作者支持渠道
│   └── assets/                      # 文档配图（README 截图、支持海报等）
│
├── server.js                         # 后端 HTTP 代理服务（Node.js 原生 http）
│                                      # 网易云 API、QQ 音乐 API、天气 API、更新检测、下载管理、节奏缓存
│
├── dj-analyzer.js                    # DJ 播客/长音频节奏分析模块
│                                      # 音频解码、BPM 检测、节拍图（beatmap）生成
│
├── package.json                       # 项目配置、依赖、electron-builder 构建配置
├── package-lock.json                  # 依赖锁定
├── README.md                          # 项目介绍、下载入口、使用说明、开发指南
├── CHANGELOG.md                       # 版本更新日志
├── LICENSE                            # GPL-3.0 许可证
├── NOTICE.md                          # 第三方版权声明
├── PRIVACY.md                         # 隐私政策说明
├── SECURITY.md                        # 安全提示（旧版本隔离）
└── RELEASE.md                         # 发布备忘
```

---

## 四、模块关系（调用关系图）

```
┌─────────────────────────────────────────────────────────────┐
│  Electron 主进程 (desktop/main.js)                            │
│  ├── 创建主窗口 → 加载 http://localhost:3000 (index.html)     │
│  ├── 创建桌面歌词窗口 → 加载 desktop-lyrics.html               │
│  ├── 创建壁纸窗口 → 加载 wallpaper.html                        │
│  ├── 全局快捷键（播放/暂停/切歌/歌词显隐）                     │
│  ├── 单实例锁（重复启动唤起已运行窗口）                        │
│  ├── 系统托盘 / 桌面快捷方式                                   │
│  └── IPC 主通道：歌词控制、视觉模式、窗口状态、登录态同步       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  前端渲染层 (public/index.html) — 单文件大前端                │
│  ├── Three.js r128 → 粒子舞台（主视觉）、3D 歌单架           │
│  ├── GSAP → 动画过渡、镜头运动、UI 动效                      │
│  ├── music-tempo → 客户端实时节奏检测（Web Audio）           │
│  ├── 自定义 DOM 播放器 → 音频播放、歌词同步、进度控制          │
│  ├── 歌词舞台 → 逐行渲染、歌词位置/颜色自定义                │
│  ├── 用户存档系统 → localStorage 读写 + JSON 序列化          │
│  └── 与主进程 IPC 通信 + 后端 HTTP 请求（AJAX/Fetch）         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  后端 HTTP 服务 (server.js) — Node.js 原生 http 模块           │
│  ├── 网易云 API 代理 (NeteaseCloudMusicApi 4.32.0)            │
│  │   └── 搜索 / 歌曲详情 / 播放 URL / 歌单 / 播客 / DJ        │
│  │   └── 登录 / Cookie 持久化 / 歌词 / 用户数据               │
│  ├── QQ 音乐 API 代理（自行逆向实现）                          │
│  │   └── Cookie 管理 / 播放地址 / 搜索 / 歌单                 │
│  ├── 天气 API 代理 (Open-Meteo + ip-api)                      │
│  │   └── 位置获取 / 天气数据 / mood 匹配播放队列生成          │
│  ├── 更新检测与下载 (GitHub Releases API)                    │
│  │   └── latest.yml / 多镜像下载 / 完整安装包 / 快速补丁 JSON  │
│  ├── 节奏缓存管理 (beatmap cache)                             │
│  │   └── 本地文件系统读写，缓存 BPM/节拍数据                   │
│  └── 静态文件服务 → 服务 public/ 目录                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  音频分析 (dj-analyzer.js)                                    │
│  └── 被 server.js 调用，用于 DJ 播客/长音频的 BPM/节拍分析     │
│  └── 使用 mpg123-decoder 解码音频，自定义 DSP 滤波             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、技术栈（详细列表）

| 类别 | 技术/库 | 版本 | 说明 |
|---|---|---|---|
| **语言** | JavaScript (ES6+) | — | Node.js 运行时 + 浏览器端 |
| **桌面框架** | Electron | ^42.4.1 | 跨平台桌面应用壳 |
| **构建工具** | electron-builder | ^26.15.3 | 打包 + NSIS 安装器生成 |
| **前端框架** | 无（原生） | — | 单文件大前端，纯 HTML/CSS/JS |
| **3D 渲染** | Three.js | r128 | 粒子舞台、3D 歌单架 |
| **动画** | GSAP | ^3.15.0 | 镜头运动、UI 过渡、时间线控制 |
| **音频解码** | mpg123-decoder | ^1.0.3 | Node.js 端音频解码 |
| **音频分析** | music-tempo | 内嵌 | 客户端 Web Audio API 节奏检测 |
| **后端 HTTP** | Node.js http | 原生 | 无 Express/Koa，原生模块实现 |
| **音乐 API** | NeteaseCloudMusicApi | ^4.32.0 | 第三方网易云 API 封装 |
| **天气 API** | Open-Meteo | 免费 API | 天气数据 + 地理位置 |
| **地理位置** | ip-api.com | 免费 API | IP 定位获取城市/经纬度 |
| **更新机制** | GitHub Releases API | — | latest.yml + 可选轻量补丁 JSON |
| **安装器** | NSIS | electron-builder 内置 | 自定义脚本 via `installer.nsh` |
| **资源编辑** | rcedit | ^5.0.2 | Windows .exe 图标/版本注入 |
| **配置** | 环境变量 + JSON | — | 无 dotenv/config 库 |
| **日志** | console.log | — | 无专用日志库（如 winston/pino） |
| **数据持久化** | fs + localStorage | — | Cookie 文件、用户存档 JSON |
| **字体** | Google Fonts | CDN | Cinzel Decorative、Inter、Noto Sans SC、JetBrains Mono、UnifrakturCook |

---

## 六、编译流程（Build 步骤）

```bash
# 1. 安装依赖
npm install

# 2. 开发运行（启动本地服务器 + Electron）
npm start
# 等价于: electron .
# 主进程启动 server.js 在 localhost:3000，然后加载 index.html

# 3. 生产构建（Windows NSIS 安装包）
npm run build:win
# 等价于: electron-builder --win nsis
# 输出目录: dist/
# 产物: Mineradio-1.1.1-Setup.exe
#       latest.yml
#       Mineradio-1.1.1-Setup.exe.blockmap

# 4. 仅打包目录（不生成安装包，用于测试）
npm run build:win:dir
# 等价于: electron-builder --win dir
# 产物: dist/win-unpacked/Mineradio.exe
```

### 构建流程细节

1. **依赖安装**：npm install 安装 `dependencies` 和 `devDependencies`
2. **打包阶段**：electron-builder 将 `files` 字段指定的文件打包到 `win-unpacked/`
3. **AfterPack 钩子**：`build/after-pack.js` 调用 `rcedit-x64.exe` 注入：
   - 应用图标（`build/icon.ico` → `.exe` 资源）
   - 版本信息（FileDescription、ProductName、CompanyName、FileVersion、ProductVersion）
4. **NSIS 安装器生成**：electron-builder 根据 `build.nsis` 配置 + `build/installer.nsh` 生成 `.exe` 安装包
5. **自动更新元数据**：生成 `latest.yml`（版本、路径、SHA512、大小）供客户端更新检测

### 构建配置（package.json 中的 `build` 字段）

- `appId`: `com.mineradio.desktop`
- `asar: false` — 不打包为 ASAR，文件直接暴露（便于补丁更新）
- `files`: `desktop/**/*`, `public/**/*`, `build/**/*`, `server.js`, `dj-analyzer.js`, `package.json`
- `win.target`: `nsis` / `x64`
- `nsis`: 非一键安装，允许修改目录（已关闭内置目录页，自定义 UI），创建桌面/开始菜单快捷方式

---

## 七、平台依赖（Windows / Linux / Mac 代码分布）

### Windows 专属代码（当前项目主体）

| 代码/配置 | 文件路径 | 说明 |
|---|---|---|
| 构建目标 | `package.json` → `build.win` | 仅配置 `nsis` / `x64` |
| 资源注入 | `build/after-pack.js` | 调用 `rcedit-x64.exe` 注入 `.exe` 图标和版本 |
| 安装器脚本 | `build/installer.nsh` | NSIS 脚本，Windows 独占 |
| GPU 性能开关 | `desktop/main.js` | `use-angle=d3d11`、D3D11 加速等 Chromium 开关 |
| 全局热键 | `desktop/main.js` | `globalShortcut` 注册 Windows 系统级快捷键 |
| 单实例锁 | `desktop/main.js` | `requestSingleInstanceLock()` |
| 节奏缓存路径 | `server.js` | `BEATMAP_CACHE_DIR = 'D:\\MineradioCache\\beatmaps'`（硬编码） |
| TLS CA 合并 | `server.js` | `applySystemCertificateAuthorities()` — Windows 系统 CA |
| 代码签名 | `package.json` | `winCodeSign: "1.1.0"` |
| 快捷方式 | `desktop/main.js` | 首次启动补创建桌面快捷方式 |

### Linux 专属代码

| 代码/配置 | 说明 |
|---|---|
| 无 | 当前未配置 Linux 构建目标，无 Linux 专属代码 |

### Mac 专属代码

| 代码/配置 | 说明 |
|---|---|
| 无 | 当前未配置 macOS 构建目标，无 Mac 专属代码 |

### 跨平台代码（核心逻辑）

| 代码/配置 | 文件 | 说明 |
|---|---|---|
| HTTP 服务 | `server.js` | 使用 Node.js 原生 `http` 模块，跨平台 |
| 音频分析 | `dj-analyzer.js` | 纯 JavaScript，无平台依赖 |
| 前端渲染 | `public/index.html` | 标准 Web 技术，完全跨平台 |
| Electron API | `desktop/main.js` | `BrowserWindow`、`ipcMain`、`session` 等跨平台 |
| 第三方库 | `NeteaseCloudMusicApi` | 本身跨平台 Node.js 库 |

---

## 八、迁移 Mac 可能遇到的风险（详细评估）

| 风险等级 | 问题 | 详细说明 | 建议处理优先级 |
|---|---|---|---|
| **🔴 高** | **安装器缺失** | NSIS 是 Windows 独占安装器。macOS 需要 dmg 或 pkg 格式。需新增 `build.mac` 配置（`target: ['dmg', 'zip']`），并配置签名/公证。 | P0 |
| **🔴 高** | **路径硬编码** | `server.js` 中 `BEATMAP_CACHE_DIR = 'D:\\MineradioCache\\beatmaps'` 硬编码 Windows 盘符路径。macOS 无 `D:` 盘符，需改为 `path.join(os.homedir(), 'Library', 'Caches', 'Mineradio', 'beatmaps')` 或使用 `app.getPath('userData')`。 | P0 |
| **🔴 高** | **rcedit 依赖** | `build/after-pack.js` 调用 `rcedit-x64.exe` 修改 Windows PE 文件资源。macOS 应用包（`.app`）使用 `Info.plist` + `electron-osx-sign` / `@electron/notarize` 进行签名和公证，完全无法复用 rcedit 逻辑。 | P0 |
| **🟡 中** | **GPU 性能开关** | `desktop/main.js` 中 `use-angle=d3d11` 等 Windows 专属 Chromium 开关在 macOS 上无效，需替换为 Metal 相关开关（如 `enable-gpu-rasterization` 保留，`use-angle` 移除或改为 `metal`）。 | P1 |
| **🟡 中** | **全局热键** | `globalShortcut` 在 macOS 上部分热键（如 `Cmd+Space`）被系统占用，需要注册替代热键或降级为应用内快捷键。 | P1 |
| **🟡 中** | **单实例锁** | `requestSingleInstanceLock` 在 macOS 上通常正常，但 Dock 点击复用窗口行为需测试。macOS 用户习惯通过 Dock 重新打开应用时聚焦已有窗口而非新建。 | P1 |
| **🟡 中** | **桌面歌词窗口** | macOS 窗口层级管理（`alwaysOnTop` + `type: 'toolbar'` 等）与 Windows 不同。透明窗口（`transparent: true`）在 macOS 上可能表现不同，需要测试 `visualEffectState` 和 `vibrancy` 效果。 | P1 |
| **🟡 中** | **应用菜单** | macOS 有全局菜单栏（`Menu`），当前项目未配置。macOS 用户期望应用有标准菜单（`Mineradio` → `About`、`Preferences`、`Quit`）。 | P2 |
| **🟢 低** | **文件系统大小写** | macOS 默认使用大小写不敏感（APFS case-insensitive），但代码中引用路径需确保一致。当前项目路径引用简单，风险低。 | P2 |
| **🟢 低** | **ASAR 配置** | `asar: false` 在 macOS 上会导致 `.app` 体积更大，但功能正常。若需减小体积，可考虑 `asar: true` + 按需解包。 | P2 |
| **🟢 低** | **第三方库** | `NeteaseCloudMusicApi` 本身跨平台，无兼容问题。`mpg123-decoder` 有预编译二进制，需确认支持 macOS arm64/x64。 | P2 |
| **🟢 低** | **更新机制** | macOS 应用更新通常使用 `electron-updater` + zip/dmg。当前自定义更新逻辑（下载 .exe 安装包）完全不适用于 macOS，需要独立的 macOS 更新通道。 | P2 |
| **🟢 低** | **托盘图标** | macOS 状态栏图标（Tray）尺寸和格式要求与 Windows 不同（macOS 通常为 16x16@2px 模板图），需要独立的 macOS 图标资源。 | P3 |

---

## 九、建议开发顺序（供后续 Agent 参考）

### 阶段一：信息梳理与文档化（不改动代码）
1. **接口文档化**：完整阅读 `server.js`，整理所有 HTTP API 路由（路径、方法、参数、响应、依赖）为独立文档
2. **前端逻辑拆解**：将 `public/index.html` 中内嵌的 CSS 和 JS 分离到独立文件，按功能模块标注（播放器、歌词、视觉、搜索、用户系统等）
3. **IPC 通道清单**：梳理 `desktop/main.js` 中所有 `ipcMain.handle` / `ipcMain.on` 和 `preload.js` 中的 `contextBridge` 暴露通道，形成 IPC 接口文档

### 阶段二：平台抽象与兼容性
4. **路径抽象**：将 `server.js` 中所有硬编码 Windows 路径（`D:\\MineradioCache` 等）改为 `path.join()` + `os.homedir()` / `app.getPath()`，并支持按平台区分
5. **Chromium 开关平台化**：将 `desktop/main.js` 中 Windows 专属 GPU 开关提取为按平台条件判断的配置
6. **新增 macOS 构建配置**：在 `package.json` 中新增 `build.mac` 配置（`dmg` + `zip`），配置 `electron-osx-sign` 和 `notarize` 选项

### 阶段三：架构优化（可选，根据产品决策）
7. **前端模块化**：将 `index.html` 单文件大前端拆分为模块化结构（CSS 文件、JS 文件按功能分离），可保留原生 JS 或引入轻量框架
8. **后端路由拆分**：将 `server.js` 按功能拆分为路由模块（`routes/search.js`、`routes/weather.js`、`routes/update.js` 等），降低维护复杂度
9. **引入日志库**：替换 `console.log` 为 `winston` 或 `pino`，增加日志级别和文件落盘
10. **配置管理**：引入 `dotenv` 或集中配置模块，替代零散的环境变量读取

### 阶段四：macOS 适配与测试
11. **打包验证**：在 macOS 环境（或 CI）上运行 `electron-builder --mac`，验证 `.app` 生成
12. **签名与公证**：配置 Apple Developer ID 证书，实现 `.app` 签名和公证流程
13. **桌面歌词测试**：在 macOS 上测试桌面歌词窗口的透明、置顶、拖拽、点击穿透行为
14. **全局热键适配**：测试并调整 macOS 上可用的全局热键组合
15. **更新通道**：为 macOS 设计独立的更新机制（`electron-updater` 或自定义 zip 替换）

### 阶段五：发布与维护
16. **CI/CD**：配置 GitHub Actions 实现 Windows + macOS 双平台自动构建
17. **测试矩阵**：建立 Windows 10/11、macOS Intel/Apple Silicon 的测试矩阵

---

## 附录：关键文件速查

| 文件 | 行数（约） | 核心职责 |
|---|---|---|
| `server.js` | ~3000+ 行 | 后端服务、API 代理、更新、下载、缓存 |
| `desktop/main.js` | ~1500+ 行 | Electron 主进程、窗口管理、IPC、系统集成 |
| `public/index.html` | ~27000+ 行 | 主界面（HTML + CSS + JS 单文件） |
| `dj-analyzer.js` | ~800+ 行 | 音频解码、BPM 检测、节拍图生成 |
| `build/after-pack.js` | ~50 行 | 打包后注入 .exe 资源 |
| `build/installer.nsh` | ~50 行 | NSIS 安装器自定义逻辑 |
| `public/desktop-lyrics.html` | ~1200+ 行 | 桌面歌词独立窗口 |
| `public/wallpaper.html` | ~150 行 | 银河粒子壁纸背景 |

---

> **本报告由 Project Manager Agent 生成**。  
> 后续任何 Agent（架构师、开发者、测试、DevOps）在开始工作前，请先阅读此报告。  
> 如有分析遗漏或错误，请在此文件末尾追加修正记录。
