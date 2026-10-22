/**
 * README 里每一条定量主张都必须能从盘面重算出来 —— 广告出去的话就是承诺。
 *
 * 为什么要有这一层：本仓 README 把「当前版本 / 3 个产物入口 / 9+1 条 external /
 * 8 个 default 桶成员 / 5 个 createRequest 默认值 / 23 个 ui 桶具名导出 /
 * 40 个 suit / 31 个 component 消费方」写成了硬数字，而每抬一次版本、每调一次
 * 依赖清单、每加一个 suit 都会让这些数字漂一次。没有任何尺子去问盘面「现在还是吗」，
 * 那这些数字的保质期就是上一次编辑的时刻。
 *
 * 口径：
 * - 缺一条主张 = 红（不许「正则没匹配上就跳过」，那正是空跑）；
 * - 数值不等 = 红，且报错必须把**重算值**打进去（红了要知道真数是多少）；
 * - README 侧的数字**一律在核对当下现解析**（本文件不缓存 README 侧数值），
 *   事实对象里只装源码侧的事实 —— 否则尺子会退化成恒等式比较，改了 README 也不红。
 *
 * ⚠ 本仓没有测试框架，源码是 .jsx —— 本文件刻意用 node:test + .mjs，
 * **零新增依赖**，且只读文本不 import JSX（import 会因 JSX 语法直接炸）。
 * 运行：npm test（= node --test test/）
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));   // <仓>/test
const REPO_ROOT = path.resolve(TEST_DIR, '..');                    // 仓根 z-frontend-common
const WORKSPACE = path.resolve(REPO_ROOT, '..');                   // 工作区根 z-opc-foundation
const README = path.join(REPO_ROOT, 'README.md');
const PKG_JSON = path.join(REPO_ROOT, 'package.json');
const VITE_MJS = path.join(REPO_ROOT, 'vite.config.mjs');
const SRC_INDEX = path.join(REPO_ROOT, 'src', 'index.js');
const UI_INDEX = path.join(REPO_ROOT, 'src', 'components', 'ui', 'index.js');
const REQUEST_JS = path.join(REPO_ROOT, 'src', 'services', 'request.js');
const DOC_DIR = path.join(REPO_ROOT, '_doc');
const PKG_NAME = '@yuku123/z-frontend-common';

const readText = (p) => fs.readFileSync(p, 'utf8');

/** 换行劈行安全：把连续空白压成一个空格，避免 README 表格换行导致正则跨行失配。 */
const flatten = (s) => s.replace(/\s+/g, ' ');

/** 取某个二级章节的正文（不含标题行本身）。 */
function section(readme, title) {
    const start = readme.indexOf(`## ${title}`);
    if (start < 0) return '';
    const body = readme.slice(start);
    const next = body.indexOf('\n## ', 3);
    return next < 0 ? body : body.slice(0, next);
}

/* ------------------------------------------------------------------ *
 * 事实侧：全部从源码重算，README 一个字都不参与
 * ------------------------------------------------------------------ */

