---
name: quiet-observatory-ui
description: >-
  Build restrained, high-density scientific dashboards and data tools with neutral light/dark surfaces, hairline panels, tabular monospace numbers, orange/blue small-multiple charts, compact controls, metric drill-down, and transparent operational states. Use when the user requests a precise research observatory, compact monitoring interface, or this skill; adapt the user's actual product and workflows.
---

# Quiet Observatory UI

把页面做成一台精密、安静、可信的观测仪器。高级感来自信息组织、数据比例和交互一致性。

来源：[Xiaomi MiMo RL](https://mimo.xiaomi.com/rl/)，2026-09-17 实际查看。此 skill 独立编写，不隶属 Xiaomi。无需再次访问原站也能使用。

## 先确定信息，再确定形式

沿用用户的技术栈、真实任务与品牌。先找出：用户正在观察什么对象、需要比较什么指标、哪些状态需要行动、哪些细节需要下钻。把这些内容映射到本风格；不要强塞 RL 术语、虚构费用、无意义时钟或假实时数据。

开始实现前阅读 [references/design-system.md](references/design-system.md)。它包含实测 token、字号、密度和布局规则。实现图表、筛选、详情或动态数据时，再读 [references/interactions.md](references/interactions.md)。需要判断哪些是原站事实时，查 [references/source-observations.md](references/source-observations.md)。

## 不能丢失的视觉骨架

- 中性近黑或白色画布，邻近明度的表面，1px 边框，主要圆角 6px。无大面积渐变、玻璃质感、装饰性发光或悬浮大阴影。
- 紧凑横向导航，当前项用细下划线；首屏直接进入公告、运行状态、关键数据。保持业务需要的内容优先级。
- UI 标签用中性无衬线；指标路径、时间、数值用等宽字体和 tabular numerals。通过 11–14px 标签与约 20px 关键值形成层级，不用巨大标题挤走数据。
- 运行概览是一整条有内部细分隔的状态面板：身份／状态／进度在上，多个指标单元在下。不要拆成一排互不相关的巨大 KPI 卡。
- 图表使用统一尺寸的 small multiples；标题左上、最新值与差值右上、主图区下方。默认细折线、低对比水平网格、少量刻度、清晰的末端点。
- 橙与蓝绑定比较对象，跨卡片、图例、详情保持不变。涨跌箭头表达方向，只有指标语义明确时才表达好坏。
- 复杂度逐层展开：概览 → 分类／过滤 → 指标详情。密集数据和留白并存；没有内容的区域可以保持空白。

## 实现路径

1. 选择与任务匹配的组件：状态条、公告列表、图表网格、目录浏览器、日志＋数据表。不是每页都需要全部组件。
2. 将 [assets/tokens.css](assets/tokens.css) 的变量适配到项目现有主题。先做一个完整状态面板和一个有真实交互的图表，再复制视觉系统。
3. 需要快速起步时，参考 [assets/starter/index.html](assets/starter/index.html)、[assets/starter/app.js](assets/starter/app.js) 与 [assets/starter/style.css](assets/starter/style.css)。它们是原创、无依赖的可运行样例，含明确标记的固定示例数据；不是原站源码，也不是生产数据接入层。
4. 控件必须改变对应数据呈现。不要只改变按钮颜色；不要把说明里的高级功能当作样例已实现的功能。正确处理 loading／empty／error／stale，保留用户筛选和阅读位置。
5. 桌面先建立密度，再检查窄屏：导航仍可用，统计两列，图表单列，工具栏换行，表格仅自身横滚。不要整页缩放。
6. 用 [references/quality-bar.md](references/quality-bar.md) 完成浏览器中的视觉与行为验收。尤其检查布局比例、路径截断、图表可比性、键盘关闭、真实状态和小屏溢出。

## 交付标准

交付用户要求的前端代码与可查看结果，说明真实实现的交互、数据来源和未接入的能力。演示值必须标成示例；生产模式不能冒充 live。不要为应用本 skill 自动创建仓库、部署、安装依赖或改动其他项目；这些操作沿用当前任务的授权。

设计质量是验收目标，不承诺仅靠引用 skill 就自动达到同等质量。通过可运行界面和实际观察完成最后一轮修正。
