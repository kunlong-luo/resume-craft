# Resume Craft 2.1.0 发布：本地优先的 Markdown 简历编辑器，支持 A4/Letter 与国际市场

Resume Craft 是一个开源、本地优先的 Markdown 简历编辑器。

v2.1.0 重点补齐了国际求职场景：Target Market、A4 / US Letter、日期格式、本地 PDF 导入、ATS 辅助检查和分享安全边界。

GitHub：https://github.com/kunlong-luo/resume-craft  
在线体验：https://kunlong-luo.github.io/resume-craft/

## 核心特点

- Markdown 和结构化表单共享同一份简历状态；
- A4 / US Letter 实时预览；
- 美国、加拿大、英国、爱尔兰、中国、International 市场预设；
- JD 关键词与基础 ATS 可读性检查；
- PDF / 文本本地导入；
- 浏览器打印 ATS PDF + Quick PDF 双路径；
- PWA；
- 公开分享与可选密码加密分享；
- MIT License；
- 正常编辑无需注册。

## 为什么做这个项目

开发者写简历经常遇到一个矛盾：

Markdown 编辑效率高，但纸张和 PDF 不好处理；Word 有成熟的纸张能力，却容易把时间花在格式上。

Resume Craft 的思路是：

> 内容继续用 Markdown 管，纸张、分页、检查和导出交给浏览器工具链。

## v2.1.0 的主要变化

### Target Market

支持：

- US
- Canada
- UK
- Ireland
- China
- International

市场设置会在用户仍使用默认值时推荐纸张和日期格式，手动设置不会被强行覆盖。

### A4 / US Letter

预览、打印和导出都按照当前纸张设置工作，并显示对应分页边界。

### 日期本地化

支持：

- `2026.09`
- `Sep 2026`
- `September 2026`

### ATS 与 PDF

ATS 功能提供 JD 关键词覆盖、联系方式、时间线和技术词汇规范等提示。

它不是某个 ATS 厂商的评分，也不承诺通过。

正式投递推荐浏览器打印生成的 ATS PDF；Quick PDF 是图片型备用路径。

### 本地导入

带文本层 PDF 使用 PDF.js 在浏览器本地提取，不上传应用后端。

扫描件 / 纯图片 PDF 暂无 OCR。

## 本地优先与隐私

草稿主要存储于 localStorage。

项目本身没有用于保存简历内容的应用后端，但 localStorage 也不是加密存储，因此设备和浏览器账号本身仍然需要保护。

分享链接分两种：

- 公开链接：拿到完整链接即可读取；
- 密码保护链接：浏览器本地 AES-256-GCM 加密，密码不进入链接。

## 如何快速体验

1. 打开在线 Demo；
2. 导入一份旧简历或粘贴 Markdown；
3. 切换 Target Market；
4. 跑一次 ATS 检查；
5. 导出 ATS PDF；
6. 对比最终 PDF 与预览。

项目地址：https://github.com/kunlong-luo/resume-craft  
v2.1.0：https://github.com/kunlong-luo/resume-craft/releases/tag/v2.1.0

如果你实际用过，欢迎反馈具体卡点。比起“再加一个功能”，我目前更关心哪一步真的让用户觉得麻烦。
