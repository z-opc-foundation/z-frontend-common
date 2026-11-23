/**
 * MenuTree（lead 008 §17 统一左侧菜单树）行为测试。
 *
 * 沿用本仓惯例：Vite SSR 把 .jsx 现场编译，react-dom/server 渲染成 HTML 断言。
 * 断言的是范本（z-cognition-portal nav）的关键结构语义：
 *   - 组头是 <button>（可点收起）+ uppercase 竖 tick 形制
 *   - active 项命中 is-active；组命中 has-active；collapsed 组隐藏 items
 *   - href ⇒ <a>、onClick ⇒ <button>、children ⇒ 子轨 zfc-mt-subitems
 *   - SSR（无 document）不注入 <style> 也不崩
 *
 * 运行：npm test（= node --test test/）
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

let vite;
let MenuTree;

test.before(async () => {
    vite = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        server: { middlewareMode: true },
        appType: 'custom',
    });
    const mod = await vite.ssrLoadModule('/src/components/ui/MenuTree.jsx');
    MenuTree = mod.default;
});

test.after(async () => {
    await vite?.close();
});

const GROUPS = [
    {
        key: 'g1',
        title: '知识空间',
        items: [
            { key: 'a', label: '文档库', icon: '📁', href: '/doc', active: true },
            { key: 'b', label: '问答库', icon: '💬', href: '/qa' },
        ],
    },
    {
        key: 'g2',
        title: '运营管理',
        items: [
            { key: 'c', label: '外层', icon: '⚙️', onClick: () => {},
              children: [
                  { key: 'c1', label: '子项一', onClick: () => {} },
                  { key: 'c2', label: '子项二', href: '/sub2', active: true },
              ] },
        ],
    },
];

test('组头/项行/激活态的基本结构', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, { groups: GROUPS }));
    // 组头是 button 且带 aria-expanded
    assert.match(html, /<button[^>]*class="zfc-mt-label zfc-mt-toggle"[^>]*aria-expanded="true"/);
    // 组标题渲染
    assert.match(html, /知识空间/);
    // active 项命中 is-active，组命中 has-active
    assert.match(html, /zfc-mt-item is-active/);
    assert.match(html, /zfc-mt-group[^"]*has-active/);
    // href 项渲染成 <a>
    assert.match(html, /<a[^>]*class="zfc-mt-item is-active"[^>]*href="\/doc"/);
    // onClick 项渲染成 <button>
    assert.match(html, /<button[^>]*class="zfc-mt-item"/);
    // 默认展开 ⇒ items 容器在
    assert.match(html, /zfc-mt-items/);
});

test('defaultCollapsed 收起分组且命中 has-active 圆点语义', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, {
        groups: GROUPS,
        defaultCollapsed: true,
    }));
    assert.match(html, /zfc-mt-group[^"]*collapsed/);
    assert.match(html, /aria-expanded="false"/);
    // collapsed 组的 items 不渲染
    assert.doesNotMatch(html, /zfc-mt-items/);
    // 收起但有激活项 ⇒ 显示圆点
    assert.match(html, /zfc-mt-active-dot/);
});

test('children 渲染子轨，父行带 chevron 与 aria-expanded', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, { groups: GROUPS }));
    assert.match(html, /zfc-mt-subitems/);
    // 默认展开 ⇒ 父行 chevron 带 is-open（展开=向下），组头同样 is-open
    assert.match(html, /<button[^>]*title="外层"[^>]*aria-expanded="true"/);
    assert.match(html, /class="zfc-mt-chevron is-open" aria-hidden="true"/);
    // 子轨里 active 子项命中 is-active
    assert.match(html, /<a[^>]*class="zfc-mt-item is-active"[^>]*href="\/sub2"/);
});

test('topItems 渲染在分组之外（无组头）', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, {
        topItems: [{ key: 'home', label: '首页', icon: '🏠', href: '/index', active: true }],
        groups: [],
    }));
    assert.match(html, /href="\/index"/);
    assert.match(html, /首页/);
    assert.doesNotMatch(html, /zfc-mt-label/);
});

test('SSR 不注入 style 也不崩；浏览器端（有 document）注入且幂等', async () => {
    assert.equal(typeof document, 'undefined');
    renderToStaticMarkup(createElement(MenuTree, { groups: GROUPS }));
    // 模拟浏览器端：注入一次后 getElementById 命中 ⇒ 二次渲染不再注入
    const appended = [];
    globalThis.document = {
        getElementById: (id) => appended.find((el) => el.id === id) || null,
        createElement: () => {
            const el = { id: '', css: '' };
            Object.defineProperty(el, 'textContent', {
                set(v) { this.css = v }, get() { return this.css },
            });
            return el;
        },
        head: { appendChild: (el) => appended.push(el) },
    };
    try {
        renderToStaticMarkup(createElement(MenuTree, { groups: GROUPS }));
        renderToStaticMarkup(createElement(MenuTree, { groups: GROUPS }));
    } finally {
        delete globalThis.document;
    }
    assert.equal(appended.length, 1);
    assert.match(appended[0].css, /\.zfc-mt-item/);
    assert.equal(appended[0].id, 'zfc-menutree-style');
});
