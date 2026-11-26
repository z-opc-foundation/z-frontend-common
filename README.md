# z-frontend-common

> z-opc-foundation 全仓共享前端基座 —— lead 008《前端开发规范》§1-§16 的唯一承载仓。

工作区内 **46** 个 `*-suit` 工程通过同一份 AppLayout / LoginPage 获得一致的
左菜单架子、登录流程与右上角用户组件；**40** 个 `*-component` 工程声明依赖本包
（其中 **39** 个在源码里真的 import）。
消费方更新依赖或使用工作区源码别名后，才能获得本仓的最新改动。

---

## 基本信息

| 字段 | 值 |
|------|-----|
| 仓 | `z-opc-foundation/z-frontend-common`（本仓） |
| npm 包 | `@yuku123/z-frontend-common`（scope 沿用 yuku123，与 0.1.x/0.2.x 旧线连续） |
| 当前版本 | `1.6.1`（`package.json` 现读） —— 1.0 语义：§1-§16 规范化起点；1.1.x 在其上追加扁平 ui 组件桶；1.2.0 追加 `./code` 代码编辑器子路径（ZCodeEditor + 自研 g4 语法桥）；1.3.0 追加 §17 统一侧栏件（MenuTree + SidebarShell）；1.3.1 给 SidebarShell 补纯文字 title 槽；1.4.0 追加 §17 对话过程时间线件（ProcessTimeline）；1.5.0 追加 §26「认知范式」块级结构件（`./blocks` 子路径 + `./blocks.css`）；1.6.0 把 design token 整体换成认知范本 token 集（主色 #0052d9 / 圆角阶梯 / 页面级零阴影），并由 `AppLayout` 直接把该主题注入 antd；1.6.1 补齐浮层/输入圆角、贴边主区与无卡片空态。0.1.x 是 pre-§16 形态；0.2.x 内嵌 react-dom 已废弃 |
| 技术栈 | React 19 + antd 6 + react-router-dom 7 + Vite 6（lead 005 §3.0 版本线单一尺子） |
| 产物 | ESM **5 入口**（`formats: ['es']`）：`dist/index.js`（主桶）+ `dist/ui.js`（扁平 ui 桶）+ `dist/ui-echarts.js`（`ui/echarts` 子路径）+ `dist/code.js`（`./code` 代码编辑器子路径，CodeMirror 6 + 自研 g4 语法桥全量打入）+ `dist/blocks.js`（`./blocks` 块级结构件子路径） |
| 打包策略 | external 精确 **9** 个包 + **1** 条前缀规则（`echarts/*`）：react / react-dom / react-dom/client / react/jsx-runtime / react-router-dom / antd / @ant-design/icons / axios / echarts |
| axios | 声明在 `dependencies`（由消费方安装，`_shared/` vendoring 时期的决策保留：避免消费方从无 node_modules 的目录解析 axios）；bundle 侧 external，不打进产物 |

## 对外 API（0.1.1 契约完全兼容 + 两处升级 + 一处新增；1.1.x 追加扁平 ui 桶）

