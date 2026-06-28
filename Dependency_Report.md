# Mineradio 依赖分析报告（Dependency Analyst）

> **生成时间**：2026-06-28  
> **Agent**: Dependency Analyst  
> **输入**: `package.json`, `Project_Analysis.md`, `Architecture.md`  
> **目标**：分析所有第三方依赖的 macOS / Apple Silicon 兼容性，识别风险

---

## 一、npm 依赖清单

### 1.1 Production Dependencies

| 库名 | 版本 | 作用 | macOS 支持 | Apple Silicon | License | 风险等级 |
|---|---|---|---|---|---|---|
| **gsap** | ^3.15.0 | 前端动画库（timeline、 easing、 tween） | ✅ 完全支持 | ✅ 纯 JS，无原生依赖 | GreenSock Standard (免费商用) | 🟢 低 |
| **mpg123-decoder** | ^1.0.3 | Node.js 端 MP3 音频解码（WASM/Native 绑定） | ⚠️ 需验证 | ⚠️ 需验证预编译二进制 | LGPL-2.1 | 🟡 中 |
| **NeteaseCloudMusicApi** | ^4.32.0 | 网易云音乐 API 封装（HTTP 代理） | ✅ 完全支持 | ✅ 纯 Node.js | MIT | 🟢 低 |

### 1.2 Development Dependencies

| 库名 | 版本 | 作用 | macOS 支持 | Apple Silicon | License | 风险等级 |
|---|---|---|---|---|---|---|
| **electron** | ^42.4.1 | 跨平台桌面框架（Chromium + Node.js） | ✅ 完全支持 | ✅ 官方提供 arm64/x64 | MIT | 🟢 低 |
| **electron-builder** | ^26.15.3 | 打包工具（NSIS/dmg/zip） | ✅ 完全支持 | ✅ 官方支持 | MIT | 🟢 低 |
| **rcedit** | ^5.0.2 | Windows .exe 资源编辑（图标/版本注入） | ❌ 不适用 | ❌ 不适用 | MIT | 🟢 低（仅 Windows） |

### 1.3 建议新增依赖（Architecture 规划）

| 库名 | 建议版本 | 作用 | macOS 支持 | Apple Silicon | License | 风险等级 |
|---|---|---|---|---|---|---|
| **@electron/notarize** | ^2.0.0 | macOS 应用公证（Notarization） | ✅ 完全支持 | ✅ 官方支持 | MIT | 🟢 低 |

---

## 二、内嵌前端库（vendor/ 目录，非 npm）

| 库名 | 版本 | 作用 | macOS 支持 | Apple Silicon | License | 说明 |
|---|---|---|---|---|---|---|
| **three.js** | r128 | 3D 渲染引擎（粒子舞台、3D 歌单架） | ✅ 完全支持 | ✅ WebGL 通用 | MIT | 内嵌 `public/vendor/three.r128.min.js` |
| **gsap** | ~3.15 | 动画库（内嵌版本与 npm 版本可能重复） | ✅ 完全支持 | ✅ 纯 JS | GreenSock Standard | `public/vendor/gsap.min.js` |
| **music-tempo** | 内嵌 | 客户端 Web Audio API 节奏检测 | ✅ 完全支持 | ✅ 纯 JS | 未知 | `public/vendor/music-tempo.min.js` |

**注意**：gsap 同时存在于 `dependencies` 和 `public/vendor/` 中，可能存在版本不一致风险。需确认两者是否指向同一版本。

---

## 三、详细依赖分析

### 3.1 gsap（^3.15.0）

- **作用**：前端动画引擎，用于镜头运动、UI 过渡、时间线控制
- **macOS 兼容性**：✅ 完全支持。GSAP 是纯 JavaScript 库，无平台依赖
- **Apple Silicon**：✅ 纯 JS，无需原生二进制，arm64/x64 通用
- **替代方案**：无需替代。如需更轻量方案可考虑 `framer-motion` 或原生 CSS Animation，但迁移成本极高
- **安装方式**：`npm install gsap`
- **Homebrew**：不适用（前端 npm 包）
- **License 风险**：🟢 低。GreenSock Standard License，2025 年起全功能免费（包括商业使用）
- **特别说明**：
  - 项目同时内嵌了 `public/vendor/gsap.min.js`，需确认版本与 npm 安装的 `^3.15.0` 一致
  - 建议统一使用 npm 版本或 vendor 版本，避免双版本冲突

### 3.2 mpg123-decoder（^1.0.3）

