import {Breadcrumb} from 'antd'
import {useInRouterContext, useNavigate} from 'react-router-dom'

/**
 * PageHeader - 通用页面标题（紧凑单行版）.
 *
 * 解决 z-opc 后台每个页面都重复写 Title + Description + 返回按钮的问题.
 *
 * 原则 (来自 anthropics/frontend-design):
 *   - Structure is information. 面包屑末级即当前页名, 与操作按钮同行, 信息密度优先.
 *   - 不用 emoji/装饰元素, 用 typography 表达层级.
 *
 * @param {Object} props
 * @param {string} props.title - 主标题（有 breadcrumb 时以面包屑末级为准, 不再单独渲染）
 * @param {string} [props.subtitle] - 副标题/描述（同行小灰字, 超长截断, hover 可见全文）
 * @param {Array<{label: string, href?: string, onClick?: Function}>} [props.breadcrumb] - 面包屑。
 *        每项可给 `href`（走路由跳转）或 `onClick`（自己处理，如「回到列表 / 关抽屉」），
 *        两者都给时以 `onClick` 为准（onClick 里可自行决定要不要跳）。
 * @param {ReactNode} [props.extra] - 右上角操作按钮区
 * @param {ReactNode} [props.back] - 是否显示返回按钮 + onBack 回调
 * @param {Function} [props.onBack] - 返回回调
 */
export default function PageHeader({
                                       title,
                                       subtitle,
                                       breadcrumb,
                                       extra,
                                       back,
                                       onBack,
                                   }) {
    // ⚠ PageHeader 可能被在没有 Router 的环境里单独渲染（Storybook / 单测 / SSR 片段）。
    //   useNavigate 在 Router 外会抛 invariant ⇒ 先探一次上下文再决定要不要调它。
    //   （与 ComponentDoc 同一口径。）
    const inRouter = useInRouterContext()
    const navigate = inRouter ? useNavigate() : null
    const handleBack = () => {
        if (onBack) onBack()
        else if (navigate) navigate(-1)
    }

    return (
        <div style={{
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: '1px solid #f1f5f9',
        }}>
            {/* 单行: 面包屑/标题 + 副标题 | 操作区 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 0,
                    flexWrap: 'wrap',
                }}>
                    {back && (
                        <button
                            onClick={handleBack}
                            aria-label="返回上一页"
                            style={{
                                width: 28, height: 28,
                                borderRadius: 6,
                                border: '1px solid #e5e7eb',
                                background: '#ffffff',
                                color: '#6b7280',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 13,
                                transition: 'all 150ms ease',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f8fafc'
                                e.currentTarget.style.color = '#111827'
                                e.currentTarget.style.borderColor = '#7c3aed'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff'
                                e.currentTarget.style.color = '#6b7280'
                                e.currentTarget.style.borderColor = '#e5e7eb'
                            }}
                        >
                            ←
                        </button>
                    )}
                    {breadcrumb && breadcrumb.length > 0 ? (
                        <Breadcrumb
                            items={breadcrumb.map((b, i) => {
                                const last = i === breadcrumb.length - 1
                                // ⚠ 面包屑项支持两种触发方式：**href**（走路由跳转）与
                                //   **onClick**（自己处理）。只有 href 是不够的 ——
                                //   有些页面的上一级不是一条路由，而是一个「回到列表 / 关闭抽屉 /
                                //   切换筛选条件」的动作，用 href 表达不了。
                                //   这条能力原先只存在于 z-wf 仓内那份 PageHeader 拷贝里，
                                //   并进基座后 z-wf 那份就能删掉（单一真源）。
                                const clickable = !last && (b.href || b.onClick)
                                const title = clickable
                                    ? <a onClick={(e) => {
                                        e.preventDefault()
                                        // href 优先：既给了 href 又给了 onClick 时，
                                        // 交给调用方自己决定（onClick 里可以 preventDefault 掉跳转）
                                        if (b.onClick) {
                                            b.onClick(e)
                                            return
                                        }
                                        if (navigate) navigate(b.href)
                                    }}>{b.label}</a>
                                    : <span style={last ? {
                                        fontWeight: 600,
                                        color: '#111827'
                                    } : undefined}>{b.label}</span>
                                return {title}
                            })}
                        />
                    ) : (
                        title && (
                            <span role="heading" aria-level={1} style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: '#111827',
                                lineHeight: 1.4,
                            }}>
                                {title}
                            </span>
                        )
                    )}
                    {subtitle && (
                        <span title={subtitle} style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 360,
                        }}>
                            {subtitle}
                        </span>
                    )}
                </div>
                {extra && (
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        flexShrink: 0,
                    }}>
                        {extra}
                    </div>
                )}
            </div>
        </div>
    )
}
