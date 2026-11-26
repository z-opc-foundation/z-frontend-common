import { useEffect, useState } from 'react'

/**
 * ProcessTimeline —— 对话过程时间线（Codex 风格，2026-11-24 CEO 截图范本）。
 *
 * 形态：一条竖向轨道，每个「组」是轨道上的一节：
 *   组头 = 圆角方块 chevron 按钮 + 灰字标签（如「执行工具 3 次」「正在执行中 · 5分59秒」）
 *   展开后 = 组内步骤链：左侧一条竖线，每步一个状态标记
 *           （✓ 完成 / ○ 进行中 / ○ 思考中 / ✗ 失败）+ 步骤名 + 可选参数徽章 + 可选流式预览
 *           步骤下方可挂详情面板（浅灰底），放思考正文 / 工具入参输出。
 *
 * 组件只管「长得像」，不管业务语义：宿主把消息流解析成 group/step 结构喂进来。
 *
 * 颜色全走 --zfc-pt-* 变量（根节点给默认值，宿主可在 style 里覆盖）；
 * 样式以一次性 scoped <style> 注入（伪类/hover 内联表达不了），
 * SSR 下（无 document）自动跳过注入，只影响交互态不影响结构断言。
 *
 * @param {Object} props
 * @param {Array}  [props.groups] 组列表，见 ProcessTimelineGroup
 * @param {string} [props.className] 追加到根节点
 * @param {Object} [props.style]    追加到根节点（可覆盖 --zfc-pt-* 变量）
 *
 * ProcessTimelineGroup: { key, label, status?, steps?, defaultOpen? }
 *   - label: 组头文字（宿主自己拼，如「执行工具 3 次」「正在执行中 · 5分59秒」）
 *   - status: 'running' 时组默认展开（流式推进过程要看得见）
 *   - steps: 步骤列表，见 ProcessTimelineStep
 * ProcessTimelineStep: { key, label, status?, badge?, preview?, detail? }
 *   - status: 'done' | 'running' | 'thinking' | 'failed' | 'pending'
 *   - badge: 参数徽章文本（如文件名 ctx.txt）
 *   - preview: 步骤右侧的流式预览单行（超长截断）
 *   - detail: 步骤下方的详情面板内容（ReactNode）
 */

const STYLE_ID = 'zfc-processtimeline-style'

const PROCESS_TIMELINE_CSS = `
.zfc-pt{--zfc-pt-ink:rgba(0,0,0,.9);--zfc-pt-ink-2:rgba(0,0,0,.62);
  --zfc-pt-muted:rgba(0,0,0,.45);--zfc-pt-line:#e2e4e8;--zfc-pt-line-strong:#c9ccd3;
  --zfc-pt-surface-3:#f3f3f3;--zfc-pt-surface-2:#f6f6f6;--zfc-pt-primary:#0052d9;
  --zfc-pt-green:#2ba471;--zfc-pt-red:#e54545;
  display:flex;flex-direction:column;gap:2px;margin:2px 0}
.zfc-pt-group{display:flex;flex-direction:column;gap:0}
.zfc-pt-head{display:flex;align-items:center;gap:8px;width:100%;
  padding:3px 0;border:0;background:transparent;cursor:pointer;text-align:left;
  font-family:inherit;font-size:13px;color:var(--zfc-pt-muted);line-height:22px;
  border-radius:6px}
.zfc-pt-head:hover{color:var(--zfc-pt-ink-2)}
.zfc-pt-head:focus-visible{outline:2px solid rgba(0,82,217,.55);outline-offset:1px}
.zfc-pt-caret{width:20px;height:20px;flex:0 0 auto;display:flex;align-items:center;
  justify-content:center;border:1px solid var(--zfc-pt-line-strong);border-radius:6px;
  background:#fff;color:var(--zfc-pt-ink-2);box-sizing:border-box}
.zfc-pt-caret:hover{border-color:var(--zfc-pt-primary);color:var(--zfc-pt-primary)}
.zfc-pt-chevron{display:inline-flex;transform:rotate(0deg);transition:transform .16s ease}
.zfc-pt-chevron.is-closed{transform:rotate(-90deg)}
.zfc-pt-label{flex:1;min-width:0;overflow-wrap:anywhere}
.zfc-pt-steps{position:relative;margin:2px 0 6px 10px;padding:2px 0 2px 22px;
  border-left:1px solid var(--zfc-pt-line)}
.zfc-pt-step{position:relative;padding:3px 0}
.zfc-pt-mark{position:absolute;left:-29px;top:5px;width:13px;height:13px;
  display:flex;align-items:center;justify-content:center;border-radius:50%;
  font-size:11px;line-height:1;box-sizing:border-box;
  background:#fff;border:1.5px solid var(--zfc-pt-line-strong);color:var(--zfc-pt-muted)}
.zfc-pt-mark.is-done{border-color:var(--zfc-pt-green);color:var(--zfc-pt-green)}
.zfc-pt-mark.is-running{border-color:var(--zfc-pt-primary);color:var(--zfc-pt-primary);
  animation:zfc-pt-pulse 1.4s ease-in-out infinite}
.zfc-pt-mark.is-failed{border-color:var(--zfc-pt-red);color:var(--zfc-pt-red)}
@keyframes zfc-pt-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.zfc-pt-step-label{font-size:13px;color:var(--zfc-pt-ink);line-height:20px;
  display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.zfc-pt-step-label.is-muted{color:var(--zfc-pt-muted)}
.zfc-pt-badge{display:inline-flex;align-items:center;max-width:280px;padding:0 7px;
  border:1px solid var(--zfc-pt-line);border-radius:5px;background:var(--zfc-pt-surface-2);
  font-size:11.5px;line-height:19px;color:var(--zfc-pt-ink-2);
  font-family:"SF Mono",Menlo,Consolas,monospace;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.zfc-pt-preview{flex:1;min-width:0;font-size:12.5px;color:var(--zfc-pt-muted);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.zfc-pt-preview::before{content:"· "}
.zfc-pt-detail-toggle{flex:0 0 auto;border:1px solid var(--zfc-pt-line);border-radius:5px;
  background:transparent;color:var(--zfc-pt-muted);cursor:pointer;font-family:inherit;
  font-size:11px;line-height:16px;padding:0 6px;opacity:0;transition:opacity .15s ease}
.zfc-pt-step:hover .zfc-pt-detail-toggle,
.zfc-pt-step.has-open .zfc-pt-detail-toggle,
.zfc-pt-detail-toggle:focus-visible{opacity:1}
.zfc-pt-detail-toggle:hover{color:var(--zfc-pt-ink-2);border-color:var(--zfc-pt-line-strong)}
.zfc-pt-detail-toggle:focus-visible{outline:2px solid rgba(0,82,217,.55);outline-offset:1px}
.zfc-pt-detail{margin:6px 0 4px 24px;padding:10px 14px;border-radius:8px;
  background:var(--zfc-pt-surface-2);
  font-size:12.5px;line-height:1.7;color:var(--zfc-pt-ink-2);
  white-space:pre-wrap;word-break:break-word;max-height:320px;overflow-y:auto}
.zfc-pt-detail code,.zfc-pt-detail pre{font-family:"SF Mono",Menlo,Consolas,monospace;
  font-size:12px}
.zfc-pt-detail code{padding:1px 5px;border-radius:4px;background:var(--zfc-pt-surface-3)}
.zfc-pt-detail pre{padding:0;margin:6px 0;overflow-x:auto}
.zfc-pt-detail pre code{background:transparent;padding:0}
@media (prefers-reduced-motion:reduce){
  .zfc-pt-chevron{transition:none}
  .zfc-pt-mark.is-running{animation:none}
}
`

