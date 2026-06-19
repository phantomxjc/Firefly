---
title: Linux自学
published: 2026-06-19
updated: 2026-06-19
draft: false
pinned: false
description: 这个我个人linux的自学笔记
image: images/linux.png
category: 技术
tags:
  - Linux运维
comment: true
---
# Linux 自学指南

------

## 一、先搞懂 Linux 的「目录世界观」

你不需要背目录，只需要理解**“谁负责什么”**。

| 目录           | 核心作用                    | 新手注意事项                 |
| -------------- | --------------------------- | ---------------------------- |
| `/bin``/sbin`  | 最基础命令                  | 实际多链接到 `/usr/bin`      |
| `/etc`         | **配置中心**                | 改前必备份：`cp xxx xxx.bak` |
| `/usr`         | 用户程序（≈ Program Files） | 软件默认装这里               |
| `/usr/local`   | 手动编译/自定义安装         | **推荐放自己装的软件**       |
| `/var`         | 日志 / 缓存 / 数据          | `/var/log`是排错核心         |
| `/home`        | 普通用户家目录              | 你的文件优先放这里           |
| `/root`        | root 的家                   | 不要当数据仓库               |
| `/boot`        | 启动文件                    | ❌ 绝对别乱动                 |
| `/dev`         | 设备文件                    | 磁盘、CPU 都以文件形式存在   |
| `/proc``/sys`  | 内核视角                    | 看信息用，不改               |
| `/tmp`         | 临时目录                    | 重启可能清空                 |
| `/mnt``/media` | 挂载点                      | U 盘 / 外接磁盘              |

✅ **一句话总结**：

> **配置去 `/etc`，日志去 `/var/log`，程序去 `/usr/local`，数据别放 `/boot`。**

------

## 二、VIM：不是编辑器，是生存技能

### 三模式（必须形成肌肉记忆）

| 模式     | 作用             | 进入方式      |
| -------- | ---------------- | ------------- |
| 一般模式 | 移动、删除、复制 | 默认进入      |
| 编辑模式 | 打字             | `i`/ `a`/ `o` |
| 命令模式 | 保存、退出、搜索 | `:`           |

### 新手必会 10 条（每天敲一遍）

```
i          # 插入
Esc        # 返回一般模式
:wq        # 保存退出
:q!        # 强制退出不保存
dd         # 删除一行
yy p       # 复制一行并粘贴
u          # 撤销
/keyword   # 搜索
:noh       # 取消高亮
:set nu    # 显示行号
```

📌 **真实场景**：

> 90% 的时间你只是在：
>
> ```
> vim 配置文件 → i → 改几行 → Esc → :wq
> ```

------

## 三、网络配置（CentOS 7 标准做法）

### 1️⃣ 修改静态 IP

```
vim /etc/sysconfig/network-scripts/ifcfg-ens33
```

关键字段：

```
BOOTPROTO=static
ONBOOT=yes
IPADDR=192.168.1.100
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
DNS1=8.8.8.8
```

重启网络：

```
systemctl restart network
```

✅ 验证：

```
ip addr
ping www.baidu.com
```

------

## 四、服务管理：systemctl 是主角

### 新旧对比（理解即可）

| 旧                | 新                  |
| ----------------- | ------------------- |
| service xxx start | systemctl start xxx |
| chkconfig         | systemctl enable    |

### 最常用命令

```
systemctl status nginx
systemctl start nginx
systemctl restart nginx
systemctl enable nginx
systemctl disable nginx
```

🔍 查日志（排错神器）：

```
journalctl -xe -u nginx
```

------

## 五、防火墙：不是关掉，而是学会放行

### 基础操作

```
systemctl status firewalld
firewall-cmd --list-ports
```

### 放行端口（生产标准）

```
firewall-cmd --add-port=8080/tcp --permanent
firewall-cmd --reload
```

### 限制 IP（进阶）

```
firewall-cmd --permanent \
--add-rich-rule="rule family='ipv4' source address='192.168.1.50' port port='3306' protocol='tcp' accept"
firewall-cmd --reload
```

✅ **建议**：学习阶段可关，生产环境必须开。

------

## 六、常用命令（场景化速查）

### 文件 & 目录

```
ls -lh
cd -
mkdir -p a/b/c
cp -r dir1 dir2
rm -rf file
mv a.txt b.txt
```

### 查看内容

| 命令      | 场景     |
| --------- | -------- |
| `cat`     | 小文件   |
| `less`    | 大文件   |
| `tail -f` | 实时日志 |

```
tail -f /var/log/messages
```

### 权限（重点）

```
chmod 644 file
chmod 755 script.sh
chown -R user:group /data
```

📌 记住：

- 

  **目录要有 x**

- 

  **文件要有 r**

- 

  **脚本要有 x**

------

## 七、搜索 & 过滤（排错核心）

### find：找文件

```
find / -name nginx.conf 2>/dev/null
find /var/log -size +100M
```

### grep：找内容

```
grep -Rn "ERROR" /var/log
grep -i "mysql" config.conf
```

### 管道组合

```
ps aux | grep nginx
netstat -tunlp | grep 80
```

------

## 八、压缩 & 解压（面试 + 实战高频）

### tar（最常用）

```
tar -zcvf app.tar.gz app/
tar -zxvf app.tar.gz -C /opt
```

### zip（跨平台）

```
zip -r app.zip app/
unzip app.zip -d /opt
```

------

## 九、用户 & 权限管理（基础但重要）

```
useradd dev
passwd dev
usermod -g wheel dev
su - dev
```

✅ sudo 提权：

```
visudo
# 添加
dev ALL=(ALL) NOPASSWD:ALL
```

------

## 十、推荐学习路线（照着走，不迷路）

### 🗓 第一周：基础生存

- 

  Day1：目录结构 + ls/cd/pwd/mkdir

- 

  Day2：vim + 改一个真实配置文件

- 

  Day3：权限 + chmod/chown

- 

  Day4：systemctl + 防火墙

- 

  Day5：grep/find + 日志排查

### 🗓 第二周：实战进阶

- 

  shell 脚本（备份 / 清理日志）

- 

  磁盘挂载 / LVM 概念

- 

  SSH 密钥登录

- 

  安装 Nginx / MySQL

- 

  看 `journalctl`排错

------

## 十一、避坑清单（血泪总结）

❌ 不要 `rm -rf /`

❌ 不要随便关 SELinux（先设 permissive）

❌ 不要在生产机直接试命令

✅ 改配置前一定 `.bak`

✅ 用 `echo`先验证再执行

------

## 十二、结语

> **Linux 不是背出来的，是敲出来的。**

