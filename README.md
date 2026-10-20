# z-frontend-common

> z-opc-foundation 全仓共享前端基座 —— lead 008《前端开发规范》§1-§16 的唯一承载仓。

工作区内 **40** 个 `*-suit` 工程通过同一份 AppLayout / LoginPage 获得一致的
左菜单架子、登录流程与右上角用户组件；**31** 个 `*-component` 工程声明依赖本包
（其中 **29** 个在源码里真的 import）。
**改一处，全仓同步**。

---

## 基本信息

| 字段 | 值 |
|------|-----|
| 仓 | `z-opc-foundation/z-frontend-common`（本仓） |
| npm 包 | `@yuku123/z-frontend-common`（scope 沿用 yuku123，与 0.1.x/0.2.x 旧线连续） |
| 当前版本 | `1.1.1` —— 1.0 语义：§1-§16 规范化起点；1.1.x 在其上追加扁平 ui 组件桶。0.1.x 是 pre-§16 形态；0.2.x 内嵌 react-dom 已废弃 |
| 技术栈 | React 19 + antd 6 + react-router-dom 7 + Vite 6（lead 005 §3.0 版本线单一尺子） |
| 产物 | ESM **3 入口**（`formats: ['es']`）：`dist/index.js`（主桶）+ `dist/ui.js`（扁平 ui 桶）+ `dist/ui-echarts.js`（`ui/echarts` 子路径） |
| 打包策略 | external 精确 **9** 个包 + **1** 条前缀规则（`echarts/*`）：react / react-dom / react-dom/client / react/jsx-runtime / react-router-dom / antd / @ant-design/icons / axios / echarts |
| axios | 声明在 `dependencies`（由消费方安装，`_shared/` vendoring 时期的决策保留：避免消费方从无 node_modules 的目录解析 axios）；bundle 侧 external，不打进产物 |

## 对外 API（0.1.1 契约完全兼容 + 两处升级 + 一处新增；1.1.x 追加扁平 ui 桶）

| 导出 | 说明 |
|------|------|
| `AppLayout` | **升级**：§1 sider 双模式品牌区（暗主题显式白字 / 折叠 36×36 圆角图标 + Tooltip）、§11 selectedKey 最长菜单前缀、§12 sider 顶 `产品名@版本`、§15 Header 48px + 1px 下边线、§16 `appUser` 右上角下拉（profile + 退出登录，`loginPath` 按 `menuItems[0].key` 自动推导可覆盖） |
| `LoginPage` | **升级**：`mockAuth` 双模式 —— 传 `{username, password, user}` 走纯前端校验（CTC/SSO 接入前短期形态）；缺省走 `loginApi` 真实端点 |
| `EmptyState` | **已实装**：`src/components/ui/EmptyState.jsx`（44×44 触控目标、默认标题「暂无数据」、可选 action 按钮），由扁平 ui 桶导出 |
| `StatusTag` / `defaultStatusMap` | 0.1.1 契约原样保留 |
| `ErrorBoundary` | 0.1.1 契约原样保留（antd Result 形态重绘） |
| `createRequest(options)` | axios 实例工厂：`{baseURL='/api', timeout=10000, tokenKey='token', userInfoKey='userInfo', unauthorizedRedirect='/login'}`；31 个 `*-component` 工程声明依赖本包 |
| `request` / `authRequest` | 预建实例（`createRequest()` 双份，0.1.1 契约） |
| `setupInterceptors` | 拦截器装配（Bearer token 注入 + 401 清凭跳登录 + 响应解包） |
| `unwrapResponse` | **新增显式导出**：`{code, data}` 包装解包 / 裸数据透传（z-opc Spring MVC 统一返回体兼容） |
| `ui` 扁平桶（`export *`） | **1.1.x 追加**：13 个 UI 组件文件导出 **14** 个具名（`TableToolbar` 同时导出 `RefreshButton`）+ **9** 个 design token（`brand` / `palette` / `neutral` / `radius` / `shadow` / `lift` / `space` / `fontSize` / `antdTheme`）= **23** 个具名导出 |
| `EChartsChart` | 走子路径 `@yuku123/z-frontend-common/ui/echarts`（不进扁平桶：让不画图的域解析 `echarts/core` 会构建失败） |
| `default`（桶） | `{AppLayout, StatusTag, defaultStatusMap, LoginPage, ErrorBoundary, request, authRequest, createRequest}` —— 0.1.1 形状原样，**8** 个成员 |

## AppLayout props

```jsx
<AppLayout
    menuItems={menuConfig}        // antd Menu items，每项必须带 icon（§10）
    appTitle="z-vector"           // sider 展开态文字
    appShort="ZV"                 // 无 appIcon 时折叠态缩写
    appVersion="1.0.5"            // §12：展开态渲染 z-vector@1.0.5（不要 "v" 前缀）
    appIcon={{icon, color, label}} // §1：折叠态 36×36 圆角色板 + Tooltip
    appUser={{name, role}}        // §16：右上角 Avatar+name+DownOutlined 下拉
    loginPath="/z-vector/login"   // 可选，缺省按 menuItems[0].key 自动推导 /<产品>/login
    headerExtra={<.../>}          // Header 右侧追加内容（版本号别放这，§12）
    loading={false}               // 菜单区 loading 占位
/>
```

## suit 接入模板（lead 008 §16）

```jsx
import { AppLayout, LoginPage, ErrorBoundary } from '@yuku123/z-frontend-common'
import { menuConfig, routes, appMeta } from '@yuku123/<repo>-component/pages'

const MOCK_AUTH = { username: 'admin', password: '123456', user: { name: 'admin', role: '管理员' } }

// <Route path="/<repo>/login" element={<LoginPage title="<repo> 管理台" mockAuth={MOCK_AUTH} redirectUrl="/<repo>/home" />} />
// <Route element={<ProtectedShell/>}> 内挂 <AppLayout menuItems={menuConfig} appTitle={appMeta.title} appVersion="…" appUser={user} />
```

完整模板见 lead 008 §16；出厂自检清单见 §9。

## 文档目录

本项目文档统一收口在 `_doc/` 下（八类固定编号表，桶按需存在）:

- [`_doc/001_arch/`](_doc/001_arch/) — 架构、接口、DB schema、协议、路线图

## 历史

- `0.1.0 – 0.1.6`：早期形态（pre-§16），源码曾位于 `yuku123/z-opc` 仓的 `z-frontend-common/` 子目录
- `0.2.x`：内嵌 react-dom 的失败尝试线，已废弃
- 应急过渡：`z-opc-foundation/_shared/z-frontend-common-local/` vendoring（不入 git，1.0.0 发版后退役）
- `1.0.0`：独立仓首版 —— 源码自 vendoring 迁入，API 契约兼容 0.1.1，AppLayout/LoginPage 升级 §1-§16 规范版
- `1.1.1`：在 1.0.0 之上追加扁平 ui 组件桶（13 个 UI 组件 + design token）与 `ui/echarts` 子路径
