# 项目总览

## 1. 项目简介

z-frontend-common 是 z-opc-foundation **全仓共享的前端基座** —— lead 008《前端开发规范》§1-§16 的唯一承载仓。对外只发布一个 npm 包 `@yuku123/z-frontend-common`（`package.json` 当前版本 `1.1.1`），提供三样东西：管理台壳层 `AppLayout`、统一登录页 `LoginPage`、以及一套 UI 通用组件库与 axios 请求工厂。

它不产出可部署应用，只产出**被消费的库**：本组织各 `z-*` 产品仓的 `_frontend/*-suit` 管理台用同一份 `AppLayout` / `LoginPage` 获得一致的左菜单架子、登录流程与右上角用户组件；各 `_frontend/*-component` 的 services 层用同一份 axios 拦截器工厂。改一处，全仓同步。

**技术栈：** React 19 + antd 6 + react-router-dom 7 + Vite 6（lib 模式，ESM 单文件产物，react / antd / axios / echarts 全部 external）

## 2. 模块架构

```
z-frontend-common/
├── package.json               # npm 包元信息：exports 三子路径 + deps/peerDeps
├── vite.config.mjs            # lib 模式三入口构建 + external 规则
├── README.md
└── src/
    ├── index.js               # 桶导出：具名导出 + 0.1.1 形状的 default 桶
    ├── components/
    │   ├── Layout/index.jsx       # AppLayout 管理台壳层
    │   ├── LoginPage/index.jsx    # LoginPage 登录页（mock / 真实双模式）
    │   ├── StatusTag/index.jsx    # StatusTag + defaultStatusMap
    │   ├── ErrorBoundary/index.jsx
    │   └── ui/                    # UI 通用组件库（独立子路径导出）
    │       ├── index.js           # 组件再导出 + tokens 再导出
    │       ├── tokens.js          # 设计 token（brand / palette / neutral / ...）
    │       ├── echarts.js         # EChartsChart（本目录唯一引 echarts 的组件）
    │       └── *.jsx              # 14 个通用组件
    └── services/
        └── request.js        # axios 实例工厂 + 拦截器装配 + 响应解包
```

## 3. 核心功能

### 3.1 管理台壳层 `AppLayout`

`src/components/Layout/index.jsx` 导出，承载规范 §1 / §11 / §12 / §15 / §16：sider 品牌区（暗主题显式白字 / 折叠态 36×36 圆角色板 + Tooltip）、`selectedKey` 按最长菜单前缀匹配、sider 顶展示「产品名@版本」、Header 48px + 1px 下边线、右上角 `appUser` 头像 + 名字 + 下拉（profile / 退出登录）。

props：`menuItems`（默认 `[]`）、`appTitle`（默认 `One Company`）、`appShort`（默认 `OC`）、`appVersion`、`appIcon`、`appUser`、`loginPath`、`headerExtra`、`loading`（默认 `false`）。`loginPath` 缺省时按 `menuItems[0].key` 自动推导「/&lt;产品&gt;/home → /&lt;产品&gt;/login」。

### 3.2 统一登录页 `LoginPage`

`src/components/LoginPage/index.jsx` 导出，双模式：

- 传 `mockAuth`（`{username, password, user:{name, role}}`）→ 纯前端校验，登录成功把 `mock-<username>` 写进 `localStorage.token`。
- 缺省 → `POST loginApi`（默认 `/auth/login`）拿真实端点签发的 token。

### 3.3 UI 通用组件库（子路径 `@yuku123/z-frontend-common/ui`）

`src/components/ui/` 下 14 个 `.jsx` 组件 + `tokens.js` + `echarts.js`：

- 视觉类：`GradientStatCard`、`CategoryDot`、`SectionHeader`、`FeatureCard`、`DarkBanner`
- 交互类：`EmptyState`、`ErrorState`、`LoadingState`、`SearchInput`、`PageHeader`、`TableToolbar`（同文件另导出 `RefreshButton`）、`StatusBadge`、`PagedTable`
- `EChartsChart` 走独立子路径 `@yuku123/z-frontend-common/ui/echarts`（`ui/index.js` 注释明确它不参与主入口再导出）
- `tokens.js` 导出 `brand`、`palette`、`neutral`、`radius`、`shadow`、`lift`、`space`、`fontSize`、`antdTheme`

### 3.4 请求层 `src/services/request.js`

- `unwrapResponse(body)`：`{code, data}` 双键命中时按包装解（`code !== 200` 则 `Promise.reject(new Error(body.message))`，否则返回 `body.data`）；裸数据原样透传。
- `setupInterceptors(instance, options)`：请求拦截从 `localStorage[tokenKey]` 注入 `Authorization: Bearer <token>`；响应拦截在 401 时清掉 token 与 userInfo 并跳 `unauthorizedRedirect`，403 / 500 分别 `console.error`。
- `createRequest(options)`：axios 实例工厂，默认 `baseURL='/api'`、`timeout=10000`、`tokenKey='token'`、`userInfoKey='userInfo'`、`unauthorizedRedirect='/login'`。
- `request` / `authRequest`：工厂预建的两个实例。

