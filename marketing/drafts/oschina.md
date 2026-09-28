# 开源项目介绍：Resume Craft v2.1.0，本地优先的 Markdown 简历编辑器

GitHub：https://github.com/kunlong-luo/resume-craft
在线体验：https://kunlong-luo.github.io/resume-craft/
v2.1.0 Release：https://github.com/kunlong-luo/resume-craft/releases/tag/v2.1.0
反馈：https://github.com/kunlong-luo/resume-craft/discussions

## 项目是什么

Resume Craft 是一个本地优先的 Markdown 简历编辑器，支持 A4 / US Letter 实时预览、ATS 检查、国际求职市场适配、PDF 导出和可选加密分享。

许可证 MIT，正常编辑无需注册，打开页面就能写。PWA 可安装，离线也能编辑。

## 解决什么问题

- Word 调对齐分页耗时，换设备易变样；
- 简历多两行变“1.1 页”；
- 海外投递分不清 A4 / Letter 和日期格式；
- 简历文件不想上传到陌生服务器。

做法是：Markdown 做源，表单同步改，纸张做基准，浏览器做导出，全程本地完成。

## v2.1.0 有什么

- Target Market：美国、加拿大、英国、爱尔兰、中国、International，默认值联动推荐纸张日期，可手动覆盖；
- A4 / US Letter 的预览、打印和导出按当前纸张设置工作，并显示对应分页边界；
- 多种日期样式 `2026.09` / `Sep 2026` / `September 2026`，中英模板和诊断全适配；
- 公开分享与密码分享的安全边界说明更明确，匿名运行时错误信号不带用户数据；
- 1200x630 社交预览卡，CI 分质量、Chromium E2E、跨浏览器 E2E 多门禁。

## 怎么试用

1. 打开在线体验，不用登录；
2. 粘贴旧简历或导入带文本层 PDF（本地 PDF.js 提取，不上传）；
3. 选 Target Market，确认纸张日期；
4. 跑 ATS 检查（关键词+格式，仅参考，不保证通过）；
5. 用 ATS PDF 浏览器打印导出，检查文字可选。

快速 PDF 是图片型备用，不适合 ATS 投递。扫描件暂无 OCR，加密或无文本层 PDF 请用文本粘贴。

## 存储与隐私边界

草稿主要保存在浏览器 localStorage，非加密，项目本身没有用于保存简历内容的应用后端。字体使用系统栈，不加载第三方字体 CDN。统计在应用侧只发送固定匿名事件名，并尊重 DNT。

分享：公开链接放 URL fragment，持有可读，只发可信人；密码链接本地 AES-256-GCM 加密，密码不进链接，密码链接分开发。

## 开源与参与

MIT，可个人团队商用改用。提 Bug 和建议先看 CONTRIBUTING、行为准则、SECURITY（漏洞私密报，别贴真实简历和密码）。

如果你试了，欢迎说说哪里不好用：导入、市场预设、ATS、导出一致性，哪块最卡？带上系统浏览器版本发 Discussions。
