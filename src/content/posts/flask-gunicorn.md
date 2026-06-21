---
title: Flask + Gunicorn 部署详细笔记
published: 2026-06-22
updated: 2026-06-22
draft: false
pinned: false
description: Flask + Gunicorn 部署详细笔记
category: 技术
tags:
  - flask项目部署
comment: true
---
## 一、环境问题诊断与解决

### 1.1 常见问题：`python: command not found`

#### 问题原因：

1. 系统未安装 Python
2. 只安装了 Python 3，但没有设置 `python`命令别名
3. Python 路径不在系统 PATH 中

#### 诊断步骤：

```
# 1. 检查系统类型
cat /etc/os-release
# 或
lsb_release -a

# 2. 查找已安装的 Python
which python
which python3
find /usr/bin -name "python*"

# 3. 检查 Python 版本
python3 --version
```

#### 解决方案：

**Ubuntu/Debian 系统：**

```
# 安装 Python 3
sudo apt update
sudo apt install -y python3 python3-pip python3-venv

# 设置 python 命令指向 python3
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3 1
# 或
sudo ln -s /usr/bin/python3 /usr/bin/python
```

**CentOS/RHEL/Rocky Linux：**

```
# 安装 Python 3
sudo yum install -y python3 python3-pip
# 或
sudo dnf install -y python3 python3-pip

# 创建软链接
sudo ln -s /usr/bin/python3 /usr/bin/python
```

**Alpine Linux：**

```
apk add python3 py3-pip
ln -s /usr/bin/python3 /usr/bin/python
```

### 1.2 验证安装

```
# 检查 Python
python --version
# 应该显示：Python 3.x.x

# 检查 pip
pip --version
# 或
pip3 --version
```

## 二、Flask 应用基础部署

### 2.1 项目目录结构

```
/usr/local/flaskapp/
├── venv/                    # 虚拟环境目录
├── app.py                   # Flask 主应用
├── requirements.txt         # 依赖文件
├── gunicorn_config.py       # Gunicorn 配置文件
├── start.sh                 # 启动脚本
└── logs/                   # 日志目录
```

### 2.2 创建虚拟环境

```
# 1. 进入项目目录
cd /usr/local/flaskapp

# 2. 创建虚拟环境
python -m venv venv

# 3. 激活虚拟环境
source venv/bin/activate
# Windows: venv\Scripts\activate

# 4. 验证虚拟环境
which python
which pip
# 应该指向 venv/bin/ 下的可执行文件
```

### 2.3 安装依赖

```
# 1. 创建 requirements.txt
cat > requirements.txt << 'EOF'
flask==2.3.3
gunicorn==21.2.0
EOF

# 2. 安装依赖
pip install -r requirements.txt
# 或单独安装
pip install flask gunicorn
```

### 2.4 创建 Flask 应用

```
# app.py
from flask import Flask, jsonify
import os
import socket

app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <h1>Flask 应用运行正常！</h1>
    <p>服务器: {}</p>
    <p>Python: {}</p>
    <p>时间: {}</p>
    '''.format(
        socket.gethostname(),
        os.popen('python --version').read().strip(),
        os.popen('date').read().strip()
    )

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'flask-app',
        'version': '1.0.0'
    })

@app.route('/api/data')
def get_data():
    return jsonify({
        'data': [1, 2, 3, 4, 5],
        'message': 'API 正常工作'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

## 三、Gunicorn 配置详解

### 3.1 基本启动方式

```
# 最简单的启动
gunicorn app:app
# 第一个 app 是模块名（app.py），第二个 app 是 Flask 应用实例

# 指定 worker 数量
gunicorn -w 4 app:app

# 指定绑定地址和端口
gunicorn -b 0.0.0.0:8000 app:app

# 指定 worker 类型
gunicorn -w 4 -k gevent app:app
```

### 3.2 Worker 类型选择

| Worker 类型 | 适用场景             | 命令 |
| ------------- | ---------------------- | ------ |
| sync        | 同步 I/O，CPU 密集型 | `-k sync`     |
| gevent      | 异步，I/O 密集型     | `-k gevent`     |
| eventlet    | 异步，I/O 密集型     | `-k eventlet`     |
| tornado     | 长连接，WebSocket    | `-k tornado`     |
| gthread     | 线程池               | `-k gthread`     |

### 3.3 配置文件方式（推荐）

```
# gunicorn_config.py
import multiprocessing

