import {useEffect, useRef} from 'react'
import * as echarts from 'echarts/core'
import {BarChart, LineChart, PieChart} from 'echarts/charts'
import {GridComponent, LegendComponent, TitleComponent, TooltipComponent,} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'

// 只注册常用图表, 减小 bundle
echarts.use([
    LineChart, PieChart, BarChart,
    GridComponent, TooltipComponent, LegendComponent, TitleComponent,
    CanvasRenderer,
])

/**
 * EChartsChart - 安全包装 echarts 实例, 自动处理初始化/销毁/resize.
 *
 * 修复 z-opc 后台原 Schedule Dashboard 的交互问题:
 *   1. 内存泄漏: 切换路由时 echarts 实例没 dispose, 多次进入页面会重复绑定 DOM
 *   2. resize 监听器没 cleanup, 每次进入页面都新增一个
 *   3. 颜色硬编码, 主题不一致
 *
 * 用法:
 *   <EChartsChart option={...} height={300} />
 *
 * @param {Object} props
 * @param {Object} props.option - echarts option
 * @param {number|string} [props.height] - 高度 (默认 300)
 * @param {string} [props.className]
 * @param {Object} [props.style]
 */
export default function EChartsChart({
                                         option,
                                         height = 300,
                                         className,
                                         style,
                                     }) {
    const containerRef = useRef(null)
    const instanceRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return
        instanceRef.current = echarts.init(containerRef.current, null, {renderer: 'canvas'})

        let resizeObserver
        const onResize = () => instanceRef.current?.resize()
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(onResize)
            resizeObserver.observe(containerRef.current)
        } else {
            window.addEventListener('resize', onResize)
        }

        return () => {
            if (resizeObserver) resizeObserver.disconnect()
            else window.removeEventListener('resize', onResize)
            if (instanceRef.current) {
                instanceRef.current.dispose()
                instanceRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        if (instanceRef.current && option) {
            instanceRef.current.setOption(option, {notMerge: true})
        }
    }, [option])

    return (
        <div
            ref={containerRef}
            className={className}
            role="img"
            aria-label="数据可视化图表"
            style={{
                width: '100%',
                height,
                ...style,
            }}
        />
    )
}
