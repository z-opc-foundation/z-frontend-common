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
//
// ⚠ 桶额外**转发 axios 的 HTTP 动词方法**（get/post/put/patch/delete/head/options）。
//   起因：仓里有 6 个包的 services/api.js 写的是「默认导入当 axios 实例用」——
//   `import request from '@yuku123/z-frontend-common'` 然后 `request.get('/xxx')`，
//   而默认导出是桶对象 ⇒ request.get 不存在 ⇒ 一调就抛
//   "TypeError: Xt.get is not a function"（线上 /msg/inbox 白屏就是它，2026-10-20 实测）。
//   那 6 个包的 dist 已发到 npm（z-oss / z-mq / z-gw / z-cache / z-graph / z-msg），
//   改它们要逐个重新发版；这里在桶上补一层转发，让「默认导入当 axios 用」的老写法继续能跑。
//   逐个转发（而不是 Object.assign(bucket, request)）：axios 实例自己也有个 .request 方法，
//   整包 assign 会把桶里 request=「axios 实例」这个契约覆盖成 axios 的 request 方法。
const httpVerbs = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
const bucket = {
    AppLayout,
    StatusTag,
    defaultStatusMap,
    LoginPage,
    ErrorBoundary,
    request,
    authRequest,
    createRequest,
}
for (const verb of httpVerbs) {
    if (typeof request[verb] === 'function' && !(verb in bucket)) {
        bucket[verb] = (...args) => request[verb](...args)
    }
}
export default bucket