# 绑定地址
bind = "0.0.0.0:8000"

# Worker 数量（推荐公式：CPU核心数 * 2 + 1）
workers = multiprocessing.cpu_count() * 2 + 1
# 或手动指定
# workers = 4

# Worker 类型
worker_class = "sync"  # 默认同步
# worker_class = "gevent"  # 异步
# worker_class = "gthread"  # 线程
# worker_class = "eventlet"  # 异步

# 线程数（当使用 gthread 时）
threads = 2

# 每个 worker 的最大请求数
max_requests = 1000
max_requests_jitter = 50  # 随机抖动，避免所有 worker 同时重启

# 超时时间
timeout = 120
keepalive = 2

# 日志配置
accesslog = "-"  # 输出到 stdout，或指定文件路径如 "logs/access.log"
errorlog = "logs/error.log"
loglevel = "info"

# 进程名称
proc_name = "flask_app"

# 是否以守护进程运行
daemon = False  # 生产环境建议用 systemd 管理

# 用户/组（不要用 root）
# user = "www-data"
# group = "www-data"

# 工作目录
chdir = "/usr/local/flaskapp"

# 环境变量
raw_env = [
    "PYTHONPATH=/usr/local/flaskapp",
    "FLASK_ENV=production"
]

# 预加载应用（减少内存占用，但可能增加重启时间）
preload_app = True

# 启用进程守护
graceful_timeout = 30
```

### 3.4 使用配置文件启动

```
# 使用配置文件启动
gunicorn -c gunicorn_config.py app:app

# 后台运行
gunicorn -c gunicorn_config.py --daemon app:app

# 测试配置文件
gunicorn --check-config -c gunicorn_config.py app:app
```

## 四、生产环境优化配置

### 4.1 多配置文件方案

```
# config/base.py - 基础配置
import multiprocessing

class BaseConfig:
    bind = "0.0.0.0:8000"
    workers = multiprocessing.cpu_count() * 2 + 1
    timeout = 120
    keepalive = 2
    max_requests = 1000
    max_requests_jitter = 50
    preload_app = True
```

```
# config/production.py - 生产配置
from .base import BaseConfig

class ProductionConfig(BaseConfig):
    workers = 8
    worker_class = "gevent"
    accesslog = "logs/access.log"
    errorlog = "logs/error.log"
    loglevel = "warning"
    proc_name = "flask_app_prod"
    daemon = True
  
    # 安全设置
    limit_request_line = 4094
    limit_request_fields = 100
    limit_request_field_size = 8190
```

```
# config/development.py - 开发配置
from .base import BaseConfig

class DevelopmentConfig(BaseConfig):
    workers = 2
    reload = True  # 开发时自动重载
    accesslog = "-"
    errorlog = "-"
    loglevel = "debug"
    daemon = False
```

### 4.2 启动脚本

```
#!/bin/bash
# start.sh

# 进入项目目录
cd /usr/local/flaskapp

# 激活虚拟环境
source venv/bin/activate

# 创建日志目录
mkdir -p logs

# 设置环境变量
export PYTHONPATH=/usr/local/flaskapp
export FLASK_ENV=production

# 启动 Gunicorn
exec gunicorn \
    -c gunicorn_config.py \
    --pid gunicorn.pid \
    app:app
```

```
#!/bin/bash
# stop.sh

cd /usr/local/flaskapp

if [ -f gunicorn.pid ]; then
    kill $(cat gunicorn.pid)
    rm gunicorn.pid
    echo "Gunicorn 已停止"
else
    echo "未找到进程ID文件"
    pkill -f gunicorn
fi
```

```
#!/bin/bash
# restart.sh

./stop.sh
sleep 2
./start.sh
```

## 五、系统服务管理

### 5.1 使用 systemd（推荐）

```
# /etc/systemd/system/flaskapp.service
[Unit]
Description=Flask Application with Gunicorn
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/usr/local/flaskapp
Environment="PATH=/usr/local/flaskapp/venv/bin"
ExecStart=/usr/local/flaskapp/venv/bin/gunicorn -c gunicorn_config.py app:app
ExecReload=/bin/kill -s HUP $MAINPID
ExecStop=/bin/kill -s TERM $MAINPID
Restart=on-failure
RestartSec=5
KillMode=mixed
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 5.2 管理命令

