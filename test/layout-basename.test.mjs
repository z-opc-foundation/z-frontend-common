import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Router, createPath } from 'react-router-dom'
import { createServer, transformWithEsbuild } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = fileURLToPath(new URL('../src/components/Layout/index.jsx', import.meta.url))
const require = createRequire(import.meta.url)
let vite, AppLayout, compiled
const menus = [
    { key: '/z-script/home', label: 'Home' },
    { key: '/z-script/console', label: 'Console' },
    { key: '/z-script/console/detail', label: 'Detail' },
]

test.before(async () => {
    vite = await createServer({ root, logLevel: 'error', ssr: { resolve: { externalConditions: ['node', 'module-sync'] } }, server: { middlewareMode: true, hmr: false }, appType: 'custom' })
    AppLayout = (await vite.ssrLoadModule('/src/components/Layout/index.jsx')).default
    compiled = (await transformWithEsbuild(await readFile(source, 'utf8'), source, { loader: 'jsx', format: 'cjs', jsx: 'automatic' })).code
})
test.after(async () => { await vite?.close() })

for (const basename of ['/', '/script', '/script/']) {
    test(`real useHref resolves native anchors under ${basename}`, () => {
        const base = basename.replace(/\/$/, '')
        const html = renderToStaticMarkup(createElement(MemoryRouter, { basename, initialEntries: [`${base}/z-script/console/detail/42`] },
            createElement(AppLayout, { menuItems: menus })))
        assert.ok(html.includes(`href="${base}/z-script/home"`))
        assert.equal((html.match(/aria-current="page"/g) || []).length, 1)
        assert.match(html, new RegExp(`is-active[^>]+href="${base}/z-script/console/detail"`))
    })
}

test('hash navigator uses real useHref without losing the hash or basename', () => {
    const navigator = { createHref: to => `#${typeof to === 'string' ? to : createPath(to)}`, encodeLocation: to => to, go() {}, push() {}, replace() {} }
    const html = renderToStaticMarkup(createElement(Router, { basename: '/script', location: '/script/z-script/home', navigator },
        createElement(AppLayout, { menuItems: menus })))
    assert.match(html, /href="#\/script\/z-script\/console"/)
})

function nodes(tree) {
    if (Array.isArray(tree)) return tree.flatMap(nodes)
    if (!tree || typeof tree !== 'object') return []
    return [tree, ...nodes(tree.props?.children)]
}

// Exercise event closures without a DOM dependency; SSR uses the real router hook.
function mount(routerRoot, props = {}) {
    const navigated = [], removed = [], window = { location: { href: '' } }
    let hrefCalls = 0
    const module = { exports: {} }
    const mockRequire = id => {
        if (id === 'react-router-dom') return {
            Outlet: 'outlet', useNavigate: () => to => navigated.push(to),
            useLocation: () => ({ pathname: '/z-script/home' }),
            useHref: to => { assert.equal(to, '/'); hrefCalls++; return routerRoot },
        }
        if (id === 'antd') return Object.fromEntries(['Avatar', 'Button', 'ConfigProvider', 'Dropdown', 'Spin', 'Tooltip'].map(name => [name, name]))
        if (id === '@ant-design/icons') return { DownOutlined: 'down', LoginOutlined: 'login' }
        if (id.endsWith('tokens')) return { antdTheme: {}, __esModule: true }
        if (id.endsWith('MenuTree.jsx')) return { default: 'menu', __esModule: true }
        if (id.endsWith('SidebarShell.jsx')) return { default: 'sidebar', __esModule: true }
        return require(id)
    }
    new Function('require', 'module', 'exports', 'window', 'localStorage', compiled)(mockRequire, module, module.exports, window, { removeItem: key => removed.push(key) })
    const tree = module.exports.default({ menuItems: menus, ...props })
    assert.equal(hrefCalls, 1)
    const all = nodes(tree)
    return { all, menu: all.find(node => node.type === 'menu').props, navigated, removed, window }
}
function click(item, changes = {}) {
    const event = { button: 0, defaultPrevented: false, preventDefault() { this.defaultPrevented = true }, ...changes }
    item.onClick(event)
    return event
}

for (const routerRoot of ['/', '/script', '/script/', '#/', '#/script/', '/host/#/script/']) {
    test(`anchor and full-window login use ${routerRoot}; navigate stays logical`, () => {
        const m = mount(routerRoot)
        const prefix = routerRoot.replace(/\/?$/, '/')
        assert.equal(m.menu.topItems[1].href, `${prefix}z-script/console`)
        assert.equal(click(m.menu.topItems[1]).defaultPrevented, true)
        assert.deepEqual(m.navigated, ['/z-script/console'])
        m.all.find(node => node.type === 'Button').props.onClick()
        assert.equal(m.window.location.href, `${prefix}z-script/login`)
    })
}

test('explicit href query/hash is preserved and used as the logical destination', () => {
    const m = mount('/script', { menuItems: [{ key: '/item', href: '/other?q=one#part', label: 'Other' }] })
    assert.equal(m.menu.topItems[0].href, '/script/other?q=one#part')
    click(m.menu.topItems[0])
    assert.deepEqual(m.navigated, ['/other?q=one#part'])
})

for (const href of ['https://example.invalid/path', '//example.invalid/path', '#section', 'mailto:someone@example.invalid']) {
    test(`explicit native href stays verbatim: ${href}`, () => {
        const m = mount('/script', { menuItems: [{ key: '/external', href, label: 'External' }] })
        assert.equal(m.menu.topItems[0].href, href)
        assert.equal(click(m.menu.topItems[0]).defaultPrevented, false)
        assert.deepEqual(m.navigated, [])
    })
}

for (const changes of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }]) {
    test(`native modified click is not intercepted: ${JSON.stringify(changes)}`, () => {
        const m = mount('/script')
        assert.equal(click(m.menu.topItems[1], changes).defaultPrevented, false)
        assert.deepEqual(m.navigated, [])
    })
}

test('blank target, disabled item and cancelled callback never navigate', () => {
    for (const extra of [{ target: '_blank' }, { disabled: true }, { onClick: ({ domEvent }) => domEvent.preventDefault() }]) {
        const m = mount('/script', { menuItems: [{ key: '/item', label: 'Item', ...extra }] })
        assert.equal(m.menu.topItems[0].href, '/script/item')
        click(m.menu.topItems[0])
        assert.deepEqual(m.navigated, [])
    }
})

test('logout clears configured storage keys and explicit loginPath remains verbatim', () => {
    for (const loginPath of [undefined, '/custom/login', 'https://example.invalid/login', '#/login']) {
        const m = mount('/script', { appUser: { name: 'Test' }, loginPath, tokenKey: 'test-token', userInfoKey: 'test-user' })
        m.all.find(node => node.type === 'Dropdown').props.menu.items.find(item => item.key === 'logout').onClick()
        assert.deepEqual(m.removed, ['test-token', 'test-user'])
        assert.equal(m.window.location.href, loginPath ?? '/script/z-script/login')
    }
})

test('empty menu defaults to router-aware login and nested groups keep base-aware hrefs', () => {
    const empty = mount('/script', { menuItems: [] })
    empty.all.find(node => node.type === 'Button').props.onClick()
    assert.equal(empty.window.location.href, '/script/login')
    const grouped = mount('/script', { menuItems: [{ key: 'group', type: 'group', children: [{ key: '/parent', children: [{ key: '/parent/child' }] }] }] })
    assert.equal(grouped.menu.groups[0].items[0].children[0].href, '/script/parent/child')
})
