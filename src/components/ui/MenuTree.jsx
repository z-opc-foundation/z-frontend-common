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
 * @param {Array}  [props.topItems]  顶部无分组叶子项（如「首页」），元素见 MenuItem
 * @param {Array}  [props.groups]    分组列表，见 MenuTreeGroup
 * @param {boolean} [props.defaultCollapsed=false] 分组初始是否收起
 * @param {boolean} [props.autoExpandActive=true] active 项所在分组/父项自动展开
 * @param {string} [props.className] 追加到根节点
 * @param {Object} [props.style]    追加到根节点（可在这里覆盖 --zfc-mt-* 变量）
 *
 * MenuItem: { key, label, icon?, active?, title?, onClick?, href?, target?, children? }
 *   - href  ⇒ 渲染 <a>；onClick ⇒ 渲染 <button>；两者都无 ⇒ 渲染不可点的 <div>
 *   - children: MenuItem[] ⇒ 行尾出现 chevron、点击展开/收起（子轨仅一层嵌套）
 *   - target ⇒ 行尾琥珀圆点（外部目标标记）
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
  font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:12px 12px 6px;white-space:nowrap}
.zfc-mt-label::before{content:"";width:3px;height:11px;border-radius:2px;background:var(--zfc-mt-line-strong);
  flex:0 0 auto;transition:background .16s ease}
.zfc-mt-group.has-active>.zfc-mt-label::before{background:var(--zfc-mt-primary)}
.zfc-mt-toggle{width:100%;border:0;background:transparent;cursor:pointer;text-align:left;
  font-family:inherit;appearance:none;border-radius:6px;transition:color .16s ease}
.zfc-mt-toggle:hover{color:var(--zfc-mt-ink)}
.zfc-mt-group.has-active>.zfc-mt-toggle{color:var(--zfc-mt-primary-strong)}
.zfc-mt-toggle:focus-visible,.zfc-mt-item:focus-visible{outline:2px solid rgba(0,82,217,.55);outline-offset:1px}
.zfc-mt-chevron{margin-left:auto;display:inline-flex;opacity:.55;transform:rotate(0deg);transition:transform .16s ease}
.zfc-mt-chevron.is-closed{transform:rotate(-90deg)}
.zfc-mt-active-dot{display:none;width:5px;height:5px;border-radius:50%;background:var(--zfc-mt-primary)}
.zfc-mt-group.collapsed .zfc-mt-active-dot{display:inline-block}
.zfc-mt-items{margin-left:23px}
.zfc-mt-item{position:relative;display:flex;align-items:center;gap:10px;height:34px;padding:6px 10px;
  margin:1px 0;border:0;border-radius:4px;background:transparent;color:var(--zfc-mt-ink-2);
  font-size:15px;font-weight:400;white-space:nowrap;width:100%;cursor:pointer;text-align:left;
  font-family:inherit;transition:background .16s ease,color .16s ease}
