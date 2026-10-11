import { Avatar, Button, Dropdown, Layout, Menu, Spin, Tooltip } from 'antd'
import { DownOutlined, LoginOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'

const { Header, Sider, Content } = Layout

function shade(hex, amount = 0.85) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
    if (!m) return hex
    const n = parseInt(m[1], 16)
    const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 0xff) * amount)))
    const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 0xff) * amount)))
    const b = Math.max(0, Math.min(255, Math.round((n & 0xff) * amount)))
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

/**
 * 通用左菜单架子 AppLayout — lead 008 §1/§11/§12/§15/§16 全 46 仓 suit 强制落地。
 *
 * props:
 *   - menuItems / appTitle / appShort / appIcon / headerExtra / loading: 同 z-vector-component 原版
 *   - appVersion?: string — sider 展开态展示「z-vector@1.0.5」格式
 *   - appUser?: { name, role } — Header 右上角 avatar+name+下拉（profile/退出登录）
 *   - loginPath?: string — 退出登录跳转目标，缺省按 menuItems[0].key 自动推导（/home → /login）
 */
export function AppLayout({
                             menuItems = [],
                             appTitle = 'One Company',
                             appShort = 'OC',
                             appVersion,
                             appIcon,
                             appUser,
                             loginPath,
                             headerExtra,
                             loading = false,
                         }) {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const handleMenuClick = ({ key }) => { navigate(key) }

    // 退出登录跳转：loginPath 显式传优先；否则按 menuItems[0].key 自动推导 /<产品>/home → /<产品>/login
    const computeLoginPath = () => {
        if (loginPath) return loginPath
        const first = menuItems && menuItems[0]
        const k = first && first.key
        if (typeof k === 'string' && k.endsWith('/home')) {
            return k.slice(0, -4) + 'login'
        }
        return '/login'
    }

    // URL 即状态（lead 008 §11）：用 location.pathname 的最长菜单前缀作 selectedKey
    const collectKeys = (items, acc = []) => {
        for (const it of items || []) {
            if (it?.key) acc.push(it.key)
            if (it?.children) collectKeys(it.children, acc)
        }
        return acc
    }
    const selectedKey = (() => {
        const keys = collectKeys(menuItems)
        const p = location.pathname
        return keys.filter((k) => p === k || p.startsWith(k + '/'))
            .sort((a, b) => b.length - a.length)[0] || p
    })()

    const renderBrand = () => {
        if (collapsed) {
            if (appIcon) {
                const { icon, color = '#7c3aed', label = appTitle } = appIcon
                const node = (
                    <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: `linear-gradient(135deg, ${color}, ${shade(color, 0.7)})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                        overflow: 'hidden',
                    }}>{icon}</div>
                )
                return <Tooltip title={label} placement="right">{node}</Tooltip>
            }
            return appShort
        }
        return (
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, whiteSpace: 'nowrap' }}>
                {appTitle}
                {appVersion && (
                    <span style={{
                        color: 'rgba(255,255,255,0.55)', fontWeight: 400, fontSize: 12, marginLeft: 4,
                    }}>@{appVersion}</span>
                )}
            </span>
        )
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div style={{
                    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {renderBrand()}
                </div>
                {loading ? (
                    <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
                ) : (
                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[selectedKey]}
                        items={menuItems}
                        onClick={handleMenuClick}
                    />
                )}
            </Sider>
            <Layout>
                <Header style={{
                    height: 48, lineHeight: '48px', padding: '0 16px', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #f1f5f9',
                }}>
                    <span onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 18, cursor: 'pointer' }}>
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {appUser && (
                            <Dropdown
                                menu={{
                                    items: [
                                        { key: 'profile', label: `${appUser.name}（${appUser.role || '用户'}）`, disabled: true },
                                        { type: 'divider' },
                                        {
                                            key: 'logout', label: '退出登录', onClick: () => {
                                                localStorage.removeItem('token')
                                                localStorage.removeItem('userInfo')
                                                window.location.href = computeLoginPath()
                                            },
                                        },
                                    ],
                                }}
                                placement="bottomRight"
                            >
                                <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <Avatar size={28} style={{ background: '#7c3aed' }}>
                                        {(appUser.name || '?').slice(0, 1).toUpperCase()}
                                    </Avatar>
                                    <span style={{ fontSize: 13, color: '#0f172a' }}>{appUser.name}</span>
                                    <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
                                </span>
                            </Dropdown>
                        )}
                        {!appUser && (
                            <Button type="primary" size="small" icon={<LoginOutlined />}
                                    onClick={() => { window.location.href = computeLoginPath() }}>
                                登录
                            </Button>
                        )}
                        {headerExtra}
                    </div>
                </Header>
                <Content style={{ margin: 16, padding: 24, background: '#fff', minHeight: 280 }}>
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    )
}

export default AppLayout