function viteFacts() {
    const vite = readText(VITE_MJS);
    const entryBody = vite.slice(vite.indexOf('entry:'), vite.indexOf('formats:'));
    const entries = [...entryBody.matchAll(/'([^']+)'\s*:/g)].map((m) => m[1]);
    const formats = [...vite.slice(vite.indexOf('formats:'), vite.indexOf('outDir:'))
        .matchAll(/'([^']+)'/g)].map((m) => m[1]);
    // external 在箭头函数体里；函数体之后不会再出现 id === / id.startsWith 形式，取尾部即可
    const tail = vite.slice(vite.indexOf('external:'));
    const exact = [...tail.matchAll(/id === '([^']+)'/g)].map((m) => m[1]);
    const prefix = [...tail.matchAll(/id\.startsWith\('([^']+)'\)/g)].map((m) => m[1]);
    return { entries, formats, exact, prefix };
}

function srcIndexFacts() {
    const src = readText(SRC_INDEX);
    const explicit = new Set();
    for (const m of src.matchAll(/export\s*\{([^}]*)\}\s*(?:from\s*'[^']*')?/g)) {
        for (const raw of m[1].split(',')) {
            const name = raw.trim().split(/\s+as\s+/).pop().trim();
            if (name) explicit.add(name);
        }
    }
    // default 桶的成员名单 —— 两种写法都要认：
    //   ① `export default { A, B }`（旧写法）
    //   ② `const bucket = { A, B }; export default bucket`（3f0f4a3 起的新写法：
    //      桶要补 axios 动词转发，不能再是字面量，只能先具名再导出）
    // ⚠ 尺子必须跟着源码写法走：只认 ① 时，源码换成 ② 会让 `indexOf` 返回 -1 ⇒
    //   slice(-1) 取到文件最后一个字符 ⇒ 成员数重算成 0 ⇒ **尺子自己把真值判成红**。
    const bucketBody = (() => {
        const literal = src.indexOf('export default {');
        if (literal >= 0) return src.slice(literal);
        // 具名桶：找 `const <name> = {` 且该 name 后面确实被 export default
        for (const m of src.matchAll(/const\s+(\w+)\s*=\s*\{/g)) {
            if (new RegExp(`export\\s+default\\s+${m[1]}\\b`).test(src)) {
                return src.slice(m.index);
            }
        }
        return '';
    })();
    const defNames = [...bucketBody.matchAll(/^\s{4}(\w+),/gm)].map((m) => m[1]);
    assert.ok(defNames.length > 0,
        'src/index.js 的 default 桶一个成员都没解析出来 —— 尺子的桶解析器跟不上源码写法了（README 说 8 个成员）');
    return { explicit, defNames };
}

function uiBucketFacts() {
    const ui = readText(UI_INDEX);
    const componentFiles = new Set();
    const componentNames = [];
    const tokenNames = [];
    for (const m of ui.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']*)'/g)) {
        const mod = m[2];
        for (const raw of m[1].split(',')) {
            const name = raw.trim().split(/\s+as\s+/).pop().trim();
            if (!name) continue;
            if (mod === './tokens') tokenNames.push(name);
            else {
                componentNames.push(name);
                componentFiles.add(mod.replace(/^\.\//, ''));
            }
        }
    }
    return {
        componentFiles: componentFiles.size,
        componentNames,
        tokenNames,
        total: componentNames.length + tokenNames.length,
    };
}

function requestDefaults() {
    const req = readText(REQUEST_JS);
    return {
        baseURL: req.match(/baseURL:\s*options\.baseURL\s*\?\?\s*'([^']+)'/)?.[1],
        timeout: req.match(/timeout:\s*options\.timeout\s*\?\?\s*(\d+)/)?.[1],
        tokenKey: req.match(/tokenKey\s*=\s*'([^']+)'/)?.[1],
        userInfoKey: req.match(/userInfoKey\s*=\s*'([^']+)'/)?.[1],
        unauthorizedRedirect: req.match(/unauthorizedRedirect\s*=\s*'([^']+)'/)?.[1],
    };
}