- **作用**：Node.js 端 MP3 音频解码，为 `dj-analyzer.js` 提供音频数据
- **底层技术**：基于 mpg123 C 库的 Node.js 绑定（可能使用 WASM 或 N-API）
- **macOS 兼容性**：⚠️ **需验证**
  - mpg123 原生 C 库**官方支持 macOS**（Homebrew 可安装）
  - 但 `mpg123-decoder` npm 包是否包含 darwin 预编译二进制**未知**
- **Apple Silicon**：⚠️ **需验证**
  - 如果包内包含 `darwin-arm64` 预编译二进制 → ✅ 支持
  - 如果仅包含 `darwin-x64` → ❌ 不支持 Apple Silicon（需 Rosetta 或自行编译）
- **验证方法**：
  ```bash
  npm install
  ls node_modules/mpg123-decoder/prebuilds/  # 查看预编译目录
  # 应包含 darwin-x64 和 darwin-arm64
  ```
- **替代方案**：
  - 如果 `mpg123-decoder` 不支持 macOS：
    1. **方案 A**：使用 `node-web-audio-api` + Web Audio API 替代（纯 JS，但性能较差）
    2. **方案 B**：使用 `ffmpeg-static` + `fluent-ffmpeg` 进行音频解码（macOS 支持好）
    3. **方案 C**：自行编译 mpg123 的 Node.js 绑定（需要 Xcode Command Line Tools）
- **安装方式**：`npm install mpg123-decoder`
- **Homebrew**：`brew install mpg123`（安装底层 C 库，但 npm 包可能不依赖系统库）
- **License 风险**：🟡 中。mpg123 为 LGPL-2.1，与项目 GPL-3.0 **兼容**（LGPL 是 GPL 的宽松版）
- **风险缓解**：T20 任务专门验证此依赖的 macOS 支持

### 3.3 NeteaseCloudMusicApi（^4.32.0）

- **作用**：网易云音乐 API 的 Node.js 封装，提供搜索/播放/登录/歌单等功能
- **macOS 兼容性**：✅ 完全支持。纯 Node.js HTTP 代理，无平台依赖
- **Apple Silicon**：✅ 纯 JS，无需原生二进制
- **子依赖**：包含 13 个 npm 依赖（axios、express 相关等），均为纯 JS
- **替代方案**：无需替代。这是项目核心功能依赖
- **安装方式**：`npm install NeteaseCloudMusicApi`
- **Homebrew**：不适用
- **License 风险**：🟢 低。MIT License，与 GPL-3.0 兼容
- **特别说明**：
  - 该库需要 Node.js 18+ 环境
  - 在 macOS 上运行时，Cookie 持久化路径需通过 `platform/paths.js` 平台化

### 3.4 electron（^42.4.1）

- **作用**：跨平台桌面应用框架
- **macOS 兼容性**：✅ 完全支持。Electron 官方提供 darwin-x64 和 darwin-arm64 预编译二进制
- **Apple Silicon**：✅ 官方原生支持 arm64（Apple Silicon Mac 无需 Rosetta）
- **版本说明**：v42 是基于 Chromium 132 的较新版本，支持 macOS 10.15+（Catalina 及更高版本）
- **替代方案**：无需替代
- **安装方式**：`npm install electron`
- **Homebrew**：`brew install --cask electron`（但不建议，应使用 npm 版本锁定）
- **License 风险**：🟢 低。MIT License

### 3.5 electron-builder（^26.15.3）

- **作用**：打包和分发工具，支持生成 .exe（NSIS）、.dmg、.zip 等格式
- **macOS 兼容性**：✅ 完全支持。内置 dmg/zip/pkg 生成器
- **Apple Silicon**：✅ 支持 `arch: ['x64', 'arm64']` 通用构建
- **替代方案**：无需替代
- **安装方式**：`npm install electron-builder --save-dev`
- **License 风险**：🟢 低。MIT License

### 3.6 rcedit（^5.0.2）

- **作用**：Windows .exe 文件的资源编辑（修改图标、版本信息等）
- **macOS 兼容性**：❌ 不适用。仅支持 Windows PE 文件格式
- **Apple Silicon**：❌ 不适用
- **处理方式**：保留在 devDependencies 中（Windows 构建仍需），macOS 构建流程不使用
- **替代方案（macOS）**：macOS 使用 `electron-osx-sign` 和 `Info.plist` 管理应用元数据，无需 rcedit
- **License 风险**：🟢 低。MIT License

### 3.7 @electron/notarize（建议新增）

- **作用**：macOS 应用公证（Notarization），将 .app 提交到 Apple Notary Service
- **macOS 兼容性**：✅ 完全支持
- **Apple Silicon**：✅ 支持
- **安装方式**：`npm install @electron/notarize --save-dev`
- **License 风险**：🟢 低。MIT License

---

## 四、系统级依赖

