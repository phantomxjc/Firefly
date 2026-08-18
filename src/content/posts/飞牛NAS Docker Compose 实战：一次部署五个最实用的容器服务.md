---
title: "飞牛NAS Docker Compose 实战：一次部署五个最实用的容器服务"
published: 2026-08-18
description: "飞牛NAS Docker Compose 实战：一次部署五个最实用的容器服务"
tags:
  - "飞牛NAS"
  - "Docker Compose"
  - "容器"
  - "Jellyfin"
  - "Navidrome"
  - "Syncthing"
  - "qBittorrent"
  - "Uptime Kuma"
category: "飞牛NAS"
draft: false
image: "api"
---

装 NAS 的时候，很多人都会遇到一个共同的困境——一个个点开 Docker 界面，找镜像、填端口、配路径、点启动，装个三五个服务下来，光记住每个容器的配置参数就够头疼了，更别说后面想升级、迁移或者换个机器重新部署。

Docker Compose 就是来解决这个问题的。一个 YAML 文件写清楚所有容器的配置，一行命令就能全部拉起，换台机器或者重新部署，直接复制文件跑就行。飞牛NAS 本身就已经预装了 Docker 环境，配合 Compose 用起来非常顺手。

这篇文章就手把手带你走完一遍，在飞牛NAS 上一次性部署五个最实用的容器服务：影音库、音乐服务器、文件同步、下载器和状态监控。

## 01 准备工作

在飞牛NAS 上操作之前，先确认两件事。

第一，你的飞牛NAS 需要是 Docker 已安装的状态。飞牛NAS 系统更新后 Docker 是自带的，进入「容器」应用就能看到 Docker 面板。如果你用的是 Docker Desktop 或者系统自带的容器管理，确认 `docker` 和 `docker compose` 命令都能用就行。

第二，在共享文件夹里新建一个目录，用来放 Compose 文件和容器数据。我一般习惯在共享目录 `docker` 下建一个子文件夹，比如 `docker-compose-services`，然后把所有东西都往这个目录里放。目录结构大概是这样的——

```
/docker-compose-services/
├── docker-compose.yml      ← 配置文件
├── jellyfin/               ← 影音库数据
│   ├── config/
│   └── data/
├── navidrome/
│   └── data/
├── syncthing/
│   └── config/
├── qbittorrent/
│   └── config/
├── uptime-kuma/
│   └── data/
├── downloads/              ← 下载目录
└── media/                  ← 影音文件目录
```

这种扁平化的目录结构看起来比嵌套多层要清晰得多，后面排查问题也好找。

## 02 编写 docker-compose.yml

打开文本编辑器，新建一个 `docker-compose.yml` 文件。下面这段配置我已经在飞牛NAS 上跑过一轮，可以直接参考，路径部分按照你自己的实际共享目录修改。

```yaml
services:
  # === 影音库 Jellyfin ===
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    restart: unless-stopped
    ports:
      - "8096:8096"
    volumes:
      - /share/docker-compose-services/jellyfin/config:/config
      - /share/docker-compose-services/jellyfin/data:/data
      - /share/media:/media:ro
    devices:
      - /dev/dri:/dev/dri
    environment:
      - TZ=Asia/Shanghai

  # === 音乐服务器 Navidrome ===
  navidrome:
    image: deluan/navidrome:latest
    container_name: navidrome
    restart: unless-stopped
    ports:
      - "4533:4533"
    volumes:
      - /share/docker-compose-services/navidrome/data:/data
      - /share/media/music:/music:ro
    environment:
      - TZ=Asia/Shanghai
      - ND_SCAN_JITTER=30s

  # === 文件同步 Syncthing ===
  syncthing:
    image: syncthing/syncthing:latest
    container_name: syncthing
    restart: unless-stopped
    ports:
      - "8384:8384"
      - "22000:22000/tcp"
      - "22000:22000/udp"
      - "21027:21027/udp"
    volumes:
      - /share/docker-compose-services/syncthing/config:/var/syncthing
      - /share/media:/media
      - /share/downloads:/downloads
    environment:
      - TZ=Asia/Shanghai
    hostname: my-nas

  # === 下载器 qBittorrent ===
  qbittorrent:
    image: linuxserver/qbittorrent:latest
    container_name: qbittorrent
    restart: unless-stopped
    ports:
      - "6881:6881"
      - "6881:6881/udp"
      - "8080:8080"
    volumes:
      - /share/docker-compose-services/qbittorrent/config:/config
      - /share/downloads:/downloads
    environment:
      - TZ=Asia/Shanghai
      - PUID=1000
      - PGID=1000
    healthcheck:
      test: curl -f http://localhost:8080/ || exit 1
      interval: 30s
      timeout: 10s
      retries: 3

  # === 状态监控 Uptime Kuma ===
  uptime-kuma:
    image: louislam/uptime-kuma:latest
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - /share/docker-compose-services/uptime-kuma/data:/app/data
    environment:
      - TZ=Asia/Shanghai
```

