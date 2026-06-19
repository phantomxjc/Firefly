---
title: " InfinityFree 部署 lylme Spage 终极笔记"
published: 2026-06-18
updated: 2026-06-18
draft: false
pinned: false
description: 在 InfinityFree 免费主机上部署 自己的个人导航页
category: 技术
tags:
  - lylme Spage
comment: true
---

---

## 一、 核心结论（必读）

在 InfinityFree 免费主机上，**千万不要使用网页安装向导**。

* **原因**：InfinityFree 禁止了 `SHOW DATABASES`和 `CREATE DATABASE`权限，而 lylme 的安装向导强制依赖这些权限，会导致 **1227 Access Denied** 或 **1044 Access Denied** 致命错误。
* **真理**：**手动配置 + 手动导库**  **=**  **成功。**

---

## 二、 标准部署流程（SOP）

### 1. 环境准备

* **域名**：建议使用 InfinityFree 官方的 `*.epizy.com`或 `*.rf.gd`，第三方域名（如 `.xo.je`）解析不稳定。
* **PHP 设置**：在 VistaPanel 的 PHP Config 里，开启 `Display Errors`（方便排错），时区设为 `Asia/Shanghai`。

### 2. 数据库配置（关键）

1. 在面板创建数据库（如 `if0_xxxxx_lylmenav`）。
2. **记下全称**：数据库名、用户名、密码、主机地址（`sql301...`）。
3. **手动导库**：进入 phpMyAdmin，选中数据库，导入 `install/data/install_struct.sql`。

### 3. 文件部署

1. 通过 FileZilla 上传文件。
2. **注意层级**：确保 `index.php`直接在 `htdocs/`下，不要套多层文件夹。
3. **静态验证**：传一个 `aaa.html`测试是否能访问，排除路径问题。

### 4. 手动创建配置文件（核心步骤）

**不要运行安装向导**，直接在本地电脑新建 `config.php`：

```
<?php
/*数据库配置*/
$dbconfig=array(
    "host" => "sql301.infinityfree.com", // 填面板里的 Hostname
    "port" => 3306,
    "user" => "if0_42011432",           // 你的用户名
    "pwd"  => "你的密码",                // 你的密码
    "dbname" => "if0_42011432_lylmenav", // 【必须】完整的数据库名
);
?>
```

* 上传至 `htdocs/config.php`。

### 5. 绕过安装锁

由于我们没有运行安装向导，程序会因为没有 `install.lock`而一直跳转。

1. 进入 `htdocs/install/`目录。
2. 新建一个名为 **​`install.lock`​** 的空文件（无后缀）。
3. 上传。

### 6. 访问网站

清除浏览器缓存，访问 `http://你的域名/`。

**此时应能正常显示首页。**

---

## 三、 常见报错与解决速查表

| 报错信息 | 原因                                             | 解决方案                               |
| ---------- | -------------------------------------------------- | ---------------------------------------- |
| **404 Not Found**         | 1. 文件不在`htdocs`根目录<br />2. 域名解析未生效<br />3.`index.php`未被解析 | 1. 检查 FTP 路径<br />2. 用`aaa.html`验证<br />3. 检查`.htaccess`   |
| **1227 Access denied (SHOW DATABASES)**         | 安装向导试图列出所有数据库                       | **放弃向导**，使用本文的“手动配置法”             |
| **1044 Access denied to database 'xxx'**         | 数据库名填写错误（如只填了用户名）               | 检查`config.php`中的`dbname`是否为完整名称（含下划线后缀） |
| **Call to undefined function insInfo()**         | PHP 代码执行顺序错误或函数未定义                 | 使用原版代码结构，不要随意调整函数位置 |
| **Request Error!**         | 服务器拦截（WAF）或 PHP 严重语法错误             | 检查`.htaccess`或开启`display_errors`看详情                       |

---

## 四、 文件结构示例

成功后的 `htdocs`目录应该是这样的：

```
htdocs/
├── index.php          (入口文件)
├── config.php         (手动创建的数据库配置)
├── install/
│   ├── install.lock   (手动创建的空文件，骗过跳转)
│   └── index.php      (可以保留，但不要运行)
├── include/
├── assets/
└── admin/
```

---
