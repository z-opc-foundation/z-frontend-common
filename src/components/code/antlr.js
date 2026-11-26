/**
 * ANTLR4 (g4) × CodeMirror 6 桥 —— 自研语法进编辑器的通道。
 *
 * <p>ANTLR 官方有 JavaScript target：任意 .g4 用 antlr 工具
 * `-Dlanguage=JavaScript` 生成 Lexer/Parser 后，经这里两步接入：
 * <ol>
 *   <li>{@link antlrHighlight} —— Lexer 全文出 token 流，映射成 CodeMirror
 *       Decoration.mark 做<b>语法高亮</b>（变更去抖重扫，管理台文档量级完全够）；</li>
 *   <li>{@link antlrLinter} —— 有 Parser 的语法再跑一遍解析，收集 syntax error
 *       做<b>语法探测</b>（红波浪线 + 报错信息）；Lexer-only 的语法也能报词法错误。</li>
 * </ol>
 *
 * <p>token 类型 → 样式的映射用「符号名」写（如 SELECT / STRING），生成物的
 * `symbolicNames` 数组是唯一事实，g4 改了重新生成即可，不用数下标。
 * Parser 入口规则取生成物 `ruleNames[0]`（g4 语法的第一条规则）。
 */
import { StateEffect, StateField } from '@codemirror/state'
import { ViewPlugin, Decoration } from '@codemirror/view'
import { linter } from '@codemirror/lint'
import antlr4 from 'antlr4'

/** 重新扫描的去抖间隔（ms）。 */
const RESCAN_DELAY = 150
/** 超过这个长度就不做 ANTLR 全文扫描（防误用把浏览器拖死）。 */
const MAX_SCAN_LENGTH = 300_000

/** token 语义 → 高亮 CSS 类（ZCodeEditor 的 theme 里定义颜色）。 */
export const ANTLR_TOKEN_CLASSES = {
    keyword: 'cm-zantlr-kw',
    type: 'cm-zantlr-type',
    string: 'cm-zantlr-str',
    number: 'cm-zantlr-num',
    comment: 'cm-zantlr-cmt',
    operator: 'cm-zantlr-op',
    punct: 'cm-zantlr-punct',
    function: 'cm-zantlr-fn',
    variable: 'cm-zantlr-var',
    invalid: 'cm-zantlr-bad',
}

/** 收集 ANTLR 词法/语法错误的标准监听器（不抛异常，攒着上屏）。 */
function errorCollector(errors) {
    return {
        syntaxError(recognizer, offendingSymbol, line, column, msg) {
            errors.push({ line, column, msg, offendingSymbol })
        },
        reportAmbiguity() {},
        reportAttemptingFullContext() {},
        reportContextSensitivity() {},
    }
}

function scanTokens(LexerCtor, text) {
    const errors = []
    const lexer = new LexerCtor(new antlr4.InputStream(text))
    lexer.removeErrorListeners()
    lexer.addErrorListener(errorCollector(errors))
    let tokens = []
    try {
        tokens = lexer.getAllTokens()
    } catch (e) {
        errors.push({ line: 1, column: 0, msg: e?.message || String(e) })
    }
    return { tokens, errors }
}

/** 高亮 decoration 的载体：doc 一变先清空，扫描插件算完再整体放回。 */
const setMarks = StateEffect.define()
const markField = StateField.define({
    create: () => Decoration.none,
    update(value, tr) {
        for (const e of tr.effects) if (e.is(setMarks)) return e.value
        if (tr.docChanged) return Decoration.none
        return value
    },
})

/**
 * ANTLR Lexer → 高亮扩展。
 *
 * @param {Function} LexerCtor antlr 生成物（默认导出的 Lexer 类）
 * @param {Object} tokenStyles 符号名 → 语义（'SELECT': 'keyword'）
 * @param {string[]} [skipTypes] 不上色的符号名（WS 之类；`-> skip` 的 g4 规则本来就出不了 token）
 */
export function antlrHighlight(LexerCtor, tokenStyles, skipTypes = []) {
    const typeToClass = new Map()
    const symbolic = LexerCtor.symbolicNames || []
    for (const [name, semantic] of Object.entries(tokenStyles)) {
        const idx = symbolic.indexOf(name)
        if (idx > 0) typeToClass.set(idx, ANTLR_TOKEN_CLASSES[semantic] || semantic)
    }
    const skip = new Set(skipTypes)

    const scan = (view) => {
        const text = view.state.doc.toString()
        if (text.length > MAX_SCAN_LENGTH) return Decoration.none
        const { tokens } = scanTokens(LexerCtor, text)
        const marks = []
        for (const t of tokens) {
            if (skip.has(t.type)) continue
            const cls = typeToClass.get(t.type)
            if (!cls) continue
            const to = Math.min(t.stop + 1, text.length)
            if (to <= t.start) continue
            marks.push(Decoration.mark({ class: cls }).range(t.start, to))
        }
        return Decoration.set(marks, true)
    }

    const plugin = ViewPlugin.fromClass(
        class {
            constructor(view) {
                this.timer = null
                this.schedule(view)
            }
            update(u) {
                if (u.docChanged) this.schedule(u.view)
            }
            schedule(view) {
                clearTimeout(this.timer)
                this.timer = setTimeout(() => {
                    view.dispatch({ effects: setMarks.of(scan(view)) })
                }, RESCAN_DELAY)
            }
            destroy() { clearTimeout(this.timer) }
        },
    )
    return [markField, plugin]
}

/**
 * ANTLR Lexer(+可选 Parser) → 语法探测 linter。
 *
 * @param {Function} LexerCtor 生成的 Lexer 类
 * @param {Function} [ParserCtor] 生成的 Parser 类（缺省 = 只做词法探测）
 * @param {string} [startRule] 入口规则名（缺省 = 生成物 ruleNames[0]）
 */
export function antlrLinter(LexerCtor, ParserCtor, startRule) {
    return linter((view) => {
        const text = view.state.doc.toString()
        if (text.length > MAX_SCAN_LENGTH) return []
        const errors = []
        try {
            const lexer = new LexerCtor(new antlr4.InputStream(text))
            lexer.removeErrorListeners()
            lexer.addErrorListener(errorCollector(errors))
            const tokens = new antlr4.CommonTokenStream(lexer)
            if (ParserCtor) {
                const parser = new ParserCtor(tokens)
                parser.removeErrorListeners()
                parser.addErrorListener(errorCollector(errors))
                const rule = startRule || (ParserCtor.ruleNames && ParserCtor.ruleNames[0])
                if (rule && typeof parser[rule] === 'function') parser[rule]()
            } else {
                lexer.getAllTokens()
            }
        } catch (e) {
            errors.push({ line: 1, column: 0, msg: e?.message || String(e) })
        }
        return errors.map((e) => {
            const lineNo = Math.max(1, Math.min(e.line, view.state.doc.lines))
            const lineInfo = view.state.doc.line(lineNo)
            const from = Math.min(lineInfo.from + Math.max(0, e.column), lineInfo.to)
            const sym = e.offendingSymbol
            const len = sym && typeof sym.stop === 'number' && typeof sym.start === 'number'
                ? sym.stop - sym.start + 1
                : 1
            return {
                from,
                to: Math.min(from + Math.max(1, len), lineInfo.to),
                severity: 'error',
                message: e.msg,
            }
        })
    }, { delay: RESCAN_DELAY })
}
