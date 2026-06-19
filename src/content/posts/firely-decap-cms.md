---
title: 给 Firely 博客接入 Decap CMS：完整小白教程
date: 2026-06-19
published: 2026-06-19
updated: 2026-06-19
draft: false
pinned: true
description: "不想要本地部署环境  就用别的方法 "
image: images/298be83c-4497-4a69-a48e-191c85df8f09.png
category: 技术教程
tags:
  - Astro
  - Decap CMS
  - 博客教程
  - GitHub
comment: true
---

# 给 Firely  博客接入 Decap CMS：完整小白教程

> **前置说明**：本教程基于 Astro + Fuwari 模板的博客，但大部分步骤适用于任何静态博客。只要你用的是 GitHub Pages / Cloudflare Pages / Vercel 等自动部署平台，都可以参考。

---

## 最终效果

完成本教程后，你将获得：

- 访问 `你的域名/admin` 即可打开 CMS 后台
- 用 GitHub 账号登录
- 在浏览器里新建、编辑、删除博客文章
- 保存后自动提交到 GitHub，触发自动部署

---

## 第一步：了解你要做什么

Decap CMS（原名 Netlify CMS）是一个**基于 Git 的内容管理系统**。

通俗地说：它就是一个网页，让你在浏览器里像用 WordPress 一样写博客，但文章实际上是保存成 Markdown 文件并提交到你的 GitHub 仓库。

```
你在浏览器写文章 → Decap CMS → 提交到 GitHub → 触发自动部署 → 博客更新
```

---

## 第二步：准备 GitHub OAuth App

Decap CMS 需要通过 GitHub API 读写你的仓库，所以要先创建一个 GitHub OAuth App 来获取权限。

### 2.1 创建 OAuth App

