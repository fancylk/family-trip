# Family Trip 网站维护约定

本仓库是"山河明月行"亲子旅行网站（纯静态站：index.html + sw.js + 数据 JSON，部署于 /var/www/trip，经 webhook 自动部署，线上 https://trip.taoge.xyz/）。

## 面向 AI 修改者的规则

- 需求来自小朋友"乐乐"的语音转写，可能是添加景点故事、诗词、小游戏、修改页面样式/内容等，按需求尽量实现。
- 这是纯静态站点：不要引入构建步骤、框架、npm 依赖；只用原生 HTML/CSS/JS。
- 所有面向儿童的文案使用简体中文，语气活泼友好。
- 新增音频文件放 audio/ 目录；景点/诗词数据如存在独立 JSON 则优先改数据文件，其次才改 index.html 内联数据。
- 保持移动端（iPad 竖屏）体验，新增 UI 要自适应宽度。
- 完成修改后不要执行 git commit / git push —— 由外部流水线统一提交部署。
- 不要修改 version.json 和 AGENTS.md。
- 每次改动保持聚焦、轻量，不要大规模重构无关代码。
