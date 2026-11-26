/**
 * ProcessTimeline（Codex 风格对话过程时间线）行为测试。
 *
 * 沿用本仓惯例：Vite SSR 把 .jsx 现场编译，react-dom/server 渲染成 HTML 断言。
 * 断言的是 CEO 2026-11-24 截图范本的几条口径：
 *   - 组头 = 圆角方块 chevron 按钮 + 灰字标签
 *   - 展开后是竖线轨道上的步骤链，步骤带状态标记 / 参数徽章 / 流式预览
 *   - 步骤下方可挂详情面板（浅灰底）
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
let ProcessTimeline;

test.before(async () => {
    vite = await createServer({
        root: REPO_ROOT,
        logLevel: 'error',
        server: { middlewareMode: true },
        appType: 'custom',
    });
    const mod = await vite.ssrLoadModule('/src/components/ui/ProcessTimeline.jsx');
    ProcessTimeline = mod.default;
});

test.after(async () => {
    await vite?.close();
});

test('组头：圆角方块 caret + 灰字标签，默认收起', () => {
    const html = renderToStaticMarkup(
        createElement(ProcessTimeline, {
            groups: [{ key: 'g1', label: '执行工具 3 次', steps: [{ key: 's1', label: '读取文件' }] }],
        })
    );
    assert.match(html, /class="zfc-pt"/);
    assert.match(html, /class="zfc-pt-caret"/);
    assert.match(html, /class="zfc-pt-label">执行工具 3 次</);
    assert.match(html, /aria-expanded="false"/);
    // 默认收起 ⇒ 步骤链不渲染
    assert.doesNotMatch(html, /zfc-pt-steps/);
    assert.doesNotMatch(html, /读取文件/);
});

test('展开态：步骤链带竖线轨道、状态标记、参数徽章、流式预览', () => {
    const html = renderToStaticMarkup(
        createElement(ProcessTimeline, {
            groups: [{
                key: 'g1',
                label: '正在执行中 · 5分59秒',
                defaultOpen: true,
                steps: [
                    { key: 's1', label: '读取文件', status: 'done', badge: 'ctx.txt' },
                    { key: 's2', label: '思考中', status: 'thinking', preview: 'Let me continue reading' },
                ],
            }],
        })
    );
    assert.match(html, /aria-expanded="true"/);
    assert.match(html, /class="zfc-pt-steps"/);
    assert.match(html, /class="zfc-pt-mark is-done"/);
    assert.match(html, /✓/);
    assert.match(html, /class="zfc-pt-badge">ctx.txt</);
    assert.match(html, /class="zfc-pt-preview">Let me continue reading</);
    assert.match(html, /class="zfc-pt-mark is-thinking"/);
});

test('失败步渲染红色叉号标记', () => {
    const html = renderToStaticMarkup(
        createElement(ProcessTimeline, {
            groups: [{
                key: 'g1', label: '执行工具 1 次', defaultOpen: true,
                steps: [{ key: 's1', label: 'grep_logs', status: 'failed' }],
            }],
        })
    );
    assert.match(html, /class="zfc-pt-mark is-failed"/);
    assert.match(html, /✕/);
});

test('详情面板：默认收起，宿主可对重点步显式展开', () => {
    const closed = renderToStaticMarkup(
        createElement(ProcessTimeline, {
            groups: [{
                key: 'g1', label: '正在执行中', defaultOpen: true,
                steps: [{ key: 's1', label: 'grep_logs', status: 'done', detail: '3 条命中' }],
            }],
        })
    );
    // 默认收起 ⇒ 只有「详情」开关，没有面板本体
    assert.match(closed, /class="zfc-pt-detail-toggle"/);
    assert.match(closed, /aria-expanded="false"/);
    assert.doesNotMatch(closed, /class="zfc-pt-detail"/);

    const opened = renderToStaticMarkup(
        createElement(ProcessTimeline, {
            groups: [{
                key: 'g1', label: '正在执行中', defaultOpen: true,
                steps: [{ key: 's1', label: '思考', status: 'thinking', detail: '推理正文', detailOpen: true }],
            }],
        })
    );
    assert.match(opened, /class="zfc-pt-detail">推理正文</);
    assert.match(opened, /aria-expanded="true"/);
});

test('组标签与步骤名按数据渲染（宿主拼文案，组件不写死业务词）', () => {
    const html = renderToStaticMarkup(
        createElement(ProcessTimeline, {
            groups: [{
                key: 'g1', label: '执行工具 1 次', defaultOpen: true,
                steps: [{ key: 's1', label: '读取文件', status: 'done' }],
            }],
        })
    );
    assert.match(html, /执行工具 1 次/);
    assert.match(html, /读取文件/);
    assert.doesNotMatch(html, /工具调用|调用工具/);
});

test('SSR 不注入 style（无 document 时跳过）', () => {
    const html = renderToStaticMarkup(
        createElement(ProcessTimeline, { groups: [{ key: 'g1', label: 'x' }] })
    );
    assert.doesNotMatch(html, /<style/);
});

test('几何：步骤轨道左缩进 + 竖线，标记挂在轨道线上', () => {
    const src = fs.readFileSync(
        path.join(REPO_ROOT, 'src/components/ui/ProcessTimeline.jsx'),
        'utf8'
    );
    assert.match(src, /\.zfc-pt-steps\{[^}]*border-left:1px solid var\(--zfc-pt-line\)/);
    assert.match(src, /\.zfc-pt-mark\{[^}]*position:absolute/);
    // chevron 基态必须显式 rotate(0deg)（WebKit 过渡到 none 会冻结，2026-11-23 真机钉死）
    assert.match(src, /\.zfc-pt-chevron\{[^}]*transform:rotate\(0deg\)/);
});
