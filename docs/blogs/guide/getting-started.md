<!--
title: "开始使用你的博客"
-->

# 开始使用你的博客

这是 GitBlog Studio 模板中唯一的示例文章。通过 GitHub Pages 和内置的内容管理后台，你可以直接在浏览器中写作、上传图片和发布内容，不需要服务器或数据库。

## 1. 准备自己的仓库

1. 打开 [GitBlog Studio 模板仓库](https://github.com/Teletele-Lin/GitBlog-Studio)，点击 **Use this template → Create a new repository**。
2. 选择自己的 GitHub 账号，填写仓库名称，选择 **Public**（GitHub Free 支持公开仓库的 Pages 托管）。
3. 保持 **Include all branches** 不勾选，点击 **Create repository from template**。

新仓库拥有独立的 Git 历史，不需要 Fork 原作者的个人博客，也不需要在本地安装 Git 或下载代码。

仓库名可以是 `你的用户名.github.io`（访问域名根目录），也可以是任意项目名称（访问 `你的用户名.github.io/仓库名/`）。

## 2. 启用 GitHub Pages

打开你自己仓库的 **Settings → Pages**：

- Source 选择 **Deploy from a branch**。
- Branch 选择 **main**（若使用其他发布分支，选择实际分支）。
- Folder 选择 **/docs**。

点击 Save，等待部署完成，再打开 Pages 中显示的网址。

## 3. 连接内容管理后台

点击博客顶部「内容管理」，CMS 会自动识别 GitHub Pages 地址中的用户名和仓库名，默认使用 `main` 分支。如果上一步 Pages 选择了其他发布分支，在 CMS 中填写对应分支即可。本地预览及自定义域名也可手动填写。

在 [GitHub Token 设置](https://github.com/settings/personal-access-tokens/new) 创建 Fine-grained Personal Access Token：

1. Repository access 只选择自己的博客仓库。
2. Repository permissions 中，**Contents** 设置为 **Read and write**。
3. 设置合适的失效时间，保存生成的 Token（只显示一次，建议使用密码管理器）。

将 Token 粘贴到 CMS，点击连接。Token 只保存在当前页面内存，不提交到 GitHub。

## 4. 设置自己的博客

进入 CMS 左侧「博客设置与首页」，填写博客名称、站点标识、默认作者、时区、博客描述、首页标题、简介和个人签名，点击「保存并发布」。

不需要编辑 JavaScript、HTML 或配置文件。GitHub Pages 部署完成后，刷新网站即可看到个人信息和新的首页。

## 5. 开始写作

先在「专题与封面」创建自己的专题，然后在「文章管理」选择专题，填写标题、摘要及正文。

Markdown 编辑器支持：

- **Ctrl / ⌘ + Shift + F**：全屏写作；Esc 退出。
- **Ctrl / ⌘ + S**：保存并发布。
- **F9**：切换分栏预览。
- **Ctrl / ⌘ + V**：粘贴截图并自动上传，插入图片 Markdown 链接。
- 从图片库选择封面、复制 GitHub Raw 图片链接。

创建时间、更新时间自动记录，默认作者来自博客设置。文章和卡片一起提交到 GitHub。

## 6. 移除示例内容

当你已经创建了自己的专题和文章，可以在 CMS 删除此示例文章，再删除空的「使用指南」专题。首页会自动显示你的专题及推荐阅读。

愿你享受写作与积累知识的过程。