```
# 重载 systemd 配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start flaskapp

# 停止服务
sudo systemctl stop flaskapp

# 重启服务
sudo systemctl restart flaskapp

# 查看状态
sudo systemctl status flaskapp

# 开机自启
sudo systemctl enable flaskapp

# 查看日志
sudo journalctl -u flaskapp -f
```

### 5.3 使用 supervisor

```
; /etc/supervisor/conf.d/flaskapp.conf
[program:flaskapp]
command=/usr/local/flaskapp/venv/bin/gunicorn -c gunicorn_config.py app:app
directory=/usr/local/flaskapp
user=www-data
autostart=true
autorestart=true
startretries=3
stderr_logfile=/var/log/flaskapp/error.log
stdout_logfile=/var/log/flaskapp/access.log
environment=PATH="/usr/local/flaskapp/venv/bin",PYTHONPATH="/usr/local/flaskapp"
```

## 六、Nginx 反向代理配置

### 6.1 Nginx 配置

```
# /etc/nginx/sites-available/flaskapp
upstream flask_app {
    server 127.0.0.1:8000;
    # 可以添加多个后端
    # server 127.0.0.1:8001;
    # server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
  
    # 访问日志
    access_log /var/log/nginx/flaskapp_access.log;
    error_log /var/log/nginx/flaskapp_error.log;
  
    # 静态文件处理
    location /static/ {
        alias /usr/local/flaskapp/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
  
    # 媒体文件
    location /media/ {
        alias /usr/local/flaskapp/media/;
        expires 30d;
    }
  
    # 代理到 Gunicorn
    location / {
        proxy_pass http://flask_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
  
        # 超时设置
        proxy_connect_timeout 75s;
        proxy_send_timeout 3600s;
        proxy_read_timeout 3600s;
  
        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
  
        # 缓冲区设置
        proxy_buffering off;
        proxy_request_buffering off;
    }
  
    # 安全头部
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### 6.2 启用 SSL（HTTPS）

```
# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
  
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
  
    # 现代 SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
  
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
  
    # 其余配置同上
    location / {
        proxy_pass http://flask_app;
        # ... 其他代理设置
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 七、监控与维护

### 7.1 日志管理

```
# 查看实时日志
tail -f logs/error.log
tail -f logs/access.log

# 使用 logrotate 管理日志
cat > /etc/logrotate.d/flaskapp << 'EOF'
/usr/local/flaskapp/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        [ -f /usr/local/flaskapp/gunicorn.pid ] && kill -USR1 $(cat /usr/local/flaskapp/gunicorn.pid)
    endscript
}
EOF
```

### 7.2 进程监控

```
# 查看 Gunicorn 进程树
pstree -ap | grep gunicorn

# 查看进程状态
ps aux | grep gunicorn

# 监控系统资源
top -p $(pgrep -d',' gunicorn)

# 使用 htop
htop -p $(pgrep -d',' gunicorn)
```

### 7.3 健康检查

```
# 创建健康检查脚本
cat > health_check.sh << 'EOF'
#!/bin/bash

HEALTH_URL="http://localhost:8000/health"
TIMEOUT=5
RETRY_COUNT=3

for i in $(seq 1 $RETRY_COUNT); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT $HEALTH_URL)
  
    if [ "$HTTP_CODE" = "200" ]; then
        echo "应用运行正常"
        exit 0
    fi
  
    echo "第 $i 次健康检查失败，状态码: $HTTP_CODE"
    sleep 2
done

echo "应用健康检查失败"
exit 1
EOF

chmod +x health_check.sh
```

## 八、故障排除

### 8.1 常见问题及解决方案

#### 问题1：`Address already in use`

```
# 查看占用端口的进程
sudo lsof -i :8000
sudo netstat -tulpn | grep :8000

# 杀死进程
sudo kill -9 <PID>

# 或强制杀死所有 Gunicorn 进程
pkill -9 gunicorn
```

#### 问题2：`ImportError: No module named 'flask'`

```
# 确保在虚拟环境中
source venv/bin/activate

# 确认 Flask 已安装
pip list | grep flask

# 重新安装
pip install -r requirements.txt
```

#### 问题3：Worker 频繁重启

```
# 在 gunicorn_config.py 中调整
timeout = 300  # 增加超时时间
max_requests = 10000  # 增加最大请求数
preload_app = True  # 预加载应用
```

#### 问题4：内存泄漏

```
# 监控内存使用
watch -n 5 "ps aux --sort=-%mem | head -10"

# 配置 worker 重启策略
max_requests = 1000
max_requests_jitter = 100
```

### 8.2 性能调优

```
# gunicorn_config.py
# 根据服务器配置调整
import multiprocessing

# CPU 核心数
cpu_count = multiprocessing.cpu_count()

# 内存限制（MB）
memory_limit = 4096

# Worker 数量
if cpu_count <= 2:
    workers = 3
elif cpu_count <= 4:
    workers = 5
else:
    workers = cpu_count * 2 + 1

# Worker 类型选择
# I/O 密集型：gevent/eventlet
# CPU 密集型：sync/gthread
worker_class = "gevent"
worker_connections = 1000
```

## 九、完整部署流程总结

### 9.1 一键部署脚本

```
#!/bin/bash
# deploy.sh

set -e  # 出错时退出

echo "=== 开始部署 Flask 应用 ==="

# 1. 安装 Python
if ! command -v python3 &> /dev/null; then
    echo "安装 Python 3..."
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv
    sudo ln -s /usr/bin/python3 /usr/bin/python
fi

# 2. 创建项目目录
PROJECT_DIR="/usr/local/flaskapp"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR

# 3. 创建虚拟环境
echo "创建虚拟环境..."
python -m venv venv
source venv/bin/activate

# 4. 安装依赖
echo "安装依赖..."
pip install --upgrade pip
pip install flask gunicorn

# 5. 创建应用文件
echo "创建应用文件..."
cat > app.py << 'EOF'
from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({'status': 'ok', 'message': '部署成功！'})

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
EOF

# 6. 创建 Gunicorn 配置
echo "创建 Gunicorn 配置..."
cat > gunicorn_config.py << 'EOF'
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
timeout = 120
accesslog = "-"
errorlog = "error.log"
loglevel = "info"
EOF

# 7. 创建启动脚本
echo "创建启动脚本..."
cat > start.sh << 'EOF'
#!/bin/bash
cd /usr/local/flaskapp
source venv/bin/activate
exec gunicorn -c gunicorn_config.py app:app
EOF
chmod +x start.sh

# 8. 创建 systemd 服务
echo "创建 systemd 服务..."
sudo cat > /etc/systemd/system/flaskapp.service << EOF
[Unit]
Description=Flask Application
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin"
ExecStart=$PROJECT_DIR/venv/bin/gunicorn -c gunicorn_config.py app:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 9. 启动服务
echo "启动服务..."
sudo systemctl daemon-reload
sudo systemctl start flaskapp
sudo systemctl enable flaskapp

# 10. 验证部署
echo "验证部署..."
sleep 2
curl -f http://localhost:8000/ || echo "启动失败，请检查日志"

echo "=== 部署完成！ ==="
echo "应用运行在: http://localhost:8000"
echo "查看状态: sudo systemctl status flaskapp"
echo "查看日志: sudo journalctl -u flaskapp -f"
```

### 9.2 使用说明

```
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh

# 手动部署步骤
1. 安装 Python
2. 创建项目目录
3. 设置虚拟环境
4. 安装依赖
5. 创建应用
6. 配置 Gunicorn
7. 配置 Nginx（可选）
8. 配置 systemd
9. 启动服务
10. 验证部署
```

## 十、最佳实践总结

1. **使用虚拟环境**：隔离项目依赖
2. **使用配置文件**：便于管理和版本控制
3. **合理配置 Worker**：根据服务器性能调整
4. **启用日志**：便于问题排查
5. **使用进程管理**：systemd 或 supervisor
6. **配置反向代理**：Nginx 处理静态文件和 SSL
7. **监控和告警**：设置健康检查
8. **定期更新**：保持依赖包最新
9. **备份配置**：配置文件纳入版本控制
10. **安全加固**：使用非 root 用户运行

这个笔记涵盖了从环境准备到生产部署的完整流程，包含了常见问题的解决方案和最佳实践建议。
