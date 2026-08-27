---
title: "5 大平台随便下！Docker 一键搭音乐服务，不花一分钱"
published: 2026-08-27
image: "api"
description: "5 大平台随便下！Docker 一键搭音乐服务，不花一分钱"
tags:
  - "飞牛NAS"
  - "Docker"
  - "效率工具"
category: "飞牛NAS"
draft: false
---

# 5 大平台随便下！Docker 一键搭音乐服务，不花一分钱

> 我在自己家的飞牛 NAS 上跑了一套能搜歌、能下载、能听歌的服务，全程零成本，5 大平台都免费。这套方案我前后折腾了两天，今天把完整的部署流程和踩过的坑一次性写清楚，照着做半小时就能跑起来。

---

## 写在前面

之前一直用 LX Music 听歌，电脑端体验是真不错。但有个小问题：手机和电视端没法直接用 LX，得开着电脑下好再传到 NAS 上，麻烦。

后来发现了 `a914599611/ro-music` 这个项目，本质上是 LX Music 的"无头版"——一个跑在 Docker 容器里的音乐下载服务。它自带 5 个搜索适配器（酷我/酷狗/QQ/网易/咪咕），但**真正能下载还需要音源脚本**——这是 LX 生态里的 `.js` 插件，由社区里的大佬维护。

整套方案跑下来需要三个东西：

- 一个能跑 Docker 的设备（NAS、迷你主机、甚至软路由都行）
- `ro` 容器本体
- 一个好用的音源脚本（推荐星海源，下面会细讲）

---

## 一、容器准备

### 1.1 目录结构

ro 的官方推荐目录长这样：

```
/vol3/1000/RO/
├── config.yaml          # 配置文件
├── data/
│   ├── sources/         # 音源脚本目录
│   ├── db/              # SQLite 数据库
└── docker-compose.yml
```

我个人是把 `/vol3/1000/RO/` 作为根目录，所有数据都集中放这里，方便备份。下载文件单独存到 `/vol3/1000/影音/NAS下载音乐/`，避免撑爆系统盘。

### 1.2 docker-compose.yml

官方文档里给的版本可直接用，自己改一下端口和挂载路径：

```yaml
services:
  ro:
    image: a914599611/ro-music:latest
    container_name: ro
    restart: unless-stopped
    ports:
      - "23330:23330"
    environment:
      TZ: Asia/Shanghai
    volumes:
      - ./config.yaml:/app/config.yaml
      - /vol3/1000/影音/NAS下载音乐:/app/data/downloads
      - ./data/sources:/app/data/sources
      - ./data/db:/app/data/db
    mem_limit: 512m
```

> 端口 `23330` 是 ro 的 Web 管理界面，下载 API 也走这个端口。改其他端口记得防火墙同步放行。

---

## 二、配置文件（最容易踩坑的地方）

直接 `docker compose up -d` 跑起来你会发现容器一直在重启，日志里全是 `EISDIR: illegal operation on a directory, read`——这是因为挂载源 `/path/config.yaml` 必须是个文件，不能是目录。

很多人首次部署时手动 `mkdir` 创建了 `config.yaml` 文件夹（系统级命令会把不存在的路径当成目录创建），然后容器读到的就是个目录，整个就崩了。

正确的做法是**先创建配置文件，再启动容器**。

### 2.1 最小可用的 config.yaml

```yaml
server:
  host: 0.0.0.0
  port: 23330
auth:
  enabled: false
  apiKey: ""
  webLogin:
    username: admin
    password: ""
download:
  dir: data/downloads
  concurrency: 3
  defaultQuality: flac
  nameTemplate: "{name} - {singer}"
  embedCover: true
  embedLyric: true
  coverSize: 500
sources:
  dir: data/sources
  hotReload: true
rateLimit:
  enabled: false
  windowMs: 60000
  max: 300
log:
  level: info
smokeTest:
  enabled: false
  cron: "0 6 * * *"
  keyword: ""
  checkLyric: true
  checkPic: true
  alertThreshold: 5
  alert:
    bark:
      enabled: false
      serverUrl: ""
      deviceKey: ""
    serverChan:
      enabled: false
      sendKey: ""
```

