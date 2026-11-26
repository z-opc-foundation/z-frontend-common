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
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, transformWithEsbuild } from 'vite';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

let vite;
let MenuTree;
let compiledMenu;
const require = createRequire(import.meta.url);

// 本包不依赖 DOM 测试框架：SSR 检查真实 React 输出；此小型 hook 驱动器执行源码的
// 事件闭包、state updater 和 effect 依赖，浏览器的原生键盘/链接行为由集成验证覆盖。
function mountMenu(initialProps) {
    const slots = [];
    let cursor = 0;
    let dirty = false;
    let effects = [];
    let props = initialProps;
    const hooks = {
        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
            return [slots[index], (update) => {
                const next = typeof update === 'function' ? update(slots[index]) : update;
                if (!Object.is(next, slots[index])) { slots[index] = next; dirty = true; }
            }];
        },
        useEffect(effect, dependencies) {
            const index = cursor++;
            if (!slots[index] || dependencies.some((value, i) => !Object.is(value, slots[index][i]))) {
                slots[index] = dependencies;
                effects.push(effect);
            }
        },
    };
    const module = { exports: {} };
    new Function('require', 'module', 'exports', compiledMenu)(
        (id) => id === 'react' ? hooks : require(id), module, module.exports,
    );
    const Component = module.exports.default;
    return {
        render(nextProps = props) {
            props = nextProps;
            let tree;
            let passes = 0;
            do {
                assert.ok(++passes < 10, 'state/effect 不应循环更新');
                cursor = 0;
                dirty = false;
                effects = [];
                tree = Component(props);
                effects.forEach((effect) => effect());
            } while (dirty);
            return tree;
        },
    };
}

function nodes(tree) {
    if (Array.isArray(tree)) return tree.flatMap(nodes);
    if (!tree || typeof tree !== 'object') return [];
    if (typeof tree.type === 'function') return nodes(tree.type(tree.props));
    return [...(typeof tree.type === 'string' ? [tree] : []), ...nodes(tree.props.children)];
}

function findNode(tree, predicate) {
    const node = nodes(tree).find(predicate);
    assert.ok(node, '应找到目标交互节点');
    return node;
}

const titled = (tree, title) => findNode(tree, (node) => node.props.title === title);
const event = (key) => ({
    key, defaultPrevented: false, propagationStopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.propagationStopped = true; },
});

test.before(async () => {
    vite = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        server: { middlewareMode: true },
        appType: 'custom',
    });
    const mod = await vite.ssrLoadModule('/src/components/ui/MenuTree.jsx');
    MenuTree = mod.default;
    const file = path.join(REPO_ROOT, 'src/components/ui/MenuTree.jsx');
    compiledMenu = (await transformWithEsbuild(fs.readFileSync(file, 'utf8'), file, {
        loader: 'jsx', jsx: 'automatic', format: 'cjs',
    })).code;
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

test('关闭 autoExpandActive 时 defaultCollapsed 收起分组并显示 active 圆点', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, {
        groups: GROUPS,
        defaultCollapsed: true,
        autoExpandActive: false,
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
    assert.match(html, /<button[^>]*class="zfc-mt-disclosure"[^>]*title="收起外层"[^>]*aria-expanded="true"/);
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
    assert.match(appended[0].css, /\.zfc-mt-disclosure:focus-visible/);
    assert.match(appended[0].css, /prefers-reduced-motion:reduce/);
    assert.match(appended[0].css, /\.zfc-mt-text\{[^}]*overflow-wrap:anywhere/);
    assert.match(appended[0].css, /\.zfc-mt-item\{[^}]*min-height:34px/);
    assert.match(appended[0].css, /\.zfc-mt-subitems \.zfc-mt-item\{[^}]*min-height:31px/);
    assert.doesNotMatch(appended[0].css, /text-overflow:ellipsis/);
});

