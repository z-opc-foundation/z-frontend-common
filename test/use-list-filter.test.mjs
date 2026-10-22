/**
 * useListFilter / filterRows 行为测试（lead 008 §2 强制规则 3 的客户端过滤口径）。
 *
 * 为什么只测纯函数不测 hook：
 *   本仓没有测试框架，且 hook 的行为 = filterRows + 一个 state；
 *   filterRows 是纯函数，直接 import 源码断言即可，不需要 React 渲染环境。
 *   （hook 那一层由 z-product 等真实页面在浏览器里验证。）
 *
 * 关注的是「口径会不会悄悄变」：
 *   - 大小写不敏感
 *   - 多字段或匹配
 *   - null/undefined 字段不参与匹配（否则 String(null)="null" 会误命中每一行）
 *   - 空关键字原样返回（不过滤）
 *
 * 运行：npm test（= node --test test/）
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TEST_DIR, '..');

/** 把 .js 源码用 Vite 现场编译后取回 ESM 导出（不引额外依赖）。 */
async function loadModule() {
    const server = await createServer({
        root: REPO_ROOT,
        logLevel: 'silent',
        server: { middlewareMode: true },
        appType: 'custom',
    });
    try {
        const url = '/src/components/ui/useListFilter.js';
        const mod = await server.ssrLoadModule(url);
        return mod;
    } finally {
        await server.close();
    }
}

const mod = await loadModule();
const { filterRows } = mod;

const ROWS = [
    {id: 'P-001', name: '智能客服', owner: 'alice', remark: null},
    {id: 'P-002', name: '风控引擎', owner: 'bob', remark: undefined},
    {id: 'P-003', name: '风控看板', owner: 'alice', remark: 'null'},
];

test('空关键字原样返回，不做任何过滤', () => {
    assert.equal(filterRows(ROWS, 'id,name', ''), ROWS);
    assert.equal(filterRows(ROWS, 'id,name', '   '), ROWS);
});

test('大小写不敏感', () => {
    assert.deepEqual(filterRows(ROWS, 'id', 'p-001').map(r => r.id), ['P-001']);
    assert.deepEqual(filterRows(ROWS, 'owner', 'ALICE').map(r => r.id), ['P-001', 'P-003']);
});

test('多字段「或」匹配：任一字段命中即保留', () => {
    assert.deepEqual(filterRows(ROWS, 'id,name', '003').map(r => r.id), ['P-003']);
    // owner 也要能被搜到 —— 调用方声明的字段集决定搜索面
    assert.deepEqual(filterRows(ROWS, 'id,name,owner', 'alice').map(r => r.id), ['P-001', 'P-003']);
    // 只声明 id,name 时，owner 里的内容不该被搜到（搜索面由调用方控制）
    assert.deepEqual(filterRows(ROWS, 'id,name', 'alice'), []);
});

test('null / undefined 字段不参与匹配（否则 "null" 会误命中每一行）', () => {
    // 只有 P-003 的 remark 是字符串 "null"，前两行的 remark 是 null/undefined
    assert.deepEqual(filterRows(ROWS, 'remark', 'null').map(r => r.id), ['P-003']);
});

test('数组形式的 keys 与逗号分隔字符串等价', () => {
    assert.deepEqual(
        filterRows(ROWS, ['id', 'name'], '客服').map(r => r.id),
        filterRows(ROWS, 'id,name', '客服').map(r => r.id),
    );
});

test('非数组入参不炸（返回空数组）', () => {
    assert.deepEqual(filterRows(null, 'id', 'x'), []);
    assert.deepEqual(filterRows(undefined, 'id', ''), []);
});

test('keys 为空串时不过滤（宁可不筛，也不要把整张表筛空）', () => {
    assert.equal(filterRows(ROWS, '', 'x').length, ROWS.length);
    assert.equal(filterRows(ROWS, [], 'x').length, ROWS.length);
});

test('导出了 hook 本体', () => {
    assert.equal(typeof mod.useListFilter, 'function');
    assert.equal(typeof mod.default, 'function');
});
