/**
 * 设计 token —— 认知范本（lead 008 §26，2026-11-25 CEO 裁定全 fleet 换 token）
 *
 * 范本源（唯一真源）：
 *   z-cognition/_frontend/z-cognition-portal/doc/ui-style-guide.md
 *   z-cognition/_frontend/z-cognition-portal/src/styles/global.css
 *
 * 四条口径：
 *   1. 主色认知蓝 #0052d9（hover #003cab / soft #e8f3ff / soft-2 #bcd8ff）
 *   2. 页面级零阴影 —— 阴影只属于浮层（0 14px 34px rgba(15,27,45,.14)）
 *   3. 圆角阶梯（范本 §4）：页面外壳 0 / 页内面板 8 / 按钮 8 / 输入 9 / 标签 5 / 浮层 10
 *   4. 中性色：白底 + #f3f3f3 次级面 + #e2e4e8 发丝线
 *
 * 这些 token 既被 antd ConfigProvider 消费（antdTheme），也被 UI 组件内部引用，
 * 也由 cssVars 镜像到 blocks.css 的 :root（两份真源由 test/tokens.test.mjs 双向比对）。
 */

// ============ 品牌主色 ============
export const brand = {
    primary: '#0052d9',            // 认知蓝
    primaryHover: '#003cab',       // --primary-strong
    primaryActive: '#002a7f',
    primarySoft: '#e8f3ff',        // --primary-soft
    primarySoft2: '#bcd8ff',       // --primary-soft-2
    accent: '#ffc53d',             // --accent
    accentSoft: '#fff6dd',         // --accent-soft
}

// ============ 分类色 ============
// 范本的语义色板（绿/琥珀/红/紫/青 + 主色蓝 + 强调黄），用于分类圆点 / 数据卡 / 状态 chip
// 每个色 = { bg, fg, soft, gradient }
export const palette = {
    pink: {
        bg: '#ec4899',
        fg: '#ffffff',
        soft: '#fce7f3',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    },
    blue: {
        bg: '#0052d9',
        fg: '#ffffff',
        soft: '#e8f3ff',
        gradient: 'linear-gradient(135deg, #0052d9 0%, #003cab 100%)',
    },
    green: {
        bg: '#2ba471',
        fg: '#ffffff',
        soft: '#e6f7ef',
        gradient: 'linear-gradient(135deg, #2ba471 0%, #1f8a5d 100%)',
    },
    orange: {
        bg: '#e37318',
        fg: '#ffffff',
        soft: '#fff1e6',
        gradient: 'linear-gradient(135deg, #e37318 0%, #b8560f 100%)',
    },
    violet: {
        bg: '#7c4dff',
        fg: '#ffffff',
        soft: '#f1edff',
        gradient: 'linear-gradient(135deg, #7c4dff 0%, #5b32d6 100%)',
    },
    cyan: {
        bg: '#0594fa',
        fg: '#ffffff',
        soft: '#e8f7ff',
        gradient: 'linear-gradient(135deg, #0594fa 0%, #0369a1 100%)',
    },
    red: {
        bg: '#d54941',
        fg: '#ffffff',
        soft: '#fdeceb',
        gradient: 'linear-gradient(135deg, #d54941 0%, #b1362f 100%)',
    },
    yellow: {
        bg: '#ffc53d',
        fg: '#172033',
        soft: '#fff6dd',
        gradient: 'linear-gradient(135deg, #ffc53d 0%, #e0a418 100%)',
    },
}

// ============ 中性色 ============
export const neutral = {
    bg: '#ffffff',                 // 页面底色（范本 --bg）
    surface: '#ffffff',            // 卡片表面（范本 --surface）
    surfaceAlt: '#f3f3f3',         // 次级面（范本 --surface-2）
    surfaceSunken: '#f3f3f3',      // 凹陷面（范本 --surface-3）
    border: '#e2e4e8',             // 发丝线（范本 --line）
    borderStrong: '#d3d6dc',       // 强线（范本 --line-strong）
    text: 'rgba(0, 0, 0, 0.9)',    // 主文本（范本 --ink）
    textMuted: 'rgba(0, 0, 0, 0.62)',   // 次文本（范本 --muted）
    textDisabled: 'rgba(0, 0, 0, 0.48)',// 禁用文本（范本 --muted-2）
    sidebar: '#f3f3f3',            // 侧栏底（范本 --sidebar）
    sidebarLine: '#e7e7e7',        // 侧栏线（范本 --sidebar-line）
}

