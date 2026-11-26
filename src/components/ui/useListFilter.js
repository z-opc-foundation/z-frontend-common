/**
 * useListFilter —— 列表页的客户端过滤（lead 008 §2 强制规则 3）。
 *
 * 为什么要有这个 hook：
 *   §2 要求「任何列表页必须有查询」，而且明确「不要求走后端搜索（端侧过滤足够，
 *   除非集合 >1k 行）」。这意味着每个列表页都要写一遍「关键字 → 过滤行」的逻辑。
 *   分散写就会分裂出 N 种口径：有的大小写敏感、有的只匹配第一个字段、有的把
 *   null 当成空串匹配到全部。统一收进基座，各仓只声明「按哪几个字段过滤」。
 *
 * 口径（与 §2 一致）：
 *   - 大小写不敏感（用户按任意大小写输入都能命中）。
 *   - 多字段「或」匹配：任一字段命中即保留该行。
 *   - 字段值为 null / undefined 时跳过，不参与匹配（否则 `String(null)` = "null"
 *     会把含 "null" 的关键字误命中到每一行）。
 *   - 关键字为空（去掉首尾空白后）时**原样返回入参数组**，不过滤、不复制语义。
 *
 * 为什么过滤键用「字符串或数组都收」：
 *   各仓调用时通常写 `useListFilter(rows, 'id,name')` 这种字面量。若把数组直接
 *   放进 useMemo 依赖，每次渲染都是新数组 → 依赖永远不等 → memo 形同虚设。
 *   这里把 keys 归一化成字符串再进依赖，保证引用稳定。
 */
import {useCallback, useMemo, useState} from 'react'

/**
 * 纯函数：按给定字段做大小写不敏感的「或」匹配过滤。
 * @param {Array<object>} rows 待过滤的行
 * @param {string|string[]} keys 参与匹配的字段名
 * @param {string} keyword 关键字
 * @returns {Array<object>} 过滤后的行（keyword 为空时返回入参本身）
 */
export function filterRows(rows, keys, keyword) {
    const list = Array.isArray(rows) ? rows : []
    const kw = String(keyword == null ? '' : keyword).trim().toLowerCase()
    if (!kw) return list

    const fields = (Array.isArray(keys) ? keys : String(keys || '').split(','))
        .map((k) => String(k || '').trim())
        .filter(Boolean)
    if (!fields.length) return list

    return list.filter((row) => {
        if (!row || typeof row !== 'object') return false
        return fields.some((field) => {
            const v = row[field]
            if (v === null || v === undefined) return false
            return String(v).toLowerCase().includes(kw)
        })
    })
}

/**
 * Hook 版：返回 {keyword, setKeyword, filtered, reset}。
 *
 * @param {Array<object>} rows 数据源
 * @param {string|string[]} keys 参与匹配的字段名（逗号分隔字符串或数组）
 * @returns {{keyword: string, setKeyword: Function, filtered: Array<object>, reset: Function}}
 */
export function useListFilter(rows, keys) {
    const [keyword, setKeyword] = useState('')

    // keys 归一成字符串再进依赖：调用方传字面量数组时也不会让 memo 失效
    const keySig = (Array.isArray(keys) ? keys.join(',') : String(keys || '')).trim()

    const filtered = useMemo(
        () => filterRows(rows, keySig, keyword),
        [rows, keySig, keyword],
    )

    const reset = useCallback(() => setKeyword(''), [])

    return {keyword, setKeyword, filtered, reset}
}

export default useListFilter