function deepItems(prefix, activeKey) {
    return [{ key: `${prefix}-parent`, label: `${prefix}父`, children: [
        { key: `${prefix}-child`, label: `${prefix}子`, children: [
            { key: `${prefix}-grandchild`, label: `${prefix}孙`, children: [
                { key: `${prefix}-leaf`, label: `${prefix}叶`, href: '/leaf', active: activeKey === 'leaf' },
                { key: `${prefix}-next`, label: `${prefix}下一叶`, href: '/next', active: activeKey === 'next' },
            ] },
        ] },
    ] }];
}

test('topItems 和 groups 默认递归展开四层，且关闭 autoExpandActive 不影响默认展开', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, {
        autoExpandActive: false,
        topItems: deepItems('top'),
        groups: [{ key: 'group', title: '分组', items: deepItems('grouped') }],
    }));
    assert.match(html, /top叶/);
    assert.match(html, /grouped叶/);
    assert.equal((html.match(/class="zfc-mt-subitems"/g) || []).length, 6);
});

test('初次 SSR 即展开深层 active 全部祖先（含 topItems），无 active 的组保持收起', () => {
    const html = renderToStaticMarkup(createElement(MenuTree, {
        defaultCollapsed: true,
        topItems: deepItems('top', 'leaf'),
        groups: [
            { key: 'group', title: '活跃组', items: deepItems('grouped', 'leaf') },
            { key: 'inactive', title: '未活跃组', items: [{ key: 'hidden', label: '不应出现' }] },
        ],
    }));
    assert.match(html, /top叶/);
    assert.match(html, /grouped叶/);
    assert.doesNotMatch(html, /不应出现/);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 2);
    assert.match(html, /class="zfc-mt-group has-active"/);
});

test('active 更新会递归展开 topItems 和 groups；相同数据重建不撤销手动折叠', () => {
    const props = (activeKey, autoExpandActive = true) => ({
        defaultCollapsed: true, autoExpandActive,
        topItems: deepItems('top', activeKey),
        groups: [{ key: 'group', title: '分组', items: deepItems('grouped', activeKey) }],
    });
    const mounted = mountMenu(props());
    assert.ok(!nodes(mounted.render()).some((node) => node.props.title === 'top叶'));
    let tree = mounted.render(props('leaf'));
    assert.equal(titled(tree, 'top叶').props['aria-current'], 'page');
    assert.equal(titled(tree, 'grouped叶').props['aria-current'], 'page');
    titled(tree, 'top父').props.onClick(event());
    findNode(tree, (node) => node.props.className === 'zfc-mt-label zfc-mt-toggle').props.onClick(event());
    tree = mounted.render(props('leaf'));
    assert.ok(!nodes(tree).some((node) => node.props.title === 'top叶'));
    assert.ok(!nodes(tree).some((node) => node.props.title === 'grouped叶'));
    tree = mounted.render(props('next'));
    assert.equal(titled(tree, 'top下一叶').props['aria-current'], 'page');
    assert.equal(titled(tree, 'grouped下一叶').props['aria-current'], 'page');
    assert.equal(titled(tree, 'top叶').props['aria-current'], undefined);
});

test('导航到父项只展开祖先，不展开父项自己的子树', () => {
    const props = (active) => ({ defaultCollapsed: true, topItems: [{
        key: 'parent', label: '父导航', href: '/parent', active,
        children: [{ key: 'child', label: '子导航', href: '/child' }],
    }] });
    const mounted = mountMenu(props(false));
    let tree = mounted.render(props(true));
    assert.equal(titled(tree, '展开父导航').props['aria-expanded'], false);
    assert.ok(!nodes(tree).some((node) => node.props.title === '子导航'));
    assert.equal(titled(tree, '父导航').props['aria-current'], 'page');
});