### 3.5 既有导出

`StatusTag` 与 `defaultStatusMap`（`src/components/StatusTag/index.jsx`，4 个状态映射）、`ErrorBoundary`（antd Result 形态）保持 0.1.1 契约不变。

## 4. 对外集成 / 上下游

**本仓无对外 HTTP 边界** —— 不监听端口、不出网、不提供服务端；只作为 npm 包被消费。

**上游依赖：**

| 依赖 | 声明位置 | 作用 |
|---|---|---|
| `axios` ^1.16.1 | `dependencies` | 请求层（内联为运行时依赖，避免消费方从无 node_modules 的目录解析） |
| `react` ^19 / `react-dom` ^19 | `peerDependencies` | 组件运行时 |
| `react-router-dom` ^7 | `peerDependencies` | `AppLayout` 菜单跳转用 `useNavigate` / `useLocation` |
| `antd` ^6 / `@ant-design/icons` ^6 | `peerDependencies` | UI 组件与图标 |
| `echarts` | 构建期 external | 仅 `EChartsChart` 使用，运行期由消费方提供 |
| `vite` ^6 / `@vitejs/plugin-react` ^4 | `devDependencies` | lib 模式构建 |

**下游消费方（本机实测 grep，非 README 口径）：** 全仓 40 个 `_frontend/*-suit` 目录存在；其中 22 个 `_frontend/*-component` 的 services 层引用 `createRequest`（`z-agent` / `z-bot` / `z-camuda` / `z-config` / `z-ctc` / `z-ext` / `z-indexer` / `z-llm-gateway` / `z-meta` / `z-observer` / `z-ops` / `z-oss` / `z-product` / `z-rpa` / `z-rpc` / `z-schedule` / `z-skill` / `z-task` / `z-team` / `z-trade` / `z-webide` / `z-wf`）。

## 5. 技术特点

1. **库模式三入口**：`vite.config.mjs` 的 lib 配置同时产出 `dist/index.js` / `dist/ui.js` / `dist/ui-echarts.js`，`package.json` 的 `exports` 把 `.` / `./ui` / `./ui/echarts` 三个子路径一一对应，消费方按需引入、互不拖累。
2. **全 external 杜绝双实例**：react / react-dom / react-dom/client / react/jsx-runtime / react-router-dom / antd / @ant-design/icons / axios / echarts 及 `echarts/*` 全部 external，消费方用自己的 node_modules 解析，不会出现两份 React。
3. **echarts 用函数式 external 判定**：echarts 走的是深层子路径（`echarts/core`、`echarts/charts`、`echarts/components`、`echarts/renderers`），字符串数组匹配不到前缀，故用 `id.startsWith('echarts/')`。
4. **default 桶契约不破坏**：除具名导出外保留 0.1.1 形状的 default 桶（`AppLayout` / `StatusTag` / `defaultStatusMap` / `LoginPage` / `ErrorBoundary` / `request` / `authRequest` / `createRequest`），老调用方 `import zfc from '@yuku123/z-frontend-common'` 不断。
5. **响应解包显式导出**：`unwrapResponse` 作为独立导出暴露给未装拦截器的调用方，同时兼容 z-opc 的 `{code, data, message}` 统一返回体与 standalone 后端的裸数据两种形态。
6. **EChartsChart 隔离在独立子路径**：它是 `src/components/ui/` 下唯一引 echarts 的组件，不进主入口再导出，避免主包把 echarts 拖进消费方依赖图。

## 6. 目录结构

本仓无 Java 包树，源码按「壳层组件 / UI 组件库 / 请求服务」三段组织：

```
src/
├── index.js                # 桶导出入口：具名导出 + default 桶
├── components/
│   ├── Layout/             # AppLayout —— 管理台壳层（antd Layout + Menu）
│   ├── LoginPage/          # LoginPage —— 登录页（mock / 真实端点双模式）
│   ├── StatusTag/          # StatusTag + defaultStatusMap
│   ├── ErrorBoundary/      # 错误边界
│   └── ui/                 # UI 通用组件库
│       ├── index.js        # 再导出面（组件 + tokens）
│       ├── tokens.js       # 设计 token 与 antdTheme
│       ├── echarts.js      # EChartsChart 子路径入口
│       └── *.jsx           # 14 个通用组件
└── services/
    └── request.js          # createRequest / setupInterceptors / unwrapResponse / request / authRequest
```
