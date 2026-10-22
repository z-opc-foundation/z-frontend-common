import {useCallback, useEffect, useState} from 'react'
import {Button, Card, Table} from 'antd'
import {ReloadOutlined} from '@ant-design/icons'
import {EmptyState, ErrorState, PageHeader} from './index'

/**
 * 中间件管理台共用的分页表格（z-opc 内孵化的 Tier A 页面用）。
 *
 * load(current, size) 既可以返回 MyBatis-Plus 的 {records,total,...}，也可以返回裸数组。
 * 后端 z-meta 的分页 count 有缺陷（records 有值但 total 返回 "0"），这里不把 0 当"共 0 条"显示，
 * 而是显式标出接口给的总数，避免页面上出现"有数据却说没有数据"的假象。
 */
/**
 * 分页总数文案 —— 提成导出是为了让它**可单测**。
 *
 * 为什么必须提成导出：antd 的 Table 在**数据为空**时不渲染整个分页块
 * （实测 SSR 空数据产物里连 `ant-pagination` 容器都没有）⇒
 * `showTotal` 那个闭包在 SSR 下**永远不会被执行**，任何针对文案本身的断言都无从下手。
 * 提成纯函数后，文案口径就能被直接测到，而不用去构造「有数据」的场景。
 */
export const PAGED_TOTAL_TEXT = {
    // total 有效 ⇒ 标准口径
    known: (total) => `共 ${total} 条`,
    // total 缺失/为 0 —— 后端 z-meta 的分页 count 有缺陷（records 有值但 total 返回 "0"），
    // 这时不能显示「共 0 条」（页面上会出现"有数据却说没有数据"的假象）
    unknown: (rowsLength) => `本页 ${rowsLength} 条（接口 total 未返回有效值）`,
}

export default function PagedTable({title, description, load, columns, rowKey = 'id', extra, expandable}) {
    const [rows, setRows] = useState([])
    const [page, setPage] = useState({current: 1, size: 10, total: null})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetch = useCallback(async (current = page.current, size = page.size) => {
        setLoading(true)
        setError(null)
        try {
            const res = await load(current, size)
            if (Array.isArray(res)) {
                setRows(res || [])
                setPage({current, size, total: res.length})
            } else {
                const records = res?.records || []
                setRows(records)
                setPage({current, size, total: res?.total == null ? null : Number(res.total)})
            }
        } catch (e) {
            setRows([])
            setError(e)
        } finally {
            setLoading(false)
        }
    }, [load, page.current, page.size])

    useEffect(() => {
        fetch(1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const totalKnown = page.total != null && page.total > 0
    return (
        <div>
            <PageHeader title={title} subtitle={description}/>
            <Card
                extra={
                    <Button icon={<ReloadOutlined/>} loading={loading}
                            onClick={() => fetch(page.current, page.size)}>刷新</Button>
                }
            >
                {extra}
                {error ? (
                    <ErrorState error={error} onRetry={() => fetch(page.current, page.size)} type="inline"/>
                ) : (
                    <Table
                        size="small"
                        columns={columns}
                        dataSource={rows}
                        loading={loading}
                        rowKey={(r) => r?.[rowKey] ?? r?.key ?? JSON.stringify(r).slice(0, 32)}
                        pagination={{
                            current: page.current,
                            pageSize: page.size,
                            total: totalKnown ? page.total : rows.length,
                            showSizeChanger: true,
                            // §2 强制规则 2：分页必须凑齐 pageSize + showSizeChanger
                            // + pageSizeOptions + showTotal 四件套。只给 showSizeChanger
                            // 而不给 pageSizeOptions，antd 会用默认的 ['10','20','50','100']
                            // 之外的行为渲染（实际 antd 默认也是这组，但那是**默认值**不是
                            // **声明值**）—— 规范要的是声明，不是碰巧对。
                            // 少这一项时，全库尺子（lead 008 §2 元素级普查）会把本页判成
                            // 「分页参数不全」⇒ 8 个仓的 PagedTable 拷贝全部误红。
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: () =>
                                totalKnown
                                    ? PAGED_TOTAL_TEXT.known(page.total)
                                    : PAGED_TOTAL_TEXT.unknown(rows.length),
                        }}
                        onChange={(p) => fetch(p.current, p.pageSize)}
                        expandable={expandable}
                        locale={{emptyText: <EmptyState title="暂无数据" description="接口返回空列表"/>}}
                    />
                )}
            </Card>
        </div>
    )
}
