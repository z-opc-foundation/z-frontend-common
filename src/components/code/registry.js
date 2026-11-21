/**
 * 语言注册表 —— 「随意支持一种语法」的落点。
 *
 * <p>内置三层来源，注册表统一按名字取用：
 * <ol>
 *   <li>CodeMirror 官方语言包（sql / json / xml / yaml / java / javascript）；</li>
 *   <li>legacy-modes（groovy / lua / shell / properties / toml，覆盖官方没做的老语言）；</li>
 *   <li><b>自研 ANTLR(g4)</b> —— 仓里 .g4 用 antlr 工具生成 JS（antlr-gen/）后经
 *       defineAntlrLanguage 接入，高亮与语法探测全部走自己的词法/语法分析器，
 *       不依赖第三方语法描述。新增一种 g4 语法 = 放 .g4 → 生成 → registerLanguage 三步。</li>
 * </ol>
 */
import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { sql } from '@codemirror/lang-sql'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { groovy } from '@codemirror/legacy-modes/mode/groovy'
import { lua } from '@codemirror/legacy-modes/mode/lua'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { properties } from '@codemirror/legacy-modes/mode/properties'
import { toml } from '@codemirror/legacy-modes/mode/toml'

import { antlrHighlight, antlrLinter } from './antlr.js'
import SQLLexer from './antlr-gen/SQLLexer.js'
import JsonLexer from './antlr-gen/JsonLexer.js'
import JsonParser from './antlr-gen/JsonParser.js'

/* ────────────────── 自研 g4：SQL（z-util-expr-sql 的 SQLLexer，注释走 HIDDEN 通道） ────────────────── */

const SQL_TOKEN_STYLES = {
    // 关键字
    SELECT: 'keyword', INSERT: 'keyword', UPDATE: 'keyword', DELETE: 'keyword',
    FROM: 'keyword', WHERE: 'keyword', ORDER: 'keyword', GROUP: 'keyword',
    HAVING: 'keyword', LIMIT: 'keyword', OFFSET: 'keyword', JOIN: 'keyword',
    INNER: 'keyword', LEFT: 'keyword', RIGHT: 'keyword', FULL: 'keyword',
    CROSS: 'keyword', ON: 'keyword', AND: 'keyword', OR: 'keyword', NOT: 'keyword',
    AS: 'keyword', BY: 'keyword', ASC: 'keyword', DESC: 'keyword', IN: 'keyword',
    LIKE: 'keyword', EXISTS: 'keyword', IS: 'keyword', DISTINCT: 'keyword',
    BETWEEN: 'keyword', CAST: 'keyword', CASE: 'keyword', WHEN: 'keyword',
    THEN: 'keyword', ELSE: 'keyword', END: 'keyword',
    // 函数 / 字面量
    COUNT: 'function', SUM: 'function', AVG: 'function', MAX: 'function', MIN: 'function',
    NULL_: 'keyword', TRUE_: 'keyword', FALSE_: 'keyword',
    // 字面量与标识符
    STRING: 'string', NUM: 'number', ID: 'variable',
    // 运算符与标点
    EQ: 'operator', NEQ: 'operator', LE: 'operator', GE: 'operator',
    LT: 'operator', GT: 'operator', PLUS: 'operator', MINUS: 'operator',
    STAR: 'operator', SLASH: 'operator', PERCENT: 'operator',
    DOT: 'punct', COMMA: 'punct', LPAREN: 'punct', RPAREN: 'punct',
    // HIDDEN 通道（getAllTokens 拿得到）
    LINE_COMMENT: 'comment', BLOCK_COMMENT: 'comment', WS: 'comment',
}

/** 注册到 CodeMirror 的 SQL 高亮（token 流 → Decoration）。 */
export function sqlAntlrHighlight() {
    return antlrHighlight(SQLLexer, SQL_TOKEN_STYLES, ['WS'])
}

/** 自研 SQL 词法探测（Lexer-only 语法：报非法字符等词法错误）。 */
export function sqlAntlrLinter() {
    return antlrLinter(SQLLexer)
}

/* ────────────────── 自研 g4：JSON（z-util-parser-json 的 Lexer+Parser 对，全量语法探测） ────────────────── */

const JSON_TOKEN_STYLES = {
    StringLiteral: 'string',
    Number: 'number',
    Bool: 'keyword',
    Null: 'keyword',
    LBrace: 'punct', RBrace: 'punct', LBracket: 'punct', RBracket: 'punct',
    Comma: 'punct', Colon: 'punct',
    Space: 'comment', EOL: 'comment',
    AnyChar: 'invalid',
}

/** 注册到 CodeMirror 的 JSON 高亮。 */
export function jsonAntlrHighlight() {
    return antlrHighlight(JsonLexer, JSON_TOKEN_STYLES, ['Space', 'EOL'])
}

/** 自研 JSON 语法探测（Lexer+Parser 全解析，红波浪线报语法错）。 */
export function jsonAntlrLinter() {
    return antlrLinter(JsonLexer, JsonParser)
}

/* ────────────────── 注册表 ────────────────── */

const registry = new Map()

/**
 * 注册一种语言。
 *
 * @param {string} name 语言名（小写键；z-dms 的 language= / z-script 的 dslType 都映射到这里）
 * @param {Object} def { support: LanguageSupport|Extension[], linter?: Extension, aliases?: string[] }
 */
export function registerLanguage(name, def) {
    registry.set(String(name).toLowerCase(), def)
    for (const a of def.aliases || []) registry.set(String(a).toLowerCase(), def)
}

/** 取语言定义；未知语言返回 null（编辑器退化为纯文本，不抛异常）。 */
export function getLanguage(name) {
    return name ? registry.get(String(name).toLowerCase()) || null : null
}

export function listLanguages() {
    return [...registry.keys()]
}

/* ────────────────── 内置语言 ────────────────── */

registerLanguage('sql', {
    support: sql(),
    aliases: ['mysql'],
})
// 自研 ANTLR SQL：词法高亮 + 词法探测（g4 是 Lexer-only）
registerLanguage('sql-antlr', { support: sqlAntlrHighlight(), linter: sqlAntlrLinter() })

registerLanguage('json', {
    support: json(),
})
// 自研 ANTLR JSON：全量语法探测（g4 Lexer+Parser 对）
registerLanguage('json-antlr', { support: jsonAntlrHighlight(), linter: jsonAntlrLinter() })

registerLanguage('xml', { support: xml() })
registerLanguage('yaml', { support: yaml(), aliases: ['yml'] })
registerLanguage('java', { support: java() })
registerLanguage('javascript', {
    support: javascript(),
    aliases: ['js', 'jsx'],
})
registerLanguage('groovy', { support: StreamLanguage.define(groovy) })
registerLanguage('lua', { support: StreamLanguage.define(lua) })
registerLanguage('shell', {
    support: StreamLanguage.define(shell),
    aliases: ['bash', 'sh'],
})
registerLanguage('properties', { support: StreamLanguage.define(properties) })
registerLanguage('toml', { support: StreamLanguage.define(toml) })

/** z-script 的 dslType → 编辑器语言映射（EL 是表达式语言，按 javascript 亮）。 */
export const DSL_TYPE_LANGUAGE = {
    EL: 'javascript',
    GROOVY: 'groovy',
    LUA: 'lua',
    SQL: 'sql',
    MOCK: 'json',
    API_BRIDGE: 'javascript',
}