/** 跨仓消费面：工作区里消费本包的 suit / component 工程。 */
function workspaceFacts() {
    if (!fs.existsSync(WORKSPACE)) return null;
    const siblings = fs.readdirSync(WORKSPACE, { withFileTypes: true })
        .filter((e) => e.isDirectory() && /^z-/.test(e.name) && e.name !== 'z-frontend-common')
        .map((e) => e.name);
    if (siblings.length === 0) return null;

    const declares = (pkgPath) => {
        if (!fs.existsSync(pkgPath)) return false;
        let data;
        try { data = JSON.parse(readText(pkgPath)); } catch { return false; }
        for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
            if ((data[key] ?? {})[PKG_NAME]) return true;
        }
        return false;
    };
    const srcImports = (dir) => {
        if (!fs.existsSync(dir)) return false;
        const stack = [dir];
        while (stack.length) {
            const cur = stack.pop();
            for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
                if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
                const full = path.join(cur, e.name);
                if (e.isDirectory()) stack.push(full);
                else if (/\.(js|jsx|ts|tsx)$/.test(e.name) && readText(full).includes(PKG_NAME)) return true;
            }
        }
        return false;
    };

    let suits = 0, declared = 0, imported = 0;
    for (const s of siblings) {
        const fe = path.join(WORKSPACE, s, '_frontend');
        if (!fs.existsSync(fe)) continue;
        for (const d of fs.readdirSync(fe, { withFileTypes: true })) {
            if (!d.isDirectory()) continue;
            if (d.name.endsWith('-suit')) {
                if (declares(path.join(fe, d.name, 'package.json'))) suits += 1;
            } else if (d.name.endsWith('-component')) {
                const dir = path.join(fe, d.name);
                if (!declares(path.join(dir, 'package.json'))) continue;
                declared += 1;
                if (srcImports(path.join(dir, 'src'))) imported += 1;
            }
        }
    }
    return { suits, declared, imported };
}

