import axios from 'axios'
import { message } from 'antd'

/**
 * 统一响应解包：z-opc 后端走 {code, data, message} 包装（Spring MVC 统一返回体），
 * 独立 standalone 后端可能返回裸数据。有 code+data 双键就按包装解，否则原样透传。
 * （z-vector standalone 实测坑：不解包全站拿 undefined —— 见 z-vector 仓 2026-10-11 修痕。）
 */
export function unwrapResponse(body) {
    if (body && typeof body === 'object' && 'code' in body && 'data' in body) {
        return body.code !== 200
            ? Promise.reject(new Error(body.message || '请求失败'))
            : body.data
    }
    return body
}

/**
 * axios 拦截器装配（request / authRequest 预建实例与 createRequest 工厂共用）。
 * 与 0.1.1 的 API 契约逐字段一致，31 个 component 仓的 services 层在消费，不能改签名。
 */
export function setupInterceptors(instance, options = {}) {
    const {
        tokenKey = 'token',
        userInfoKey = 'userInfo',
        unauthorizedRedirect = '/login',
    } = options

    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem(tokenKey)
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
    })

    instance.interceptors.response.use(
        (response) => unwrapResponse(response.data),
        (error) => {
            const status = error.response?.status
            if (status === 401) {
                // ⚠ 401 有两种含义，HTTP 码一样但语义相反，必须分开：
                //   会话 401（平台 SSO 层）: {"success":false,"code":401,"message":"未登录或Token无效","data":null}
                //   业务 401（子域自己的凭据/口径）: {"success":false,"errorCode":"MISSING_API_KEY","message":"..."}
                // 业务 401 **不是**平台会话过期 —— 清 token 跳登录会把人直接踢出系统。
                // 实测（2026-10-20）：z-script 的 /api/script/** 被它自己的 ApiKeyAuthInterceptor
                // 拦成 401 MISSING_API_KEY，一进 /script/manage 就被踢回 /login
                // （运维面当年为此把该页从菜单里摘掉了）。
                // 判据用「响应体带 errorCode」：平台会话 401 不带 errorCode，业务 401 带 —— 互斥，不会误伤真会话失效。
                const body = error.response?.data
                const isBusiness401 = !!(body && typeof body === 'object' && body.errorCode)
                if (isBusiness401) {
                    console.warn(`[401] 业务鉴权失败（不是会话过期，不跳登录）: ${error.config?.url} → ${body.errorCode}`)
                } else {
                    localStorage.removeItem(tokenKey)
                    localStorage.removeItem(userInfoKey)
                    window.location.href = unauthorizedRedirect
                }
            } else if (status === 403) {
                console.error('没有权限访问该资源')
            } else if (status === 500) {
                console.error('服务器内部错误')
            }
            return Promise.reject(error)
        },
    )
    return instance
}

/**
 * axios 实例工厂 —— 31 个 <repo>-component 的 services/api.js 用它建各自的请求实例。
 * @param {Object} options
 * @param {string}  [options.baseURL='/api']
 * @param {number}  [options.timeout=10000]
 * @param {string}  [options.tokenKey='token']
 * @param {string}  [options.userInfoKey='userInfo']
 * @param {string}  [options.unauthorizedRedirect='/login']
 */
export function createRequest(options = {}) {
    const instance = axios.create({
        baseURL: options.baseURL ?? '/api',
        timeout: options.timeout ?? 10000,
    })
    return setupInterceptors(instance, {
        tokenKey: options.tokenKey,
        userInfoKey: options.userInfoKey,
        unauthorizedRedirect: options.unauthorizedRedirect,
    })
}

export const request = createRequest()
export const authRequest = createRequest()