| 导出 | 说明 |
|------|------|
| `AppLayout` | **升级**：认知风格 `MenuTree` + `SidebarShell`，分组与递归菜单、最长路由前缀选中、独立折叠把手及状态持久化；顶部展示品牌、版本提示及用户菜单；`loginPath` 按菜单内 `/home` 路径推导，可显式覆盖 |
| `LoginPage` | **升级**：`mockAuth` 双模式 —— 传 `{username, password, user}` 走纯前端校验（CTC/SSO 接入前短期形态）；缺省走 `loginApi` 真实端点 |
| `EmptyState` | **已实装**：`src/components/ui/EmptyState.jsx`（44×44 触控目标、默认标题「暂无数据」、可选 action 按钮），由扁平 ui 桶导出 |
| `StatusTag` / `defaultStatusMap` | 0.1.1 契约原样保留 |
| `ErrorBoundary` | 0.1.1 契约原样保留（antd Result 形态重绘） |
| `createRequest(options)` | axios 实例工厂：`{baseURL='/api', timeout=10000, tokenKey='token', userInfoKey='userInfo', unauthorizedRedirect='/login'}`；40 个 `*-component` 工程声明依赖本包 |
| `request` / `authRequest` | 预建实例（`createRequest()` 双份，0.1.1 契约） |
| `setupInterceptors` | 拦截器装配（Bearer token 注入 + 401 清凭跳登录 + 响应解包） |
| `unwrapResponse` | **新增显式导出**：`{code, data}` 包装解包 / 裸数据透传（z-opc Spring MVC 统一返回体兼容） |
| `ui` 扁平桶（`export *`） | **1.1.x 追加**：19 个 UI 组件文件导出 **22** 个具名（`TableToolbar` 同时导出 `RefreshButton`；`useListFilter` 同时导出纯函数 `filterRows`）+ **10** 个 design token（`brand` / `palette` / `neutral` / `radius` / `shadow` / `lift` / `space` / `fontSize` / `cssVars` / `antdTheme`）= **32** 个具名导出 |
| `EChartsChart` | 走子路径 `@yuku123/z-frontend-common/ui/echarts`（不进扁平桶：让不画图的域解析 `echarts/core` 会构建失败） |
| `blocks`（1.5.0，走子路径 `@yuku123/z-frontend-common/blocks`） | **认知范式**块级结构件（lead 008 §26，范本源 = z-cognition-portal 的 `doc/ui-style-guide.md` + `src/styles/global.css`）：`Panel` / `PanelHead` / `PanelTitle` / `PanelHint` / `PanelActions` / `PanelBody` / `PanelFoot` / `BlockRow` / `Bleed` / `SplitLayout` + `clampSplitWidth`。三条核心口径 = **贴边**（`Bleed` 反向外扩一个 `--zfc-page-x`）/ **共边**（`BlockRow` 零间隙 + 后块叠 1px、直角无阴影）/ **页面级零阴影**（阴影只属浮层）。样式在 `@yuku123/z-frontend-common/blocks.css`（宿主入口 import 一次），`:root` 里是**认知范本 token 集**（`--zfc-primary` #0052d9 / `--zfc-line` #e2e4e8 / `--zfc-radius-sm` 8px / `--zfc-surface-2` #f3f3f3 …），域仓覆写同名 `--zfc-*` 即可换肤 |
| `cssVars`（1.6.0，ui 桶导出） | design token 的 **CSS 镜像**：`{'--zfc-primary': '#0052d9', …}`，与 `blocks.css` 的 `:root` 一一对应（`test/tokens.test.mjs` 双向比对，两份真源不许漂移），供需要把 token 值写进 JS 侧计算的域仓使用 |
| `mergeTheme`（1.6.0，顶层导出） | 宿主把自己的 antd 主题并进基座认知主题：`mergeTheme(override)` —— token 深合并、component 按组件整体替换；`AppLayout` 的 `theme` prop 走的就是它 |
| `ProcessTimeline`（1.4.0） | **对话过程时间线**（Codex 风格，2026-11-24 CEO 截图范本）：`{groups: [{key, label, status?, defaultOpen?, steps: [{key, label, status?, badge?, preview?, detail?, detailOpen?}]}]}`。组头 = 圆角方块 chevron + 灰字标签；展开后是竖线轨道上的步骤链（`✓` 完成 / `○` 进行中 / `✗` 失败）+ 参数徽章 + 流式预览 + 可折叠详情面板。组件只管长相，业务语义（什么归哪组）由宿主解析 |
| `ZCodeEditor`（1.2.0，走子路径 `@yuku123/z-frontend-common/code`） | 代码编辑器（CodeMirror 6 壳 + 语言注册表 + 自研 ANTLR(g4) 桥）：`{value, onChange, language, height, readOnly, placeholder, dark}` 受控组件；内置 sql/json/xml/yaml/java/javascript/groovy/lua/shell/properties/toml 与 **sql-antlr / json-antlr**（自研 g4 生成物：SQL 词法高亮 + JSON 全量语法探测）；`registerLanguage` / `getLanguage` / `DSL_TYPE_LANGUAGE` / `antlrHighlight` / `antlrLinter` 同路径导出。codemirror 全家 + antlr4 全量打进本子路径产物，不进扁平桶 |
| `default`（桶） | `{AppLayout, StatusTag, defaultStatusMap, LoginPage, ErrorBoundary, request, authRequest, createRequest}` —— 0.1.1 形状原样，**8** 个成员 |

## AppLayout props

