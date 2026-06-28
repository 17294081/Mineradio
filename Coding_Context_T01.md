# Coding Context — T01: 创建 platform/index.js 平台检测模块

> **Task**: T01  
> **目标**: 创建平台抽象层的入口文件  
> **生成时间**: 2026-06-28  
> **前置文档**: `Project_Analysis.md`, `Architecture.md`, `Tasks.md`, `Dependency_Report.md`

---

## 当前 Task 涉及

### 模块
- **新增模块**: `platform/index.js` — 平台抽象层入口
- **上游调用方**: `platform/paths.js`（T02）, `platform/chromium-switches.js`（T03）, `platform/shortcuts.js`（T04）, `desktop/main.js`, `server.js`

### 接口
```javascript
module.exports = {
  PLATFORM: { isWin, isMac, isLinux },
  platformName: string // 'win32' | 'darwin' | 'linux'
};
```

### 调用关系
```
platform/index.js
    ├── platform/paths.js (T02) ──→ server.js, main.js
    ├── platform/chromium-switches.js (T03) ──→ main.js
    ├── platform/shortcuts.js (T04) ──→ main.js
    └── 直接 require ──→ main.js, server.js（可选）
```

### 依赖关系
- **Node.js 内置**: `os` 模块
- **无外部 npm 依赖**
- **无前置 Task**

### 禁止修改部分
- 不修改任何现有文件（`desktop/main.js`, `server.js`, `package.json`）
- 不修改 `public/` 下任何前端文件
- 不引入新的 npm 依赖

### 兼容要求
- Windows: `isWin === true`, `isMac === false`, `isLinux === false`
- macOS: `isWin === false`, `isMac === true`, `isLinux === false`
- Linux: `isWin === false`, `isMac === false`, `isLinux === true`
- `platformName` 必须与 `process.platform` / `os.platform()` 返回值一致

### 建议阅读源码顺序
1. `Tasks.md` — T01 验收标准
2. `Architecture.md` — ADR-2（平台抽象层设计）
3. `desktop/main.js` 开头部分 — 了解当前 `process.platform` 的使用方式

### 可能影响模块
- 所有后续 `platform/` 模块（T02~T04）
- `desktop/main.js`（T06, T14, T15）
- `server.js`（T05）

---

## 代码实现要求

### 文件位置
```
Mineradio/
└── platform/
    └── index.js    ← 本 Task 创建
```

### 代码规范
- 使用 CommonJS（`require`/`module.exports`），与项目现有代码风格一致
- 不使用 ES6 模块语法（项目无 Babel/TypeScript 配置）
- 常量使用大写命名
- 导出对象结构需与 Architecture.md 中定义一致

### 实现细节
- 使用 `os.platform()` 而非 `process.platform`（两者等价，但 `os` 模块更明确）
- 导出应为单例（首次 require 时计算，后续复用）
- 不可变对象（冻结 `PLATFORM` 对象防止意外修改）

---

## 验收标准（来自 Tasks.md）

- [ ] 文件创建成功
- [ ] `require('./platform')` 在任何平台都能正确返回 `{ isWin, isMac, isLinux }`
- [ ] 在 Windows 上 `isWin === true`，其他为 `false`
- [ ] 在 macOS 上 `isMac === true`，其他为 `false`
- [ ] 单元测试：手动运行 `node -e "console.log(require('./platform'))"` 验证输出

---

> 本 Context 由 Context Engineer Agent 生成。Senior Software Engineer 可直接基于此开始编码。