test('autoExpandActive=false 阻止初次及后续 active 自动展开；重新开启时展开', () => {
    const props = (activeKey, autoExpandActive = false) => ({
        topItems: deepItems('top', activeKey), defaultCollapsed: true, autoExpandActive,
    });
    const mounted = mountMenu(props('leaf'));
    assert.equal(titled(mounted.render(), 'top父').props['aria-expanded'], false);
    assert.equal(titled(mounted.render(props('next')), 'top父').props['aria-expanded'], false);
    assert.equal(titled(mounted.render(props('next', true)), 'top下一叶').props['aria-current'], 'page');
});

test('父项按钮/链接只导航；独立箭头只折叠，不嵌套交互节点', () => {
    for (const href of [undefined, '/parent']) {
        let navigations = 0;
        let receivedEvent;
        const mounted = mountMenu({ topItems: [{
            key: 'parent', label: '父导航', href,
            onClick: (e) => { navigations++; receivedEvent = e; },
            children: [{ key: 'child', label: '子导航', href: '/child' }],
        }] });
        let tree = mounted.render();
        const click = event();
        assert.equal(titled(tree, '父导航').type, href ? 'a' : 'button');
        assert.equal(titled(tree, '父导航').props['aria-expanded'], undefined);
        titled(tree, '父导航').props.onClick(click);
        assert.equal(navigations, 1);
        assert.equal(receivedEvent, click);
        tree = mounted.render();
        assert.equal(titled(tree, '收起父导航').props['aria-expanded'], true);
        titled(tree, '收起父导航').props.onClick(event());
        tree = mounted.render();
        assert.equal(navigations, 1);
        assert.equal(titled(tree, '展开父导航').props['aria-expanded'], false);
        assert.ok(!nodes(tree).some((node) => node.props.title === '子导航'));
        const html = renderToStaticMarkup(tree);
        assert.doesNotMatch(html, /<(button|a)\b[^>]*>(?:(?!<\/\1>)[\s\S])*<(?:button|a)\b/);
    }
});

test('纯父项支持原生按钮及左右方向键，导航父项箭头拥有独立可访问名称', () => {
    for (const onClick of [undefined, () => assert.fail('折叠键不可触发导航')]) {
        const mounted = mountMenu({
            defaultCollapsed: true,
            topItems: [{ key: 'parent', label: '键盘父项', onClick, children: [{ key: 'child', label: '键盘子项' }] }],
        });
        let tree = mounted.render();
        const control = () => titled(tree, onClick ? '展开键盘父项' : '键盘父项');
        assert.equal(control().type, 'button');
        assert.equal(control().props.type, 'button');
        const right = event('ArrowRight');
        control().props.onKeyDown(right);
        assert.equal(right.defaultPrevented, true);
        tree = mounted.render();
        assert.ok(titled(tree, '键盘子项'));
        const opened = titled(tree, onClick ? '收起键盘父项' : '键盘父项');
        if (onClick) assert.equal(opened.props['aria-label'], '收起键盘父项');
        opened.props.onKeyDown(event('ArrowLeft'));
        tree = mounted.render();
        assert.equal(control().props['aria-expanded'], false);
        control().props.onClick(event());
        assert.ok(titled(mounted.render(), '键盘子项'));
    }
});

test('disabled 链接、按钮及父项不会导航或折叠，包括直接调用事件及键盘处理器', () => {
    for (const href of [undefined, '/disabled', 'https://example.com/disabled']) {
        const mounted = mountMenu({ topItems: [{
            key: 'disabled', label: '禁用父项', href, disabled: true,
            onClick: () => assert.fail('disabled 不可调用回调'),
            children: [{ key: 'child', label: '子项' }],
        }] });
        let tree = mounted.render();
        const row = titled(tree, '禁用父项');
        assert.equal(row.props['aria-disabled'], true);
        if (href) {
            assert.equal(row.props.href, undefined);
            assert.equal(row.props.tabIndex, -1);
            assert.equal(row.props.role, 'link');
        } else assert.equal(row.props.disabled, true);
        const click = event();
        row.props.onClick(click);
        assert.equal(click.defaultPrevented, true);
        const disclosure = titled(tree, '收起禁用父项');
        assert.equal(disclosure.props.disabled, true);
        disclosure.props.onClick(event());
        disclosure.props.onKeyDown(event('ArrowLeft'));
        tree = mounted.render();
        assert.equal(titled(tree, '收起禁用父项').props['aria-expanded'], true);
    }
    const pure = mountMenu({ defaultCollapsed: true, topItems: [{
        key: 'disabled', label: '禁用纯父项', disabled: true, children: [{ key: 'child', label: '子项' }],
    }] });
    const row = titled(pure.render(), '禁用纯父项');
    row.props.onClick(event());
    row.props.onKeyDown(event('ArrowRight'));
    assert.equal(titled(pure.render(), '禁用纯父项').props['aria-expanded'], false);
});

