/**
 * blocks.css / blocks.jsx —— 「认知范式」块级结构件守卫测试（lead 008 §26）。
 *
 * 沿用本仓惯例：node:test + .mjs，零新增依赖；
 * .jsx 用 Vite SSR 现场编译，react-dom/server 渲染成 HTML 断言。
 *
 * 守的是什么（机械判据，对齐认知 ui-style-guide.md §1/§3/§10）：
 *   - 页面级零阴影：唯一允许出现阴影的是浮层 .zfc-overlay
 *   - 贴边：.zfc-bleed 用 calc(-1 * var(--zfc-page-x)) 反向外扩
 *   - 共边：gap:0 + 后块 -1px 叠边，整页只留 1px 分隔线
 *   - 圆角：贴边外层 0，页内面板 8px
 *   - 分栏：栏间零间隙 + 1px 竖线 + 抓手 role=separator
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
const CSS_PATH = path.join(REPO_ROOT, 'src', 'components', 'ui', 'blocks.css');
const JSX_PATH = path.join(REPO_ROOT, 'src', 'components', 'ui', 'blocks.jsx');

const css = fs.readFileSync(CSS_PATH, 'utf8');

/** 把样式表拆成 {selector, body} 规则列表（跳过 @media 内的规则，单列出来）。 */
function rules(text) {
    const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');
    const out = [];
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = re.exec(stripped)) !== null) {
        const selector = m[1].trim();
        if (selector.startsWith('@')) continue;
        out.push({selector, body: m[2]});
    }
    return out;
}

const allRules = rules(css);

/* ------------------------------------------------------------------ *
 * 1) 样式表口径
 * ------------------------------------------------------------------ */

test('页面级零阴影：除浮层外没有任何规则带阴影', () => {
    const offenders = allRules.filter((r) => {
        if (/zfc-overlay/.test(r.selector)) return false;
        const m = r.body.match(/box-shadow\s*:\s*([^;]+);/);
        return m && m[1].trim() !== 'none';
    });
    assert.deepEqual(offenders.map((r) => r.selector), [], '页面级规则不得带阴影');
});

test('浮层是全站唯一带阴影的地方，且阴影值固定', () => {
    const overlay = allRules.find((r) => r.selector === '.zfc-overlay');
    assert.ok(overlay, '缺 .zfc-overlay 规则');
    assert.match(overlay.body, /box-shadow\s*:\s*var\(--zfc-overlay-shadow\)/);
    assert.match(css, /--zfc-overlay-shadow:\s*0 14px 34px rgba\(15,\s*27,\s*45,\s*0?\.14\)/);
});

test('token 全部用 --zfc-* 前缀，且直接持有范本值（不做 var() 间接引用）', () => {
    const decls = [...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
    const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('}'));
    for (const name of decls) {
        assert.match(name, /^--zfc-/, `token ${name} 未使用 --zfc-* 前缀`);
    }
    // 间接引用（var(--line)）会在 :root 上定型，宿主页内局部覆写将失效 —— 不允许
    assert.doesNotMatch(rootBlock, /var\(--(?!zfc-)/, 'token 不得间接引用宿主变量');
    assert.ok(rootBlock.includes('--zfc-line: #e2e4e8'), '--zfc-line 必须是范本发丝线色');
    assert.ok(rootBlock.includes('--zfc-page-x: 24px'), '--zfc-page-x 必须是 24px');
    assert.ok(rootBlock.includes('--zfc-radius-sm: 8px'), '--zfc-radius-sm 必须是 8px');
    assert.ok(rootBlock.includes('--zfc-primary: #0052d9'), '--zfc-primary 必须是认知蓝');
});

test('贴边：反向外扩一个 --zfc-page-x', () => {
    const bleed = allRules.find((r) => r.selector === '.zfc-bleed');
    assert.ok(bleed, '缺 .zfc-bleed 规则');
    assert.match(bleed.body, /margin-left\s*:\s*calc\(-1 \* var\(--zfc-page-x\)\)/);
    assert.match(bleed.body, /margin-right\s*:\s*calc\(-1 \* var\(--zfc-page-x\)\)/);
});

test('共边：零间隙 + 后块叠 1px + 直角无阴影', () => {
    const row = allRules.find((r) => r.selector === '.zfc-glue');
    const col = allRules.find((r) => r.selector === '.zfc-glue-col');
    assert.ok(row && col, '缺 .zfc-glue / .zfc-glue-col');
    assert.match(row.body, /gap\s*:\s*0/);
    assert.match(col.body, /gap\s*:\s*0/);
    const rowChild = allRules.find((r) => r.selector === '.zfc-glue > * + *');
    const colChild = allRules.find((r) => r.selector === '.zfc-glue-col > * + *');
    assert.match(rowChild.body, /margin-left\s*:\s*-1px/);
    assert.match(colChild.body, /margin-top\s*:\s*-1px/);
    const flat = allRules.find((r) => r.selector === '.zfc-glue > *,\n.zfc-glue-col > *');
    assert.ok(flat, '共边子块未归零圆角/阴影');
    assert.match(flat.body, /border-radius\s*:\s*0/);
    assert.match(flat.body, /box-shadow\s*:\s*none/);
});

test('面板原语：1px 描边 + 8px 圆角 + 零阴影，head/body/foot 用 1px 线分隔', () => {
    const panel = allRules.find((r) => r.selector === '.zfc-panel');
    assert.match(panel.body, /border:\s*1px solid var\(--zfc-line\)/);
    assert.match(panel.body, /border-radius:\s*var\(--zfc-radius-sm\)/);
    assert.match(panel.body, /box-shadow:\s*none/);
    assert.match(allRules.find((r) => r.selector === '.zfc-panel-head').body, /border-bottom:\s*1px solid var\(--zfc-line\)/);
    assert.match(allRules.find((r) => r.selector === '.zfc-panel-foot').body, /border-top:\s*1px solid var\(--zfc-line\)/);
});

test('分栏：零间隙 + 1px 竖线 + 9px 命中区 + 窄屏折叠', () => {
    assert.match(allRules.find((r) => r.selector === '.zfc-split').body, /gap\s*:\s*0/);
    const handle = allRules.find((r) => r.selector === '.zfc-split-handle');
    assert.match(handle.body, /flex:\s*0 0 1px/);
    assert.match(handle.body, /background:\s*var\(--zfc-line\)/);
    const hit = allRules.find((r) => r.selector === '.zfc-split-handle::after');
    assert.match(hit.body, /width:\s*9px/);
    assert.match(hit.body, /left:\s*-4px/);
    assert.match(css, /@media \(max-width: 1080px\)/, '缺窄屏折叠断点');
    assert.match(css, /\.zfc-split-handle \{\s*display:\s*none;\s*\}/, '窄屏未隐藏抓手');
});

test('样式表不含硬编码品牌色（除 token 默认值外）', () => {
    const body = css.slice(css.indexOf('}'));  // 跳过 :root 里的默认值
    assert.doesNotMatch(body, /#0052d9|#7c3aed|#e8f3ff/, '页面规则里出现硬编码品牌色');
});

/* ------------------------------------------------------------------ *
 * 2) React 结构件
 * ------------------------------------------------------------------ */

let vite;
let blocks;

test.before(async () => {
    vite = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        server: { middlewareMode: true },
        appType: 'custom',
    });
    blocks = await vite.ssrLoadModule('/src/components/ui/blocks.jsx');
});

