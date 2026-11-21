/**
 * 代码编辑器子路径 `@yuku123/z-frontend-common/code`。
 *
 * ZCodeEditor 是唯一依赖 codemirror 全家 + antlr4 的组件，故不进扁平桶：
 * 不用编辑器的 suit 从不 resolve 这些包（同 ./ui/echarts 先例）。
 * 需要编辑器的域显式引本子路径；codemirror/antlr4 已是本包 dependencies，消费方零声明。
 */
export { default as ZCodeEditor } from './ZCodeEditor.jsx'
export {
    registerLanguage,
    getLanguage,
    listLanguages,
    DSL_TYPE_LANGUAGE,
    sqlAntlrHighlight,
    sqlAntlrLinter,
    jsonAntlrHighlight,
    jsonAntlrLinter,
} from './registry.js'
export { antlrHighlight, antlrLinter, ANTLR_TOKEN_CLASSES } from './antlr.js'