```jsx
<AppLayout
    menuItems={menuConfig}        // antd Menu items，每项必须带 icon（§10）
    appTitle="z-vector"           // sider 展开态文字
    appShort="ZV"                 // 无 appIcon 时折叠态缩写
    appVersion="1.0.5"            // §12：展开态渲染 z-vector@1.0.5（不要 "v" 前缀）
    appIcon={{icon, color, label}} // §1：折叠态 36×36 圆角色板 + Tooltip
    appUser={{name, role}}        // §16：右上角 Avatar+name+DownOutlined 下拉
    loginPath="/z-vector/login"   // 可选，缺省按菜单中的 /home 路径推导
    tokenKey="token"             // 与 createRequest 使用同一登录凭据键
    userInfoKey="userInfo"       // 与登录页使用同一用户信息键
    headerExtra={<.../>}          // Header 右侧追加内容（版本号别放这，§12）
    loading={false}               // 菜单区 loading 占位
/>
```

## suit 接入模板（lead 008 §16）

```jsx
import { AppLayout, LoginPage, ErrorBoundary } from '@yuku123/z-frontend-common'
import { menuConfig, routes, appMeta } from '@yuku123/<repo>-component/pages'

const MOCK_AUTH = { username: 'admin', password: '123456', user: { name: 'admin', role: '管理员' } }

// <Route path="/<repo>/login" element={<LoginPage title="<repo> 管理台" mockAuth={MOCK_AUTH} redirectUrl="/<repo>/home" />} />
// <Route element={<ProtectedShell/>}> 内挂 <AppLayout menuItems={menuConfig} appTitle={appMeta.title} appVersion="…" appUser={user} />
```

完整模板见 lead 008 §16；出厂自检清单见 §9。

## 文档目录

本项目文档统一收口在 `_doc/` 下（八类固定编号表，桶按需存在）:

- [`_doc/001_arch/`](_doc/001_arch/) — 架构、接口、DB schema、协议、路线图

## 历史

- `1.2.0`：新增 `./code` 代码编辑器子路径 —— `ZCodeEditor`（CodeMirror 6 壳）+ 语言注册表 + `defineAntlrLanguage` 式自研 g4 桥（antlr.js：ANTLR4 JavaScript target 生成物直接驱动「token 流高亮」与「parser 语法探测」，不依赖 Monarch/Lezer）。首批自研语法来自 z-util：SQLLexer（z-util-expr-sql，注释改 HIDDEN 通道的包内副本，grammars/ 留源）出 sql-antlr；JsonLexer+JsonParser（z-util-parser-json）出 json-antlr 全量语法探测。codemirror 全家 + antlr4 为本包 dependencies、全量打入本子路径产物，消费方零额外声明
- `0.1.0 – 0.1.6`：早期形态（pre-§16），源码曾位于 `yuku123/z-opc` 仓的 `z-frontend-common/` 子目录
- `0.2.x`：内嵌 react-dom 的失败尝试线，已废弃
- 应急过渡：`z-opc-foundation/_shared/z-frontend-common-local/` vendoring（不入 git，1.0.0 发版后退役）
- `1.0.0`：独立仓首版 —— 源码自 vendoring 迁入，API 契约兼容 0.1.1，AppLayout/LoginPage 升级 §1-§16 规范版
- `1.1.1`：在 1.0.0 之上追加扁平 ui 组件桶（13 个 UI 组件 + design token）与 `ui/echarts` 子路径
- `1.1.2`：ui 桶追加 `ComponentDoc`（§7 组件文档页：240px TOC + 正文两栏、滚动联动、锚点跳转、自带零依赖 markdown 引擎，宿主可注册 react-markdown 三件套升级为 GFM + Prism 高亮）
- `1.1.4`：ui 桶的 `ListTable` 支持 `cardExtra`（Card 动作按钮）与 `searchKeys`（过滤框）**并排**渲染 —— 原实现二选一，会把其中一个静默吞掉（页面同时有「搜索」和「新增」按钮时按钮消失）。
- `1.1.6`：`PageHeader` 补两件基座该有的事 —— ① **面包屑项支持 `onClick`**（原先只支持 `href`，而有些页面的上一级不是一条路由，是「回到列表 / 关抽屉 / 切筛选条件」这类动作，`href` 表达不了；这条能力原先只活在 z-wf 仓内那份 PageHeader 拷贝里，并进基座后那份拷贝就能删）；② **没有 Router 上下文时不再抛异常**（`useNavigate` 在 Router 外会抛 invariant，PageHeader 之前没有像 `ComponentDoc` 那样先探上下文 ⇒ 单独渲染它时报的是一句与真实病因毫不相干的错）。同版新增 `test/page-header.test.mjs`（6 例，含变异必须真红）。
- `1.1.5`：`PagedTable`（**服务端分页**变体）补上 `pageSizeOptions` —— §2 强制规则 2 要求分页凑齐 `pageSize` + `showSizeChanger` + `pageSizeOptions` + `showTotal` 四件套，而 `PagedTable` 的分页参数是内联在组件里的（不走 `DEFAULT_PAGINATION`），此前漏了 `pageSizeOptions` ⇒ 全库 §2 元素级普查把 **8 个仓**的 `PagedTable` 拷贝一起判红（根因是这一处漏项被复制了 8 遍）。同版把 `showTotal` 的两支文案提成纯函数 `PAGED_TOTAL_TEXT` 并加 `test/paged-table.test.mjs`（含变异必须真红）—— antd Table 在空数据时整个分页块不渲染，闭包式文案没法被测到。
- `1.1.3`：ui 桶追加 `useListFilter` / `filterRows`（§2 强制规则 3 的客户端过滤口径统一收在基座：大小写不敏感、多字段「或」匹配、null 字段不参与匹配、空关键字原样返回）与 `ListTable`（§2 规则 2/3/4 的成品件：分页三件套 + Card extra 过滤框 + EmptyState 空态一次到位）