有几个地方需要说明一下。Jellyfin 的 `/dev/dri` 设备映射是为了硬件解码，如果你的 NAS 有独立的 GPU 或者支持核显转码，加上这个可以明显降低 CPU 占用。如果没有这个设备，删掉 `devices` 那一节就行，软件解码也能用，只是 4K 视频转码可能会有点吃力。

Navidrome 的 `ND_SCAN_JITTER` 参数是让扫描间隔随机波动，避免每次都在同一时间点触发扫描，对 NAS 的 IO 压力更友好。

qBittorrent 的 `PUID` 和 `PGID` 是容器内用户的 ID，需要和你 NAS 上的用户 ID 对应。在 NAS 终端里跑一下 `id` 命令就能看到，默认一般是 1000。

Uptime Kuma 的端口 3001 是 Web 管理界面，如果飞牛NAS 上已经有其他服务占用了这个端口，改成别的就行，比如 `3002:3001`。

## 03 启动与验证

把 `docker-compose.yml` 保存到刚才建的目录里，打开终端（SSH 或者 NAS 自带的终端都行），进入这个目录，执行：

```bash
cd /share/docker-compose-services
docker compose up -d
```

`-d` 参数表示后台运行。这条命令执行完之后，五个容器就会同时启动。如果中途报错，一般是端口被占用了，或者某个目录权限不对。

启动完成后，用下面这条命令看看是不是都起来了：

```bash
docker compose ps
```

全部显示 `Up` 状态就说明没问题了。

然后依次打开浏览器访问：

- Jellyfin：`http://NAS-IP:8096`
- Navidrome：`http://NAS-IP:4533`
- Syncthing：`http://NAS-IP:8384`
- qBittorrent：`http://NAS-IP:8080`
- Uptime Kuma：`http://NAS-IP:3001`

第一次进去都需要注册或者设置密码，按照提示来就行。Jellyfin 和 qBittorrent 的管理账号密码初始设置都在第一次访问时弹出，设置完后记牢就好。

## 04 日常使用的小技巧

**升级镜像版本。** 用 Docker Compose 的好处就是升级特别简单。在目录里跑：

```bash
docker compose pull
docker compose up -d
```

第一条拉取最新镜像，第二条用新镜像重新启动容器。原来的数据还在原目录里，不会丢。

**查看日志。** 哪个服务出了问题，先看日志：

```bash
docker compose logs -f jellyfin
```

把 `jellyfin` 换成对应的服务名就行。

**只重启某个服务。** 不用全部重启，单独拉一个：

```bash
docker compose restart qbittorrent
```

**修改配置后重启。** 改了 `docker-compose.yml` 里的端口或者路径，运行：

```bash
docker compose up -d
```

Compose 会自动识别差异，只重新创建需要改动的容器。

## 05 几个需要注意的地方

Syncthing 的同步目录权限要特别留意。容器里用的默认用户是 `nobody`，如果你 NAS 上的共享目录权限设得比较严，可能同步的时候报错。简单的方法是直接在 NAS 面板里把同步目录的权限设为「所有用户可读写」，或者在 `docker-compose.yml` 里加上 `user: "1000:1000"` 来指定用户 ID。

qBittorrent 的下载速度如果特别慢，大概率是端口没开。在 NAS 的路由器上做端口转发，把 6881 端口映射到 NAS 的内网 IP，再配合 DHT 和 PE 协议，下载速度会好很多。

Uptime Kuma 默认是没有登录密码的，如果端口直接暴露在公网，建议进去之后在设置里开一个管理员密码，否则别人也能访问你的监控面板。

## 茶余饭后

说实话，第一次用 Compose 的时候我也觉得多此一举——直接 Docker 面板点几下不就完了嘛。但装到第四个服务的时候我就理解了，写文件确实比一个一个点要省时间得多，尤其是后面还要维护的时候。你有没有哪个服务是装了之后天天用的？或者有什么觉得特别适合 NAS 的 Docker 镜像，评论区聊聊 🍡

***
*详情请关注微信公众号：**软件推手***