test.after(async () => {
    await vite?.close();
});

test('Panel 四段结构渲染出范式类名', () => {
    const html = renderToStaticMarkup(createElement(
        blocks.Panel,
        {className: 'extra'},
        createElement(blocks.PanelHead, null,
            createElement(blocks.PanelTitle, null, '标题'),
            createElement(blocks.PanelActions, null, createElement(blocks.PanelHint, null, '说明')),
        ),
        createElement(blocks.PanelBody, {tight: true}, '正文'),
        createElement(blocks.PanelFoot, null, '底栏'),
    ));
    assert.match(html, /class="zfc-panel extra"/);
    assert.match(html, /class="zfc-panel-head"/);
    assert.match(html, /class="zfc-panel-title"/);
    assert.match(html, /class="zfc-panel-actions"/);
    assert.match(html, /class="zfc-panel-hint"/);
    assert.match(html, /class="zfc-panel-body is-tight"/);
    assert.match(html, /class="zfc-panel-foot"/);
});

test('PanelBody 的 tight / flush 互斥，不叠加', () => {
    const flush = renderToStaticMarkup(createElement(blocks.PanelBody, {flush: true}, 'x'));
    assert.match(flush, /class="zfc-panel-body is-flush"/);
    assert.doesNotMatch(flush, /is-tight/);
});

test('BlockRow / Bleed 输出共边与贴边类名', () => {
    assert.match(renderToStaticMarkup(createElement(blocks.BlockRow, null, 'a')), /class="zfc-glue"/);
    assert.match(renderToStaticMarkup(createElement(blocks.Bleed, null, 'a')), /class="zfc-bleed"/);
});

test('clampSplitWidth 双向钳制', () => {
    assert.equal(blocks.clampSplitWidth(100), 190);
    assert.equal(blocks.clampSplitWidth(999), 420);
    assert.equal(blocks.clampSplitWidth(236), 236);
    assert.equal(blocks.clampSplitWidth('abc'), 190);
    assert.equal(blocks.clampSplitWidth(200, 210, 300), 210);
});

test('SplitLayout 渲染 左栏 + 1px 抓手 + 右栏', () => {
    const html = renderToStaticMarkup(createElement(
        blocks.SplitLayout,
        {side: createElement('span', null, '左'), defaultSideWidth: 240},
        createElement('span', null, '右'),
    ));
    assert.match(html, /class="zfc-split"/);
    assert.match(html, /class="zfc-split-side"/);
    assert.match(html, /class="zfc-split-handle"/);
    assert.match(html, /class="zfc-split-main"/);
    assert.match(html, /role="separator"/);
    assert.match(html, /aria-orientation="vertical"/);
    assert.match(html, /--zfc-split-w: ?240px/);
});

test('SplitLayout 受控宽度优先于内部状态', () => {
    const html = renderToStaticMarkup(createElement(
        blocks.SplitLayout,
        {side: '左', sideWidth: 300},
        '右',
    ));
    assert.match(html, /--zfc-split-w: ?300px/);
});
