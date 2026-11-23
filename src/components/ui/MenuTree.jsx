import { useEffect, useState } from 'react'

/**
 * MenuTree —— 全 fleet 统一左侧菜单树（lead 008 §17）。
 *
 * 视觉范本 = z-cognition-portal app-shell 的 nav（2026-11-23 CEO 裁定：
 * 「其他所有 tab 点开都学习这个」）。几何/配色/交互态逐值照搬：
 *   - 顶/组内项行 34px、子轨项 31px；组头 14px/700/uppercase + 竖 tick
 *   - 激活 = primary-strong 字色 + surface-3 底；hover = surface-3 + ink
 *   - 组间发丝分隔线；子项列 margin-left 23px；子轨 border-left 1px
 *
 * 颜色全部走 --zfc-mt-* 变量（根节点给范本默认值，宿主可在 style 里覆盖），
 * 样式以一次性 scoped <style> 注入（伪类/hover/::before 内联样式表达不了），
 * SSR 下（无 document）自动跳过注入，只影响交互态不影响结构断言。
 *
 * @param {Object} props
 * @param {Array}  [props.topItems]  顶部无分组项（如「首页」），元素见 MenuItem
 * @param {Array}  [props.groups]    分组列表，见 MenuTreeGroup
 * @param {boolean} [props.defaultCollapsed=false] 分组初始是否收起
 * @param {boolean} [props.autoExpandActive=true] active 项所在分组/父项自动展开
 * @param {string} [props.className] 追加到根节点
 * @param {Object} [props.style]    追加到根节点（可在这里覆盖 --zfc-mt-* 变量）
 *
 * MenuItem: { key, label, icon?, active?, title?, onClick?, href?, target?, disabled?, children? }
 *   - href ⇒ <a>；onClick ⇒ <button>；无操作的叶子 ⇒ 不可点的 <div>
 *   - children: MenuItem[] ⇒ 递归子轨；有导航的父行与折叠按钮独立
 *   - target ⇒ 行尾琥珀圆点（业务标记，不作为 HTML window name）
 *   - HTTP(S)/协议相对 href 或显式 target="_blank" ⇒ 原生新标签链接，不调用路由 onClick
 * MenuTreeGroup: { key, title, items: MenuItem[] }
 */

const STYLE_ID = 'zfc-menutree-style'