### 2.2 几个容易踩的坑

**坑 1：`nameTemplate` 变量名不是 `{artist}`**

ro 的模板变量是 `{name}`（歌名）、`{singer}`（歌手）、`{album}`（专辑），不是 LX 习惯的 `{artist}`/`{title}`。我第一次写错了，下载出来一堆 `{artist} - {title}.flac` 这种字面文件，重命名脚本都救不回来。

**坑 2：配置文件改了不重启不生效**

ro 启动时一次性把 config 读进内存，热重载只对 `data/sources/` 生效。所以改了 `config.yaml` 必须 `docker compose restart ro`。

**坑 3：`download.dir` 是相对路径**

`download.dir: data/downloads` 是相对 `ROOT_DIR`（容器内 `/app`）的，**不要**改成绝对路径 `/vol3/...`，否则保存目录算错。如果你下载目录就是挂载路径，**保持相对路径**就行。

---

## 三、启动容器

```bash
cd /vol3/1000/RO
docker compose up -d
```

跑完 `docker ps` 看一眼：

```
CONTAINER ID   STATUS                   PORTS
xxxxx          Up 5 seconds (healthy)   0.0.0.0:23330->23330/tcp   ro
```

浏览器打开 `http://NAS-IP:23330`，看到 Web 界面就成功了。

健康检查端点 `http://NAS-IP:23330/api/v1/status` 返回 200 也算活体检测通过。

---

## 四、部署音源脚本

这一步是**最关键的**，没有音源 ro 只能搜歌不能下载。

### 4.1 为什么需要音源脚本？

ro 容器启动时只会加载内置的搜索适配器（5 个平台），用来返回搜索结果。但**真正去音乐平台拿音频 URL**得靠音源脚本——这就是 LX Music 生态里常见的 `.js` 文件，每个文件自己声明支持哪些平台、哪些音质。

没有音源的情况下你提交下载任务会得到错误：

```
没有可用音源支持平台 kw（需要已加载/启用/ready 且声明支持该平台的音源）
```

### 4.2 推荐音源：星海音乐源

我对比了 LX 生态里比较火的几个源：

| 音源 | 大小 | 平台覆盖 | 维护状态 |
|------|------|---------|---------|
| **星海音乐源** | 18KB | 5 大平台（wy/tx/kg/kw/mg） | 活跃 |
| 六音音源（加密版） | 333KB | 5 大平台 | 较稳定但代码混淆 |
| 小熊猫音源 | 19KB | 5 大平台 | 较稳定 |
| ikun 音源 | 9KB | 5 大平台 | 一般 |

**我推荐星海源**——18KB 未混淆代码，作者维护勤快，支持到母带和 Hi-Res 音质，并且接口完全符合 LX Music 标准，ro 的 worker 沙箱能完美加载。

源码仓库：https://github.com/cdyUuu/lx-music-xinghai-source

### 4.3 部署步骤

下载 `xinghai-music-source.js` 文件，放到 ro 的 sources 目录：

```bash
# 方式 1：用 curl 直接拉
curl -L -o /vol3/1000/RO/data/sources/xinghai.js \
  https://raw.githubusercontent.com/cdyUuu/lx-music-xinghai-source/main/xinghai-music-source.js

# 方式 2：手动下载后上传到 NAS
```

只要文件落到 `data/sources/`，ro 会**自动热重载**（不需要重启容器）。几秒钟后查看日志：

```bash
docker logs ro --tail 20
```

看到这样的日志就是成功：

```
"msg":"source dir changed, reloading all sources"
"source":"xinghai","platforms":["kw","kg","tx","wy","mg"],"msg":"source inited"
"count":1,"msg":"source engine: all sources loaded"
```

---

## 五、验证下载链路

部署完不能光看日志，得真下载一首歌验证。

用 Web 界面搜首歌（比如"晴天"），点击下载 flac 或 320k。也可以走 API：

```bash
curl -X POST "http://127.0.0.1:23330/api/v1/download" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "wy",
    "musicInfo": {"songmid": "1", "name": "稻香", "singer": "周杰伦"},
    "quality": "320k"
  }'
```

