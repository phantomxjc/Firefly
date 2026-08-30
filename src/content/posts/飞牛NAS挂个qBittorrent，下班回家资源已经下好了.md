---
title: "飞牛NAS挂个qBittorrent，下班回家资源已经下好了"
published: 2026-08-30
description: "飞牛NAS挂个qBittorrent，下班回家资源已经下好了"
tags:
  - "飞牛NAS"
  - "qBittorrent"
  - "Docker"
category: "飞牛NAS"
draft: false
image: "api"
---

前阵子朋友问我：你家NAS那么能装，平时电影都是怎么搞进去的？我说还能怎么搞，挂个qBittorrent呗。他居然不知道NAS还能这么玩——白天在单位摸鱼刷到想看的资源，手机往Web界面里一丢，下班回家打开Jellyfin直接看，中间啥都不用管。

说实话，这套流程我已经用了大半年，稳定到几乎忘了它的存在。今天就把飞牛NAS上部署qBittorrent的完整过程捋一遍，顺便聊聊几个容易踩的坑。

## 为什么选qBittorrent

BT下载器其实不少，transmission、aria2、Deluge都能用。我自己轮了一圈最后留在qBittorrent，理由很简单：

一是Web界面做得最像桌面软件，分类、限速、RSS订阅全都有，不用记任何命令；二是它对PT站很友好，做种稳定，不会被客户端检测拉黑；三是linuxserver维护的Docker镜像更新勤快，出事概率低。

如果你只是偶尔拖个磁力链接下电影，aria2那种轻量的也够了。但想长期挂机做种、玩PT保号，qBittorrent基本是标准答案。

## 在飞牛NAS上部署

飞牛NAS的Docker管理图形化做得不错，但这次我直接上docker-compose，一劳永逸。先 SSH 连上NAS，在合适的目录建个文件夹，比如 `/vol1/1000/docker/qbittorrent`，里面放两个东西：

一个 `docker-compose.yml`：

```yaml
services:
  qbittorrent:
    image: lscr.io/linuxserver/qbittorrent:latest
    container_name: qbittorrent
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Asia/Shanghai
      - WEBUI_PORT=8080
    volumes:
      - ./config:/config
      - /vol1/1000/downloads:/downloads
    ports:
      - "8080:8080"
      - "6881:6881"
      - "6881:6881/udp"
    restart: unless-stopped
```

一个空的 `config` 文件夹，用来存配置。

然后在目录下执行：

```bash
docker compose up -d
```

一两分钟后，浏览器打开 `http://NAS的IP:8080` 就能看到登录界面。新版本的qBittorrent第一次启动会在日志里生成一个临时密码，用 `docker logs qbittorrent` 查看，用户名是 `admin`，登进去第一件事就是改密码。

## 部署完别急着用，这几个设置必须改

裸奔的qBittorrent其实挺难用的，我总结了几个必改项：

**1. 关闭UPnP，手动做端口映射。** 很多教程让你勾选自动端口映射，我建议别信它。直接在路由器里把6881端口的TCP和UDP都映射到NAS上，WebUI里把"使用UPnP/NAT-PMP"关掉。做种能不能连人就看这一步，连不上peer基本都是端口没通。

**2. 默认下载路径指向NAS共享目录。** 在 设置→下载 里把默认保存路径设为 `/downloads`（也就是我们挂载进去的那个目录），这样下完的东西直接在SMB共享里能看到，电视和手机都能访问。

**3. 启用"下载完成后自动分类"。** 我是按 电影/剧集/纪录片 分了三个分类，每个分类指定不同的子目录。这样配合Jellyfin扫媒体库特别省心，下完自动进对应文件夹，不用手动挪。

**4. 限制上传速度但别关死。** 家里宽带上传一般是30M-50M，我会把全局上传限速设在上行带宽的80%左右，留点余量给手机和监控用。纯吸血不做种的不讨论，玩PT的记得单独给PT任务设置"不计算限速"或者干脆不限——反正PT流量是钱。

**5. 勾选"为所有文件预分配磁盘空间"。** 机械硬盘上不勾这个，边下边写容易把磁盘IO打满，整个NAS都会卡。

## 手机端也能随手添加任务

这是我觉得最爽的部分。iOS上可以装「qBittorrent Remote」这类第三方App，填上NAS的地址和账号密码，在外面刷到磁力链接直接添加。安卓这边选择更多，甚至直接把磁力链接分享到浏览器打开WebUI操作也行，界面是响应式的，手机上不别扭。

我的日常就是：中午刷公众号看到某个纪录片出了4K资源，复制磁力链接，手机App里粘贴，选"纪录片"分类，点确定。晚上到家打开电视，片已经躺在Jellyfin的媒体库里了。

整个过程里NAS就是那个24小时不关机、电费又低的苦力，而qBittorrent就是那个最听话的苦力头子。

## 几个容易翻车的坑

最后说点踩坑经验，能帮一个是一个。

**镜像源问题。** 如果 `docker compose up` 拉镜像特别慢，换国内镜像源，或者用飞牛NAS自带Docker管理里的镜像加速设置，填一个可用的加速器地址。

**PUID/PGID权限。** 如果下完的文件在SMB共享里删不掉或者改不了，十有八九是权限问题。`PUID` 和 `PGID` 要填你NAS上实际用户的ID，SSH里执行 `id 你的用户名` 就能查到。

**某个大种子下不动。** 不一定是NAS的锅，可能是tracker服务器挂了。在Trackers标签页手动加几个公共tracker，或者把BT协议的DHT、PeX都打开，做种的人会多不少。

**别把WebUI端口直接暴露到公网。** 这一点必须强调。8080这种端口直接映射到公网，等于把家门钥匙挂门口。要远程管理就走内网穿透加验证，或者干脆用VPN回家再操作，安全永远排第一。

***

*详情请关注微信公众号：**软件推手***