const MENU_TREE_CSS = `
.zfc-mt{position:relative;z-index:1;flex:1;overflow-y:auto;padding:4px 10px 18px;scrollbar-width:none;
  --zfc-mt-surface-3:#f3f3f3;--zfc-mt-ink:rgba(0,0,0,.9);--zfc-mt-ink-2:rgba(0,0,0,.6);
  --zfc-mt-muted:rgba(0,0,0,.62);--zfc-mt-line:#e2e4e8;--zfc-mt-line-strong:#c9ccd3;
  --zfc-mt-primary:#0052d9;--zfc-mt-primary-strong:#003cab;--zfc-mt-amber:#f59e0b}
.zfc-mt::-webkit-scrollbar{display:none}
.zfc-mt a.zfc-mt-item,.zfc-mt a.zfc-mt-item:hover{text-decoration:none}
.zfc-mt-group+.zfc-mt-group{margin-top:8px;padding-top:2px;border-top:1px solid var(--zfc-mt-line)}
.zfc-mt-label{display:flex;align-items:center;gap:8px;color:var(--zfc-mt-muted);font-size:14px;
  font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:12px 12px 6px;white-space:normal}
.zfc-mt-label>span:first-of-type{min-width:0;overflow-wrap:anywhere}
.zfc-mt-label::before{content:"";width:3px;height:11px;border-radius:2px;background:var(--zfc-mt-line-strong);
  flex:0 0 auto;transition:background .16s ease}
.zfc-mt-group.has-active>.zfc-mt-label::before{background:var(--zfc-mt-primary)}
.zfc-mt-toggle{width:100%;border:0;background:transparent;cursor:pointer;text-align:left;
  font-family:inherit;appearance:none;border-radius:6px;transition:color .16s ease}
.zfc-mt-toggle:hover{color:var(--zfc-mt-ink)}
.zfc-mt-group.has-active>.zfc-mt-toggle{color:var(--zfc-mt-primary-strong)}
.zfc-mt-toggle:focus-visible,.zfc-mt-item:focus-visible,.zfc-mt-disclosure:focus-visible{outline:2px solid rgba(0,82,217,.55);outline-offset:1px}
.zfc-mt-chevron{margin-left:auto;display:inline-flex;flex:0 0 auto;opacity:.55;transform:rotate(0deg);transition:transform .16s ease}
.zfc-mt-chevron.is-closed{transform:rotate(-90deg)}
.zfc-mt-active-dot{display:none;width:5px;height:5px;border-radius:50%;background:var(--zfc-mt-primary)}
.zfc-mt-group.collapsed .zfc-mt-active-dot{display:inline-block}
.zfc-mt-items{margin-left:23px}
.zfc-mt-item{position:relative;display:flex;align-items:center;gap:10px;min-height:34px;padding:6px 10px;
  margin:1px 0;border:0;border-radius:4px;background:transparent;color:var(--zfc-mt-ink-2);
  font-size:15px;font-weight:400;line-height:22px;white-space:normal;width:100%;box-sizing:border-box;cursor:pointer;text-align:left;
  font-family:inherit;transition:background .16s ease,color .16s ease}
.zfc-mt-item .zfc-mt-ic{display:inline-flex;width:18px;height:18px;opacity:.92;flex:0 0 auto}
.zfc-mt-item:not(.is-disabled):hover{background:var(--zfc-mt-surface-3);color:var(--zfc-mt-ink)}
.zfc-mt-item.is-active{color:var(--zfc-mt-primary-strong);background:var(--zfc-mt-surface-3)}
.zfc-mt-text{flex:1;min-width:0;overflow-wrap:anywhere}
.zfc-mt-target-dot{width:5px;height:5px;border-radius:50%;background:var(--zfc-mt-amber);opacity:.8;flex:0 0 auto}
.zfc-mt-subitems{margin-left:22px;padding-left:12px;border-left:1px solid var(--zfc-mt-line)}
.zfc-mt-subitems .zfc-mt-item{min-height:31px;margin:1px 0;padding:0 9px;font-size:14px;gap:9px;
  color:var(--zfc-mt-muted);border-radius:7px}
.zfc-mt-subitems .zfc-mt-item .zfc-mt-ic{width:14px;height:14px;opacity:.82}
.zfc-mt-subitems .zfc-mt-item:not(.is-disabled):hover{color:var(--zfc-mt-ink);background:var(--zfc-mt-surface-3)}
.zfc-mt-subitems .zfc-mt-item.is-active{color:var(--zfc-mt-primary-strong);background:var(--zfc-mt-surface-3)}
.zfc-mt-row{position:relative}
.zfc-mt-row>.zfc-mt-item{padding-right:36px}
.zfc-mt-disclosure{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:28px;height:28px;
  display:flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:4px;
  background:transparent;color:var(--zfc-mt-ink-2);cursor:pointer}
.zfc-mt-disclosure .zfc-mt-chevron{margin:0}
.zfc-mt-disclosure:not(:disabled):hover{background:var(--zfc-mt-surface-3);color:var(--zfc-mt-ink)}
.zfc-mt-item.is-disabled,.zfc-mt-disclosure:disabled{opacity:.45;cursor:not-allowed}
.zfc-mt div.zfc-mt-item{cursor:default}
@media (prefers-reduced-motion:reduce){
  .zfc-mt-toggle,.zfc-mt-label::before,.zfc-mt-item,.zfc-mt-chevron{transition:none}
}
`

function ensureStyles() {
    if (typeof document === 'undefined') return
    if (document.getElementById(STYLE_ID)) return
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = MENU_TREE_CSS
    document.head.appendChild(el)
}

function ChevronIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

/** chevron：open（展开）= 向下；closed = rotate(-90deg) 指右。基态必须显式 rotate(0deg)：
 * WebKit 对「transform 过渡到 none」会冻结在起始值，展开组会卡在 -90°（2026-11-23 真机钉死）。 */
function Chevron({open}) {
    return (
        <span className={`zfc-mt-chevron${open ? ' is-open' : ' is-closed'}`}
              aria-hidden="true">
            <ChevronIcon/>
        </span>
    )
}

