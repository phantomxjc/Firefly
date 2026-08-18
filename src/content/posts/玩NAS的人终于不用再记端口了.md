---
title: "玩NAS的人终于不用再记端口了"
published: 2026-08-18
description: "玩NAS的人终于不用再记端口了"
tags:
  - "飞牛NAS"
category: "飞牛NAS"
draft: false
image: "api"
---

玩 NAS 的朋友大概率都有过这种经历：刚开始装 Docker 的时候，记性还挺好，哪个容器跑哪个端口心里有数。慢慢地，装的东西越来越多——Jellyfin、qBittorrent、Nginx Proxy Manager、Home Assistant、Nextcloud……再过阵子，**端口号全糊了，想记也记不住**。有时候还得打开终端敲 `docker ps` 翻半天，或者翻自己记的备忘录，效率极低。

今天要说的这个工具就是来解决这个问题的。

## 工具介绍

**DockPorts**，GitHub 上一个叫 coracoo 的作者做的，目前 248 个星。一句话概括，它是一个 **Docker 容器端口的可视化面板**，把你 NAS 上所有容器的端口使用情况一股脑列出来，看个明白。

它最大的特点是**轻量**。纯 HTML 写的，跑起来就一个小容器，内存几乎不占。而且对 host 网络模式的支持特别友好——很多 NAS 上的容器为了走通网络，都用的是 `network_mode: host`，这种模式下的端口，普通的桥接式监控工具是看不到的，DockPorts 能看到。

具体来说，打开面板之后，你可以看到：

- 当前所有运行中的 Docker 容器各自占用了哪些端口
- 端口号、协议（TCP 还是 UDP）、容器名都在上面，一目了然
- 端口多了不用慌，一眼扫过去就能找到你想找的那个

## 部署方式

部署也简单，两种方式，选一种就行。

**方式一：Docker Compose**

部署方式如下：

```yaml
services:
  dockports:
    image: crpi-xg6dfmt5h2etc7hg.cn-hangzhou.personal.cr.aliyuncs.com/cherry4nas/dockports:latest
    container_name: dockports
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./config:/app/config
    environment:
      - DOCKPORTS_PORT=7777
      - TZ=Asia/Shanghai
    network_mode: host
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
```

**方式二：一行命令行**

如果想直接用命令行跑，一行搞定：

```bash
mkdir -p /vol2/1000/docker/dockports
docker run -d --name dockports --restart unless-stopped --network host \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v /vol2/1000/docker/dockports/config:/app/config \
  -e DOCKPORTS_PORT=7777 -e TZ=Asia/Shanghai \
  --log-driver json-file --log-opt max-size=10m \
  crpi-xg6dfmt5h2etc7hg.cn-hangzhou.personal.cr.aliyuncs.com/cherry4nas/dockports:latest
```

> **注意三个关键点：**
> - **`network_mode: host` 必须开**，不开的话它就看不到你宿主机的端口了，等于白装
> - **Docker socket 要挂进去**，它靠这个读取容器的端口信息，只读挂载就够，安全没问题
> - **端口默认是 7777**，想改的话调 `DOCKPORTS_PORT` 环境变量就行

部署完之后，浏览器打开 `http://你的NAS内网IP:7777` 就能直接用了。不需要注册登录，也不需要额外的配置，打开就是面板。

## 使用感受

用下来感觉挺实在的。以前想查哪个端口被谁占了，得在容器页面一个个找，现在打开 DockPorts 扫一眼，心里就有数了。对于端口越用越多、懒得记的 NAS 玩家来说，**这种一目了然的体验确实省不少事**。

---

## 🍵 茶余饭后

端口管理这件事，说大不大，说小也不小。端口冲突的时候调试起来真的很烦，尤其是好几个容器都绑 80 或者 443 的时候，排查能搞半天。DockPorts 虽然是个小工具，但把这种烦人的事情提前给挡住了，用起来是舒服的。

你平时 NAS 上跑几个容器？端口有没有踩过什么坑？评论区聊聊。

---

***
*详情请关注微信公众号：**软件推手***

📦 下载地址：见 CTA 卡片
💬 公众号后台私信回复：DockPorts

如果觉得软件推手的作品对你有用，就点个赞和在看再走吧 👍
