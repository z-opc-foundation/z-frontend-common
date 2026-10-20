/**
 * z-frontend-common 桶导出 —— lead 008 前端开发规范唯一承载仓。
 *
 * 40 个 suit 的 AppLayout / LoginPage 唯一来源；31 个 <repo>-component 的
 * services 层消费 createRequest / request / authRequest。
 *
 * API 契约与 0.1.1 完全兼容（ErrorBoundary / LoginPage / StatusTag /
 * authRequest / createRequest / defaultStatusMap / request /
 * setupInterceptors + default 桶），AppLayout 升级为 §1/§11/§12/§15/§16
 * 规范版，LoginPage 扩展 mockAuth 双模式（§16）。
 */

export * from './components/ui/index.js'

export { AppLayout } from './components/Layout/index.jsx'
export { default as LoginPage } from './components/LoginPage/index.jsx'
export { default as StatusTag, defaultStatusMap } from './components/StatusTag/index.jsx'
export { default as ErrorBoundary } from './components/ErrorBoundary/index.jsx'

import { AppLayout } from './components/Layout/index.jsx'
import StatusTag, { defaultStatusMap } from './components/StatusTag/index.jsx'
import LoginPage from './components/LoginPage/index.jsx'
import ErrorBoundary from './components/ErrorBoundary/index.jsx'
import { createRequest, setupInterceptors, unwrapResponse, request, authRequest } from './services/request.js'

export { createRequest, setupInterceptors, unwrapResponse, request, authRequest }

// 0.1.1 default 桶契约原样保留（Ge 对象），老调用方 `import zfc from '@yuku123/z-frontend-common'` 不断
export default {
    AppLayout,
    StatusTag,
    defaultStatusMap,
    LoginPage,
    ErrorBoundary,
    request,
    authRequest,
    createRequest,
}