/** 导航与 disclosure 用兄弟节点，保留原生链接/按钮的 Tab、Enter、Space 行为。 */
function ItemRow({item, showIcon, open, onToggleChildren}) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    const hasNavigation = Boolean(item.href || item.onClick)
    const split = hasChildren && hasNavigation
    const newTab = Boolean(item.href && (/^(?:https?:)?\/\//i.test(item.href.trim()) || item.target === '_blank'))
    const title = item.title || (typeof item.label === 'string' ? item.label : undefined)
    const cls = `zfc-mt-item${item.active ? ' is-active' : ''}${item.disabled ? ' is-disabled' : ''}`
    const toggle = (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!item.disabled) onToggleChildren()
    }
    const onDisclosureKeyDown = (event) => {
        if ((event.key === 'ArrowRight' && !open) || (event.key === 'ArrowLeft' && open)) toggle(event)
    }
    const body = (
        <>
            {showIcon ? <span className="zfc-mt-ic" aria-hidden="true">{item.icon}</span> : null}
            <span className="zfc-mt-text">{item.label}</span>
            {item.target ? <span className="zfc-mt-target-dot" aria-hidden="true"/> : null}
            {hasChildren && !split ? <Chevron open={open}/> : null}
        </>
    )
    const handleClick = (event) => {
        if (item.disabled) {
            event.preventDefault()
            event.stopPropagation()
            return
        }
        if (newTab) {
            event.preventDefault()
            event.stopPropagation()
            window.open(item.href, '_blank', 'noopener,noreferrer')
            return
        }
        if (hasNavigation) item.onClick?.(event)
        else if (hasChildren) toggle(event)
    }
    const extra = {
        'aria-current': item.active ? 'page' : undefined,
        'aria-disabled': item.disabled || undefined,
        ...(hasChildren && !split ? { 'aria-expanded': open, onKeyDown: onDisclosureKeyDown } : {}),
    }
    let row
    if (item.href) {
        row = <a className={cls} href={item.disabled ? undefined : item.href} title={title}
                 role={item.disabled ? 'link' : undefined} tabIndex={item.disabled ? -1 : undefined}
                 target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}
                 onClick={handleClick} {...extra}>{body}</a>
    } else if (item.onClick || hasChildren) {
        row = <button type="button" className={cls} title={title} disabled={item.disabled}
                      onClick={handleClick} {...extra}>{body}</button>
    } else {
        row = <div className={cls} title={title} {...extra}>{body}</div>
    }
    if (!split) return row
    const toggleLabel = `${open ? '收起' : '展开'}${title || '子菜单'}`
    return (
        <div className="zfc-mt-row">
            {row}
            <button type="button" className="zfc-mt-disclosure" disabled={item.disabled}
                    title={toggleLabel} aria-label={toggleLabel} aria-expanded={open}
                    onClick={toggle} onKeyDown={onDisclosureKeyDown}>
                <Chevron open={open}/>
            </button>
        </div>
    )
}

/** 同时收集默认展开项和 active 的完整归属链（含 topItems）。 */
function collectExpansion(topItems, groups) {
    const all = new Set()
    const active = new Set()
    const selected = []
    const visit = (items) => {
        let hit = false
        for (const item of items) {
            const children = item.children || []
            if (children.length) all.add(item.key)
            const childActive = visit(children)
            if (item.active) selected.push(item.key)
            if (childActive) active.add(item.key)
            if (item.active || childActive) hit = true
        }
        return hit
    }
    visit(topItems)
    for (const group of groups) {
        all.add(group.key)
        if (visit(group.items || [])) active.add(group.key)
    }
    return { all, active, selected }
}

export default function MenuTree({
    topItems = [],
    groups = [],
    defaultCollapsed = false,
    autoExpandActive = true,
    className = '',
    style,
}) {
    ensureStyles()

    const expansion = collectExpansion(topItems, groups)
    const [openKeys, setOpenKeys] = useState(() => new Set([
        ...(!defaultCollapsed ? expansion.all : []),
        ...(autoExpandActive ? expansion.active : []),
    ]))

    // 只展开选中项的祖先，父项自身导航不能改变其子树折叠状态。
    const activeSignature = JSON.stringify({ ancestors: [...expansion.active], selected: expansion.selected })
    useEffect(() => {
        if (!autoExpandActive) return
        const activeKeys = JSON.parse(activeSignature).ancestors
        setOpenKeys((prev) => {
            const next = new Set([...prev, ...activeKeys])
            return next.size === prev.size ? prev : next
        })
    }, [activeSignature, autoExpandActive])

    const toggle = (key) => {
        setOpenKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const renderItems = (items) => {
        const showIcon = items.some((item) => item.icon != null)
        return items.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0
            const open = openKeys.has(item.key)
            return (
                <div key={item.key}>
                    <ItemRow item={item} showIcon={showIcon} open={open} onToggleChildren={() => toggle(item.key)}/>
                    {hasChildren && open ? (
                        <div className="zfc-mt-subitems">{renderItems(item.children)}</div>
                    ) : null}
                </div>
            )
        })
    }

    return (
        <nav className={`zfc-mt${className ? ' ' + className : ''}`} style={style}>
            {renderItems(topItems)}
            {groups.map((group) => {
                const groupActive = expansion.active.has(group.key)
                const collapsed = !openKeys.has(group.key)
                return (
                    <div key={group.key}
                         className={`zfc-mt-group${collapsed ? ' collapsed' : ''}${groupActive ? ' has-active' : ''}`}>
                        <button type="button" className="zfc-mt-label zfc-mt-toggle"
                                aria-expanded={!collapsed}
                                onClick={() => toggle(group.key)}>
                            <span>{group.title}</span>
                            {groupActive ? <span className="zfc-mt-active-dot" aria-hidden="true"/> : null}
                            <Chevron open={!collapsed}/>
                        </button>
                        {!collapsed ? (
                            <div className="zfc-mt-items">
                                {renderItems(group.items || [])}
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </nav>
    )
}
