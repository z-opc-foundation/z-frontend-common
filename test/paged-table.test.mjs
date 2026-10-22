/**
 * PagedTable（服务端分页变体）的 §2 合规行为测试。
 *
 * 为什么要有这个文件：
 *   ListTable 是**客户端分页**的成品件，规则 2 的四件套在 `DEFAULT_PAGINATION` 里，
 *   list-table.test.mjs 已经钉住了。
 *   但 PagedTable 是**服务端分页**的另一形态（`load(current, size)` 由宿主自己去请求后端），
 *   它的分页参数是**内联**在组件里的，不走 DEFAULT_PAGINATION。
 *   ⇒ 它的分页四件套没有任何尺子管 ⇒ 补了一个 `pageSizeOptions` 时没人知道补了，
 *   漏了也没人知道漏了。而全库 §2 元素级普查（lead 008 §2）会把 8 个仓的 PagedTable
 *   拷贝一起判红 —— 根因就是基座这一处漏项被复制了 8 遍。
 *
 * 为什么断言分两层：
 *   - **渲染层**：showTotal 的文案、showSizeChanger 的容器、空态是不是 EmptyState。
 *     这些在 SSR 产物里看得见。
 *   - **源码层**：`pageSizeOptions` 的选项列表在 antd 的下拉里，**SSR 不渲染**
 *     （antd 的 Pagination 把 options 放进 client-only 的下拉）⇒ 只能在源码/prop 层断言。
 *     这一点在 list-table.test.mjs 里已记录，这里沿用同一口径。
 *
 * 变异必须真红：
 *   把源码里的 `pageSizeOptions` 那一行删掉，源码层断言必须判红 ——
 *   否则这个测试只是「文档」不是「尺子」。
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
const PAGED_TABLE_SRC = path.join(REPO_ROOT, 'src', 'components', 'ui', 'PagedTable.jsx');

async function loadModule() {
    const server = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        appType: 'custom',
        // hmr 关掉：middleware 模式下它会起一个 ws 服务，把 node --test 进程吊住不退出
        server: { middlewareMode: true, hmr: false },
        resolve: { conditions: ['import', 'module', 'browser', 'default'] },
        ssr: {
            noExternal: ['react-router-dom', 'react-router'],
            resolve: { conditions: ['import', 'module', 'browser', 'default'] },
        },
    });
    try {
        const ui = await server.ssrLoadModule('/src/components/ui/index.js');
        // PAGED_TOTAL_TEXT 是 PagedTable.jsx 的具名导出，**没有**进 ui 桶
        // （桶的导出名单是 §2/§7 的公开面，不为一条文案规则扩它）
        // ⇒ 测试直接加载组件文件拿它。
        const paged = await server.ssrLoadModule('/src/components/ui/PagedTable.jsx');
        // ⚠ MemoryRouter 必须**从同一个 SSR 模块图里**取。
        //   本测试文件由 node 直接加载 ⇒ 它的 `import 'react-router-dom'` 解析到 node_modules
        //   里的 CJS 产物；而 PageHeader（经 vite SSR 加载）用的是 noExternal 强制出来的
        //   ESM 产物 ⇒ **两份 react-router、两个 React Context** ⇒
        //   Router 的 context 对不上 ⇒ useNavigate() 抛
        //   "may be used only in the context of a <Router> component"。
        //   这不是组件的 bug，是**测试引入了第二份实现**。
        const router = await server.ssrLoadModule('react-router-dom');
        return {ui, paged, router};
    } finally {
        await server.close();
    }
}

const {ui: mod, paged, router} = await loadModule();
const {PagedTable} = mod;
const {PAGED_TOTAL_TEXT} = paged;
const {MemoryRouter} = router;

const COLUMNS = [
    {title: '名称', dataIndex: 'name', key: 'name'},
];

const readSrc = () => fs.readFileSync(PAGED_TABLE_SRC, 'utf8');

/**
 * PagedTable 内部渲染 <PageHeader>，而 PageHeader 用了 useNavigate() ⇒ 必须给 Router 上下文，
 * 否则 SSR 直接抛 "useNavigate() may be used only in the context of a <Router> component"。
 * 用 MemoryRouter 而不是 BrowserRouter：后者在 Node 下没有 window.history。
 */
