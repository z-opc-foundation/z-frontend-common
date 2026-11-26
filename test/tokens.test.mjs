/**
 * 认知 token 集守卫测试（lead 008 §26，2026-11-25 CEO 裁定全 fleet 换 token）。
 *
 * 守的是「全 fleet 抄认知」这条令的四个机械判据：
 *   1. token 值 = 认知范本值（主色 #0052d9 / 中性色 / 圆角阶梯 / 阴影口径）
 *   2. 页面级零阴影：基座组件里不出现任何 boxShadow，antd 卡片阴影恒为 none
 *   3. antdTheme = 认知口径（浅色侧栏、8px 圆角、主色下划线页签）
 *   4. JS token 与 CSS token 两份真源不允许漂移（tokens.cssVars ⇄ blocks.css :root）
 *
 * 运行：npm test（= node --test test/）
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {brand, cssVars, fontSize, lift, neutral, palette, radius, shadow, antdTheme} from '../src/components/ui/tokens.js'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UI_DIR = path.join(REPO_ROOT, 'src', 'components', 'ui')
const CSS_PATH = path.join(UI_DIR, 'blocks.css')
const LAYOUT_PATH = path.join(REPO_ROOT, 'src', 'components', 'Layout', 'index.jsx')
const EMPTY_STATE_PATH = path.join(UI_DIR, 'EmptyState.jsx')

/* ------------------------------------------------------------------ *
 * 1) 认知 token 值
 * ------------------------------------------------------------------ */

