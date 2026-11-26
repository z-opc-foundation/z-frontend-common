import { Tag } from 'antd'

/** 0.1.1 契约保留：数值/枚举 → 语义色 Tag 的默认映射。 */
export const defaultStatusMap = {
    1: { color: 'green', text: '正常' },
    0: { color: 'red', text: '禁用' },
    pending: { color: 'orange', text: '待处理' },
    approved: { color: 'blue', text: '已通过' },
    rejected: { color: 'red', text: '已拒绝' },
}

/**
 * 状态标签。props 与 0.1.1 一致：status + 可选 map（覆盖/追加 defaultStatusMap）。
 */
export default function StatusTag({ status, map }) {
    const conf = map?.[status] || defaultStatusMap[status] || { color: 'default', text: String(status) }
    return <Tag color={conf.color}>{conf.text}</Tag>
}
