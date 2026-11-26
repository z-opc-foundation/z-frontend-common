import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let vite
let AppLayout

test.before(async () => {
    vite = await createServer({ root, logLevel: 'error', ssr: { resolve: { externalConditions: ['node', 'module-sync'] } }, server: { middlewareMode: true }, appType: 'custom' })
    AppLayout = (await vite.ssrLoadModule('/src/components/Layout/index.jsx')).default
})

test.after(async () => { await vite?.close() })

function renderLayout(props, pathname = '/catalog/items/42') {
    return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [pathname] },
        createElement(Routes, null, createElement(Route, { element: createElement(AppLayout, props) },
            createElement(Route, { path: '*', element: createElement('article', null, '详情内容') }),
        )),
    ))
}

test('应用壳复用认知菜单并保留分组与详情选中态', () => {
    const html = renderLayout({
        appTitle: '资源管理', appShort: 'CAT',
        menuItems: [{ key: 'assets', type: 'group', label: '资源', children: [
            { key: '/catalog', label: '全部资源' },
            { key: '/catalog/items', label: '资源条目' },
        ] }],
    })
    assert.match(html, /zfc-sbs/)
    assert.match(html, /<nav class="zfc-mt"/)
    assert.doesNotMatch(html, /ant-layout-sider|ant-menu-dark/)
    assert.match(html, /资源条目/)
    assert.match(html, /<a[^>]*is-active[^>]*href="\/catalog\/items"/)
    assert.doesNotMatch(html, /<a[^>]*is-active[^>]*href="\/catalog"/)
    assert.match(html, /<main[^>]*class="zfc-app-main"[^>]*><article>详情内容<\/article><\/main>/)
    assert.match(html, /padding:0 24px/)
    assert.doesNotMatch(html, /padding:24px/)
})

test('路径命中按段匹配，不误选同名前缀', () => {
    const html = renderLayout({ menuItems: [{ key: '/catalog/item', label: '单项' }] })
    assert.doesNotMatch(html, /zfc-mt-item is-active/)
})

test('品牌、用户菜单和额外操作均保留且用户入口可键盘访问', () => {
    const html = renderLayout({
        appTitle: '资源管理', appVersion: '2.0',
        appUser: { name: '测试用户', role: '管理员' },
        appIcon: { icon: createElement('img', { src: '/icon.png', alt: '产品图标' }), color: '#0052d9' },
        headerExtra: createElement('button', null, '刷新数据'),
    })
    assert.match(html, /资源管理/)
    assert.match(html, /<button[^>]*aria-label="用户菜单"/)
    assert.match(html, /刷新数据/)
    assert.match(html, /width:28px;height:28px/)
    assert.match(html, /src="\/icon.png"/)
})

test('菜单加载态和空菜单都不隐藏主区', () => {
    const loading = renderLayout({ loading: true })
    assert.match(loading, /role="status" aria-label="正在加载菜单"/)
    assert.match(loading, /详情内容/)
    const empty = renderLayout({ menuItems: [] })
    assert.match(empty, /详情内容/)
    assert.match(empty, /登录/)
})
