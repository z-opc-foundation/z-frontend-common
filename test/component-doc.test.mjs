/**
 * ComponentDoc（lead 008 §7 组件文档页）行为测试。
 *
 * 为什么这么写：
 *   - 本仓没有测试框架，源码是 .jsx —— 沿用 readme-claims.test.mjs 的做法：
 *     node:test + .mjs，零新增依赖。
 *   - 但组件本身必须**真的渲染一次**，否则「markdown → 标题/表格/代码块」只能靠
 *     读源码猜。这里用 Vite 的 SSR 能力（vite 已在 devDependencies）把 .jsx 现场编译，
 *     再用 react-dom/server 渲染成 HTML 断言 —— 不引 jsdom、不引 testing-library。
 *   - useLayoutEffect 在 SSR 下不跑（React 会告警），所以测试期间静音 console，
 *     断言只认渲染产物本身。
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

/** 一份典型的 DOC.md：标题 / 表格 / 代码块 / 列表 / 链接 / 引用都有。 */
const DOC = [
    '# 组件文档',
    '',
    '> 一段说明文字。',
    '',
    '## 1. 功能',
    '',
    '| 页面 | 路径 |',
    '|---|---|',
    '| 列表 | /demo/list |',
    '| 详情 | /demo/detail |',
    '',
    '## 2. 接口',
    '',
    '```ts',
    'const id = 1',
    '# 注释不是标题',
    '```',
    '',
    '## 3. 链接',
    '',
    '- 第一项',
    '- 第二项',
    '',
    '见 [站内](/demo/home) 与 [外部](https://example.com)。',
].join('\n');

/** 统计 markdown 里的 H2 数量（TOC 默认只收 H2）。 */
const countH2 = (md) => md.split('\n').filter((l) => /^##[ \t]+/.test(l)).length;

/* ------------------------------------------------------------------ *
 * 组件加载（Vite SSR 现场编译 JSX）
 * ------------------------------------------------------------------ */

let server = null;
let doc = null;

const loadComponent = async () => {
    if (doc) return doc;
    server = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        appType: 'custom',
        // hmr 关掉：middleware 模式下它会起一个 ws 服务，把 node --test 进程吊住不退出
        server: { middlewareMode: true, hmr: false },
        // react-router-dom 在 Node 条件下解析到 CJS 产物（没有具名导出），
        // 让 Vite 走 noExternal + import 条件，把它的 ESM 产物编进来，具名导出才拿得到
        resolve: { conditions: ['import', 'module', 'browser', 'default'] },
        ssr: {
            noExternal: ['react-router-dom', 'react-router'],
            resolve: { conditions: ['import', 'module', 'browser', 'default'] },
        },
    });
    const mod = await server.ssrLoadModule('/src/components/ui/ComponentDoc.jsx');
    doc = mod;
    return doc;
};

/** 渲染一段 markdown，屏蔽 SSR 下 React 的 useLayoutEffect 告警。 */
const renderDoc = async (markdown, props = {}) => {
    const mod = await loadComponent();
    const Component = mod.default;
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = () => {};
    console.warn = () => {};
    try {
        return renderToStaticMarkup(createElement(Component, { markdown, ...props }));
    } finally {
        console.error = originalError;
        console.warn = originalWarn;
    }
};

test.after(async () => {
    if (server) await server.close();
});

/* ------------------------------------------------------------------ *
 * 用例
 * ------------------------------------------------------------------ */

