/**
 * PageHeader 的行为测试 —— 重点是两条**只能靠行为测出来**的能力：
 *   ① 面包屑项支持 `onClick`（不只有 `href`）；
 *   ② 没有 Router 上下文时**不炸**（Storybook / 单测 / SSR 片段里单独渲染）。
 *
 * 为什么这两条要测：
 *   - `onClick` 是从 z-wf 仓内那份 PageHeader 拷贝并进基座的能力。
 *     并进来的动机是「单一真源」：能力留在拷贝里，就还得留着那份拷贝。
 *     并进基座后 z-wf 那份就能删 ⇒ 但「并进来了」不等于「能用」⇒ 必须有尺子。
 *   - Router 缺席不炸：基座自己的 ComponentDoc 早就用 `useInRouterContext` 做了这件事，
 *     PageHeader 之前没有 ⇒ 一旦哪个页面在没有 Router 的环境里渲染它，
 *     报的是 "useNavigate() may be used only in the context of a <Router> component"，
 *     而这个报错与真实病因（少了个 Router 上下文）看起来毫不相干 ⇒ 很难查。
 *
 * 断言口径：
 *   - 渲染层：SSR HTML 里看得到面包屑文字、标题。
 *   - 交互层：node:test 没有 DOM 事件系统 ⇒ onClick 的触发顺序用**源码层**判定，
 *     并用变异自检确认尺子有牙口。
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
const PAGE_HEADER_SRC = path.join(REPO_ROOT, 'src', 'components', 'ui', 'PageHeader.jsx');

async function loadModule() {
    const server = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false },
        resolve: { conditions: ['import', 'module', 'browser', 'default'] },
        ssr: {
            noExternal: ['react-router-dom', 'react-router'],
            resolve: { conditions: ['import', 'module', 'browser', 'default'] },
        },
    });
    try {
        const ui = await server.ssrLoadModule('/src/components/ui/index.js');
        // ⚠ MemoryRouter 必须从**同一个 SSR 模块图**里取：测试文件由 node 直接加载 ⇒
        //   它的 react-router-dom 是 CJS 产物，而组件经 vite 加载的是 noExternal 强制出的
        //   ESM 产物 ⇒ 两份实现、两个 Context ⇒ Router 上下文对不上。
        const router = await server.ssrLoadModule('react-router-dom');
        return {ui, router};
    } finally {
        await server.close();
    }
}

const {ui: mod, router} = await loadModule();
const {PageHeader} = mod;
const {MemoryRouter} = router;

const readSrc = () => fs.readFileSync(PAGE_HEADER_SRC, 'utf8');

test('ui 扁平桶导出了 PageHeader', () => {
    assert.equal(typeof PageHeader, 'function');
});

test('没有 Router 上下文时渲染不炸（Storybook / 单测 / SSR 片段场景）', () => {
    // 改造前这里会抛 "useNavigate() may be used only in the context of a <Router> component"
    let html = null;
    assert.doesNotThrow(() => {
        html = renderToStaticMarkup(createElement(PageHeader, {title: '实例列表'}));
    }, 'PageHeader 在没有 Router 时抛异常了');
    assert.ok(html.includes('实例列表'), '标题未渲染');
});

test('有 Router 时面包屑、标题都渲染出来', () => {
    const html = renderToStaticMarkup(createElement(
        MemoryRouter,
        {initialEntries: ['/']},
        createElement(PageHeader, {
            title: '实例',
            breadcrumb: [{label: '首页', href: '/home'}, {label: '实例'}],
            back: true,
        }),
    ));
    assert.ok(html.includes('首页'), '面包屑首项未渲染');
    assert.ok(html.includes('实例'), '面包屑末级未渲染');
    assert.ok(html.includes('ant-breadcrumb'), 'Breadcrumb 容器未渲染');
});

test('面包屑末级不可点（它是当前页，不是入口）', () => {
    const src = readSrc();
    assert.match(src, /const last = i === breadcrumb\.length - 1/, '末级判定没了');
    assert.match(src, /const clickable = !last && \(b\.href \|\| b\.onClick\)/, '可点判定没了');
});

test('面包屑项支持 onClick（从 z-wf 仓内拷贝并进基座的能力）', () => {
    const src = readSrc();
    const onClickAt = src.indexOf('b.onClick(e)');
    const navigateAt = src.indexOf('navigate(b.href)');
    assert.ok(onClickAt > 0, 'onClick 分支不见了');
    assert.ok(navigateAt > 0, 'href 跳转分支不见了');
    assert.ok(onClickAt < navigateAt, 'onClick 必须在 href 跳转之前（两者都给时以 onClick 为准）');
    assert.match(src, /props\.breadcrumb/, 'props 文档里没有 breadcrumb');
});

test('尺子的牙口：把 onClick 分支删掉，判定必须判红', () => {
    const real = readSrc();
    const broken = real.replace(/if \(b\.onClick\) \{\s*b\.onClick\(e\)\s*return\s*\}/, '');
    assert.notEqual(broken, real, '变异没改动源码（尺子测不到自己）');
    assert.doesNotMatch(broken, /if \(b\.onClick\)/, '变异后尺子竟然没判红');
    assert.match(real, /if \(b\.onClick\)/, '真实源码反而不合规');
});
