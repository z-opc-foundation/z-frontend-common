/**
 * ListTable（lead 008 §2 强制规则 2/3/4 的成品件）行为测试。
 *
 * 为什么这么写：
 *   沿用 component-doc.test.mjs 的做法 —— 本仓没有测试框架，用 Vite 的 SSR 能力
 *   把 .jsx 现场编译，再用 react-dom/server 渲染成 HTML 断言。不引 jsdom。
 *   antd 的 Table / Card / Input 在 SSR 下能渲染出结构，足以断言三件套是否在位。
 *
 * 断言的是「规范要求的东西在不在」：
 *   - 规则 2：分页参数 showSizeChanger / pageSizeOptions / showTotal 是否真的渲染出来了
 *   - 规则 3：Card extra 里有没有过滤框
 *   - 规则 4：空数据时是不是 EmptyState（而不是 antd 默认的空图文案）
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

async function loadModule() {
    const server = await createServer({
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
    try {
        return await server.ssrLoadModule('/src/components/ui/index.js');
    } finally {
        await server.close();
    }
}

const mod = await loadModule();
const {ListTable, DEFAULT_PAGINATION} = mod;

const COLUMNS = [
    {title: '名称', dataIndex: 'name', key: 'name'},
    {title: '编号', dataIndex: 'code', key: 'code'},
];

test('ui 扁平桶导出了 ListTable', () => {
    assert.equal(typeof ListTable, 'function');
    assert.equal(typeof DEFAULT_PAGINATION, 'object');
});

test('规则 2：分页三件套参数真的传下去了', () => {
    const html = renderToStaticMarkup(createElement(ListTable, {
        rows: [{name: 'A', code: 'C-1'}],
        columns: COLUMNS,
        rowKey: 'code',
        searchKeys: 'name,code',
    }));
    // showTotal ⇒ 「共 N 条」在渲染产物里
    assert.ok(html.includes('共 1 条'), 'showTotal 渲染缺失');
    // showSizeChanger ⇒ 分页尾部有 options 容器（尺寸切换器）
    assert.ok(html.includes('ant-pagination-options'), 'showSizeChanger 渲染缺失');
    // pageSizeOptions 的选项列表在 antd 的下拉里，SSR 不渲染 ⇒ 只能在 prop 层断言
    assert.deepEqual(DEFAULT_PAGINATION.pageSizeOptions, ['10', '20', '50', '100']);
    assert.equal(DEFAULT_PAGINATION.showSizeChanger, true);
    assert.equal(typeof DEFAULT_PAGINATION.showTotal, 'function');
    assert.equal(DEFAULT_PAGINATION.pageSize, 10);
});

test('规则 3：Card extra 里有过滤框', () => {
    const html = renderToStaticMarkup(createElement(ListTable, {
        rows: [{name: 'A', code: 'C-1'}],
        columns: COLUMNS,
        rowKey: 'code',
        searchKeys: 'name,code',
        searchPlaceholder: '按名称过滤',
    }));
    assert.ok(html.includes('按名称过滤'), '过滤框 placeholder 未渲染');
});

test('规则 4：空数据时渲染 EmptyState 而不是 antd 默认空图', () => {
    const html = renderToStaticMarkup(createElement(ListTable, {
        rows: [],
        columns: COLUMNS,
        rowKey: 'code',
        searchKeys: 'name,code',
        emptyTitle: '还没有术语',
        emptyDescription: '蓝图的第 6 段缺口信号',
    }));
    assert.ok(html.includes('还没有术语'), 'EmptyState 标题未渲染');
    assert.ok(html.includes('蓝图的第 6 段缺口信号'), 'EmptyState 描述未渲染');
    assert.ok(!html.includes('No data'), '仍在用 antd 默认空图文案');
});

test('有数据时渲染行内容', () => {
    const html = renderToStaticMarkup(createElement(ListTable, {
        rows: [{name: '智能客服', code: 'C-1'}],
        columns: COLUMNS,
        rowKey: 'code',
        searchKeys: 'name,code',
    }));
    assert.ok(html.includes('智能客服'), '行数据未渲染');
    assert.ok(html.includes('C-1'), '行数据未渲染');
});

test('不给 searchKeys 时不渲染过滤框（过滤是空操作，不制造一个没用的输入框）', () => {
    const html = renderToStaticMarkup(createElement(ListTable, {
        rows: [{name: 'A', code: 'C-1'}],
        columns: COLUMNS,
        rowKey: 'code',
    }));
    assert.ok(!html.includes('placeholder="过滤"'), '不该出现默认过滤框');
});

test('过滤框与 cardExtra（动作按钮）同时给时两个都在，不二选一', () => {
    const html = renderToStaticMarkup(createElement(ListTable, {
        rows: [{name: 'A', code: 'C-1'}],
        columns: COLUMNS,
        rowKey: 'code',
        searchKeys: 'name',
        searchPlaceholder: '按名称过滤',
        cardExtra: createElement('button', {type: 'button'}, '新增'),
    }));
    assert.ok(html.includes('按名称过滤'), '过滤框被吞了');
    assert.ok(html.includes('新增'), '动作按钮被吞了');
});