test('markdown 字符串传入后渲染出标题 / 表格 / 代码块', async () => {
    const html = await renderDoc(DOC);

    // 标题：H1 与 H2 都要出来，且带锚点 id（TOC 靠 id 跳转）
    assert.match(html, /<h1[^>]*id="组件文档"/, 'H1 没渲染出来或没有锚点 id');
    assert.match(html, /<h2[^>]*id="1-功能"/, 'H2 没渲染出来或没有锚点 id');
    assert.match(html, />1\. 功能</, 'H2 文字没渲染出来');

    // 表格：GFM 管道表格要有表头 + 数据行
    assert.match(html, /<table/, '表格没渲染出来');
    assert.match(html, /<th[^>]*>页面<\/th>/, '表头没渲染出来');
    assert.match(html, /<td[^>]*>\/demo\/list<\/td>/, '表格数据行没渲染出来');
    // 窄屏横向滚动的包裹层（§7）
    assert.match(html, /zfc-doc-table-wrap/, '表格少了横向滚动包裹层');

    // 代码块：围栏代码块要落在 <pre> 里，且围栏里的 # 不是标题
    assert.match(html, /<pre/, '代码块没渲染出来');
    assert.match(html, /const id = 1/, '代码块内容丢了');
    assert.doesNotMatch(html, /<h[1-6][^>]*>[^<]*注释不是标题/, '代码块里的 # 被误当成标题');

    // 列表 / 引用 / 链接
    assert.match(html, /<ul/, '列表没渲染出来');
    assert.match(html, /<blockquote/, '引用没渲染出来');
    assert.match(html, /href="\/demo\/home"/, '站内链接没渲染出来');
    assert.match(html, /href="https:\/\/example\.com"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
        '外链没带 target=_blank rel=noopener');
});

test('TOC 项数与 H2 数量一致，且每项都锚到正文真实存在的标题', async () => {
    const html = await renderDoc(DOC);
    const mod = await loadComponent();

    const tocIds = [...html.matchAll(/data-toc-id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(tocIds.length, countH2(DOC), 'TOC 项数与 H2 数量对不上');

    // TOC 项的锚点必须能在正文里找到同名 id（点得动）
    for (const id of tocIds) {
        assert.match(html, new RegExp(`id="${id}"`), `TOC 锚点 ${id} 在正文里不存在`);
    }

    // TOC 数据源与正文渲染用的是同一套 id 算法（TOC 默认只收 H2）
    const headings = mod.parseDocHeadings(DOC);
    assert.deepEqual(
        headings.filter((h) => h.level === 2).map((h) => h.id),
        tocIds,
        'TOC 的 id 与 parseDocHeadings 对不上'
    );
    // 正文里 H1/H2 的 id 必须与同一张表一致（TOC 点得动的前提）
    const h1 = mod.parseDocHeadings(DOC).find((h) => h.level === 1);
    assert.match(html, new RegExp(`<h1[^>]*id="${h1.id}"`), '正文的 H1 锚点 id 与 id 表对不上');
});

test('点击 TOC 会平滑滚动到对应锚点', async () => {
    const mod = await loadComponent();

    // 点击 TOC → scrollIntoView({behavior:'smooth', block:'start'})
    const calls = [];
    const fakeEl = { scrollIntoView: (opts) => calls.push(opts) };
    assert.equal(mod.scrollToAnchor(fakeEl), true, 'scrollToAnchor 没滚动');
    assert.deepEqual(calls, [{ behavior: 'smooth', block: 'start' }], '滚动参数不对');

    // 目标不存在时不抛异常，只是没滚动
    assert.equal(mod.scrollToAnchor(null), false);
    assert.equal(mod.scrollToAnchor({}), false);
});

test('锚点 id 稳定且唯一：同名标题不撞号，重复解析结果一致', async () => {
    const mod = await loadComponent();
    const md = ['# 标题', '', '## 重复', '', '## 重复', '', '## 重复'].join('\n');

    const ids = mod.parseDocHeadings(md).map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, `锚点 id 撞了：${ids.join(',')}`);
    assert.deepEqual(ids, mod.parseDocHeadings(md).map((h) => h.id), '同一份 markdown 两次解析结果不一致');
});

test('宿主注册自己的渲染器后，ComponentDoc 改用它渲染', async () => {
    const mod = await loadComponent();
    const FakeMarkdown = ({ children }) => createElement('section', { 'data-fake': '1' }, children);
    mod.registerMarkdownRenderer({ ReactMarkdown: FakeMarkdown });
    try {
        const html = await renderDoc('# 标题');
        assert.match(html, /data-fake="1"/, '注册后的渲染器没被用上');
    } finally {
        mod.registerMarkdownRenderer(null);
    }
});

test('ui 扁平桶导出了 ComponentDoc', async () => {
    const fs = await import('node:fs');
    const uiIndex = fs.readFileSync(path.join(REPO_ROOT, 'src', 'components', 'ui', 'index.js'), 'utf8');
    assert.match(uiIndex, /export \{default as ComponentDoc\} from '\.\/ComponentDoc'/,
        'ui 桶没有导出 ComponentDoc');
});
