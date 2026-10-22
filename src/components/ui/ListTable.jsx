import {Card, Table} from 'antd'
import EmptyState from './EmptyState'
import SearchInput from './SearchInput'
import useListFilter from './useListFilter'

/**
 * ListTable —— 列表页的标准形态（lead 008 §2 强制规则 2/3/4 的成品件）。
 *
 * 为什么要有这个组件：
 *   §2 要求每个 `<Table>` 渲染的列表页都必须凑齐三件套 ——
 *     规则 2 分页（`pageSize` + `showSizeChanger` + `pageSizeOptions` + `showTotal`）
 *     规则 3 查询（Card 的 extra 里一个过滤框，端侧过滤）
 *     规则 4 空态用 `<EmptyState>`，不是 antd 默认空图
 *   逐页手写这三样，分母是全库几百个 Table 元素 ⇒ 漏一处就是一处不一致，
 *   而且每处都要自己决定「按哪个字段过滤」，很容易各写各的。
 *   收进基座后，各仓只需要声明「按哪几个字段过滤」和「空态说什么」。
 *
 * 为什么搜索用基座自己的 SearchInput 而不是 antd 的 `Input.Search`：
 *   两者都是 300ms 防抖 + allowClear，但 SearchInput 是基座实现，Esc 立即清空、
 *   Enter 立即出结果，全仓口径一致；各仓不用再各自决定用哪个。
 *
 * 透传约定：
 *   - `cardProps` → 传给外层 `<Card>`（如 `style` / `size` / `title`）
 *   - `tableProps` → 传给内层 `<Table>`（如 `scroll` / `columns` 之外的表级属性）
 *   - 其余 props → 直接给 `<Table>`（与 antd 一致）
 *   - `pagination={false}` 仍然允许显式传（用于「数据已知 ≤10 行且不变」的豁免场景，
 *     但按 §2 必须在该处注释豁免原因）。
 */
export const DEFAULT_PAGINATION = {
    pageSize: 10,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total) => `共 ${total} 条`,
}

export default function ListTable({
                                  rows,
                                  columns,
                                  rowKey,
                                  loading,
                                  searchKeys,
                                  searchPlaceholder = '过滤',
                                  searchWidth = 220,
                                  cardTitle,
                                  cardExtra,
                                  emptyTitle = '暂无数据',
                                  emptyDescription,
                                  emptyActionText,
                                  emptyOnAction,
                                  pagination = DEFAULT_PAGINATION,
                                  cardProps = {},
                                  tableProps = {},
                                  ...rest
                              }) {
    const {keyword, setKeyword, filtered} = useListFilter(rows, searchKeys)

    // searchKeys 为空 ⇒ 不渲染搜索框（过滤也是空操作）
    const search = searchKeys
        ? (
            <SearchInput
                allowClear
                width={searchWidth}
                placeholder={searchPlaceholder}
                value={keyword}
                onChange={setKeyword}
            />
        )
        : null

    return (
        <Card title={cardTitle} extra={search || cardExtra} {...cardProps}>
            <Table
                rowKey={rowKey}
                columns={columns}
                dataSource={filtered}
                loading={loading}
                size="small"
                pagination={pagination}
                locale={{
                    emptyText: (
                        <EmptyState
                            title={emptyTitle}
                            description={emptyDescription}
                            actionText={emptyActionText}
                            onAction={emptyOnAction}
                        />
                    ),
                }}
                {...tableProps}
                {...rest}
            />
        </Card>
    )
}
