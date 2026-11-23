/**
 * SidebarShell（lead 008 §17 统一左侧栏外壳）行为测试。
 *
 * 沿用本仓惯例：Vite SSR 把 .jsx 现场编译，react-dom/server 渲染成 HTML 断言。
 * 断言的是 CEO 2026-11-23 裁定的两条口径：
 *   - 顶部不设品牌图标区（壳里只有菜单内容 + 把手）
 *   - 收起/展开把手贴在左菜单与右面板之间的分隔带上
 *     （展开态 right:-9px 跨线、收起态贴内容左缘）
 *
 * 运行：npm test（= node --test test/）
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

let vite;
let SidebarShell;

test.before(async () => {
    vite = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        server: { middlewareMode: true },
        appType: 'custom',
    });
    const mod = await vite.ssrLoadModule('/src/components/ui/SidebarShell.jsx');
    SidebarShell = mod.default;
});

test.after(async () => {
    await vite?.close();
});

test('展开态：侧栏宽度取自 width，把手是「收起侧栏」', () => {
    const html = renderToStaticMarkup(
        createElement(SidebarShell, { width: 220 }, createElement('nav', null, '菜单'))
    );
    assert.match(html, /class="zfc-sbs"/);
    assert.match(html, /width:220/);
    assert.match(html, /min-width:220/);
    assert.match(html, /aria-label="收起侧栏"/);
    assert.match(html, /aria-expanded="true"/);
    assert.match(html, /‹/);
});

test('收起态：宽度归零 + 把手翻成「展开侧栏」', () => {
    const html = renderToStaticMarkup(
        createElement(SidebarShell, { width: 220, defaultCollapsed: true }, '菜单')
    );
    assert.match(html, /class="zfc-sbs is-collapsed"/);
    assert.match(html, /width:0/);
    assert.match(html, /aria-label="展开侧栏"/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /›/);
});

test('标题槽是纯文字（无图标），不带 title 时不渲染', () => {
    const withTitle = renderToStaticMarkup(
        createElement(SidebarShell, { title: '研发工作台' }, '菜单')
    );
    assert.match(withTitle, /class="zfc-sbs-title">研发工作台</);
    assert.doesNotMatch(withTitle, /<svg/);
    const without = renderToStaticMarkup(createElement(SidebarShell, null, '菜单'));
    assert.doesNotMatch(without, /zfc-sbs-title/);
});

test('壳里不渲染任何品牌图标位（顶部只放菜单）', () => {
    const html = renderToStaticMarkup(
        createElement(SidebarShell, { width: 220 }, createElement('nav', null, '菜单'))
    );
    assert.doesNotMatch(html, /brand/i);
    assert.doesNotMatch(html, /<img/);
    assert.doesNotMatch(html, /<svg/);
});

test('把手贴分隔带：展开跨线、收起贴内容左缘', () => {
    const src = fs.readFileSync(
        path.join(REPO_ROOT, 'src/components/ui/SidebarShell.jsx'),
        'utf8'
    );
    assert.match(src, /\.zfc-sbs-handle\{[^}]*right:-9px/);
    assert.match(src, /\.zfc-sbs\.is-collapsed \.zfc-sbs-handle\{[^}]*left:0/);
});
