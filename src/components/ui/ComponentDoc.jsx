/**
 * ComponentDoc - 组件文档页（lead 008 §7）
 *
 * 规范 §7 要求：每个 *-component 仓有唯一一份 DOC.md；每个 *-suit 在 menuConfig 最末
 * 追加 {key:'/docs', label:'组件文档', icon:<ReadOutlined/>}，并渲染「左侧 240px TOC +
 * 右侧正文」的两栏文档页。这套 TOC + markdown 渲染逻辑在 25 个仓里逐字重复，
 * 做成共享组件后各仓只需提供 DOC.md 内容（编译期 import 的字符串）。
 *
 * ⚠ 依赖说明（重要，勿删）：
 *   1) 本组件**默认不依赖任何第三方 markdown 库** —— 内置了一个覆盖规范文档常用子集的
 *      轻量引擎（标题 / 段落 / 列表 / GFM 表格 / 代码块 / 引用 / 图片 / 链接 / 行内格式）。
 *      这样 25 个仓接入时零安装、零接线，只写 DOC.md 就能出文档页。
 *   2) 需要 GFM 任务列表 / autolink / **Prism 代码高亮**时，宿主工程装上
 *      react-markdown + remark-gfm + react-syntax-highlighter 后调一次
 *      registerMarkdownRenderer({ReactMarkdown, remarkGfm, Prism, oneDark}) 即可升级。
 *   3) 为什么不是直接静态 import 那三个包：本仓 vite.config.mjs 的 external 是**精确匹配**
 *      列表，而这三个包既不在 dependencies 也不在 peerDependencies，静态 import 会让
 *      `npm run build` 直接炸（Rollup failed to resolve import）。peerDependencies 的
 *      增补 + external 白名单是**主仓单独的改动**，不在本任务的文件所有权范围内。
 *      ⇒ 建议主仓补（可选增强，非必需）：
 *          react-markdown           ^9.1.0
 *          remark-gfm               ^4.0.1
 *          react-syntax-highlighter ^15.6.6
 */
import {Fragment, createElement, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {ReadOutlined} from '@ant-design/icons'
import {useInRouterContext, useNavigate} from 'react-router-dom'
import {antdTheme, brand, neutral, radius} from './tokens'
import EmptyState from './EmptyState'
import PageHeader from './PageHeader'

const TOC_WIDTH = 240          // §7 强制：左栏 240px
const READ_LINE = 96           // 读线：正文容器顶部往下 96px 以内的章节算「当前章节」
const SCROLL_OPTIONS = {behavior: 'smooth', block: 'start'}

// 窄屏（<800px）表格横向滚动：窄屏下把表格撑到最小宽，列不会被挤扁
const DOC_TABLE_CSS = `
.zfc-doc-table-wrap { max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
@media (max-width: 800px) { .zfc-doc-table-wrap > table { min-width: 520px; } }
`

/* ------------------------------------------------------------------ *
 * 锚点 id：自己算，不依赖 rehype-slug
 * ------------------------------------------------------------------ */

/**
 * 生成稳定且唯一的锚点 id。
 *
 * 不用 rehype-slug 的原因：它只有被宿主当作插件传进来时才生效，而 TOC 里的锚点
 * 必须和正文渲染出来的 id **永远一致** —— 一旦宿主换了渲染器或忘了传插件，
 * TOC 就变成一堆点不动的死链。自己算 + 渲染后按序回填，两边共用同一份 id 表。
 */
export const slugify = (text) => String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}\p{M}\p{Pc}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

/** 去掉行内 markdown 标记，只留可读文字（TOC 标题用）。 */
const stripInline = (text) => String(text || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim()

/**
 * 锚点 id 计数器：slug 撞了就加 -1 / -2 后缀，保证唯一。
 *
 * parseDocHeadings（TOC 的数据源）和内置引擎（正文的渲染方）各持一份计数器，
 * 对同一批标题算出**同一串 id** —— 这是 TOC 锚点点得动的根本原因：
 * 只要两边共用这一个算法，就不依赖宿主有没有传 rehype-slug。
 */
const createSlugCounter = () => {
    const seen = new Map()
    let seq = 0
    return (text) => {
        seq += 1
        const base = slugify(text) || `section-${seq}`
        const n = seen.get(base) || 0
        seen.set(base, n + 1)
        return n > 0 ? `${base}-${n}` : base
    }
}

/**
 * 从 markdown 源码里抽出 H1/H2/H3 标题（TOC 的数据源 + 锚点 id 表）。
 *
 * 只按行扫描并跳过围栏代码块：DOC.md 是人写的规范文档，不是任意 markdown，
 * 没必要为它引一整套解析器。行首必须顶格（左侧空白不 trim），否则 4 空格缩进的
 * 代码块里的 `# xxx` 会被误当成标题。
 */
export const parseDocHeadings = (markdown) => {
    const out = []
    const nextId = createSlugCounter()
    let inFence = false
    for (const raw of String(markdown || '').split('\n')) {
        const line = raw.replace(/\s+$/, '')
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence
            continue
        }
        if (inFence) continue
        const m = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line)
        if (!m) continue
        const level = m[1].length
        if (level > 3) continue                    // §7 只要求 H1/H2/H3 有 id
        const text = stripInline(m[2])
        if (!text) continue
        out.push({level, text, id: nextId(text)})
    }
    return out
}