test('target 业务标记不当 window name；内部导航保留回调及事件对象', () => {
    for (const target of [true, 'agents', '_self', undefined]) {
        let calls = 0;
        const mounted = mountMenu({ topItems: [{
            key: 'internal', label: '内部', href: '/agents', target,
            onClick: (e) => { calls++; e.preventDefault(); },
        }] });
        const tree = mounted.render();
        const link = titled(tree, '内部');
        assert.equal(link.props.target, undefined);
        assert.equal(link.props.rel, undefined);
        const click = event();
        link.props.onClick(click);
        assert.equal(calls, 1);
        assert.equal(click.defaultPrevented, true);
        assert.equal(nodes(tree).some((node) => node.props.className === 'zfc-mt-target-dot'), Boolean(target));
    }
});

test('真实外链及显式 _blank 是新标签/noopener；不执行当前页导航回调', () => {
    for (const [href, target] of [
        ['https://example.com/docs', undefined], ['http://example.com', 'business-marker'],
        ['//example.com/docs', true], ['/internal', '_blank'],
    ]) {
        const mounted = mountMenu({ topItems: [{
            key: 'external', label: '外链', href, target,
            onClick: () => assert.fail('外链不得触发当前页路由'),
            children: [{ key: 'child', label: '子项' }],
        }] });
        let tree = mounted.render();
        const link = titled(tree, '外链');
        assert.equal(link.type, 'a');
        assert.equal(link.props.href, href);
        assert.equal(link.props.target, '_blank');
        assert.match(link.props.rel, /\bnoopener\b/);
        const click = event();
        const previousWindow = globalThis.window;
        const opened = [];
        globalThis.window = { open: (...args) => opened.push(args) };
        try {
            link.props.onClick(click);
        } finally {
            if (previousWindow === undefined) delete globalThis.window;
            else globalThis.window = previousWindow;
        }
        assert.equal(click.defaultPrevented, true);
        assert.deepEqual(opened, [[href, '_blank', 'noopener,noreferrer']]);
        assert.equal(click.propagationStopped, true);
        tree = mounted.render();
        assert.equal(titled(tree, '收起外链').props['aria-expanded'], true);
    }
});

test('图标按同级占位，子层独立对齐；长标题保留完整内容和 title', () => {
    const label = '这是一段不能被裁掉的很长菜单标题'.repeat(4);
    const mounted = mountMenu({ topItems: [
        { key: 'icon', label: '有图标', icon: createElement('svg'), href: '/icon', children: [
            { key: 'child-icon', label: '子图标', icon: createElement('svg') },
            { key: 'child-empty', label: '子占位' },
        ] },
        { key: 'empty', label, href: '/empty', children: [{ key: 'plain', label: '无需占位' }] },
    ] });
    const tree = mounted.render();
    for (const title of ['有图标', label, '子图标', '子占位']) {
        assert.equal(nodes(titled(tree, title)).filter((node) => node.props.className === 'zfc-mt-ic').length, 1);
    }
    assert.ok(!nodes(titled(tree, '无需占位')).some((node) => node.props.className === 'zfc-mt-ic'));
    assert.equal(titled(tree, label).props.title, label);
    assert.match(renderToStaticMarkup(tree), new RegExp(label));
});
