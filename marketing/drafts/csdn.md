# Resume Craft v2.1.0 上手教程：从导入到 ATS 检查再到 PDF 导出

> 草稿，未发布。基于 marketing/drafts/main.md 重写，偏教程和功能实践。

GitHub：https://github.com/kunlong-luo/resume-craft
在线体验：https://kunlong-luo.github.io/resume-craft/

## 0. 准备

- 浏览器：Chrome / Edge / Firefox / Safari 等现代浏览器均可，正式投递前建议用同一浏览器验证导出；
- 材料：旧简历 PDF（带文本层最佳）或一段纯文本；
- 注册：不需要。打开即用，草稿保存在浏览器 localStorage（非加密，注意设备安全）；
- 技术栈（了解即可）：React + TypeScript + Vite + Tailwind CSS + Zustand，Markdown 用 react-markdown + remark-gfm，PDF 导入用 pdfjs-dist，导出是浏览器打印 + html2canvas-pro + jsPDF 双路径。

项目开源 MIT，版本记录：https://github.com/kunlong-luo/resume-craft/releases/tag/v2.1.0

## 1. 导入旧简历

1. 打开在线体验，选“导入 PDF”；
2. 选择带文本层的 PDF，工具会在浏览器本地用 PDF.js 提取文字，不上传服务器；
3. 查看提取质量提示：文本完整度、邮箱/电话、章节识别情况；
4. 提取后会自动规整为 Markdown，可继续编辑。

注意：扫描件/纯图片 PDF 暂不支持 OCR；带密码或无文本层的 PDF 请改用 .txt 或直接粘贴。

## 2. 编辑：表单和 Markdown 联动

- 编辑区可在表单和 Markdown 源码之间切换；修改后状态与预览同步；
- 拖拽 Grip 可重排经历和技能顺序，不用剪切粘贴；
- 二级标题板块支持整体上移下移；
- 中英混排点一次“空格优化”：`熟练使用React开发` -> `熟练使用 React 开发`；
- 多岗位准备多份：用 Profile Matrix 克隆（如前端版、全栈版），用 Diff 对比关键词差异。

## 3. 设 Target Market、纸张和日期

v2.1.0 新增 Target Market：美国、加拿大、英国、爱尔兰、中国、International。

1. 先选目标市场；
2. 用默认值时会自动推荐纸张（A4 / US Letter）和日期格式，也可手动覆盖；
3. 日期样式可选 `2026.09`、`Sep 2026`、`September 2026` 等；
4. 预览里确认分页边界；内容稍超页时可点“一键压缩贴合”，让工具自动微调边距、行高和间距，尝试减少轻微溢出。

界面和模板诊断支持中英切换，一键切换 zh/en。

## 4. ATS 检查（辅助参考）

提前说明：不承诺 ATS 通过，只做可读性和匹配度提示。

1. 粘贴目标 JD，看关键词匹配度和短板提示；
2. 看排版自检：联系方式缺失、经历时间重叠、`react`/`node` 大小写规范等；
3. 按提示回 Markdown 改完再查一次。

## 5. 导出 PDF：选对路径

**正式投递用 ATS PDF：**

1. 点顶部 ATS PDF，或 Ctrl/Cmd+P；
2. 目标打印机选“另存为 PDF”；
3. 纸张按简历设置选 A4 或 Letter；
4. 边距先试“无”，页眉页脚取消勾选，需要主题背景再勾“背景图形”；
5. 导出后检查文字是否可选、可搜索。

**快速分享用快速 PDF：**

工具栏快速 PDF 是图片型，适合临时预览，浏览器打印受限时兜底，不适合 ATS 投递。

跨设备字体用系统栈兜底（PingFang SC、Microsoft YaHei 等），仍可能有轻微差异，以最终 PDF 为准。深色模式不影响纸张，纸张保持白底。

## 6. 分享

- 公开链接：载荷在 URL fragment，不进查询参数，持有可读，只发可信人；
- 加密链接：浏览器本地 AES-256-GCM 加密，密码不进链接，密码和链接分两条消息发。

反馈：https://github.com/kunlong-luo/resume-craft/discussions

如果你按这篇教程走完，欢迎说说哪里不好用：导入质量、Target Market 推荐、ATS 提示、还是导出和预览不一致？带上系统、浏览器、纸张设置更方便定位。