const render = (props) => renderToStaticMarkup(
    createElement(MemoryRouter, {initialEntries: ['/']}, createElement(PagedTable, props)),
);

test('ui 扁平桶导出了 PagedTable', () => {
    assert.equal(typeof PagedTable, 'function');
});

test('规则 2：分页四件套在源码里逐项声明（pageSizeOptions 只能源码层断言）', () => {
    const src = readSrc();
    // showSizeChanger / showTotal / pageSize
    assert.match(src, /showSizeChanger:\s*true/, 'showSizeChanger 未声明');
    assert.match(src, /showTotal:/, 'showTotal 未声明');
    assert.match(src, /pageSize:\s*page\.size/, 'pageSize 未声明');
    // pageSizeOptions：SSR 渲染里看不到，只能在源码层钉
    assert.match(src, /pageSizeOptions:\s*\[[^\]]*\]/, 'pageSizeOptions 未声明');
    // 必须真的是那组可选项，而不是空数组
    const m = src.match(/pageSizeOptions:\s*\[([^\]]*)\]/);
    assert.ok(m, 'pageSizeOptions 取不到');
    const opts = m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    assert.deepEqual(opts, ['10', '20', '50', '100'], `pageSizeOptions 选项集不对：${opts.join(',')}`);
});

test('规则 4：空数据时渲染 EmptyState 而不是 antd 默认空图', () => {
    // SSR 下 useEffect 不跑 ⇒ rows 为空 ⇒ 正好走空态分支
    const html = render({
        title: '实例',
        load: async () => ({records: [], total: 0}),
        columns: COLUMNS,
    });
    assert.ok(html.includes('暂无数据'), 'EmptyState 标题未渲染');
    assert.ok(!html.includes('No data'), '仍在用 antd 默认空图文案');
});

test('规则 2：showTotal 的两支文案口径固定（提成纯函数才测得到）', () => {
    // 为什么在纯函数层断言：antd Table 在空数据时**整个分页块都不渲染**
    // （SSR 产物里连 ant-pagination 容器都没有）⇒ showTotal 那个闭包在 SSR 下永不执行。
    // 不提成纯函数的话，这个文案口径根本没有任何办法被测到。
    assert.equal(PAGED_TOTAL_TEXT.known(37), '共 37 条');
    assert.equal(PAGED_TOTAL_TEXT.unknown(12), '本页 12 条（接口 total 未返回有效值）');
    // 源码里 showTotal 必须真的调它（防止「导出了但没接上」）
    const src = readSrc();
    assert.match(src, /showTotal:[\s\S]{0,200}PAGED_TOTAL_TEXT\.known/, 'showTotal 没走 PAGED_TOTAL_TEXT.known');
    assert.match(src, /showTotal:[\s\S]{0,300}PAGED_TOTAL_TEXT\.unknown/, 'showTotal 没走 PAGED_TOTAL_TEXT.unknown');
});

test('尺子的牙口：把源码里的 pageSizeOptions 删掉，判定必须判红', () => {
    const real = readSrc();
    const broken = real.replace(/^\s*pageSizeOptions:\s*\[[^\]]*\],\s*$/m, '');
    assert.notEqual(broken, real, '变异没改动源码（尺子测不到自己）');
    assert.doesNotMatch(broken, /pageSizeOptions:\s*\[[^\]]*\]/, '变异后尺子竟然没判红');
    assert.match(real, /pageSizeOptions:\s*\[[^\]]*\]/, '真实源码反而不合规');
});