返回任务 ID 后等几秒查任务状态：

```bash
curl "http://127.0.0.1:23330/api/v1/tasks" | python3 -m json.tool
```

成功的话会看到：

```
status: completed
actualQuality: 320k
actualSource: xinghai@kw
filePath: /app/data/downloads/稻香 - 周杰伦.mp3
fileSize: 9021847  # ≈ 8.6MB
```

文件名 `稻香 - 周杰伦.mp3` 出现在你挂载的下载目录里，整个链路就跑通了。

---

## 六、进阶：高音质 & 解锁更多音源

### 6.1 配置 ChKSz API 取母带音质

星海源默认走 GDAPI 聚合接口，能稳定拿到 320k 和 FLAC，但**Hi-Res（24bit）和母带**需要 ChKSz 的 apikey。

打开 `xinghai.js`，找到第 14 行附近的 `CHKSZ_CONFIG`：

```js
const CHKSZ_CONFIG = {
    apikey: '',           // ← 在这里填入 ChKSz apikey
    enableNetease: true,  // 启用网易云 SVIP 接口
    enableQQ: true,       // 启用 QQ 音乐接口
};
```

chksz 的 apikey 需要去他们官网申请（地址在星海源 README 里），免费档就能解锁母带音质。填完保存，ro 会自动重载音源。

### 6.2 酷我加密音频解密

酷我的无损以上音质（Hi-Res、母带）是加密的 `.mflac`/`.mgg` 文件，需要中间层解密。

星海源作者提供了一个 PHP 单文件的解密代理：https://github.com/cdyUuu/kuwo-music-relay

部署起来很简单：

```bash
docker run -d --name kuwo-decrypt -p 3000:80 cdyu/kuwo-music-relay
```

然后在 `xinghai.js` 里把 `KW_DECRYPT_PROXY` 改成你的代理地址：

```js
const KW_DECRYPT_PROXY = 'http://NAS-IP:3000';
const allowEncryptedLossless = true;
```

就能拉酷我的加密高音质了。

### 6.3 想换音源？

`LXJ-George666/LXMusic-Yinyuan` 仓库里有十几个 LX 音源插件（六音、小熊猫、ikun、monster、肥猫不肥等），都是 `.js` 文件直接放进 `data/sources/` 就能用。

需要哪个下载哪个就行，ro 会自动识别并加载。

---

## 七、常见问题

**Q1：Web 界面打不开**

A：检查 `23330` 端口防火墙，容器是否 `healthy` 状态，浏览器访问的是 NAS 的 IP 而不是 `localhost`（从其他设备访问时）。

**Q2：搜索有结果但下载都失败**

A：99% 是没装音源脚本。检查 `data/sources/` 目录里有没有 `.js` 文件，文件权限是不是 644。

**Q3：容器一直在 Restarting**

A：99% 是 `config.yaml` 是目录不是文件。`ls -la config.yaml` 看下文件类型，是 `directory` 就删掉重建。

**Q4：API 鉴权失败**

A：默认 `auth.enabled: false`，API 不需要 key。如果改了配置开启鉴权，得在请求头带 `Authorization: Bearer <apiKey>`。

**Q5：想换 NAS / 迁移容器**

A：备份 `/vol3/1000/RO/` 整个目录即可（包含 `config.yaml` 和 `data/`），到新机器 `docker compose up -d` 直接恢复。

---

## 写在最后

这套方案跑了快两周，搜歌稳定、下载稳定，没有遇到崩容器的情况。最爽的是手机和电视端都能用 Web 界面访问，下完直接 NAS 上听，不用折腾。

音源这块建议同时备 2-3 个源——音乐平台的接口经常变，星海源作者偶尔也会临时修 bug，多源备份就稳得多。

觉得这篇部署文档有用的话，点赞、在看、收藏走一波 👇

---

> 🎵 配套资源：**星海音乐源**（xinghai.js）已打包好放在公众号后台，回复关键词 `xinghai` 获取。

***
*详情请关注微信公众号：**软件推手***

📦 下载地址：见CTA卡片
💬 公众号后台私信回复：关键词

如果觉得软件推手的作品对你有用，就点个赞和在看再走吧 👍
