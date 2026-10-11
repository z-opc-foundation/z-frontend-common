import { useState } from 'react'
import { Alert, Button, Card, Form, Input, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { request } from '../../services/request'

/**
 * 统一登录页（lead 008 §16）—— mockAuth / 真实 API 双模式：
 * <ul>
 *   <li>{@code mockAuth} 传入 → 纯前端校验（admin/123456 硬编码顶替，CTC/SSO 接入前短期形态），
 *       登录成功写 localStorage.token + userInfo 并跳 redirectUrl</li>
 *   <li>{@code mockAuth} 缺省 → POST {@code loginApi}（CTC 中央认证），后端签发 token</li>
 * </ul>
 *
 * @param {string}  [title='统一管理平台']  卡片标题
 * @param {Object}  [mockAuth]  {username, password, user:{name, role}} 本地 mock 校验配置
 * @param {string}  [loginApi='/auth/login']  真实登录端点（mockAuth 缺省时生效）
 * @param {string}  [redirectUrl='/']  登录成功跳转
 * @param {Function} [onSuccess]  登录成功回调（覆盖 redirectUrl 跳转）
 */
export default function LoginPage({
                                      title = '统一管理平台',
                                      mockAuth,
                                      loginApi = '/auth/login',
                                      redirectUrl = '/',
                                      onSuccess,
                                  }) {
    const [loading, setLoading] = useState(false)

    const persistAndRedirect = (user) => {
        localStorage.setItem('token', mockAuth ? 'mock-' + mockAuth.username : user?.token || 'token')
        localStorage.setItem('userInfo', JSON.stringify(user || {}))
        message.success('登录成功' + (mockAuth ? '（mock 模式，待 CTC/SSO 接入）' : ''))
        if (onSuccess) onSuccess(user)
        else window.location.href = redirectUrl
    }

    const handleSubmit = async (values) => {
        setLoading(true)
        try {
            if (mockAuth) {
                if (values.username === mockAuth.username && values.password === mockAuth.password) {
                    persistAndRedirect(mockAuth.user)
                } else {
                    message.error('用户名或密码错误')
                }
                return
            }
            const res = await request.post(loginApi, values)
            if (res?.token) {
                localStorage.setItem('token', res.token)
                localStorage.setItem('userInfo', JSON.stringify(res.user || res))
                message.success('登录成功')
                if (onSuccess) onSuccess(res)
                else window.location.href = redirectUrl
            } else {
                message.error('登录失败：未获取到 token')
            }
        } catch (err) {
            message.error(err.response?.data?.message || err.message || '登录失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: '#f0f2f5',
        }}>
            <Card title={title} style={{ width: 400 }}>
                {mockAuth && (
                    <Alert
                        type="info" showIcon style={{ marginBottom: 16 }}
                        message={`Mock 模式：用户名 ${mockAuth.username} / 密码 ${mockAuth.password}`}
                    />
                )}
                <Form onFinish={handleSubmit} size="large">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            登 录
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