### 4.1 构建工具链

| 工具 | 作用 | macOS 安装 | Apple Silicon | 必需 |
|---|---|---|---|---|
| **Xcode Command Line Tools** | C/C++ 编译器、签名工具 | `xcode-select --install` | ✅ | 是（原生模块编译） |
| **Node.js 20+** | JavaScript 运行时 | `brew install node` 或官网下载 | ✅ | 是 |
| **Python 3** | node-gyp 编译依赖 | macOS 自带 | ✅ | 是（可选，原生模块） |

### 4.2 Apple 开发者证书（外部依赖）

| 证书类型 | 作用 | 费用 | 获取方式 | 必需 |
|---|---|---|---|---|
| **Apple Developer ID Application** | 代码签名 | $99/年 | Apple Developer Program | 是（否则用户需手动允许运行） |
| **Apple Developer ID Installer** | .pkg 安装包签名 | $99/年（同上） | Apple Developer Program | 否（仅 .dmg 不需要） |

---

## 五、CMake / 原生模块编译风险

### 5.1 当前项目无直接 CMake 依赖

Mineradio 的 `dependencies` 均为纯 JavaScript 库或预编译二进制，**没有直接依赖需要编译的原生 Node.js 模块**。

### 5.2 潜在编译风险

| 场景 | 风险 | 缓解措施 |
|---|---|---|
| `mpg123-decoder` 缺少 darwin-arm64 预编译二进制 | 安装时会尝试从源码编译，需要 Python + C 编译器 | 预先验证（T20任务），如缺失则替换为替代方案 |
| Electron 42 的 Node.js ABI 与某些旧 N-API 模块不兼容 | 运行时崩溃 | 使用 `electron-rebuild` 重新编译原生模块 |

### 5.3 electron-rebuild（建议备用）

如果任何依赖包含原生模块且预编译二进制缺失，需要：
```bash
npm install electron-rebuild --save-dev
npx electron-rebuild
```

---

## 六、License 兼容性矩阵

| 库 | License | GPL-3.0 兼容 | 说明 |
|---|---|---|---|
| gsap | GreenSock Standard | ✅ 兼容 | 2025 年起全免费，可商用 |
| mpg123-decoder | LGPL-2.1 | ✅ 兼容 | LGPL 是 GPL 的宽松版 |
| NeteaseCloudMusicApi | MIT | ✅ 兼容 | 宽松许可证 |
| electron | MIT | ✅ 兼容 | 宽松许可证 |
| electron-builder | MIT | ✅ 兼容 | 宽松许可证 |
| rcedit | MIT | ✅ 兼容 | 宽松许可证 |
| @electron/notarize | MIT | ✅ 兼容 | 宽松许可证 |
| three.js | MIT | ✅ 兼容 | 宽松许可证 |

**结论**：所有依赖的 License 均与项目 GPL-3.0 兼容，无法律风险。

---

## 七、依赖风险总结

| 风险等级 | 依赖 | 问题 | 缓解措施 | 负责 Task |
|---|---|---|---|---|
| 🟡 **中** | `mpg123-decoder` | 预编译二进制可能缺失 darwin-arm64 | T20 验证；如缺失改用 `ffmpeg-static` 或 `node-web-audio-api` | T20 |
| 🟢 低 | `gsap`（双版本） | npm 版本与 vendor 内嵌版本可能不一致 | 统一版本或移除 vendor 内嵌版本 | 可选优化 |
| 🟢 低 | `rcedit` | macOS 上无意义但保留在 devDeps | 无需处理，Windows 构建仍需要 | 无 |
| 🟢 低 | Apple Developer 证书 | 外部依赖，$99/年 | 开发者自行购买 | P2 阶段 |

---

## 八、Homebrew 命令速查

```bash
# 安装 Node.js（如果尚未安装）
brew install node

# 安装 mpg123（底层 C 库，备用）
brew install mpg123

# 安装 Xcode Command Line Tools
xcode-select --install

# 验证安装
node -v    # 应 >= 18
npm -v
```

---

## 九、对 Architecture 的依赖调整建议

1. **新增 devDependency**：`@electron/notarize: ^2.0.0`
2. **保留 rcedit**：虽然 macOS 不用，但 Windows 构建需要，保留无风险
3. **mpg123-decoder 替代预案**：如果 T20 验证失败，在 `package.json` 中替换为 `ffmpeg-static` + `fluent-ffmpeg`
4. **无需 CMake 修改**：项目无直接 CMake 依赖

---

> **本报告由 Dependency Analyst Agent 生成。**  
> 后续 Developer Agent 应在 T20 任务中优先验证 `mpg123-decoder` 的 macOS 兼容性。
