/**
 * 图表子路径 `@yuku123/z-frontend-common/ui/echarts`。
 *
 * EChartsChart 是 ui 目录里唯一依赖 echarts 的组件, 故不进扁平桶:
 * 绝大多数域组件 (z-gw/z-ctc/z-oss/z-msg …) 从不画图, 让它们 resolve echarts/core
 * 会直接构建失败。需要图表的域显式引本子路径并自行声明 echarts 依赖。
 */
export {default as EChartsChart} from './EChartsChart.jsx'