.zfc-mt-item .zfc-mt-ic{display:inline-flex;width:18px;height:18px;opacity:.92;flex:0 0 auto}
.zfc-mt-item:hover{background:var(--zfc-mt-surface-3);color:var(--zfc-mt-ink)}
.zfc-mt-item.is-active{color:var(--zfc-mt-primary-strong);background:var(--zfc-mt-surface-3)}
.zfc-mt-text{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
.zfc-mt-target-dot{width:5px;height:5px;border-radius:50%;background:var(--zfc-mt-amber);opacity:.8;flex:0 0 auto}
.zfc-mt-subitems{margin-left:22px;padding-left:12px;border-left:1px solid var(--zfc-mt-line)}
.zfc-mt-subitems .zfc-mt-item{height:31px;margin:1px 0;padding:0 9px;font-size:14px;gap:9px;
  color:var(--zfc-mt-muted);border-radius:7px}
.zfc-mt-subitems .zfc-mt-item .zfc-mt-ic{width:14px;height:14px;opacity:.82}
.zfc-mt-subitems .zfc-mt-item:hover{color:var(--zfc-mt-ink);background:var(--zfc-mt-surface-3)}
.zfc-mt-subitems .zfc-mt-item.is-active{color:var(--zfc-mt-primary-strong);background:var(--zfc-mt-surface-3)}
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

/** chevron：open（展开）= 向下；closed = rotate(-90deg) 指右。基态必须显式 rotate(0deg)：WebKit 对 transform→none 的过渡会冻结在起始值，展开组会卡在 -90°。 */
function Chevron({open}) {
    return (
        <span className={`zfc-mt-chevron${open ? ' is-open' : ' is-closed'}`}
              aria-hidden="true">
            <ChevronIcon/>
        </span>
    )
}

/**
 * 单行渲染。<a> 走 href，<button> 走 onClick，两者皆无（纯占位项）渲染 <div>。
 * 有 children 的行带 chevron：行自身 onClick 若存在则先执行再展开，否则点击即展开。
 */
function ItemRow({item, open, onToggleChildren}) {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    const cls = `zfc-mt-item${item.active ? ' is-active' : ''}`
    const body = (
        <>
            {item.icon != null ? <span className="zfc-mt-ic">{item.icon}</span> : null}
            <span className="zfc-mt-text">{item.label}</span>
            {item.target ? <span className="zfc-mt-target-dot" aria-hidden="true"/> : null}
            {hasChildren ? <Chevron open={open}/> : null}
        </>
    )
    const handleClick = hasChildren
        ? (e) => {
            if (item.onClick) item.onClick(e)
            onToggleChildren()
        }
        : item.onClick
    const extra = hasChildren ? {'aria-expanded': open} : {}
    if (item.href) {
        return <a className={cls} href={item.href} title={item.title || item.label}
                  onClick={handleClick} {...extra}>{body}</a>
    }
    if (item.onClick || hasChildren) {
        return <button type="button" className={cls} title={item.title || item.label}
                       onClick={handleClick} {...extra}>{body}</button>
    }
    return <div className={cls} title={item.title || item.label}>{body}</div>
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

    const initOpen = () => {
        const s = new Set()
        if (!defaultCollapsed) {
            groups.forEach((g) => {
                s.add(g.key)
                ;(g.items || []).forEach((it) => {
                    if (it.children && it.children.length) s.add(it.key)
                })
            })
        }
        return s
    }
    const [openKeys, setOpenKeys] = useState(initOpen)

    // 消费方数据多为 useMemo 重建的引用，这里收敛成字符串做 effect 依赖
    const activeSignature = groups
        .map((g) => g.key + ':' + (g.items || []).map((it) =>
            it.key + (it.active ? '!' : '') +
            (it.children || []).map((c) => c.key + (c.active ? '!' : '')).join(',')
        ).join(',')).join('|')

    useEffect(() => {
        if (!autoExpandActive) return
        setOpenKeys((prev) => {
            const next = new Set(prev)
            let changed = false
            const add = (k) => { if (!next.has(k)) { next.add(k); changed = true } }
            groups.forEach((g) => {
                const items = g.items || []
                const hit = items.some((it) =>
                    it.active || (it.children || []).some((c) => c.active))
                if (hit) add(g.key)
                items.forEach((it) => {
                    if (it.active || (it.children || []).some((c) => c.active)) add(it.key)
                })
            })
            return changed ? next : prev
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSignature, autoExpandActive])

    const toggle = (key) => {
        setOpenKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const renderItem = (item) => {
        const hasChildren = Array.isArray(item.children) && item.children.length > 0
        if (!hasChildren) {
            return <ItemRow key={item.key} item={item}/>
        }
        const open = openKeys.has(item.key)
        return (
            <div key={item.key}>
                <ItemRow item={item} open={open} onToggleChildren={() => toggle(item.key)}/>
                {!open ? null : (
                    <div className="zfc-mt-subitems">
                        {item.children.map((c) => <ItemRow key={c.key} item={c}/>)}
                    </div>
                )}
            </div>
        )
    }

    return (
        <nav className={`zfc-mt${className ? ' ' + className : ''}`} style={style}>
            {topItems.map(renderItem)}
            {groups.map((group) => {
                const groupActive = (group.items || []).some((it) =>
                    it.active || (it.children || []).some((c) => c.active))
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
                                {(group.items || []).map(renderItem)}
                            </div>
                        ) : null}
                    </div>
                )
            })}
        </nav>
    )
}
