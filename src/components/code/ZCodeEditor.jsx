/**
 * ZCodeEditor —— z-opc 全仓共享代码编辑器（子路径 `@yuku123/z-frontend-common/code`）。
 *
 * <p>CodeMirror 6 壳 + 语言注册表（registry.js）+ 自研 ANTLR(g4) 桥（antlr.js）：
 * <ul>
 *   <li><b>语法高亮</b>：官方语言包 / legacy-modes / 自研 g4 生成物均可，受控于 language prop；</li>
 *   <li><b>语法探测</b>：有 Parser 的语言红波浪线报语法错（自研 g4 即可，不需要第三方语法）；</li>
 *   <li>受控组件：value/onChange 与 antd Form 双向兼容（File 顶层包了 Form.Item 也能用）。</li>
 * </ul>
 *
 * <p>重依赖（codemirror 全家 + antlr4）只在本子路径打包，不进扁平桶 ——
 * 不用编辑器的 40 个 suit 零负担（同 ./ui/echarts 的先例）。
 */
import { useEffect, useMemo, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, placeholder as cmPlaceholder } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { getLanguage } from './registry.js'

export default function ZCodeEditor({
    value,
    onChange,
    language,
    height = 200,
    readOnly = false,
    placeholder,
    dark = false,
    style,
}) {
    const hostRef = useRef(null)
    const viewRef = useRef(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    const langDef = useMemo(() => getLanguage(language), [language])

    useEffect(() => {
        const extensions = [
            basicSetup,
            theme({ height, dark }),
            EditorView.updateListener.of((u) => {
                if (u.docChanged && onChangeRef.current) {
                    onChangeRef.current(u.state.doc.toString())
                }
            }),
        ]
        if (readOnly) extensions.push(EditorState.readOnly.of(true), EditorView.editable.of(false))
        if (placeholder) extensions.push(cmPlaceholder(placeholder))
        if (langDef?.support) extensions.push(langDef.support)
        if (langDef?.linter) extensions.push(langDef.linter)

        const state = EditorState.create({ doc: value ?? '', extensions })
        const view = new EditorView({ state, parent: hostRef.current })
        viewRef.current = view
        return () => {
            view.destroy()
            viewRef.current = null
        }
        // 语言/主题/尺寸变更重建编辑器；value 不进依赖（外部受控同步走下面的 effect）
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, height, readOnly, dark, placeholder, langDef])

    // 外部 value → 编辑器（跳过自己刚编辑出的值，避免光标跳动）
    useEffect(() => {
        const view = viewRef.current
        if (!view) return
        const current = view.state.doc.toString()
        if ((value ?? '') !== current) {
            view.dispatch({
                changes: { from: 0, to: current.length, insert: value ?? '' },
            })
        }
    }, [value])

    return <div ref={hostRef} style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden', ...style }} />
}

function theme({ height, dark }) {
    const fg = dark ? '#d4d4d8' : '#0f172a'
    const bg = dark ? '#18181b' : '#ffffff'
    const gut = dark ? '#3f3f46' : '#94a3b8'
    return EditorView.theme({
        '&': { height: typeof height === 'number' ? `${height}px` : height, backgroundColor: bg, color: fg, fontSize: '13px' },
        '.cm-scroller': { fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace", lineHeight: '1.55' },
        '.cm-gutters': { backgroundColor: bg, color: gut, border: 'none', borderRight: `1px solid ${dark ? '#27272a' : '#f1f5f9'}` },
        '.cm-activeLine': { backgroundColor: dark ? '#1f1f23' : '#f8fafc' },
        '.cm-activeLineGutter': { backgroundColor: dark ? '#1f1f23' : '#f8fafc', color: fg },
        '.cm-content': { padding: '8px 0' },
        '.cm-cursor': { borderLeftColor: '#4f46e5' },
        '&.cm-focused': { outline: 'none' },
        '.cm-selectionBackground, ::selection': { backgroundColor: dark ? '#274375' : '#dbeafe' },
        // —— ANTLR 自研语法高亮配色（registry 里 cm-zantlr-* 类）——
        '.cm-zantlr-kw': { color: dark ? '#c4b5fd' : '#7c3aed', fontWeight: '600' },
        '.cm-zantlr-type': { color: dark ? '#67e8f9' : '#0891b2' },
        '.cm-zantlr-str': { color: dark ? '#86efac' : '#16a34a' },
        '.cm-zantlr-num': { color: dark ? '#fdba74' : '#ea580c' },
        '.cm-zantlr-cmt': { color: dark ? '#71717a' : '#94a3b8', fontStyle: 'italic' },
        '.cm-zantlr-op': { color: dark ? '#f9a8d4' : '#db2777' },
        '.cm-zantlr-punct': { color: dark ? '#a1a1aa' : '#475569' },
        '.cm-zantlr-fn': { color: dark ? '#93c5fd' : '#2563eb' },
        '.cm-zantlr-var': { color: fg },
        '.cm-zantlr-bad': { color: dark ? '#fca5a5' : '#dc2626', textDecoration: 'underline wavy' },
    }, { dark })
}