---

<!-- z-opc-foundation-sibling-registry:v1 -->
## 🔗 兄弟仓全景（z-opc-foundation 组织）

本仓隶属于 [z-opc-foundation](https://github.com/orgs/z-opc-foundation/repositories) 组织——一人公司基座的全部自研件（现存 61 仓，含私有仓；口径 2026-11-24 GitHub org API 实读）。

| 仓 | 一句话说明 |
|---|---|
| [z-agent](https://github.com/z-opc-foundation/z-agent) | 云端 Agent 平台的库与 starter——ReAct/Plan 实现 + 注册中心 + REST 网关 + 只读控制面 |
| [z-agent-kernel](https://github.com/z-opc-foundation/z-agent-kernel) | Agent 框架基座——消息/工具/记忆/provider/会话 SPI + 轻量默认实现（纯 POJO 无 Spring） |
| [z-asset](https://github.com/z-opc-foundation/z-asset) | 企业资产台账——实物设备全生命周期 + 域名/证书/许可到期提醒 |
| [z-audit](https://github.com/z-opc-foundation/z-audit) | 审计与合规留痕——事件模型 + 哈希链 + 事件出口 SPI + 留存期策略 |
| [z-biz](https://github.com/z-opc-foundation/z-biz) | 商务外壳域——客户/合同/票据/对账四聚合 |
| [z-biz-erp](https://github.com/z-opc-foundation/z-biz-erp) | 进销存 ERP——商品/客商/采购/销售/库存流水/应收应付核销（z-biz 业务线） |
| [z-biz-security](https://github.com/z-opc-foundation/z-biz-security) | 业务数据安全防护入口——场景化策略注册 + 安全线四段流水线对外编排 |
| [z-boot](https://github.com/z-opc-foundation/z-boot) | Spring Boot Starter 聚合仓 + 版本权威（火车制）——唯一消费入口 z-boot-parent |
| [z-bot](https://github.com/z-opc-foundation/z-bot) | 本地 agent 应用——终端 CLI + HTTP/SSE web 控制台 + 多通道 gateway（飞书/钉钉/webhook） |
| [z-cache](https://github.com/z-opc-foundation/z-cache) | RESP2 协议兼容的分布式内存缓存——Java 8 + Netty，Redis 客户端零修改直连 |
| [z-camuda](https://github.com/z-opc-foundation/z-camuda) | 【已退役·归档】基于 Camunda 的工作流封装层（原 z-wf 改名，与现行 z-wf 无共同历史） |
| [z-cognition](https://github.com/z-opc-foundation/z-cognition) | 业务认知域/认知舱——术语/概念/证据链 + memory/kb/ontology 渐进式模块 |
| [z-config](https://github.com/z-opc-foundation/z-config) | 分布式配置中心 + 服务注册中心（类 Nacos）——Netty 长连接推送 + React 控制台 |
| [z-ctc](https://github.com/z-opc-foundation/z-ctc) | 4A 中心——认证/授权/账户/审计，多租户 JWT + SSO 跨子域 |
| [z-dms](https://github.com/z-opc-foundation/z-dms) | 数据源管控底座——统一登记、统一建池、统一探活、变更统一推送 |
| [z-env](https://github.com/z-opc-foundation/z-env) | 本地中间件与基础设施环境——31 个 docker-compose 场景 + make 一键运维 |
| [z-etl](https://github.com/z-opc-foundation/z-etl) | ETL 引擎——DataX 式线性作业 + Flink 式 DAG 流管道（键控状态/水位/窗口） |
| [z-ext](https://github.com/z-opc-foundation/z-ext) | Java 扩展点框架——@ExtPoint/@ExtImpl 运行期选实现，五档侵入方式 |
| [z-frontend-common](https://github.com/z-opc-foundation/z-frontend-common) | 全仓共享前端基座——AppLayout/LoginPage 等前端规范的唯一承载 **（本仓）** |
| [z-frontend-markdown](https://github.com/z-opc-foundation/z-frontend-markdown) | Markdown 通用共享组件包（npm）——MarkdownLiveEditor/NoteMarkdown/MermaidBlock 单一真源 |
| [z-frontend-render](https://github.com/z-opc-foundation/z-frontend-render) | 平台共享前端渲染引擎——后端 schema 是唯一事实源，报表与低代码共用 |
| [z-graph](https://github.com/z-opc-foundation/z-graph) | 独立图数据库——MVCC 版本链存储 + OpenCypher 子集 + Bolt 风格协议 + React 控制台 |
| [z-gw](https://github.com/z-opc-foundation/z-gw) | 自研高性能 API 网关——Netty 手写运行时，Route/Predicate/Filter 模型可嵌 Spring Boot |
| [z-indexer](https://github.com/z-opc-foundation/z-indexer) | 代码索引服务——仓库注册表 + 定时重建索引 + 符号/调用链查询 |
| [z-introduce](https://github.com/z-opc-foundation/z-introduce) | 组织仓库展示站——全仓实测元数据汇总成可搜索静态站点 |
| [z-lc](https://github.com/z-opc-foundation/z-lc) | 低代码平台——DB 驱动通用 CRUD 引擎 + 报表/模型设计框架 |
| [z-llm-agent](https://github.com/z-opc-foundation/z-llm-agent) | CLI Agent 服务化——把本机 CLI agent（CC/Hermes/Qoder 等）暴露成 OpenAI 兼容对话 API |
| [z-llm-gateway](https://github.com/z-opc-foundation/z-llm-gateway) | LLM 网关——OpenAI/Anthropic 双协议面 + 多 vendor 凭据池、限流与 token 记账 |
| [z-llm-msghub](https://github.com/z-opc-foundation/z-llm-msghub) | msgHub 中心消息路由——WebSocket 中心枢纽 + Agent 侧客户端 SDK |
| [z-mask](https://github.com/z-opc-foundation/z-mask) | 脱敏与遮蔽引擎——按敏感命中位置遮蔽，策略即数据 |
| [z-mcp](https://github.com/z-opc-foundation/z-mcp) | MCP 服务端 + 上游聚合网关——Java 8 手写协议层，Spring Boot 自动装配 |
| [z-meta](https://github.com/z-opc-foundation/z-meta) | 元数据管理平台——租户/应用/接口清单登记 + @BizModel 业务模型采集 |
| [z-mill](https://github.com/z-opc-foundation/z-mill) | 资料磨坊——全格式文档转 Markdown/JSON/纯文本/HTML（对标 MinerU） |
| [z-mist](https://github.com/z-opc-foundation/z-mist) | KMS 分布式密钥/秘密管理平台——集中加密存储 + Netty 协议 + starter 嵌入 |
| [z-mq](https://github.com/z-opc-foundation/z-mq) | 自研分布式消息队列——NameServer+Broker+Store，形状对标 RocketMQ、自有 Netty 协议 |
| [z-msg](https://github.com/z-opc-foundation/z-msg) | 多通道消息 + WebSocket 实时下发基础设施——短信/邮件/站内信/Webhook/IM 平台 |
| [z-observer](https://github.com/z-opc-foundation/z-observer) | 可观测性域——指标/日志/链路 + 告警引擎 |
| [z-opc](https://github.com/z-opc-foundation/z-opc) | 一人公司统一后端+统一前端——单 JVM all-in-one 承载协作/Agent/RPA/交易/资产等业务域与自研中间件 |
| [z-opc-foundation-lead](https://github.com/z-opc-foundation/z-opc-foundation-lead) | 组织治理大脑——事实表、强制规范、跨仓工具集、新机器恢复钥匙（本清单权威持有处） |
| [z-opcs](https://github.com/z-opc-foundation/z-opcs) | 任务撮合/服务市场——用户付费发布诉求，持有者接单完成，金额自动瓜分 |
| [z-ops](https://github.com/z-opc-foundation/z-ops) | 个人公司运维平台——部署单元/镜像构建/WebShell/K8s 巡检 + Ops Agent 执行器 |
| [z-oss](https://github.com/z-opc-foundation/z-oss) | 对象存储服务——自持 local 后端 + aliyun/s3 对接层，starter 注入 OssTemplate |
| [z-product](https://github.com/z-opc-foundation/z-product) | 产品设计信息汇总仓（开发域 PM 工件） |
| [z-qa](https://github.com/z-opc-foundation/z-qa) | 步骤式 API 链路测试平台——用例/计划/执行/报告/质量看板（对标 TestRail·MeterSphere） |
| [z-rpa](https://github.com/z-opc-foundation/z-rpa) | RPA 产品皮——应用市场/需求中心（执行归 z-script，触发归 z-schedule） |
| [z-rpc](https://github.com/z-opc-foundation/z-rpc) | Java 8 + Netty RPC 框架——微内核 + SPI 插件化，形状参照 Dubbo/gRPC |
| [z-schedule](https://github.com/z-opc-foundation/z-schedule) | 分布式任务调度中枢（对标 XXL-Job）——选主 + 时间环排期，starter 嵌入宿主 |
| [z-script](https://github.com/z-opc-foundation/z-script) | 多 DSL 脚本平台 + Mock 平台——沙箱执行/版本灰度/可注册 MCP Tool，starter 内嵌 |
| [z-security](https://github.com/z-opc-foundation/z-security) | 数据安全域编排层——场景→策略→识别→脱敏→水印→审计 四段流水线编排 |
| [z-sense](https://github.com/z-opc-foundation/z-sense) | 敏感识别与分类分级引擎——数据安全线底座（规则目录 + 可插拔识别器 + 分类分级） |
| [z-skill](https://github.com/z-opc-foundation/z-skill) | Skill 平台聚合器——归一化各家 Skill 形状，再按各家 API 形状发回 |
| [z-surl](https://github.com/z-opc-foundation/z-surl) | 短网址服务——短码生成/解析/命中统计，starter 一行集成 |
| [z-task](https://github.com/z-opc-foundation/z-task) | 任务协作平台——项目空间/看板/任务卡片（看板范式，对标 Trello·Teambition） |
| [z-team](https://github.com/z-opc-foundation/z-team) | 数字员工协同域——全栈独立仓，自 z-opc 毕业 |
| [z-trade](https://github.com/z-opc-foundation/z-trade) | 交易域独立仓——自 z-opc reactor 迁出 |
| [z-util](https://github.com/z-opc-foundation/z-util) | 底层 Java 工具库——89 个模块 POM，Java 8/17 口径，按需引用按需升级 |
| [z-vector](https://github.com/z-opc-foundation/z-vector) | 自研 Java 向量数据库——嵌入式+可独立部署，ANN+Payload 过滤，兼容 Qdrant REST |
| [z-voice-demo](https://github.com/z-opc-foundation/z-voice-demo) | 语音链路 demo——流式识别→kernel LLM→流式 TTS→可打断 的契约验证实现 |
| [z-watermark](https://github.com/z-opc-foundation/z-watermark) | 水印引擎——显式文字/图片隐写/盲水印，三种技术成对「打+验」 |
| [z-webide](https://github.com/z-opc-foundation/z-webide) | 企业级 WebIDE 后端——Git 仓/共享目录秒变 code-server 实例，全生命周期管理 |
| [z-wf](https://github.com/z-opc-foundation/z-wf) | 自研流程引擎——不依赖 Camunda/Flowable，定义层与运行时全自研 |

**已退役仓**（迁至 [z-trash](https://github.com/z-trash) 组织，archived 只读）：

| 仓 | 说明 |
|---|---|
| [z-agent-proxy](https://github.com/z-trash/z-agent-proxy) | 三方 coding agent 适配代理（Aider/Cursor → kernel Agent SPI），2026-10-26 退役 |
| [z-kb](https://github.com/z-trash/z-kb) | 自研知识库系统（对标 LightRAG/RAGFlow），2026-11 并入 z-cognition 认知舱后退役 |
| [z-ontology](https://github.com/z-trash/z-ontology) | 本体层（TBox/ABox/RDFS 推理），并入 z-cognition 后退役 |

另有 [z-report](https://github.com/z-opc-foundation/z-report)（报表域，2026-10-11 撤销并入 z-lc（远端已删除））。

总清单权威持有处在 [z-opc-foundation-lead](https://github.com/z-opc-foundation/z-opc-foundation-lead) `008_组织规范/005_兄弟仓清单.md`。