function ensureStyles() {
    if (typeof document === 'undefined') return
    if (document.getElementById(STYLE_ID)) return
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = PROCESS_TIMELINE_CSS
    document.head.appendChild(el)
}

function ChevronIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    )
}

/** chevron：open（展开）= 向下；closed = rotate(-90deg) 指右。
 * 基态必须显式 rotate(0deg)：WebKit 对「transform 过渡到 none」会冻结在起始值（2026-11-23 真机钉死）。 */
function Chevron({open}) {
    return (
        <span className={`zfc-pt-chevron${open ? ' is-open' : ' is-closed'}`} aria-hidden="true">
            <ChevronIcon/>
        </span>
    )
}

const MARK_TEXT = {done: '✓', failed: '✕', running: '', thinking: '', pending: ''}

function StepMark({status}) {
    // pending 与 thinking 都是空心圆（截图口径），但保留类名让宿主能另行着色。
    const cls = status === 'pending' ? '' : ` is-${status}`
    return (
        <span className={`zfc-pt-mark${cls}`} aria-hidden="true">
            {MARK_TEXT[status] ?? ''}
        </span>
    )
}

function ProcessStep({step}) {
    const status = step.status || 'done'
    // 详情默认收起：工具结果很长，常驻会把时间线撑成日志墙；
    // 宿主可对「思考中」这类需要盯着的步显式传 detailOpen。
    const [open, setOpen] = useState(step.detailOpen === true)
    const hasDetail = step.detail != null && step.detail !== false
    return (
        <div className={`zfc-pt-step${open ? ' has-open' : ''}`}>
            <StepMark status={status}/>
            <div className={`zfc-pt-step-label${status === 'pending' ? ' is-muted' : ''}`}>
                <span>{step.label}</span>
                {step.badge ? <span className="zfc-pt-badge">{step.badge}</span> : null}
                {step.preview ? <span className="zfc-pt-preview">{step.preview}</span> : null}
                {hasDetail ? (
                    <button
                        type="button"
                        className="zfc-pt-detail-toggle"
                        aria-expanded={open}
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        {open ? '收起' : '详情'}
                    </button>
                ) : null}
            </div>
            {hasDetail && open ? <div className="zfc-pt-detail">{step.detail}</div> : null}
        </div>
    )
}

function ProcessGroup({group}) {
    const [open, setOpen] = useState(group.defaultOpen === true)
    const running = group.status === 'running'

    // 进行中的组默认展开：流式推进过程要看得见；结束后保持用户的手动选择。
    useEffect(() => {
        if (running) setOpen(true)
    }, [running])

    const steps = group.steps || []
    return (
        <div className="zfc-pt-group">
            <button
                type="button"
                className="zfc-pt-head"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="zfc-pt-caret"><Chevron open={open}/></span>
                <span className="zfc-pt-label">{group.label}</span>
            </button>
            {open && steps.length > 0 ? (
                <div className="zfc-pt-steps">
                    {steps.map((step, idx) => (
                        <ProcessStep key={step.key ?? idx} step={step}/>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

export default function ProcessTimeline({groups, className = '', style}) {
    ensureStyles()
    const list = groups || []
    return (
        <div className={`zfc-pt${className ? ' ' + className : ''}`} style={style}>
            {list.map((group, idx) => (
                <ProcessGroup key={group.key ?? idx} group={group}/>
            ))}
        </div>
    )
}