// ============ 圆角（范本 §4 圆角口径）============
export const radius = {
    none: 0,          // 页面外壳 / 整屏容器 / 列表容器
    sm: 5,            // 标签 .tag
    xs: 6,            // 小按钮 .btn.xs
    md: 8,            // 按钮 / 页内独立面板 .panel / 药丸页签
    lg: 8,            // 页内独立面板 .panel
    input: 9,         // 输入 / 搜索 / 租户条
    icon: 9,          // 图标底 / 头像块
    overlay: 10,      // 浮层（下拉 / 气泡 / 菜单）
    pill: 999,
}

// ============ 阴影 ============
// 页面级零阴影：只有浮层有阴影，范本 §10
export const shadow = {
    none: 'none',
    overlay: '0 14px 34px rgba(15, 27, 45, 0.14)',
}

// 悬浮抬升 —— 页面级零阴影口径下恒为 none，hover 反馈靠描边/底色
export const lift = {
    rest: shadow.none,
    hover: shadow.none,
}

// ============ 间距 ============
export const space = {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
}

// ============ 字号梯度 ============
// 范本正文 15px / 行高 1.62
export const fontSize = {
    xs: 12,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
}

// ============ CSS 变量镜像 ============
// 与 src/components/ui/blocks.css 的 :root 一一对应（test/tokens.test.mjs 双向比对）
export const cssVars = {
    '--zfc-bg': neutral.bg,
    '--zfc-surface': neutral.surface,
    '--zfc-surface-2': neutral.surfaceAlt,
    '--zfc-surface-3': neutral.surfaceSunken,
    '--zfc-ink': neutral.text,
    '--zfc-ink-2': 'rgba(0, 0, 0, 0.6)',
    '--zfc-muted': neutral.textMuted,
    '--zfc-muted-2': neutral.textDisabled,
    '--zfc-line': neutral.border,
    '--zfc-line-strong': neutral.borderStrong,
    '--zfc-primary': brand.primary,
    '--zfc-primary-strong': brand.primaryHover,
    '--zfc-primary-soft': brand.primarySoft,
    '--zfc-primary-soft-2': brand.primarySoft2,
    '--zfc-accent': brand.accent,
    '--zfc-accent-soft': brand.accentSoft,
    '--zfc-sidebar': neutral.sidebar,
    '--zfc-sidebar-line': neutral.sidebarLine,
    '--zfc-radius': `${radius.overlay}px`,
    '--zfc-radius-sm': `${radius.md}px`,
    '--zfc-page-x': '24px',
    '--zfc-sidebar-w': '260px',
    '--zfc-app-footer-h': '32px',
    '--zfc-overlay-shadow': shadow.overlay,
}

