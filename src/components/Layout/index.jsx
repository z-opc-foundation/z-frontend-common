import { Avatar, Button, Dropdown, Spin, Tooltip } from 'antd'
import { DownOutlined, LoginOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import MenuTree from '../ui/MenuTree.jsx'
import SidebarShell from '../ui/SidebarShell.jsx'

function collectItems(items) {
    return (items || []).flatMap((item) => item ? [item, ...collectItems(item.children)] : [])
}

function routePath(key) {
    return typeof key === 'string' && key.startsWith('/') && !key.startsWith('//')
        ? key.split(/[?#]/)[0]
        : null
}

export function AppLayout({
    menuItems = [],
    appTitle = 'One Company',
    appShort = 'OC',
    appVersion,
    appIcon,
    appUser,
    loginPath,
    tokenKey = 'token',
    userInfoKey = 'userInfo',
    headerExtra,
    loading = false,
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const items = collectItems(menuItems)
    const selectedItem = items
        .filter((item) => item.type !== 'group' && item.type !== 'divider' && routePath(item.key))
        .filter((item) => {
            const path = routePath(item.key)
            return location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`))
        })
        .sort((a, b) => routePath(b.key).length - routePath(a.key).length)[0]

    const toTreeItem = (item, ancestors = []) => {
        const path = routePath(item.key)
        const href = item.href || (path ? item.key : undefined)
        return {
            key: item.key,
            label: item.label,
            icon: item.icon,
            title: item.title,
            disabled: item.disabled,
            active: item === selectedItem,
            href,
            target: item.target,
            children: item.children?.filter((child) => child && child.type !== 'divider')
                .map((child) => toTreeItem(child, [...ancestors, item.key])),
            onClick: href || item.onClick ? (event) => {
                if (item.disabled) return
                item.onClick?.({ key: item.key, keyPath: [item.key, ...ancestors.slice().reverse()], domEvent: event })
                if (event.defaultPrevented) return
                if (href && routePath(href) && item.target !== '_blank'
                    && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                    event.preventDefault()
                    navigate(href)
                }
            } : undefined,
        }
    }
    const topItems = menuItems.filter((item) => item && item.type !== 'group' && item.type !== 'divider').map((item) => toTreeItem(item))
    const groups = menuItems.filter((item) => item?.type === 'group').map((group, index) => ({
        key: group.key || `group-${index}`,
        title: group.label,
        items: (group.children || []).filter((item) => item && item.type !== 'divider').map((item) => toTreeItem(item)),
    }))
    const home = items.find((item) => routePath(item.key)?.endsWith('/home'))
    const resolvedLoginPath = loginPath || (home ? `${routePath(home.key).slice(0, -4)}login` : '/login')

    return (
        <div style={{ height: '100dvh', minHeight: 280, display: 'flex', flexDirection: 'column', background: '#fff', color: '#172033' }}>
            <header style={{
                minHeight: 48, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16,
                justifyContent: 'space-between', borderBottom: '1px solid #e2e4e8', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    {appIcon?.icon && <span aria-hidden="true" style={{ color: appIcon.color || '#0052d9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, flexShrink: 0, fontSize: 20 }}>{appIcon.icon}</span>}
                    <Tooltip title={appVersion ? `${appTitle} · ${appVersion}` : appTitle}>
                        <span style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appTitle || appShort}</span>
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    {headerExtra}
                    {appUser ? (
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'profile', label: `${appUser.name}（${appUser.role || '用户'}）`, disabled: true },
                                    { type: 'divider' },
                                    {
                                        key: 'logout', label: '退出登录', onClick: () => {
                                            localStorage.removeItem(tokenKey)
                                            localStorage.removeItem(userInfoKey)
                                            window.location.href = resolvedLoginPath
                                        },
                                    },
                                ],
                            }}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <Button type="text" aria-label="用户菜单" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Avatar size={24} style={{ background: '#0052d9' }}>{(appUser.name || '?').slice(0, 1).toUpperCase()}</Avatar>
                                <span>{appUser.name}</span>
                                <DownOutlined style={{ fontSize: 10 }} />
                            </Button>
                        </Dropdown>
                    ) : (
                        <Button size="small" icon={<LoginOutlined />} onClick={() => { window.location.href = resolvedLoginPath }}>登录</Button>
                    )}
                </div>
            </header>
            <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0 }}>
                <SidebarShell width={232} storageKey={`zfc-sidebar:${appShort}`}>
                    {loading ? (
                        <div role="status" aria-label="正在加载菜单" style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
                    ) : <MenuTree topItems={topItems} groups={groups} />}
                </SidebarShell>
                <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'auto', padding: 16 }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AppLayout