test('主色是认知蓝 #0052d9，旧 marketplace 紫已下线', () => {
    assert.equal(brand.primary, '#0052d9')
    assert.equal(brand.primaryHover, '#003cab')
    assert.equal(brand.primarySoft, '#e8f3ff')
    assert.equal(brand.primarySoft2, '#bcd8ff')
    const dumped = JSON.stringify({brand, palette, neutral, radius, shadow, antdTheme})
    assert.doesNotMatch(dumped, /#7c3aed|#8b5cf6|#6d28d9|#ede9fe/, '仍存在旧 violet 主色')
})

test('中性色 = 范本口径：白底 / #f3f3f3 次级面 / #e2e4e8 发丝线', () => {
    assert.equal(neutral.bg, '#ffffff')
    assert.equal(neutral.surface, '#ffffff')
    assert.equal(neutral.surfaceAlt, '#f3f3f3')
    assert.equal(neutral.border, '#e2e4e8')
    assert.equal(neutral.borderStrong, '#d3d6dc')
    assert.equal(neutral.text, 'rgba(0, 0, 0, 0.9)')
    assert.equal(neutral.textMuted, 'rgba(0, 0, 0, 0.62)')
    assert.equal(neutral.textDisabled, 'rgba(0, 0, 0, 0.48)')
    assert.equal(neutral.sidebar, '#f3f3f3')
})

test('圆角阶梯 = 范本 §4：外壳 0 / 标签 5 / 面板 8 / 输入 9 / 浮层 10', () => {
    assert.equal(radius.none, 0)
    assert.equal(radius.sm, 5)
    assert.equal(radius.md, 8)
    assert.equal(radius.lg, 8)
    assert.equal(radius.input, 9)
    assert.equal(radius.icon, 9)
    assert.equal(radius.overlay, 10)
})

test('阴影只属于浮层：页面级恒为 none', () => {
    assert.equal(shadow.none, 'none')
    assert.equal(shadow.overlay, '0 14px 34px rgba(15, 27, 45, 0.14)')
    assert.deepEqual(Object.keys(shadow).sort(), ['none', 'overlay'], '阴影不得再有 sm/md/lg/xl 分级')
    assert.equal(lift.rest, 'none')
    assert.equal(lift.hover, 'none')
})

test('正文字号 15px（范本 body 15 / 行高 1.62）', () => {
    assert.equal(fontSize.base, 15)
})

/* ------------------------------------------------------------------ *
 * 2) 基座组件页面级零阴影
 * ------------------------------------------------------------------ */

test('基座 UI 组件里不出现任何 boxShadow', () => {
    const offenders = []
    for (const file of fs.readdirSync(UI_DIR)) {
        if (!file.endsWith('.jsx') && !file.endsWith('.js')) continue
        if (file === 'tokens.js') continue
        const src = fs.readFileSync(path.join(UI_DIR, file), 'utf8')
        if (/boxShadow/.test(src)) offenders.push(file)
    }
    assert.deepEqual(offenders, [], '页面级组件不得带阴影')
})

test('EmptyState 是结果区域本身，不套卡片也不回退旧紫渐变', () => {
    const src = fs.readFileSync(EMPTY_STATE_PATH, 'utf8')
    assert.match(src, /className="zfc-empty-state"/)
    assert.match(src, /borderRadius: 0/)
    assert.match(src, /border: 0/)
    assert.doesNotMatch(src, /linear-gradient|#7c3aed|#6d28d9|#8b5cf6/)
})

/* ------------------------------------------------------------------ *
 * 3) antdTheme = 认知口径
 * ------------------------------------------------------------------ */

test('antd 主题：主色 / 圆角 / 浅色侧栏 / 卡片零阴影', () => {
    const t = antdTheme.token
    assert.equal(t.colorPrimary, '#0052d9')
    assert.equal(t.colorLink, '#0052d9')
    assert.equal(t.borderRadius, 8)
    assert.equal(t.borderRadiusLG, 8)
    assert.equal(t.borderRadiusSM, 5)
    assert.equal(t.colorBgLayout, '#ffffff')
    assert.equal(t.colorBgContainer, '#ffffff')
    assert.equal(t.boxShadow, shadow.overlay)
    assert.equal(t.boxShadowTertiary, 'none')
    assert.equal(antdTheme.components.Card.boxShadowTertiary, 'none')
    assert.equal(antdTheme.components.Card.borderRadiusLG, 8)
    assert.equal(antdTheme.components.Input.borderRadiusLG, 9)
    assert.equal(antdTheme.components.Select.borderRadiusLG, 9)
    assert.equal(antdTheme.components.Modal.borderRadiusLG, 10)
    assert.equal(antdTheme.components.Dropdown.borderRadiusLG, 10)
    assert.equal(antdTheme.components.Popover.borderRadiusLG, 10)
    assert.equal(antdTheme.components.Tooltip.borderRadiusLG, 10)
    assert.equal(antdTheme.components.Drawer.borderRadiusLG, 0)
    assert.equal(antdTheme.components.Layout.siderBg, '#f3f3f3')
    assert.equal(antdTheme.components.Menu.itemSelectedBg, '#e8f3ff')
    assert.equal(antdTheme.components.Menu.activeBarWidth, 0)
    assert.doesNotMatch(JSON.stringify(antdTheme), /#0f172a/, '侧栏不得是深色 slate')
})

/* ------------------------------------------------------------------ *
 * 4) JS token ⇄ CSS token 两份真源不得漂移
 * ------------------------------------------------------------------ */

test('cssVars 与 blocks.css 的 :root 双向一致', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8')
    const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('}'))
    const cssDecls = new Map()
    for (const m of rootBlock.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
        cssDecls.set(`--${m[1]}`, m[2].trim())
    }
    for (const [name, value] of Object.entries(cssVars)) {
        assert.ok(cssDecls.has(name), `blocks.css 缺 ${name}`)
        assert.equal(cssDecls.get(name), value, `${name} 两份真源不一致`)
    }
    for (const name of cssDecls.keys()) {
        assert.ok(name in cssVars, `blocks.css 的 ${name} 未登记进 cssVars`)
    }
})

/* ------------------------------------------------------------------ *
 * 5) AppLayout 把主题接到 antd 上（40 个 suit 的唯一外壳）
 * ------------------------------------------------------------------ */

test('AppLayout 注入 ConfigProvider(antdTheme)，宿主可局部覆盖', async () => {
    const src = fs.readFileSync(LAYOUT_PATH, 'utf8')
    assert.match(src, /import \{antdTheme\} from '\.\.\/ui\/tokens'/)
    assert.match(src, /<ConfigProvider theme=\{mergeTheme\(theme\)\}>/)
    const {createServer} = await import('vite')
    const vite = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        ssr: {resolve: {externalConditions: ['node', 'module-sync']}},
        server: {middlewareMode: true},
        appType: 'custom',
    })
    try {
        const {mergeTheme} = await vite.ssrLoadModule('/src/components/Layout/index.jsx')
        assert.deepEqual(mergeTheme(), antdTheme)
        const merged = mergeTheme({token: {colorPrimary: '#111111'}, components: {Card: {borderRadiusLG: 0}}})
        assert.equal(merged.token.colorPrimary, '#111111')
        assert.equal(merged.token.borderRadius, 8, '宿主只覆盖一个 token 时其余认知 token 必须保留')
        assert.deepEqual(merged.components.Card, {borderRadiusLG: 0}, 'component 按组件整体替换')
        assert.equal(merged.components.Menu.itemSelectedBg, '#e8f3ff')
    } finally {
        await vite.close()
    }
})