/** 取出 React 节点的纯文本（代码块要高亮，得先拿到源码文本）。 */
const textOf = (node) => {
    if (node === null || node === undefined || typeof node === 'boolean') return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(textOf).join('')
    if (node.props) return textOf(node.props.children)
    return ''
}

/** CSS.escape 的兜底实现（老浏览器没有 CSS.escape）。 */
const escapeAttr = (value) => String(value).replace(/["\\]/g, '\\$&')

/**
 * 平滑滚动到锚点。抽成独立函数是为了让「点击 TOC → 滚动」这条链可被单测钉住。
 * @returns {boolean} 是否真的滚动了
 */
export const scrollToAnchor = (target, options = SCROLL_OPTIONS) => {
    if (!target || typeof target.scrollIntoView !== 'function') return false
    target.scrollIntoView(options)
    return true
}

/* ------------------------------------------------------------------ *
 * 内置 markdown 引擎（零依赖）
 *
 * 只覆盖规范文档常用子集，不追求 CommonMark 全量兼容：
 *   块级：ATX 标题、段落、围栏代码块、无序/有序列表（含缩进嵌套）、
 *         GFM 管道表格、引用、水平线
 *   行内：链接、图片、行内代码、粗体、斜体、删除线、自动链接
 * 宿主注册 react-markdown 后整套交给 react-markdown 渲染（见 registerMarkdownRenderer）。
 * ------------------------------------------------------------------ */

const FENCE_RE = /^\s*(`{3,}|~{3,})\s*([\w+#-]*)\s*$/
const HEADING_RE = /^(#{1,6})\s+(.*?)\s*#*$/
const HR_RE = /^\s*([-*_])\s*(\1\s*){2,}$/
const LIST_RE = /^(\s*)([-*+]|\d+[.)])(\s+)(.*)$/
const QUOTE_RE = /^\s*>\s?(.*)$/
const INLINE_RE = /(!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|~~([^~]+)~~|\*([^*\n]+)\*|<((?:https?:\/\/|mailto:)[^>\s]+)>)/g

/** 表格行切列（去掉首尾的 |，逐格 trim）。 */
const splitRow = (line) => {
    let s = String(line).trim()
    if (s.startsWith('|')) s = s.slice(1)
    if (s.endsWith('|')) s = s.slice(0, -1)
    return s.split('|').map((c) => c.trim())
}

/** 是否是 GFM 表格的分隔行（|---|---|）。 */
const isTableDivider = (line) => {
    if (!String(line).includes('-')) return false
    const cells = splitRow(line)
    return cells.length > 0 && cells.every((c) => /^:?-+:?$/.test(c))
}

/** 分隔行 → 对齐方式。 */
const dividerToAlign = (cell) => {
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    return 'left'
}

/** 解析列表（支持缩进嵌套）。 */
const parseList = (lines, start) => {
    const first = LIST_RE.exec(lines[start])
    const ordered = /\d/.test(first[2])
    const items = []
    let i = start
    while (i < lines.length) {
        const m = LIST_RE.exec(lines[i])
        if (!m) break
        const indent = m[1].length
        const contentIndent = indent + m[2].length + m[3].length
        const itemLines = [m[4]]
        i += 1
        while (i < lines.length) {
            const l = lines[i]
            if (!l.trim()) {
                // 空行后若还是同级或更深层的列表项，列表继续
                let j = i
                while (j < lines.length && !lines[j].trim()) j += 1
                const next = j < lines.length ? LIST_RE.exec(lines[j]) : null
                if (next && next[1].length >= indent) { i = j; continue }
                break
            }
            const ind = /^[ \t]*/.exec(l)[0].length
            const nm = LIST_RE.exec(l)
            if (nm && nm[1].length <= indent) break              // 同级新项 → 本项结束
            if (ind >= contentIndent) { itemLines.push(l.slice(contentIndent)); i += 1; continue }
            if (ind > indent) { itemLines.push(l.slice(ind)); i += 1; continue }
            // 懒续行：非空、不是新的块起始，就当上一段的延续
            if (!nm && !FENCE_RE.test(l) && !HEADING_RE.test(l) && !HR_RE.test(l) && !QUOTE_RE.test(l)) {
                itemLines.push(l.trim())
                i += 1
                continue
            }
            break
        }
        items.push({blocks: parseBlocks(itemLines, true)})
    }
    return {block: {type: 'list', ordered, items}, next: i}
}

/**
 * markdown 源码 → 块结构。
 *
 * flat = true 时（列表项内部用）标题降级成段落：列表项里的标题在 parseDocHeadings
 * 眼里不是标题（它带缩进），若这里渲染成 h* 就会和 TOC 的 id 表错位。
 */
function parseBlocks(lines, flat = false) {
    const blocks = []
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        if (!line.trim()) { i += 1; continue }

        const fence = FENCE_RE.exec(line)
        if (fence) {
            const marker = fence[1][0]
            const minLen = fence[1].length
            const body = []
            i += 1
            while (i < lines.length) {
                const l = lines[i]
                if (new RegExp(`^\\s*\\${marker}{${minLen},}\\s*$`).test(l)) { i += 1; break }
                body.push(l)
                i += 1
            }
            blocks.push({type: 'code', lang: fence[2] || '', text: body.join('\n')})
            continue
        }

        const heading = HEADING_RE.exec(line)
        if (heading) {
            i += 1
            // 空标题直接跳过（与 parseDocHeadings 的口径保持一致，否则 id 表会错位）
            if (!stripInline(heading[2]).trim()) continue
            if (flat) {
                blocks.push({type: 'paragraph', text: heading[2]})
            } else {
                blocks.push({type: 'heading', level: heading[1].length, text: heading[2]})
            }
            continue
        }

        if (HR_RE.test(line)) { blocks.push({type: 'hr'}); i += 1; continue }

        // GFM 表格：当前行含 | 且下一行是分隔行
        if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
            const header = splitRow(line)
            const aligns = splitRow(lines[i + 1]).map(dividerToAlign)
            i += 2
            const rows = []
            while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
                rows.push(splitRow(lines[i]))
                i += 1
            }
            blocks.push({type: 'table', header, aligns, rows})
            continue
        }

        if (QUOTE_RE.test(line)) {
            const inner = []
            while (i < lines.length) {
                const m = QUOTE_RE.exec(lines[i])
                if (!m) break
                inner.push(m[1])
                i += 1
            }
            blocks.push({type: 'quote', lines: inner})
            continue
        }

        if (LIST_RE.test(line)) {
            const list = parseList(lines, i)
            blocks.push(list.block)
            i = list.next
            continue
        }

        // 段落：吃到空行或下一个块起始
        const para = []
        while (i < lines.length) {
            const l = lines[i]
            if (!l.trim()) break
            if (para.length
                && (FENCE_RE.test(l) || HEADING_RE.test(l) || HR_RE.test(l)
                    || LIST_RE.test(l) || QUOTE_RE.test(l))) break
            para.push(l.trim())
            i += 1
        }
        blocks.push({type: 'paragraph', text: para.join(' ')})
    }
    return blocks
}

/** 行内 markdown → React 节点数组。 */
const renderInline = (text, components) => {
    const out = []
    let last = 0
    let seq = 0
    const push = (node) => out.push(<Fragment key={`i${seq++}`}>{node}</Fragment>)
    // 用 matchAll 而不是 exec：链接文字会递归进 renderInline，
    // 而 matchAll 内部会克隆一份正则（带 lastIndex 的全局正则被递归共用会死循环）
    for (const m of text.matchAll(INLINE_RE)) {
        if (m.index > last) push(text.slice(last, m.index))
        // 分组序号对应 INLINE_RE 的捕获组：
        // 1=整段图片/链接 2=alt或链接文字 3=src或href | 4=行内代码
        // 5=**粗体** 6=__粗体__ 7=~~删除线~~ 8=*斜体* 9=<自动链接>
        if (m[1] !== undefined) {                    // 图片或链接（靠开头的 ! 区分）
            if (m[0].startsWith('!')) {
                push(components.img
                    ? components.img({src: m[3], alt: m[2]})
                    : <img src={m[3]} alt={m[2] || ''}/>)
            } else {
                const children = renderInline(m[2], components)
                push(components.a
                    ? components.a({href: m[3], children})
                    : <a href={m[3]}>{children}</a>)
            }
        } else if (m[4] !== undefined) {             // 行内代码
            push(components.code
                ? components.code({children: m[4]})
                : <code>{m[4]}</code>)
        } else if (m[5] !== undefined) {             // **粗体**
            push(<strong>{renderInline(m[5], components)}</strong>)
        } else if (m[6] !== undefined) {             // __粗体__
            push(<strong>{renderInline(m[6], components)}</strong>)
        } else if (m[7] !== undefined) {             // ~~删除线~~
            push(<del>{renderInline(m[7], components)}</del>)
        } else if (m[8] !== undefined) {             // *斜体*
            push(<em>{renderInline(m[8], components)}</em>)
        } else if (m[9] !== undefined) {             // <自动链接>
            push(components.a
                ? components.a({href: m[9], children: m[9]})
                : <a href={m[9]}>{m[9]}</a>)
        }
        last = m.index + m[0].length
    }
    if (last < text.length) push(text.slice(last))
    return out
}

/**
 * 块结构 → React 节点数组。所有样式都走 components 映射 ——
 * 内置引擎和宿主注册的 react-markdown 共用同一套组件，视觉不会两套。
 */
const renderBlocks = (blocks, components, nextId) => {
    const out = []
    blocks.forEach((b, idx) => {
        const key = `b${idx}`
        const wrap = (node) => out.push(<Fragment key={key}>{node}</Fragment>)
        if (b.type === 'heading') {
            const level = Math.min(b.level, 6)
            const tag = `h${level}`
            const Comp = components[tag]
            const children = renderInline(b.text, components)
            // 标题 id 与 TOC 用同一套算法算出来（见 createSlugCounter）
            const id = level <= 3 ? nextId(stripInline(b.text)) : undefined
            wrap(Comp ? Comp({children, id}) : createElement(tag, {id}, children))
        } else if (b.type === 'paragraph') {
            const children = renderInline(b.text, components)
            wrap(components.p ? components.p({children}) : <p>{children}</p>)
        } else if (b.type === 'code') {
            const codeEl = <code className={b.lang ? `language-${b.lang}` : undefined}>{b.text}</code>
            wrap(components.pre ? components.pre({children: codeEl}) : <pre>{codeEl}</pre>)
        } else if (b.type === 'list') {
            const tag = b.ordered ? 'ol' : 'ul'
            const Comp = components[tag]
            const items = b.items.map((item, i) => {
                const children = renderBlocks(item.blocks, components, nextId)
                const li = components.li ? components.li({children}) : <li>{children}</li>
                return <Fragment key={`li${i}`}>{li}</Fragment>
            })
            wrap(Comp ? Comp({children: items}) : createElement(tag, null, items))
        } else if (b.type === 'table') {
            const head = (
                <thead key="thead">
                    <tr>{b.header.map((cell, i) => {
                        const th = components.th
                            ? components.th({children: renderInline(cell, components), align: b.aligns[i]})
                            : <th>{cell}</th>
                        return <Fragment key={`th${i}`}>{th}</Fragment>
                    })}</tr>
                </thead>
            )
            const body = (
                <tbody key="tbody">
                    {b.rows.map((row, r) => (
                        <tr key={`tr${r}`}>
                            {row.map((cell, c) => {
                                const td = components.td
                                    ? components.td({children: renderInline(cell, components), align: b.aligns[c]})
                                    : <td>{cell}</td>
                                return <Fragment key={`td${c}`}>{td}</Fragment>
                            })}
                        </tr>
                    ))}
                </tbody>
            )
            const table = components.table
                ? components.table({children: [head, body]})
                : <table>{[head, body]}</table>
            wrap(table)
        } else if (b.type === 'quote') {
            // 引用内只渲染段落：避免引用里的标题打乱正文标题与锚点 id 的一一对应
            const children = b.lines
                .filter((l) => l.trim())
                .map((l, i) => {
                    const p = components.p
                        ? components.p({children: renderInline(l, components)})
                        : <p>{l}</p>
                    return <Fragment key={`q${i}`}>{p}</Fragment>
                })
            wrap(components.blockquote
                ? components.blockquote({children})
                : <blockquote>{children}</blockquote>)
        } else if (b.type === 'hr') {
            wrap(components.hr ? components.hr({}) : <hr/>)
        }
    })
    return out
}

/** 内置引擎入口：markdown 字符串 → React 节点数组。 */
export const renderMarkdownBlocks = (markdown, components = {}) =>
    renderBlocks(parseBlocks(String(markdown || '').split('\n')), components, createSlugCounter())

/* ------------------------------------------------------------------ *
 * 宿主渲染器注册（可选增强：GFM 任务列表 / autolink / Prism 高亮）
 * ------------------------------------------------------------------ */

let registeredRenderer = null
const rendererListeners = new Set()

/**
 * 注册宿主自己的 markdown 渲染器（react-markdown + remark-gfm + react-syntax-highlighter）。
 *
 * 用法（宿主 main.jsx 里一次接线）：
 *   import ReactMarkdown from 'react-markdown'
 *   import remarkGfm from 'remark-gfm'
 *   import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
 *   import {oneDark} from 'react-syntax-highlighter/dist/esm/styles/prism'
 *   import {registerMarkdownRenderer} from '@yuku123/z-frontend-common'
 *   registerMarkdownRenderer({ReactMarkdown, remarkGfm, Prism: SyntaxHighlighter, oneDark})
 *
 * 不注册也能用：组件内置的轻量引擎会渲染规范文档常用子集。
 *
 * @param {Object} renderer
 * @param {Function} renderer.ReactMarkdown - react-markdown 组件
 * @param {Function} [renderer.remarkGfm] - remark-gfm 插件
 * @param {Function} [renderer.Prism] - react-syntax-highlighter 的 Prism
 * @param {Object} [renderer.oneDark] - Prism 主题
 */
export const registerMarkdownRenderer = (renderer) => {
    registeredRenderer = renderer || null
    rendererListeners.forEach((fn) => fn(registeredRenderer))
    return registeredRenderer
}

/** 读回当前注册的渲染器（宿主在运行期注册后要能立刻生效）。 */
export const getMarkdownRenderer = () => registeredRenderer

/* ------------------------------------------------------------------ *
 * markdown 组件映射（内置引擎与 react-markdown 共用）
 * ------------------------------------------------------------------ */

/**
 * 生成 markdown 组件映射。
 *
 * 表格走 wrapper（窄屏横向滚动）、代码块走 Prism 主题高亮、站内链接走 react-router，
 * 这些都在这里统一收口 —— 各仓不需要再各写一遍渲染配置。
 */
const buildMarkdownComponents = ({navigate, Prism, oneDark, onAnchorClick}) => {
    const inlineCode = {
        background: brand.primarySoft,
        color: brand.primary,
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: '0.92em',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    }
    return {
        h1: ({node, children, ...rest}) => (
            <h1 {...rest} style={{
                fontSize: 22, fontWeight: 700, margin: '8px 0 16px',
                borderBottom: `1px solid ${neutral.border}`, paddingBottom: 8, scrollMarginTop: 16,
            }}>{children}</h1>
        ),
        h2: ({node, children, ...rest}) => (
            <h2 {...rest} style={{
                fontSize: 18, fontWeight: 700, margin: '24px 0 12px',
                color: neutral.text, scrollMarginTop: 16,
            }}>{children}</h2>
        ),
        h3: ({node, children, ...rest}) => (
            <h3 {...rest} style={{
                fontSize: 15, fontWeight: 600, margin: '16px 0 8px',
                color: '#334155', scrollMarginTop: 16,
            }}>{children}</h3>
        ),
        p: ({node, children, ...rest}) => (
            <p {...rest} style={{margin: '8px 0', color: '#1f2937'}}>{children}</p>
        ),
        ul: ({node, children, ...rest}) => (
            <ul {...rest} style={{margin: '8px 0', paddingLeft: 22}}>{children}</ul>
        ),
        ol: ({node, children, ...rest}) => (
            <ol {...rest} style={{margin: '8px 0', paddingLeft: 22}}>{children}</ol>
        ),
        li: ({node, children, ...rest}) => (
            <li {...rest} style={{margin: '4px 0'}}>{children}</li>
        ),
        blockquote: ({node, children, ...rest}) => (
            <blockquote {...rest} style={{
                margin: '12px 0', padding: '8px 14px',
                borderLeft: `3px solid ${antdTheme.token.colorPrimary}`,
                background: brand.primarySoft, color: '#475569', borderRadius: 4,
            }}>{children}</blockquote>
        ),
        hr: () => <hr style={{border: 'none', borderTop: `1px solid ${neutral.border}`, margin: '20px 0'}}/>,
        img: ({node, src, alt, ...rest}) => (
            <img {...rest} src={src} alt={alt || ''} style={{maxWidth: '100%', height: 'auto', display: 'block'}}/>
        ),
        table: ({node, children, ...rest}) => (
            // §7：窄屏表格要能横向滚动，不能把列挤成一团
            <div className="zfc-doc-table-wrap">
                <table {...rest} style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>{children}</table>
            </div>
        ),
        th: ({node, children, align, ...rest}) => (
            <th {...rest} style={{
                padding: '8px 10px', background: neutral.surfaceAlt,
                border: `1px solid ${neutral.border}`, textAlign: align || 'left',
                fontWeight: 600, color: '#334155',
            }}>{children}</th>
        ),
        td: ({node, children, align, ...rest}) => (
            <td {...rest} style={{
                padding: '8px 10px', border: `1px solid ${neutral.border}`,
                textAlign: align || 'left', color: '#1f2937',
            }}>{children}</td>
        ),
        pre: ({node, children}) => {
            const codeEl = Array.isArray(children) ? children[0] : children
            const className = (codeEl && codeEl.props && codeEl.props.className) || ''
            const match = /language-([\w-]+)/.exec(className)
            const source = textOf(codeEl).replace(/\n$/, '')
            if (match && Prism) {
                // §7：代码块走 Prism 主题高亮（不引 Shiki —— 太重）
                return (
                    <Prism language={match[1]} style={oneDark} customStyle={{
                        margin: '12px 0', borderRadius: radius.sm, fontSize: 13, background: '#1e293b',
                    }}>
                        {source}
                    </Prism>
                )
            }
            return (
                <pre style={{
                    margin: '12px 0', padding: '12px 14px', borderRadius: radius.sm,
                    background: '#1e293b', color: '#e2e8f0', overflowX: 'auto', fontSize: 13,
                }}>
                    <code style={{background: 'transparent', color: 'inherit', padding: 0, fontSize: 'inherit'}}>
                        {source}
                    </code>
                </pre>
            )
        },
        code: ({node, className, children, ...rest}) => (
            <code {...rest} className={className} style={inlineCode}>{children}</code>
        ),
        a: ({node, href, children, ...rest}) => {
            const target = href || ''
            const isExternal = /^https?:\/\//i.test(target) || target.startsWith('//')
            if (isExternal) {
                return (
                    <a {...rest} href={target} target="_blank" rel="noopener noreferrer"
                       style={{color: antdTheme.token.colorPrimary}}>{children}</a>
                )
            }
            if (target.startsWith('#')) {
                // 文档内锚点：走正文滚动而不是改地址栏
                return (
                    <a {...rest} href={target} style={{color: antdTheme.token.colorPrimary}}
                       onClick={(e) => onAnchorClick(e, target.slice(1))}>{children}</a>
                )
            }
            if (target.startsWith('/')) {
                // 站内链接走 react-router（§7），没有 Router 环境时退回浏览器跳转
                return (
                    <a {...rest} href={target} style={{color: antdTheme.token.colorPrimary}}
                       onClick={(e) => {
                           e.preventDefault()
                           if (navigate) navigate(target)
                           else if (typeof window !== 'undefined') window.location.href = target
                       }}>{children}</a>
                )
            }
            return <a {...rest} href={target} style={{color: antdTheme.token.colorPrimary}}>{children}</a>
        },
    }
}

/* ------------------------------------------------------------------ *
 * 组件
 * ------------------------------------------------------------------ */

/**
 * @param {Object} props
 * @param {string} props.markdown - DOC.md 内容（编译期 import 得到的字符串，不是 fetch）
 * @param {string} [props.title] - 页面标题（缺省不渲染标题栏）
 * @param {number} [props.tocWidth=240] - 左栏宽度（§7 强制 240px）
 * @param {number[]} [props.tocLevels=[2]] - TOC 收录的标题层级（2 = 只列章节级）
 * @param {string} [props.height='calc(100vh - 120px)'] - 正文区可视高度；传 'auto' 则跟随页面滚动
 * @param {Object} [props.markdownComponents] - 追加/覆盖 markdown 组件映射
 * @param {Function} [props.renderMarkdown] - 完全接管渲染 ({markdown, components}) => ReactNode
 */
export default function ComponentDoc({
                                     markdown,
                                     title,
                                     tocWidth = TOC_WIDTH,
                                     tocLevels = [2],
                                     height = 'calc(100vh - 120px)',
                                     markdownComponents,
                                     renderMarkdown,
                                 }) {
    // 组件可能在没有 Router 的环境里被单独渲染（Storybook / 单测）：
    // useNavigate 在 Router 外会抛 invariant，所以先探一次上下文再决定要不要调它。
    const inRouter = useInRouterContext()
    const navigate = inRouter ? useNavigate() : null

    const contentRef = useRef(null)
    const tocRef = useRef(null)
    const lockRef = useRef('')
    const lockTimerRef = useRef(null)
    const [activeId, setActiveId] = useState('')
    const [rendererVersion, setRendererVersion] = useState(0)

    const headings = useMemo(() => parseDocHeadings(markdown), [markdown])
    const tocItems = useMemo(
        () => headings.filter((h) => tocLevels.includes(h.level)),
        [headings, tocLevels]
    )

    // 宿主在运行期注册渲染器后要立刻重渲（注册发生在首次渲染之后的情况）
    useEffect(() => {
        const onChange = () => setRendererVersion((v) => v + 1)
        rendererListeners.add(onChange)
        return () => { rendererListeners.delete(onChange) }
    }, [])

    // 滚动锁定：点击 TOC 触发的平滑滚动期间不让 IO 抢高亮（否则会闪）
    const lockActive = (id) => {
        lockRef.current = id
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current)
        lockTimerRef.current = setTimeout(() => { lockRef.current = '' }, 700)
    }
    useEffect(() => () => { if (lockTimerRef.current) clearTimeout(lockTimerRef.current) }, [])

    // 锚点回填：渲染后按序把 id 写回 h1/h2/h3 —— TOC 与正文锚点因此永远一致
    useLayoutEffect(() => {
        const root = contentRef.current
        if (!root) return
        const els = Array.from(root.querySelectorAll('h1, h2, h3'))
        headings.forEach((h, i) => {
            const el = els[i]
            if (!el) return
            if (el.id !== h.id) el.id = h.id
            el.setAttribute('data-anchor', h.id)
        })
    }, [headings, rendererVersion, renderMarkdown])

    // 滚动联动：IntersectionObserver 当「变化信号源」，高亮本身用有序列表 + 矩形判定重算。
    //
    // 为什么不在 IO 回调里直接用 isIntersecting 判当前章节：IO 的回调顺序不保证，
    // 快速滚动/反向滚动时同一批 entry 到达顺序一变，高亮就会来回跳。
    // 改成「回调只负责叫醒重算，重算永远是『读线之上最后一个标题』」的纯函数，
    // 同一个滚动位置永远算出同一个结果 —— 不抖。
    useEffect(() => {
        const root = contentRef.current
        if (!root) return undefined
        const els = Array.from(root.querySelectorAll('h1, h2, h3'))
        if (!els.length) return undefined

        const computeActive = () => {
            const boxTop = root.getBoundingClientRect().top
            let active = els[0]
            for (const el of els) {
                if (el.getBoundingClientRect().top - boxTop <= READ_LINE) active = el
                else break
            }
            if (lockRef.current) return              // 平滑滚动中：让点击结果说话
            setActiveId(active.id)
        }

        const io = new IntersectionObserver(computeActive, {
            root,
            rootMargin: `-${READ_LINE}px 0px 0px 0px`,
            threshold: 0,
        })
        els.forEach((el) => io.observe(el))
        computeActive()

        // 支持 scrollend 的浏览器上用 scrollend 收尾（否则靠 700ms 定时器兜底）
        const onScrollEnd = () => { lockRef.current = '' }
        root.addEventListener('scrollend', onScrollEnd)
        return () => {
            io.disconnect()
            root.removeEventListener('scrollend', onScrollEnd)
        }
    }, [headings, rendererVersion, renderMarkdown])

    // TOC 当前项自动滚入可视区（选中项跑出视野时要能看见自己）
    useEffect(() => {
        const toc = tocRef.current
        if (!toc || !activeId) return
        const el = toc.querySelector(`[data-toc-id="${escapeAttr(activeId)}"]`)
        if (!el) return
        const tocRect = toc.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        if (elRect.top < tocRect.top + 24 || elRect.bottom > tocRect.bottom - 24) {
            el.scrollIntoView({block: 'nearest', behavior: 'smooth'})
        }
    }, [activeId])

    const findAnchor = (id) => {
        const root = contentRef.current
        const el = root && root.querySelector(`[data-anchor="${escapeAttr(id)}"]`)
        return el || (typeof document !== 'undefined' ? document.getElementById(id) : null)
    }

    const onTocClick = (e, id) => {
        e.preventDefault()
        lockActive(id)
        scrollToAnchor(findAnchor(id))
        setActiveId(id)
    }

    const onAnchorClick = (e, id) => {
        e.preventDefault()
        lockActive(id)
        scrollToAnchor(findAnchor(id))
        setActiveId(id)
    }

    const markdownComponentsMap = useMemo(
        () => buildMarkdownComponents({
            navigate,
            Prism: registeredRenderer && registeredRenderer.Prism,
            oneDark: registeredRenderer && registeredRenderer.oneDark,
            onAnchorClick,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigate, rendererVersion]
    )
    const mergedComponents = useMemo(
        () => ({...markdownComponentsMap, ...(markdownComponents || {})}),
        [markdownComponentsMap, markdownComponents]
    )

    const renderBody = () => {
        if (!markdown || !String(markdown).trim()) {
            return (
                <EmptyState
                    title="暂无文档"
                    description="把组件说明写成 DOC.md，用编译期 import 的字符串传给 ComponentDoc 即可"
                />
            )
        }
        if (renderMarkdown) return renderMarkdown({markdown, components: mergedComponents})
        if (registeredRenderer && registeredRenderer.ReactMarkdown) {
            const ReactMarkdown = registeredRenderer.ReactMarkdown
            return (
                <ReactMarkdown
                    remarkPlugins={registeredRenderer.remarkGfm ? [registeredRenderer.remarkGfm] : []}
                    components={mergedComponents}
                >
                    {markdown}
                </ReactMarkdown>
            )
        }
        // 未注册宿主渲染器：走内置轻量引擎（规范文档常用子集），不白屏
        return <>{renderMarkdownBlocks(markdown, mergedComponents)}</>
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1}}>
            <style>{DOC_TABLE_CSS}</style>
            {title ? <PageHeader title={title}/> : null}

            <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', minHeight: 0}}>
                {/* 左栏：240px TOC */}
                <aside
                    ref={tocRef}
                    style={{
                        width: tocWidth,
                        flexShrink: 0,
                        position: 'sticky',
                        top: 12,
                        alignSelf: 'flex-start',
                        maxHeight: height,
                        overflowY: 'auto',
                        padding: '8px 8px 12px',
                        background: neutral.surface,
                        border: `1px solid ${neutral.border}`,
                        borderRadius: radius.sm,
                    }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 12, color: neutral.textMuted, marginBottom: 8, padding: '0 4px',
                    }}>
                        <ReadOutlined/>
                        <span style={{fontWeight: 600}}>本文目录</span>
                    </div>
                    <ul style={{listStyle: 'none', margin: 0, padding: 0}}>
                        {tocItems.map((h) => {
                            const isActive = activeId === h.id
                            return (
                                <li key={h.id} data-toc-id={h.id}>
                                    <a
                                        href={'#' + h.id}
                                        onClick={(e) => onTocClick(e, h.id)}
                                        style={{
                                            display: 'block',
                                            padding: '6px 10px',
                                            borderLeft: `3px solid ${isActive ? antdTheme.token.colorPrimary : 'transparent'}`,
                                            background: isActive ? brand.primarySoft : 'transparent',
                                            color: isActive ? antdTheme.token.colorPrimary : '#475569',
                                            fontWeight: isActive ? 600 : 400,
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                            textDecoration: 'none',
                                            borderRadius: isActive ? '0 4px 4px 0' : 4,
                                            transition: 'all 120ms ease',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {h.text}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </aside>

                {/* 右栏：正文 */}
                <article
                    ref={contentRef}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: neutral.surface,
                        border: `1px solid ${neutral.border}`,
                        borderRadius: radius.sm,
                        padding: '24px 32px',
                        lineHeight: 1.75,
                        color: neutral.text,
                        overflowY: height === 'auto' ? 'visible' : 'auto',
                        maxHeight: height === 'auto' ? 'none' : height,
                    }}
                >
                    {renderBody()}
                </article>
            </div>
        </div>
    )
}
