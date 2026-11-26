import {useCallback, useEffect, useRef, useState} from 'react'

/**
 * 块级结构件（lead 008 §26「认知范式」）
 *
 * 范本源：z-cognition/_frontend/z-cognition-portal
 *   doc/ui-style-guide.md + src/styles/global.css
 *
 * 这些组件是**薄壳**：只负责把范式的结构与类名固定下来，
 * 视觉全部来自同目录的 blocks.css（宿主需在入口 import 一次）。
 * 组件不引入任何品牌色/线色 —— 走 --zfc-* token，宿主自有 token 优先。
 */

/** 面板容器：1px 描边 + 8px 圆角 + 页面级零阴影 */
export function Panel({className = '', children, ...rest}) {
    return (
        <section className={`zfc-panel${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </section>
    )
}

export function PanelHead({className = '', children, ...rest}) {
    return (
        <header className={`zfc-panel-head${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </header>
    )
}

export function PanelTitle({className = '', children, ...rest}) {
    return (
        <h3 className={`zfc-panel-title${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </h3>
    )
}

export function PanelHint({className = '', children, ...rest}) {
    return (
        <span className={`zfc-panel-hint${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </span>
    )
}

export function PanelActions({className = '', children, ...rest}) {
    return (
        <div className={`zfc-panel-actions${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </div>
    )
}

/** 正文区：tight = 12px 内距，flush = 0 内距（贴边表格/结果区） */
export function PanelBody({tight = false, flush = false, className = '', children, ...rest}) {
    const modifier = tight ? ' is-tight' : flush ? ' is-flush' : ''
    return (
        <div className={`zfc-panel-body${modifier}${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </div>
    )
}

export function PanelFoot({className = '', children, ...rest}) {
    return (
        <footer className={`zfc-panel-foot${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </footer>
    )
}

/** 共边横排容器：子块之间零间隙、叠 1px，读作一整块 */
export function BlockRow({className = '', children, ...rest}) {
    return (
        <div className={`zfc-glue${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </div>
    )
}

/** 贴边容器：反向外扩到侧栏/视口边缘 */
export function Bleed({className = '', children, ...rest}) {
    return (
        <div className={`zfc-bleed${className ? ` ${className}` : ''}`} {...rest}>
            {children}
        </div>
    )
}

export const DEFAULT_SPLIT_WIDTH = 236
export const DEFAULT_SPLIT_MIN = 190
export const DEFAULT_SPLIT_MAX = 420

/** 宽度钳制：越界即贴边，不会把手拖丢 */
export function clampSplitWidth(value, min = DEFAULT_SPLIT_MIN, max = DEFAULT_SPLIT_MAX) {
    const n = Number(value)
    if (!Number.isFinite(n)) return min
    return Math.min(max, Math.max(min, Math.round(n)))
}

/**
 * 整屏多栏工作台：左栏 + 1px 竖线 + 右栏。
 *
 * 范本口径（认知 §3.1）：
 *   - 栏间零间隙，只有 1px 分隔线，不靠 gap / margin 造白条
 *   - 抓手 9px 命中区骑在竖线上，hover/拖动才亮
 *   - 双击抓手复位默认宽
 *   - 宽度可持久化（storageKey）
 */
export function SplitLayout({
                                side,
                                children,
                                sideWidth,
                                defaultSideWidth = DEFAULT_SPLIT_WIDTH,
                                minSideWidth = DEFAULT_SPLIT_MIN,
                                maxSideWidth = DEFAULT_SPLIT_MAX,
                                storageKey,
                                onSideWidthChange,
                                className = '',
                                ...rest
                            }) {
    const [innerWidth, setInnerWidth] = useState(() => {
        if (typeof window === 'undefined' || !storageKey) return defaultSideWidth
        try {
            const stored = Number(window.localStorage.getItem(storageKey))
            return Number.isFinite(stored) && stored > 0
                ? clampSplitWidth(stored, minSideWidth, maxSideWidth)
                : defaultSideWidth
        } catch {
            return defaultSideWidth
        }
    })
    const dragging = useRef(false)
    const startX = useRef(0)
    const startWidth = useRef(defaultSideWidth)

    const width = sideWidth === undefined ? innerWidth : clampSplitWidth(sideWidth, minSideWidth, maxSideWidth)

    const commit = useCallback((next) => {
        const clamped = clampSplitWidth(next, minSideWidth, maxSideWidth)
        if (sideWidth === undefined) setInnerWidth(clamped)
        if (storageKey && typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(storageKey, String(clamped))
            } catch {
                /* 隐私模式下 localStorage 不可写：宽度只在本会话生效 */
            }
        }
        if (onSideWidthChange) onSideWidthChange(clamped)
        return clamped
    }, [minSideWidth, maxSideWidth, onSideWidthChange, sideWidth, storageKey])

    const onPointerDown = useCallback((event) => {
        dragging.current = true
        startX.current = event.clientX
        startWidth.current = width
        if (event.currentTarget.setPointerCapture && event.pointerId !== undefined) {
            try {
                event.currentTarget.setPointerCapture(event.pointerId)
            } catch {
                /* 某些环境不支持指针捕获：退化为 window 监听 */
            }
        }
    }, [width])

    useEffect(() => {
        if (typeof window === 'undefined') return undefined
        const move = (event) => {
            if (!dragging.current) return
            commit(startWidth.current + (event.clientX - startX.current))
        }
        const up = () => {
            dragging.current = false
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
        window.addEventListener('pointercancel', up)
        return () => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', up)
            window.removeEventListener('pointercancel', up)
        }
    }, [commit])

    const onKeyDown = useCallback((event) => {
        const step = event.shiftKey ? 40 : 12
        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            commit(width - step)
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            commit(width + step)
        }
    }, [commit, width])

    return (
        <div
            className={`zfc-split${className ? ` ${className}` : ''}`}
            style={{'--zfc-split-w': `${width}px`}}
            {...rest}
        >
            <div className="zfc-split-side">{side}</div>
            <div
                className="zfc-split-handle"
                role="separator"
                aria-orientation="vertical"
                aria-label="调整左栏宽度"
                tabIndex={0}
                onPointerDown={onPointerDown}
                onDoubleClick={() => commit(defaultSideWidth)}
                onKeyDown={onKeyDown}
            />
            <div className="zfc-split-main">{children}</div>
        </div>
    )
}
