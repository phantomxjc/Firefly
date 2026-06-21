---
title: 飞牛OS部署HTTPS服务并通过FRP内网穿透完整指南
published: 2026-06-22
updated: 2026-06-22
draft: false
pinned: false
description: 飞牛OS部署HTTPS服务并通过FRP内网穿透完整指南
category: 技术
tags:
  - 飞牛nas
comment: true
---
## 📋 项目概述

### 目标环境

* **飞牛OS**：内网服务器，部署各类服务
* **公网服务器**：具有公网IP，仅运行FRP服务端
* **无域名**：使用IP地址直接访问
* **技术要求**：HTTPS加密 + 反向代理 + 内网穿透

### 架构流程

```
用户浏览器 → 公网IP:端口 → FRP服务端 → FRP客户端 → Nginx(SSL终止) → 内网服务
```

## 🛠️ 核心配置步骤

### 1. 生成共享SSL证书

```
# 创建证书目录
sudo mkdir -p /etc/nginx/ssl
cd /etc/nginx/ssl

# 生成私钥
sudo openssl genrsa -out shared_service.key 2048

# 生成证书请求（Common Name填写公网IP）
sudo openssl req -new -key shared_service.key -out shared_service.csr

# 生成自签名证书
sudo openssl x509 -req -days 365 -in shared_service.csr -signkey shared_service.key -out shared_service.crt

# 设置权限
sudo chown -R root:www-data /etc/nginx/ssl
sudo chmod -R 750 /etc/nginx/ssl
```

### 2. 配置Nginx主配置文件

`/etc/nginx/nginx.conf`：

```
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
}

http {
    # 基础设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
  
    # MIME类型
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
  
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
  
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
  
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
  
    # SSL优化设置
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
  
    # 包含服务配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### 3. 配置Nginx服务代理

服务A配置 `/etc/nginx/conf.d/service_a.conf`：

```
server {
    listen 8443 ssl;
    server_name _;
  
    # 使用共享证书
    ssl_certificate /etc/nginx/ssl/shared_service.crt;
    ssl_certificate_key /etc/nginx/ssl/shared_service.key;
  
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
  
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

服务B配置 `/etc/nginx/conf.d/service_b.conf`：

```
server {
    listen 9443 ssl;
    server_name _;
  
    ssl_certificate /etc/nginx/ssl/shared_service.crt;
    ssl_certificate_key /etc/nginx/ssl/shared_service.key;
  
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
  
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 配置FRP内网穿透

FRP服务端配置（公网服务器）`frps.ini`：

```
[common]
bind_port = 7000
token = your_secure_token_here
```

FRP客户端配置（飞牛OS）`frpc.ini`：

```
[common]
server_addr = 公网服务器IP
server_port = 7000
token = your_secure_token_here

[service_a_https]
type = tcp
local_ip = 127.0.0.1
local_port = 8443
remote_port = 18080

[service_b_https]
type = tcp
local_ip = 127.0.0.1
local_port = 9443
remote_port = 18081
```

## 🔧 部署与验证命令

### 应用配置

```
# 检查Nginx配置语法
sudo nginx -t

# 重载Nginx配置
sudo systemctl reload nginx

# 重启FRP客户端
sudo systemctl restart frpc

# 检查服务状态
sudo systemctl status nginx
sudo systemctl status frpc
```

### 验证步骤

```
# 1. 检查端口监听
sudo netstat -tulpn | grep nginx

# 2. 本地HTTPS测试（跳过证书验证）
curl -k https://127.0.0.1:8443
curl -k https://127.0.0.1:9443

# 3. 详细连接测试
curl -v -k https://127.0.0.1:8443

# 4. 检查防火墙
sudo ufw status
sudo ufw allow 8443/tcp
sudo ufw allow 9443/tcp
```

### 公网访问测试

* 服务A：`https://公网IP:18080`
* 服务B：`https://公网IP:18081`

**注意**：浏览器会显示"不安全"警告，这是自签名证书的正常现象。

## ⚠️ 重要注意事项

### 证书相关

1. **自签名证书限制**：浏览器不信任，需要手动确认安全风险
2. **IP变更处理**：公网IP变化需重新生成证书
3. **证书有效期**：自签名证书默认1年，需定期更新

### 安全考虑

1. **防火墙配置**：仅开放必要端口（18080, 18081, 7000）
2. **FRP令牌**：使用强密码保护FRP连接
3. **服务隔离**：不同服务使用不同端口，避免权限混淆

### 维护建议

1. **日志监控**：定期检查Nginx和FRP日志
2. **备份配置**：重要配置文件定期备份
3. **域名考虑**：长期使用建议申请域名+Let's Encrypt证书

## 🐛 常见问题排查

### Nginx配置错误

```
# 检查具体错误
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### 证书验证问题

```
# 跳过验证测试
curl -k https://127.0.0.1:8443

# 指定证书测试
curl --cacert /etc/nginx/ssl/shared_service.crt https://127.0.0.1:8443
```

### FRP连接问题

```
# 检查FRP状态和日志
sudo systemctl status frpc
sudo journalctl -u frpc -f
```

## 💡 优化建议

1. **SSL参数优化**：可根据安全要求调整加密套件
2. **HTTP/2支持**：在Nginx配置中启用HTTP/2提升性能
3. **缓存配置**：根据服务特性配置适当的缓存策略
4. **负载均衡**：多实例服务可配置upstream实现负载均衡

---

**文档版本**：1.0

**最后更新**：2025年12月

**适用环境**：飞牛OS + Nginx + FRP + 自签名证书
