# Local-first 简历编辑器的工程取舍：状态同步、纸张布局、PDF 与加密分享

Resume Craft v2.1.0 是一个浏览器端的 Markdown 简历编辑器。

这个项目最有意思的地方不是模板，而是几个互相牵制的工程约束：

1. 核心简历数据尽量留在本地；
2. Markdown 和表单不能互相打架；
3. A4 / US Letter 需要进入布局模型；
4. PDF 必须区分“可选文本”和“光栅化”；
5. ATS 相关功能只能输出可解释信号。

在线体验：https://kunlong-luo.github.io/resume-craft/  
GitHub：https://github.com/kunlong-luo/resume-craft

## 1. 状态同步：Markdown 与表单共用一个事实源

编辑区可以在表单、Markdown 源码和板块排序之间切换，旁边预览实时更新。

设计重点不是“两个编辑器同时存在”，而是避免出现两个版本的事实源。

在此基础上，Profile Matrix 和 Diff 用于维护多个岗位版本。

这种方案比单向“表单生成 Markdown”复杂，但对经常调整技术简历的人更可控。

## 2. 纸张进入状态，而不是只存在于 CSS

项目支持 A4 和 US Letter。

纸张设置会影响：

- 预览尺寸；
- 分页边界；
- 打印样式；
- Quick PDF；
- Target Market 默认值。

v2.1.0 支持 US / Canada / UK / Ireland / China / International。

市场切换只在纸张和日期仍为默认值时应用推荐，手动覆盖优先。

这点很重要，否则“智能默认值”很容易变成“偷偷改用户配置”。

## 3. 浏览器排版的一致性只能做到“可控”，做不到绝对

使用系统字体链、不依赖第三方字体 CDN，可以减少一些变量。

但 Windows、macOS、Linux 的字体度量仍然会有差异。

因此当前策略是：

- 纸张尺寸作为基准；
- 预览实时测量；
- 轻微超页用 Auto Fit；
- 最终 PDF 做验收。

Auto Fit 只是对 margin / line-height / block-gap 做级联微调，不试图重新写用户内容。

## 4. 两条 PDF 路径解决的是不同问题

### Browser Print / ATS PDF

目标：尽量保留文本层。

适合正式投递。

### html2canvas + jsPDF

目标：视觉兜底。

适合快速下载、分享或浏览器打印受限场景。

这两种结果并不等价，所以 UI 和文档都明确区分。

## 5. PDF 导入为什么要设上限

PDF 导入使用 pdfjs-dist。

当前会限制文件大小和解析页数，并检查 PDF signature。

提取后再分析：

- 文本量；
- replacement character 比例；
- 邮箱；
- 电话；
- 常见章节。

这里的目标不是“兼容所有 PDF”，而是尽早发现“这个文件不适合自动导入”。

## 6. 分享：公开链接和加密链接必须是两个安全模型

公开分享的数据位于 URL fragment。

好处是 fragment 不会像 query 一样随 HTTP 请求直接发送给托管站点。

但它依然不是加密，所以产品明确把它描述成“持有链接即可读取”。

密码保护分享则使用：

- PBKDF2-SHA-256；
- 310,000 iterations；
- AES-256-GCM；
- 16-byte salt；
- 12-byte IV；
- authenticated additional data；
- 压缩前后尺寸限制。

密码本身不进入 URL。

这部分实现比“前端加个密码框”复杂不少，但至少安全模型是可以解释的。

## 7. Local-first 仍然有边界

localStorage 本身不加密。

另外页面当前仍会在允许条件下加载匿名统计脚本，所以“local-first”应该理解为：

> 核心简历编辑与存储不依赖应用后端，而不是页面完全不发生任何网络请求。

这个边界我觉得比喊“100% offline/private”更重要。

## 8. 可验证性比功能数量更重要

现在我更关注几个实际问题：

- 表单和 Markdown 是否真的不会互相覆盖；
- 市场默认值是否尊重手动修改；
- PDF 文本层是否能保留；
- 分享链接的边界是否清楚；
- 不同浏览器是否出现排版回归。

v2.1.0 之后，下一步也不会以“功能越多越好”为目标，而是看真实使用在哪一步掉得最多。

如果你从工程角度试过，欢迎直接告诉我：**哪一个设计在真实浏览器里最先失效？**

v2.1.0：https://github.com/kunlong-luo/resume-craft/releases/tag/v2.1.0