1. 打开 [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. 点击 **"New OAuth App"**
3. 按如下填写：

| 字段                       | 填写内容                      | 说明                 |
| -------------------------- | ----------------------------- | -------------------- |
| Application name           | `你的博客名 CMS`              | 随便取，自己认识就行 |
| Homepage URL               | `https://你的域名.com`        | 你的博客地址         |
| Authorization callback URL | `https://你的域名.com/admin/` | **注意末尾有斜杠**   |

4. 点击 **"Register application"**

### 2.2 获取 Client ID 和 Client Secret

创建成功后，你会看到 **Client ID**，先复制保存好。

然后点击 **"Generate a new client secret"**，生成后**立刻复制保存**（只显示一次！）。

```
# 你需要的这两个值（示例，用你自己的）：
CLIENT_ID=你的ClientID
CLIENT_SECRET=你的ClientSecret
```

---

## 第三步：部署 OAuth 回调服务

Decap CMS 的 GitHub 认证需要一个**中间服务**来处理 OAuth 回调。如果你用的是 Cloudflare Pages，可以用 Cloudflare Worker 来搭建这个服务。

### 3.1 创建 Cloudflare Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create Application** → **Create Worker**
3. Worker 名字随便取，比如 `你的博客名-cms-oauth`
4. 点击创建，然后点击 **Edit Code**
5. 把默认代码全部删除，粘贴以下代码：

```javascript
// Cloudflare Worker - Decap CMS GitHub OAuth 回调服务
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 授权端点：跳转到 GitHub OAuth
    if (path === "/authorize") {
      const state = url.searchParams.get("state") || "";
      const redirectUri = url.searchParams.get("redirect_uri") || "";
      const encodedState = encodeURIComponent(state + ":::" + redirectUri);
      
      const githubAuthUrl = "https://github.com/login/oauth/authorize" +
        "?client_id=" + CLIENT_ID +
        "&redirect_uri=" + encodeURIComponent("https://" + url.hostname + "/callback") +
        "&state=" + encodedState;
      
      return Response.redirect(githubAuthUrl, 302);
    }

    // 回调端点：接收 GitHub 的授权码
    if (path === "/callback") {
      const code = url.searchParams.get("code") || "";
      const state = url.searchParams.get("state") || "";
      
      // 用 code 换取 access_token
      const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code
        })
      });
      const tokenData = await tokenResp.json();
      const accessToken = tokenData.access_token;

      // 解析 state（格式：原来的state:::原来的redirect_uri）
      const [origState, redirectUri] = decodeURIComponent(state).split(":::");

      // 跳转回 Decap CMS，带上 token
      const successUrl = redirectUri + "#access_token=" + accessToken +
        "&token_type=bearer&state=" + encodeURIComponent(origState || "");
      return Response.redirect(successUrl, 302);
    }

    return new Response("Not Found", { status: 404 });
  }
};

// 把这两个值替换成你自己的！
const CLIENT_ID = "你的ClientID";
const CLIENT_SECRET = "你的ClientSecret";
```

6. 把代码里的 `你的ClientID` 和 `你的ClientSecret` 替换成你在第二步获取的真实值
7. 点击 **Save and Deploy**

部署成功后，你会得到一个 Worker 地址，比如：

```
https://你的博客名-cms-oauth.你的Cloudflare账号.workers.dev
```

**复制保存这个地址，后面要用！**

---

## 第四步：创建 Decap CMS 配置文件

现在要在你的博客项目里创建 CMS 相关文件。

### 4.1 创建 admin 目录

在你的博客项目根目录下，找到 `public` 文件夹，在里面创建 `admin` 文件夹：

```
你的博客项目/
├── public/
│   └── admin/          ← 新建这个文件夹
│       ├── index.html   ← 新建
│       └── config.yml   ← 新建
├── src/
│   └── content/
│       └── posts/      ← 你的文章目录
...
```

### 4.2 创建 config.yml

在 `public/admin/` 下创建 `config.yml`，内容如下：

```yaml
# Decap CMS 配置文件
# 详细文档：https://decapcms.org/docs/configuration-options/

# ===== 后端配置 =====
backend:
  name: github
  repo: 你的GitHub用户名/你的仓库名   # ← 改成你自己的！
  branch: main                        # ← 改成你的默认分支名（main 或 master）
  base_url: https://你的Worker地址    # ← 改成你的 Cloudflare Worker 地址
  auth_endpoint: authorize            # 对应 Worker 里的 /authorize 路径

# 发布模式：simple = 直接提交，不使用 PR 流程
publish_mode: simple

# 本地开发时设为 true，可以用本地 Git 后端（不需要 GitHub OAuth）
local_backend: false

# 媒体文件（图片）存放位置
media_folder: "/images/posts"    # 在仓库里的路径
public_folder: "/images/posts"   # 在 Markdown 里引用的路径前缀

# ===== 内容集合配置 =====
collections:
  - name: "posts"               # 内部名称，不能含中文
    label: "文章"                # 在 CMS 界面上显示的名称
    label_singular: "文章"       # 单篇文章的显示名称
    folder: "src/content/posts"  # ← 改成你的文章实际存放目录！
    nested:
      depth: 5                   # 递归扫描 5 层子目录（支持子文件夹里的文章）
    create: true                 # 允许在 CMS 里新建文章
    slug: "{{slug}}"           # 新文章的文件名格式（使用标题的 slug）
    
    # ===== 文章字段定义 =====
    # 这些字段对应你 Markdown 文件里 --- 之间的 frontmatter
    fields:
      - { name: "title", label: "标题", widget: "string", required: true }
      - { name: "date", label: "日期", widget: "datetime", format: "yyyy-MM-dd", required: true }
      - { name: "tags", label: "标签", widget: "list" }
      - name: "category"
        label: "分类"
        widget: "select"
        options:
          - "技术笔记"
          - "生活随笔"
          - "学习记录"
        required: false
      - { name: "description", label: "摘要", widget: "string", required: false }
      - { name: "body", label: "正文", widget: "markdown", required: true }
```

**你需要修改的地方**（搜索 `← 改成` 找到它们）：

1. `repo: 你的GitHub用户名/你的仓库名` → 比如 `phantomxjc/Firefly`
2. `branch: main` → 如果你的默认分支是 `master`，改成 `master`
3. `base_url: https://你的Worker地址` → 填你在第三步部署的 Worker 地址
4. `folder: "src/content/posts"` → 改成你的文章实际存放路径

### 4.3 关于字段配置的说明

上面 `fields` 里的配置是根据常见的 Astro 博客 frontmatter 设计的。你可以对照自己现有的文章，看看需要调整哪些字段：

```markdown
---
title: "文章标题"
date: 2026-06-19
tags: [标签1, 标签2]
category: 技术笔记
description: "文章摘要"
---

文章正文...
```

如果你的文章 frontmatter 有不同的字段，**对照修改** `config.yml` 里的 `fields` 部分即可。

**⚠️ 重要警告**：

- **不要加 `format: "yaml"`**！这个选项会让 Decap CMS 把文件写成纯 YAML 格式（没有 `---` 分隔符），导致 Astro 构建失败！不写这个字段，Decap 默认使用正确的 `yaml-frontmatter` 格式。
- **`tags` 用简单 `list`**，不要写成嵌套的 `field` 结构（见下面的"常见问题"章节）。

---

## 第五步：创建 admin/index.html

在 `public/admin/` 下创建 `index.html`，这是 CMS 的入口页面。

### 5.1 完整的 index.html 代码

把下面代码**完整复制**到 `public/admin/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>博客 CMS 后台</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
    }
  </style>
  
  <!-- 
    ============================================
    fetch 拦截器：修复 git/trees API 404 问题
    ============================================
    问题：Decap CMS 会调用 GitHub 的 git/trees API 来获取文件列表，
    但在浏览器端这个 API 经常返回 404（GitHub 的安全策略）。
    这个拦截器会在检测到 404 时，自动改用 contents API，
    对 Decap CMS 来说数据是透明的，不影响使用。
  -->
  <script>
  (function() {
    var origFetch = window.fetch;
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      
      // 只拦截 git/trees API 的请求
      if (url && url.indexOf('/git/trees/') !== -1 && url.indexOf('api.github.com') !== -1) {
        return origFetch.call(this, input, init).then(function(resp) {
          // 如果不是 404，直接返回
          if (resp.status !== 404) return resp;
          
          console.log('[Decap CMS] git/trees 返回 404，正在 fallback 到 contents API...');
          
          // 将 git/trees API 的 URL 转换成 contents API 的 URL
          var newUrl = url
            .replace('/git/trees/', '/contents/')
            .replace('?recursive=5', '')
            .replace('?recursive=1', '');
          
          var newInput = (typeof input === 'string') 
            ? newUrl 
            : (Object.assign({}, input, { url: newUrl }));
          
          // 调用 contents API
          return origFetch.call(this, newInput, init).then(function(cResp) {
            if (!cResp.ok) return cResp;
            
            // 将 contents API 的响应格式转换成 git/trees 的格式
            return cResp.json().then(function(data) {
              var treeData = Array.isArray(data) ? data : [data];
              var fakeTree = {
                tree: treeData.map(function(item) {
                  return {
                    path: item.path,
                    mode: item.type === 'file' ? '100644' : '040000',
                    type: item.type,
                    sha: item.sha,
                    url: item.url,
                    size: item.size || 0
                  };
                })
              };
              return new Response(JSON.stringify(fakeTree), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }).catch(function() { return cResp; });
          }).catch(function() { return resp; });
        });
      }
      
      // 其他请求正常处理
      return origFetch.call(this, input, init);
    };
  })();
  </script>
</head>
<body>
  <!-- 
    ============================================
    Decap CMS 挂载点
    ============================================
    ⚠️ 重要：<div id="nc-root"> 必须放在 <body> 里面！
    如果放在 <head> 里，decap-cms.js 加载时会报错：
    "Cannot read properties of null (reading 'appendChild')"
  -->
  <div id="nc-root">
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;color:#666;font-size:18px;">
      <p>⏳ 正在加载 CMS 后台，请稍候...</p>
    </div>
  </div>
  
  <!-- 
    ============================================
    ⚠️ 关键：decap-cms.js 必须放在 </body> 之前！
    ============================================
    不能放在 <head> 里！
    不能写成 async 或 defer！
    
    版本说明：
    @^3.0.0 表示使用 3.x.x 的最新版本
    不要用太老的版本（< 3.0），也不要写死版本号（如 3.14.1）
  -->
  <script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
  
</body>
</html>
```

### 5.2 这个文件的关键点（必读）

| 关键点                              | 说明                                             |
| ----------------------------------- | ------------------------------------------------ |
| `<div id="nc-root">` 在 `<body>` 里 | 如果放 `<head>` 里会导致崩溃                     |
| `decap-cms.js` 在 `</body>` 之前    | 放 `<head>` 里会报 `appendChild null` 错误       |
| fetch 拦截器在 `<head>` 里          | 拦截器不依赖 DOM，放哪里都可以，但放 head 更合理 |
| 不要用 `async` 或 `defer`           | 会让加载顺序出问题                               |

---

## 第六步：提交并部署

### 6.1 提交到 GitHub

```bash
# 在你的博客项目根目录下执行：

git add public/admin/
git commit -m "feat: 添加 Decap CMS 后台"
git push origin main   # 或 master，看你的默认分支
```

### 6.2 等待自动部署

提交后，你的部署平台（Cloudflare Pages / Vercel / GitHub Pages 等）会自动开始构建。

- Cloudflare Pages：通常 1-2 分钟
- Vercel：通常 30 秒 - 1 分钟
- GitHub Pages：通常 1-3 分钟

等部署完成后，进行下一步测试。

---

## 第七步：测试

### 7.1 访问 CMS 后台

在浏览器打开：

```
https://你的域名.com/admin/
```

你应该能看到 Decap CMS 的登录界面。

### 7.2 登录

1. 点击 **"Login with GitHub"**
2. 会跳转到 GitHub 的授权页面
3. 点击 **"Authorize"** 授权
4. 会自动跳回 `你的域名.com/admin/`，此时应该已经登录成功

### 7.3 测试文章列表

登录成功后，左侧应该能看到**文章**集合，点击后能看到你现有的所有文章。

如果看不到文章列表，检查：

- `config.yml` 里的 `folder` 路径是否正确
- 仓库里对应路径下是否有 `.md` 文件

### 7.4 测试读取文章

点击一篇文章，看看能不能正常加载标题、日期、标签、正文。

如果报 `Failed to load entry` 或类似错误，检查：

- 浏览器控制台的报错信息
- 是否有 `git/trees 404` 的错误（如果有，说明 fetch 拦截器没生效）

### 7.5 测试保存文章

修改一点内容，点击**保存**。然后：

1. 去 GitHub 仓库看，是否有新的 commit
2. 等自动部署完成后，去博客前台看文章是否更新

---

## 常见问题与解决方案

### ❌ 问题 1：打开 /admin 后白屏，控制台报错 `appendChild null`

**原因**：`decap-cms.js` 放在了 `<head>` 里，此时 `document.body` 还不存在。

**解决**：确保 `decap-cms.js` 的 `<script>` 标签在 `</body>` 之前，且 `<div id="nc-root">` 在 `<body>` 里面。

---

### ❌ 问题 2：能登录，文章列表也能加载，但点击文章后报错

**控制台可能有这些错误**：

```
GET https://api.github.com/repos/xxx/xxx/git/trees/... 404 (Not Found)
Failed to load entry
```

**原因**：Decap CMS 调用的 `git/trees` API 在浏览器端返回 404（GitHub 的安全策略导致）。

**解决**：确保 `admin/index.html` 里有 fetch 拦截器代码（本教程 5.1 节的代码已包含）。

---

### ❌ 问题 3：通过 CMS 保存文章后，博客构建失败

**可能的报错**：

```
title: Required
---
cannot read frontmatter
```

**原因**：`config.yml` 里错误地设置了 `format: "yaml"`。

`format: "yaml"` 会让 Decap CMS 把文件写成**纯 YAML 格式**（没有 `---` 分隔符），而 Astro 期望的是 `yaml-frontmatter` 格式（有 `---` 包裹的 frontmatter）。

**解决**：删除 `config.yml` 里的 `format` 字段，让 Decap CMS 使用默认的 `yaml-frontmatter` 格式。

**正确格式（Astro 能识别）**：

```markdown
---
title: "文章标题"
date: 2026-06-19
tags: [标签1, 标签2]
---

正文内容...
```

**错误格式（Astro 无法识别）**：

```markdown
title: "文章标题"
date: 2026-06-19
tags: [标签1, 标签2]
---

正文内容...
```

（注意：缺少了开头的 `---`，这就是 `format: "yaml"` 导致的）

---

### ❌ 问题 4：tags 标签显示异常

**原因**：`config.yml` 里的 tags 字段配置错误，写成了嵌套的 `field` 结构。

**错误配置**：

```yaml
- name: "tags"
  label: "标签"
  widget: "list"
  field:
    name: "tag"
    widget: "string"
```

这种配置会让 Decap CMS 期望文件里的 tags 是 `[{tag: "x"}]` 格式，但实际文件里是 `["x", "y"]` 格式。

**正确配置**：

```yaml
- name: "tags"
  label: "标签"
  widget: "list"
  # 不要写 field，就是纯字符串列表
```

---

### ❌ 问题 5：浏览器控制台有很多红字，但 CMS 能用

以下错误可以**安全忽略**，不影响功能：

| 错误信息                        | 原因                             | 需要处理吗？ |
| ------------------------------- | -------------------------------- | ------------ |
| `IndexSizeError: getRangeAt`    | 浏览器扩展的 bug                 | ❌ 忽略       |
| `git/trees 404`（控制台有日志） | fetch 拦截器正常工作，只是有日志 | ❌ 忽略       |
| `admin/images/xxx.avif 404`     | Decap CMS UI 装饰图片缺失        | ❌ 忽略       |

---

## 配置文件完整参考

### config.yml 完整示例

```yaml
backend:
  name: github
  repo: 你的用户名/你的仓库名
  branch: main
  base_url: https://你的Worker地址
  auth_endpoint: authorize

publish_mode: simple
local_backend: false

media_folder: "/images/posts"
public_folder: "/images/posts"

collections:
  - name: "posts"
    label: "文章"
    label_singular: "文章"
    folder: "src/content/posts"
    nested:
      depth: 5
    create: true
    slug: "{{slug}}"
    fields:
      - { name: "title", label: "标题", widget: "string", required: true }
      - { name: "date", label: "日期", widget: "datetime", format: "yyyy-MM-dd", required: true }
      - { name: "tags", label: "标签", widget: "list" }
      - name: "category"
        label: "分类"
        widget: "select"
        options: ["技术笔记", "生活随笔", "学习记录"]
        required: false
      - { name: "description", label: "摘要", widget: "string", required: false }
      - { name: "body", label: "正文", widget: "markdown", required: true }
```

### index.html 完整示例

> 见本文 **第五步 5.1 节**，直接复制即可。

---

## 总结：检查清单

部署前，对照这个清单检查一遍：

- [ ] GitHub OAuth App 已创建，`Authorization callback URL` 正确
- [ ] Cloudflare Worker 已部署，`CLIENT_ID` 和 `CLIENT_SECRET` 已填写
- [ ] `config.yml` 里的 `repo`、`branch`、`base_url` 都已改成你自己的值
- [ ] `config.yml` 里**没有** `format: "yaml"` 这一行
- [ ] `config.yml` 里的 `folder` 路径和你的实际文章目录一致
- [ ] `index.html` 里的 `<div id="nc-root">` 在 `<body>` 里面
- [ ] `index.html` 里的 `decap-cms.js` 在 `</body>` 之前（不在 `<head>` 里）
- [ ] `index.html` 里有 fetch 拦截器代码
- [ ] 所有文件已提交到 GitHub
- [ ] 部署平台已成功构建并部署

---

## 参考资源

- [Decap CMS 官方文档](https://decapcms.org/docs/intro/)
- [Decap CMS GitHub Backend 文档](https://decapcms.org/docs/github-backend/)
- [Astro 官方文档](https://docs.astro.build/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [GitHub OAuth Apps 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

*如果你在配置过程中遇到了本文未覆盖的问题，或者某些步骤不太清楚，欢迎在评论区留言！*