// ============ antd theme token (给 ConfigProvider 消费) ============
export const antdTheme = {
    token: {
        // 主色
        colorPrimary: brand.primary,
        colorPrimaryHover: brand.primaryHover,
        colorPrimaryActive: brand.primaryActive,
        colorPrimaryBg: brand.primarySoft,
        colorPrimaryBorder: brand.primarySoft2,
        colorInfo: brand.primary,
        colorSuccess: palette.green.bg,
        colorWarning: palette.orange.bg,
        colorError: palette.red.bg,

        // 链接
        colorLink: brand.primary,
        colorLinkHover: brand.primaryHover,
        colorLinkActive: brand.primaryActive,

        // 文本
        colorText: neutral.text,
        colorTextSecondary: neutral.textMuted,
        colorTextTertiary: neutral.textDisabled,
        colorTextQuaternary: 'rgba(0, 0, 0, 0.34)',

        // 背景：白底 + 发丝线分块，不用灰底浮起白卡
        colorBgBase: neutral.surface,
        colorBgLayout: neutral.bg,
        colorBgContainer: neutral.surface,
        colorBgElevated: neutral.surface,
        colorFillAlter: neutral.surfaceAlt,
        colorFillSecondary: neutral.surfaceAlt,
        colorFillTertiary: neutral.surfaceAlt,

        // 边框
        colorBorder: neutral.border,
        colorBorderSecondary: neutral.border,
        colorSplit: neutral.border,

        // 圆角
        borderRadius: radius.md,
        borderRadiusLG: radius.lg,
        borderRadiusSM: radius.sm,

        // 字体
        fontSize: fontSize.base,
        fontFamily:
            '"Inter Variable", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ' +
            '"Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',

        // 控件高度：范本高 34px 控件
        controlHeight: 34,
        controlHeightSM: 28,
        controlHeightLG: 40,

        // 阴影：页面级零阴影，唯一阴影归浮层
        boxShadow: shadow.overlay,
        boxShadowSecondary: shadow.overlay,
        boxShadowTertiary: shadow.none,
    },
    components: {
        // Layout：白顶导 + 浅灰侧栏（范本侧栏不是深色）
        Layout: {
            headerBg: neutral.surface,
            headerHeight: 48,
            headerPadding: '0 24px',
            headerBorderRadius: 0,
            siderBg: neutral.sidebar,
            bodyBg: neutral.bg,
        },
        // Menu：浅色菜单，选中 = 主色字 + 浅蓝底，不用左侧竖条
        Menu: {
            itemBg: 'transparent',
            subMenuItemBg: 'transparent',
            itemColor: neutral.textMuted,
            itemHoverColor: neutral.text,
            itemHoverBg: 'rgba(0, 82, 217, 0.06)',
            itemSelectedBg: brand.primarySoft,
            itemSelectedColor: brand.primaryHover,
            titleColor: neutral.textMuted,
            itemBorderRadius: radius.md,
            itemMarginInline: 4,
            iconSize: 14,
            activeBarWidth: 0,
        },
        // Card：1px 描边 + 8px 圆角 + 页面级零阴影
        Card: {
            borderRadiusLG: radius.lg,
            boxShadowTertiary: shadow.none,
            headerBg: 'transparent',
            headerFontSize: fontSize.base,
            headerHeight: 52,
            bodyPadding: '16px',
            colorBorderSecondary: neutral.border,
        },
        // Button：统一 8px 圆角，无阴影
        Button: {
            borderRadius: radius.md,
            fontWeight: 500,
            primaryShadow: shadow.none,
            defaultShadow: shadow.none,
            defaultBg: neutral.surface,
            defaultBorderColor: neutral.borderStrong,
            defaultHoverBorderColor: brand.primarySoft2,
            defaultHoverColor: brand.primary,
        },
        // Table：白底表头 + 发丝线
        Table: {
            headerBg: neutral.surface,
            headerColor: neutral.textMuted,
            headerSplitColor: neutral.border,
            borderColor: neutral.border,
            rowHoverBg: neutral.surfaceAlt,
            headerBorderRadius: 0,
        },
        // Tabs：主色下划线
        Tabs: {
            itemSelectedColor: brand.primary,
            inkBarColor: brand.primary,
            titleFontSize: fontSize.base,
            horizontalItemGutter: 24,
        },
        // Modal / Drawer：浮层圆角 10 / 侧抽屉直角
        Modal: {
            borderRadiusLG: radius.overlay,
        },
        Drawer: {
            borderRadiusLG: 0,
        },
        // Tag：小圆角
        Tag: {
            borderRadiusSM: radius.sm,
        },
        // 输入类
        Input: {
            activeShadow: '0 0 0 2px rgba(0, 82, 217, 0.1)',
        },
        Select: {
            optionSelectedBg: brand.primarySoft,
        },
        // 分段控件：浅灰轨道 + 白块选中（不用深色块）
        Segmented: {
            itemSelectedBg: neutral.surface,
            itemSelectedColor: brand.primary,
            itemColor: neutral.textMuted,
            trackBg: neutral.surfaceAlt,
        },
        Form: {
            labelColor: neutral.textMuted,
        },
    },
}
