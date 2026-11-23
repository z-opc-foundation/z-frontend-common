import { useEffect, useState } from 'react'

/**
 * SidebarShell —— 工作台左侧栏外壳（lead 008 §17 侧栏统一）
 *
 * 范本 = z-cognition-portal 侧栏（2026-11-23 CEO 裁定）：
 *   - 顶部不设品牌图标区（logo 由主壳顶栏承担，侧栏只放菜单）
 *   - 收起/展开把手贴在「左侧菜单与右侧面板之间的那条分隔带」上：
 *     展开态把手压在侧栏右缘、跨过分隔线；收起态把手贴在内容面板左缘
 *
 * 几何沿用 z-team 协作面已有的 edge handle 规格（18×36 竖条、
 * 左侧圆角、hover 变主色），保证同一壳内两种侧栏手感一致。
 *
 * 折叠态由组件自管（可传 storageKey 持久化），宿主无需感知。
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children] 菜单内容（通常是 MenuTree）
 * @param {string}  [props.title]              侧栏顶部标题（纯文字，无图标）
 * @param {number} [props.width=220]          展开态侧栏宽度
 * @param {boolean} [props.defaultCollapsed=false] 初始是否收起
 * @param {string}  [props.storageKey]        折叠态持久化键（'1'/'0'）
 * @param {string}  [props.className]         追加到根节点
 * @param {Object}  [props.style]             追加到根节点（可覆盖 --zfc-sbs-* 变量）
 */

const STYLE_ID = 'zfc-sidebarshell-style'

const SIDEBAR_SHELL_CSS = `
.zfc-sbs{position:relative;flex:0 0 auto;display:flex;flex-direction:column;overflow:visible;
  background:var(--zfc-sbs-bg,#f7f8fa);border-right:1px solid var(--zfc-sbs-line,#e2e4e8);
  transition:width .18s ease,min-width .18s ease}
.zfc-sbs.is-collapsed{border-right:none}
.zfc-sbs-title{padding:14px 12px 4px;font-size:13px;font-weight:600;letter-spacing:.01em;
  color:var(--zfc-sbs-ink,rgba(0,0,0,.9))}
.zfc-sbs-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.zfc-sbs.is-collapsed .zfc-sbs-body{display:none}
.zfc-sbs-handle{position:absolute;top:50%;right:-9px;transform:translateY(-50%);z-index:30;
  width:18px;height:36px;border:1px solid var(--zfc-sbs-line,#e2e4e8);border-right:none;
  border-radius:6px 0 0 6px;background:#fff;color:var(--zfc-sbs-ink,rgba(0,0,0,.6));
  cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;line-height:1;
  padding:0;box-shadow:-2px 0 8px rgba(0,0,0,.06);
  transition:background .15s ease,color .15s ease,box-shadow .15s ease}
.zfc-sbs-handle:hover{background:var(--zfc-sbs-primary,#0052d9);color:#fff;
  border-color:var(--zfc-sbs-primary,#0052d9)}
.zfc-sbs.is-collapsed .zfc-sbs-handle{right:auto;left:0;border-right:1px solid var(--zfc-sbs-line,#e2e4e8);
  border-left:none;border-radius:0 6px 6px 0}
`

function ensureStyles() {
    if (typeof document === 'undefined') return
    if (document.getElementById(STYLE_ID)) return
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = SIDEBAR_SHELL_CSS
    document.head.appendChild(el)
}

export default function SidebarShell({
    children,
    title,
    width = 220,
    defaultCollapsed = false,
    storageKey,
    className = '',
    style,
}) {
    ensureStyles()

    const [collapsed, setCollapsed] = useState(() => {
        if (!storageKey || typeof localStorage === 'undefined') return defaultCollapsed
        try {
            return localStorage.getItem(storageKey) === '1'
        } catch (e) {
            return defaultCollapsed
        }
    })

    useEffect(() => {
        if (!storageKey || typeof localStorage === 'undefined') return
        try {
            localStorage.setItem(storageKey, collapsed ? '1' : '0')
        } catch (e) {
            /* Safari 无痕模式禁写 localStorage —— 折叠态退化为不持久化 */
        }
    }, [collapsed, storageKey])

    const label = collapsed ? '展开侧栏' : '收起侧栏'

    return (
        <div
            className={`zfc-sbs${collapsed ? ' is-collapsed' : ''}${className ? ' ' + className : ''}`}
            style={{ width: collapsed ? 0 : width, minWidth: collapsed ? 0 : width, ...style }}
        >
            {title ? <div className="zfc-sbs-title">{title}</div> : null}
            <div className="zfc-sbs-body">{children}</div>
            <button
                type="button"
                className="zfc-sbs-handle"
                title={label}
                aria-label={label}
                aria-expanded={!collapsed}
                onClick={() => setCollapsed((prev) => !prev)}
            >
                {collapsed ? '›' : '‹'}
            </button>
        </div>
    )
}
