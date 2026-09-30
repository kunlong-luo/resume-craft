# React + Markdown 简历编辑器实战：PDF 导入、ATS 检查、A4/Letter 与导出

这篇不只介绍 Resume Craft，也把一条完整使用路径走一遍：

**旧简历 → 本地导入 → Markdown / 表单编辑 → Target Market → ATS 检查 → PDF 导出。**

在线体验：https://kunlong-luo.github.io/resume-craft/  
GitHub：https://github.com/kunlong-luo/resume-craft

项目采用 React + TypeScript + Vite + Tailwind CSS + Zustand，Markdown 使用 react-markdown + remark-gfm，PDF 导入使用 pdfjs-dist，导出保留浏览器打印和 html2canvas-pro + jsPDF 两条路径。

## 1. 先准备一份旧简历

可以使用：

- 带文本层的 PDF；
- TXT；
- 直接粘贴纯文本。

正常编辑不需要注册，草稿主要保存在浏览器 localStorage。

### PDF 导入

1. 打开在线体验；
2. 选择 PDF 导入；
3. 工具在浏览器本地使用 PDF.js 提取文本；
4. 查看提取质量、邮箱/电话和章节识别情况；
5. 确认后继续整理成可编辑内容。

当前限制：

- 扫描件 / 图片型 PDF 暂不支持 OCR；
- 加密 PDF 暂不支持直接导入；
- 没有可用文本层时，建议改用纯文本。

## 2. 编辑：表单和 Markdown 共用同一份状态

编辑区可以在表单、Markdown 源码和板块排序之间切换，修改后预览同步更新。

常用操作包括：

- 拖拽调整经历和技能顺序；
- 整体调整二级标题板块；
- 中英文混排格式清理；
- 克隆多个 Profile，为不同岗位维护不同版本；
- 使用 Diff 对比两个版本的内容差异。

例如：

`熟练使用React开发`

可以通过格式清理变成：

`熟练使用 React 开发`

## 3. Target Market：先处理纸张和日期默认值

v2.1.0 支持：

- 美国
- 加拿大
- 英国
- 爱尔兰
- 中国
- International

当纸张和日期仍然是默认值时，切换市场会提供相应推荐。

纸张支持：

- A4
- US Letter

日期支持：

- `2026.09`
- `Sep 2026`
- `September 2026`

如果你已经手动调整，市场切换不会强行覆盖。

预览会按当前纸张显示分页边界；内容只有轻微溢出时，可以尝试“一键压缩贴合”微调边距、行高和段距。

## 4. ATS 检查：看可解释信号，不看“神秘分数”

目前主要检查：

1. JD 关键词覆盖和缺口；
2. 联系方式是否缺失；
3. 经历时间是否有明显冲突；
4. React / Node.js 等技术名词大小写；
5. PDF 文本提取质量。

这些结果只作为辅助参考，不代表任何具体 ATS 的真实评分或通过结果。

## 5. 正式投递和快速分享，要用不同 PDF

### ATS PDF

推荐正式投递使用。

1. 点击 ATS PDF，或 Ctrl/Cmd + P；
2. 选择“另存为 PDF”；
3. 纸张选择和简历设置一致的 A4 / Letter；
4. 边距可以先试“无”；
5. 关闭页眉页脚；
6. 导出后测试文字能否选择和搜索。

### 快速 PDF

使用 html2canvas-pro + jsPDF 生成图片型 PDF。

它适合：

- 快速预览；
- 临时分享；
- 浏览器打印受限时兜底。

但因为内容被光栅化，不建议作为 ATS 投递首选。

## 6. 分享和隐私边界

草稿主要位于 localStorage，它本身不是加密存储。

分享链接分两种：

- 公开链接：载荷位于 URL fragment，拿到完整链接的人可以读取；
- 密码链接：浏览器本地使用 AES-256-GCM 加密，密码不进入链接。

项目本身没有用于保存简历内容的应用后端。

## 7. 一个实际测试流程

如果你想判断它是否适合自己，可以只花几分钟：

1. 导入一份旧简历；
2. 切换一次 Target Market；
3. 修改一段经历；
4. 跑一次 ATS 检查；
5. 导出 ATS PDF；
6. 对比预览和最终 PDF。

如果第 6 步差异明显，或者前面任何一步让你觉得流程绕，欢迎直接反馈。

v2.1.0：https://github.com/kunlong-luo/resume-craft/releases/tag/v2.1.0  
反馈：https://github.com/kunlong-luo/resume-craft/discussions
