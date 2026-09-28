# 程序员简历，用 Markdown 还是 Word？聊聊我的选择

> 草稿，未发布。基于 marketing/drafts/main.md 重写，从知乎问题切入。

GitHub：https://github.com/kunlong-luo/resume-craft
在线体验：https://kunlong-luo.github.io/resume-craft/

## 先说结论：看你是谁，看你要投哪里

这个问题在知乎被问了很多遍，我的看法是：

- 如果你习惯 Markdown 写文档、写技术博客，用 Markdown 写简历更顺：版本清晰、复制粘贴不乱、表单和源码能联动；
- 如果你需要和 HR 反复用修订模式改，或公司要求特定 .docx 模板，那 Word 更合适；
- 对开发者和技术求职者，真正麻烦的往往不是语法，而是纸张、分页、跨设备字体和 ATS 可读性。

我最近在用的 Resume Craft v2.1.0，就是按第二种思路做的：Markdown 是源，但不用你操心纸张和导出。开源 MIT，无需注册。

## 用 Markdown 写，会遇到哪些实际问题

1. **排版和分页**：多两行就变两页，第一页半空很难看；
2. **纸张和日期**：国内常用 A4 + `2026.09`，美国多用 Letter + `Sep 2026` / `September 2026`，投错会显得外行；
3. **导出**：有些工具导出的 PDF 是图片，机器读不了；
4. **隐私**：简历不想上传到陌生服务器。

## 这个工具是怎么处理的

**写的方式**：表单和 Markdown 同步。改表单，源码变；改源码，预览变。经历顺序可以直接拖，不用剪切整段。还有中英之间自动加空格（`熟练使用React` -> `熟练使用 React`），中文简历会顺眼很多。

**市场适配**：Target Market 可选美国、加拿大、英国、爱尔兰、中国、International。用默认值时会推荐纸张和日期格式，你也可以手动改。A4 / US Letter 的分页边界在预览里直接能看到，还有一键压缩贴合把轻微超页收回来。

**ATS 检查**：先说清楚，不保证通过。它能做的是：粘贴 JD 看关键词缺口；检查联系方式缺失、时间重叠、`react` 写成 `React` 这类细节。PDF 导入用 PDF.js 本地提取，不上传，导入前会告诉你提取质量怎么样。扫描件不支持 OCR，这点要提前说明。

**导出**：分两条。正式投递用 ATS PDF——浏览器打印另存为 PDF，保留可选文本；快速分享才用快速 PDF（图片型）。打印时选对纸张、边距试“无”、去掉页眉页脚。

**存储和分享**：草稿在浏览器 localStorage，没有后端存你的简历，但 localStorage 本身不加密，设备和浏览器账号要保护好。分享有公开链接（持有可读，只发可信人）和密码加密链接（本地 AES-256-GCM，密码不进链接，密码链接分开发）。

## 适合谁试

- 习惯 Markdown 的开发者；
- 要同时准备国内和海外版本的求职者；
- 在意“打开即用、不注册、不上传”的用户。

v2.1.0 记录：https://github.com/kunlong-luo/resume-craft/releases/tag/v2.1.0
反馈：https://github.com/kunlong-luo/resume-craft/discussions

最后想问问大家：你现在用 Markdown 还是 Word 写简历？如果试了这个工具，哪里不好用？是导入、Target Market、ATS 检查，还是导出和预览不一致？欢迎带上系统和浏览器版本说说。