/** 事实对象：只装源码侧事实。 */
function facts() {
    const pkg = JSON.parse(readText(PKG_JSON));
    const vite = viteFacts();
    const src = srcIndexFacts();
    const ui = uiBucketFacts();
    return {
        name: pkg.name,
        version: pkg.version,
        deps: pkg.dependencies ?? {},
        peerDeps: pkg.peerDependencies ?? {},
        devDeps: pkg.devDependencies ?? {},
        vite,
        src,
        ui,
        defaults: requestDefaults(),
        docBuckets: fs.existsSync(DOC_DIR)
            ? fs.readdirSync(DOC_DIR, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort()
            : [],
        emptyStateFile: fs.existsSync(path.join(REPO_ROOT, 'src', 'components', 'ui', 'EmptyState.jsx')),
    };
}

/** 依赖的 major 版本（^19.2.0 → 19）。 */
const major = (range) => Number(String(range).replace(/^[^0-9]*/, '').split('.')[0]);

/* ------------------------------------------------------------------ *
 * 主张侧：全部在核对当下从「被核对的那份 README」现解析
 * ------------------------------------------------------------------ */

function verifyClaims(readme, f) {
    const flat = flatten(readme);
    const api = section(readme, '对外 API');
    const flatApi = flatten(api);

    const claim = (re, what, src = flat) => {
        const m = src.match(re);
        if (!m) {
            throw new assert.AssertionError({
                message: `README 里找不到「${what}」这条主张 —— 要么它被改了写法（尺子要跟着改），` +
                    `要么它被删了（那就不该再声称这个数）`,
            });
        }
        return m[1];
    };
    const claimNum = (re, what, src = flat) => {
        const raw = claim(re, what, src);
        const n = Number(raw);
        assert.ok(Number.isFinite(n), `README 里的「${what}」不是数字：${raw}`);
        return n;
    };
    const eq = (readmeVal, srcVal, what) => assert.equal(readmeVal, srcVal, `${what} 对不上（重算值见右侧）`);

    // 主张 1：当前版本 = package.json version
    eq(claim(/当前版本 \| `([0-9]+\.[0-9]+\.[0-9]+)`/, '当前版本 `X.Y.Z`'), f.version, '当前版本');

    // 主张 2：技术栈四个 major（devDependencies 版本线）
    const stack = flat.match(/React (\d+) \+ antd (\d+) \+ react-router-dom (\d+) \+ Vite (\d+)/);
    if (!stack) {
        throw new assert.AssertionError({
            message: 'README 里找不到「React N + antd N + react-router-dom N + Vite N」这条技术栈主张',
        });
    }
    eq(Number(stack[1]), major(f.devDeps.react), 'React major');
    eq(Number(stack[2]), major(f.devDeps.antd), 'antd major');
    eq(Number(stack[3]), major(f.devDeps['react-router-dom']), 'react-router-dom major');
    eq(Number(stack[4]), major(f.devDeps.vite), 'Vite major');

    // 主张 3：产物入口数 + 三个入口名（vite lib entry）
    eq(claimNum(/ESM \*\*(\d+) 入口\*\*/, 'ESM N 入口'), f.vite.entries.length, '产物入口数');
    const distNames = [...flat.matchAll(/`dist\/([A-Za-z0-9-]+)\.js`/g)].map((m) => m[1]);
    eq(distNames.length, f.vite.entries.length, 'README 里点名的 dist 入口数');
    for (const e of f.vite.entries) {
        assert.ok(distNames.includes(e), `README 的产物段没有点名入口 ${e}.js（vite lib entry 实有）`);
    }

    // 主张 4：external 精确包数 + 前缀规则数
    const ext = flat.match(/external 精确 \*\*(\d+)\*\* 个包 \+ \*\*(\d+)\*\* 条前缀规则/);
    if (!ext) {
        throw new assert.AssertionError({
            message: 'README 里找不到「external 精确 N 个包 + N 条前缀规则」这条主张',
        });
    }
    eq(Number(ext[1]), f.vite.exact.length, 'external 精确包数');
    eq(Number(ext[2]), f.vite.prefix.length, 'external 前缀规则数');

    // 主张 5：default 桶成员名单 + 成员数
    const defNames = claim(/`default`（桶） \| `?\{([^}]*)\}`?/, 'default 桶成员名单', flatApi)
        .split(',').map((s) => s.trim()).filter(Boolean);
    eq(defNames.length, f.src.defNames.length, 'default 桶成员数');
    for (const n of f.src.defNames) {
        assert.ok(defNames.includes(n), `default 桶少写了成员 ${n}（src/index.js 里有）`);
    }
    eq(claimNum(/\*\*(\d+)\*\* 个成员/, 'default 桶 N 个成员', flatApi), f.src.defNames.length, 'default 桶成员数（正文写的数）');

    // 主张 6：createRequest 五个默认值（README 现抠 vs 源码现抠）
    const opts = claim(/`createRequest\(options\)` \| axios 实例工厂：`\{([^}]*)\}`/, 'createRequest 默认值清单', flatApi);
    const readmeOpts = new Map();
    for (const part of opts.split(',')) {
        const kv = part.trim().match(/^(\w+)=('[^']*'|\d+)$/);
        if (kv) readmeOpts.set(kv[1], kv[2].replace(/^'|'$/g, ''));
    }
    for (const key of ['baseURL', 'timeout', 'tokenKey', 'userInfoKey', 'unauthorizedRedirect']) {
        assert.ok(readmeOpts.has(key), `createRequest 默认值清单里没有 ${key}`);
        eq(readmeOpts.get(key), String(f.defaults[key]), `createRequest 默认值 ${key}`);
    }

    // 主张 7：ui 扁平桶的 组件文件数 / 具名数 / token 数 / 总数 / token 名单
    eq(claimNum(/(\d+) 个 UI 组件文件导出/, 'ui 桶组件文件数', flatApi), f.ui.componentFiles, 'ui 桶组件文件数');
    eq(claimNum(/个 UI 组件文件导出 \*\*(\d+)\*\* 个具名/, 'ui 桶组件具名数', flatApi), f.ui.componentNames.length, 'ui 桶组件具名数');
    eq(claimNum(/\+ \*\*(\d+)\*\* 个 design token/, 'ui 桶 token 数', flatApi), f.ui.tokenNames.length, 'ui 桶 token 数');
    eq(claimNum(/= \*\*(\d+)\*\* 个具名导出/, 'ui 桶具名导出总数', flatApi), f.ui.total, 'ui 桶具名导出总数');
    const tokenList = claim(/个 design token（([^）]*)）/, 'ui 桶 token 名单', flatApi)
        .split('/').map((s) => s.trim().replace(/`/g, '')).filter(Boolean);
    eq(tokenList.length, f.ui.tokenNames.length, 'ui 桶 token 名单条数');
    for (const t of f.ui.tokenNames) {
        assert.ok(tokenList.includes(t), `ui 桶 token 名单少写了 ${t}`);
    }

    // 主张 8：对外 API 表里的具名导出，源码里都得真的导得出来（名单双向对账）
    const apiNames = new Set();
    for (const m of api.matchAll(/`([A-Za-z][A-Za-z0-9_]*)(?:\([^`]*\))?`/g)) apiNames.add(m[1]);
    for (const n of f.src.explicit) {
        assert.ok(apiNames.has(n), `对外 API 表没有列出顶层导出 ${n}（src/index.js 里 export 过）`);
    }

    // 主张 9：升级 / 新增的处数（表里的标记数与标题里的措辞必须一致）
    eq((api.match(/\*\*升级\*\*/g) ?? []).length, 2, '对外 API 表里「升级」标记数');
    eq((api.match(/\*\*新增/g) ?? []).length, 1, '对外 API 表里「新增」标记数');
    assert.ok(/两处升级 \+ 一处新增/.test(flatApi), '对外 API 标题没有声明「两处升级 + 一处新增」');

    // 主张 10：EmptyState 是实装件，不是占位
    assert.ok(f.emptyStateFile, 'src/components/ui/EmptyState.jsx 不存在');
    assert.ok(f.ui.componentNames.includes('EmptyState'), 'EmptyState 没有从 ui 桶导出');
    const esRow = api.split('\n').find((l) => l.includes('`EmptyState`')) ?? '';
    assert.ok(/已实装/.test(esRow), 'README 的 EmptyState 行没有写「已实装」');
    assert.ok(!/占位/.test(esRow), 'README 的 EmptyState 行仍写着「占位」');

    // 主张 11：axios 在 dependencies 且 external（README 两处说法都得与源码一致）
    assert.ok(f.deps.axios, 'package.json dependencies 里没有 axios');
    assert.ok(f.vite.exact.includes('axios'), 'vite external 里没有 axios');
    assert.ok(/axios \| 声明在 `dependencies`/.test(flat), 'README 的 axios 行没有声明它在 dependencies');
    assert.ok(/bundle 侧 external/.test(flat), 'README 的 axios 行没有声明 bundle 侧 external');

    // 主张 12：_doc 桶目录与 README 列的桶一一对应
    const docBuckets = [...flat.matchAll(/\[`_doc\/(\d+_[a-z]+)\/`\]/g)].map((m) => m[1]).sort();
    eq(docBuckets.join(','), f.docBuckets.join(','), '_doc 桶目录');
}

/* ------------------------------------------------------------------ *
 * 用例
 * ------------------------------------------------------------------ */

test('README 的定量主张与盘面重算值逐条对账', () => {
    verifyClaims(readText(README), facts());
});

test('不许冤枉健康页：真实 README 不得被判红', () => {
    verifyClaims(readText(README), facts());
});

test('跨仓消费面与工作区实测一致（suit / component 声明 / component 真 import）', () => {
    const w = workspaceFacts();
    if (!w) {
        // 单仓 checkout 下算不出跨仓面：这时只保证 README 仍声明了这三个数（不许悄悄删）
        const flat = flatten(readText(README));
        assert.match(flat, /工作区内 \*\*\d+\*\* 个 `\*-suit` 工程/, 'README 缺 suit 消费数');
        assert.match(flat, /\*\*\d+\*\* 个 `\*-component` 工程声明依赖本包/, 'README 缺 component 消费数');
        return;
    }
    const flat = flatten(readText(README));
    const suits = Number(flat.match(/工作区内 \*\*(\d+)\*\* 个 `\*-suit` 工程/)[1]);
    const declared = Number(flat.match(/\*\*(\d+)\*\* 个 `\*-component` 工程声明依赖本包/)[1]);
    const imported = Number(flat.match(/（其中 \*\*(\d+)\*\* 个在源码里真的 import）/)[1]);
    assert.equal(suits, w.suits, `suit 消费数对不上（工作区实测 ${w.suits}）`);
    assert.equal(declared, w.declared, `component 声明数对不上（工作区实测 ${w.declared}）`);
    assert.equal(imported, w.imported, `component 真 import 数对不上（工作区实测 ${w.imported}）`);
    // createRequest 行里第二处 component 数也要被钉住（同一数多处出现，每处单独钉）
    const again = Number(flat.match(/；(\d+) 个 `\*-component` 工程声明依赖本包/)[1]);
    assert.equal(again, w.declared, `createRequest 行的 component 数对不上（工作区实测 ${w.declared}）`);
});

test('尺子的牙口：把 README 的数改错，判定必须判红', () => {
    const real = readText(README);
    const f = facts();
    const mutations = [
        ['当前版本', (s) => s.replace(/当前版本 \| `[0-9.]+`/, '当前版本 | `9.9.9`')],
        ['产物入口数', (s) => s.replace(/ESM \*\*3 入口\*\*/, 'ESM **1 入口**')],
        ['external 精确包数', (s) => s.replace(/external 精确 \*\*9\*\* 个包/, 'external 精确 **7** 个包')],
        ['default 桶成员数', (s) => s.replace(/\*\*8\*\* 个成员/, '**6** 个成员')],
        ['createRequest 默认值', (s) => s.replace(/timeout=10000/, 'timeout=30000')],
        // ⚠ 变异目标要跟着 README 的现值走（ui 桶加组件后总数会变）：
        //   写死旧数字 ⇒ replace 不命中 ⇒ 「变异没改动 README」自检先红，
        //   尺子在自己的牙口上失灵（这不是尺子坏了，是尺子的靶子挪了）。
        //   这里用「任意数字」正则而不是写死值：靶子再挪也不会失灵。
        ['ui 桶具名总数', (s) => s.replace(/= \*\*\d+\*\* 个具名导出/, '= **999** 个具名导出')],
        ['ui 桶组件文件数', (s) => s.replace(/(\d+) 个 UI 组件文件导出/, '999 个 UI 组件文件导出')],
        ['EmptyState 占位回退', (s) => s.replace(/\| \*\*已实装\*\*/, '| **占位**')],
    ];
    for (const [what, mutate] of mutations) {
        const broken = mutate(real);
        assert.notEqual(broken, real, `变异「${what}」没改动 README（尺子测不到自己）`);
        assert.throws(() => verifyClaims(broken, f), assert.AssertionError, `变异「${what}」竟然没被判红`);
    }
});

test('尺子的牙口：把 README 的主张删掉，判定必须判红（不许静默跳过）', () => {
    const real = readText(README);
    const f = facts();
    const deletions = [
        ['当前版本', (s) => s.replace(/当前版本 \| `[0-9.]+`/, '当前版本 | 待定')],
        ['技术栈 major', (s) => s.replace(/React \d+ \+ antd \d+ \+ react-router-dom \d+ \+ Vite \d+/, '前端技术栈')],
        ['external 条数', (s) => s.replace(/external 精确 \*\*9\*\* 个包 \+ \*\*1\*\* 条前缀规则/, '全部 external')],
    ];
    for (const [what, mutate] of deletions) {
        const broken = mutate(real);
        assert.notEqual(broken, real, `删除「${what}」没改动 README（尺子测不到自己）`);
        assert.throws(() => verifyClaims(broken, f), assert.AssertionError, `删除「${what}」竟然没被判红`);
    }
});
