---
title: Python 爬虫学习笔记
published: 2026-06-21
updated: 2026-06-21
draft: false
pinned: false
description: python爬虫浅见
image: images/python-.png
comment: true
---
## 一、爬虫基础概念

### 1.1 什么是网络爬虫？

* **定义**：网络爬虫是一种自动化程序，用于从互联网上抓取和提取数据
* **工作原理**：

  1. 发送 HTTP 请求到目标网站
  2. 获取网页的 HTML 内容
  3. 解析 HTML 提取所需数据
  4. 存储数据到本地或数据库

### 1.2 爬虫的分类

* **通用爬虫**：搜索引擎爬虫（Google、Baidu）
* **专用爬虫**：针对特定网站的爬虫
* **增量爬虫**：只爬取新增或更新的内容
* **深度爬虫**：递归爬取链接

### 1.3 爬虫的法律和伦理

* 遵守 `robots.txt` 规则
* 尊重网站的 `User-Agent` 限制
* 不过度占用服务器资源
* 遵守网站的服务条款
* 避免爬取个人隐私信息

## 二、环境搭建

### 2.1 必要的库安装

```
# 基础库
pip install requests          # HTTP 请求库
pip install beautifulsoup4    # HTML 解析库
pip install lxml              # XML/HTML 解析库
pip install selenium          # 动态网页爬虫
pip install scrapy            # 爬虫框架
pip install pandas            # 数据处理
pip install pymongo           # MongoDB 数据库
pip install mysql-connector-python  # MySQL 数据库
```

### 2.2 验证安装

```
import requests
import bs4
import selenium
import scrapy
import pandas
print("All libraries installed successfully!")
```

## 三、Requests 库（静态网页爬虫）

### 3.1 基本请求

```
import requests

# 发送 GET 请求
response = requests.get('https://www.example.com')

# 检查响应状态
print(response.status_code)  # 200 表示成功
print(response.text)         # 获取响应文本
print(response.content)      # 获取响应字节
print(response.url)          # 获取最终 URL
print(response.headers)      # 获取响应头
```

### 3.2 请求参数

```
# 带参数的 GET 请求
params = {'q': 'python', 'page': 1}
response = requests.get('https://www.example.com/search', params=params)

# 自定义请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
response = requests.get('https://www.example.com', headers=headers)

# POST 请求
data = {'username': 'admin', 'password': '123456'}
response = requests.post('https://www.example.com/login', data=data)

# JSON 数据
json_data = {'key': 'value'}
response = requests.post('https://www.example.com/api', json=json_data)

# 文件上传
files = {'file': open('test.txt', 'rb')}
response = requests.post('https://www.example.com/upload', files=files)
```

### 3.3 会话管理

```
# 使用 Session 保持连接
session = requests.Session()
session.headers.update({'User-Agent': 'Mozilla/5.0'})

# 多个请求共享 Cookie
response1 = session.get('https://www.example.com/login')
response2 = session.get('https://www.example.com/profile')

# 关闭会话
session.close()
```

### 3.4 超时和重试

```
# 设置超时
response = requests.get('https://www.example.com', timeout=5)

# 重试机制
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=3, backoff_factor=0.5)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)

response = session.get('https://www.example.com')
```

## 四、BeautifulSoup 库（HTML 解析）

### 4.1 基本用法

```
from bs4 import BeautifulSoup

html = """
<html>
  <body>
    <div class="container">
      <h1 id="title">标题</h1>
      <p class="content">内容</p>
    </div>
  </body>
</html>
"""

# 创建 BeautifulSoup 对象
soup = BeautifulSoup(html, 'html.parser')

# 获取标签
title = soup.find('h1')
print(title.text)  # 获取文本内容
print(title.get('id'))  # 获取属性值
```

### 4.2 查找元素

```
# find() - 返回第一个匹配的元素
element = soup.find('div', class_='container')

# find_all() - 返回所有匹配的元素
elements = soup.find_all('p')

# select() - 使用 CSS 选择器
elements = soup.select('div.container > p')

# select_one() - 返回第一个匹配的元素
element = soup.select_one('h1#title')
```

### 4.3 导航树

```
# 获取子元素
children = soup.div.children  # 迭代器
children_list = list(soup.div.children)

# 获取后代元素
descendants = soup.div.descendants

# 获取父元素
parent = element.parent

# 获取兄弟元素
next_sibling = element.next_sibling
previous_sibling = element.previous_sibling

# 获取下一个/上一个元素
next_element = element.next
previous_element = element.previous
```

### 4.4 提取数据

```
# 获取文本
text = element.get_text()
text = element.text
text = element.string

# 获取属性
href = element.get('href')
href = element['href']

# 获取所有属性
attrs = element.attrs

# 移除标签
element.decompose()

# 替换标签
element.replace_with('new content')
```

## 五、Lxml 库（高效解析）

### 5.1 XPath 选择

```
from lxml import etree

html = """
<html>
  <body>
    <div class="container">
      <h1>标题</h1>
      <p class="content">内容</p>
    </div>
  </body>
</html>
"""

# 创建解析器
parser = etree.HTMLParser()
tree = etree.HTML(html, parser)

# XPath 查询
title = tree.xpath('//h1/text()')[0]
content = tree.xpath('//p[@class="content"]/text()')[0]

# 获取属性
href = tree.xpath('//a/@href')

# 获取元素
elements = tree.xpath('//div[@class="container"]//p')
```

### 5.2 CSS 选择器

```
from lxml import etree
from cssselect import GenericTranslator

# 使用 CSS 选择器
translator = GenericTranslator()
xpath = translator.css_to_xpath('div.container > p')
elements = tree.xpath(xpath)
```

## 六、Selenium 库（动态网页爬虫）

### 6.1 基本使用

```
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 创建浏览器实例
driver = webdriver.Chrome()

# 打开网页
driver.get('https://www.example.com')

# 等待元素加载
wait = WebDriverWait(driver, 10)
element = wait.until(EC.presence_of_element_located((By.ID, 'element_id')))

# 获取页面源代码
html = driver.page_source

# 关闭浏览器
driver.quit()
```

### 6.2 元素交互

```
# 点击元素
element.click()

# 输入文本
element.send_keys('text')

# 提交表单
element.submit()

# 获取文本
text = element.text

# 获取属性
attribute = element.get_attribute('href')
```

## 七、Scrapy 框架（大规模爬虫）

### 7.1 项目创建

```
# 创建 Scrapy 项目
scrapy startproject myproject

# 创建爬虫
cd myproject
scrapy genspider myspider example.com
```

### 7.2 爬虫编写

```
import scrapy

class MySpider(scrapy.Spider):
    name = 'myspider'
    allowed_domains = ['example.com']
    start_urls = ['https://www.example.com']
  
    def parse(self, response):
        # 提取数据
        for item in response.css('div.item'):
            yield {
                'title': item.css('h2::text').get(),
                'price': item.css('span.price::text').get(),
                'url': item.css('a::attr(href)').get(),
            }
  
        # 跟随链接
        next_page = response.css('a.next::attr(href)').get()
        if next_page:
            yield scrapy.Request(next_page, callback=self.parse)
```

### 7.3 运行爬虫

```
# 运行爬虫
scrapy crawl myspider

# 保存为 JSON
scrapy crawl myspider -o output.json

# 保存为 CSV
scrapy crawl myspider -o output.csv
```

## 八、数据存储

### 8.1 保存为 CSV

```
import csv

data = [
    {'name': 'Item 1', 'price': 100},
    {'name': 'Item 2', 'price': 200},
]

with open('data.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'price'])
    writer.writeheader()
    writer.writerows(data)
```

### 8.2 保存为 JSON

```
import json

data = [
    {'name': 'Item 1', 'price': 100},
    {'name': 'Item 2', 'price': 200},
]

with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
```

### 8.3 保存到 MongoDB

```
from pymongo import MongoClient

# 连接数据库
client = MongoClient('mongodb://localhost:27017/')
db = client['mydb']
collection = db['items']

# 插入数据
data = {'name': 'Item 1', 'price': 100}
collection.insert_one(data)

# 查询数据
result = collection.find_one({'name': 'Item 1'})
print(result)

# 关闭连接
client.close()
```

### 8.4 保存到 MySQL

```
import mysql.connector

# 连接数据库
conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='password',
    database='mydb'
)

cursor = conn.cursor()

# 插入数据
sql = "INSERT INTO items (name, price) VALUES (%s, %s)"
val = ("Item 1", 100)
cursor.execute(sql, val)
conn.commit()

# 查询数据
cursor.execute("SELECT * FROM items")
results = cursor.fetchall()
for row in results:
    print(row)

# 关闭连接
cursor.close()
conn.close()
```

## 九、完整爬虫示例

### 9.1 爬取电商网站

```
import requests
from bs4 import BeautifulSoup
import csv
import time

def scrape_products(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  
    products = []
  
    for page in range(1, 6):  # 爬取 5 页
        params = {'page': page}
        response = requests.get(url, headers=headers, params=params)
  
        if response.status_code != 200:
            print(f"Failed to fetch page {page}")
            continue
  
        soup = BeautifulSoup(response.text, 'html.parser')
  
        # 查找所有产品
        items = soup.find_all('div', class_='product-item')
  
        for item in items:
            try:
                name = item.find('h2', class_='product-name').text.strip()
                price = item.find('span', class_='product-price').text.strip()
                url_link = item.find('a')['href']
          
                products.append({
                    'name': name,
                    'price': price,
                    'url': url_link
                })
            except AttributeError:
                continue
  
        print(f"Scraped page {page}, total items: {len(products)}")
        time.sleep(1)  # 延迟 1 秒，避免被封 IP
  
    return products

# 保存数据
def save_to_csv(products, filename='products.csv'):
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'price', 'url'])
        writer.writeheader()
        writer.writerows(products)
    print(f"Data saved to {filename}")

# 执行爬虫
if __name__ == '__main__':
    url = 'https://www.example.com/products'
    products = scrape_products(url)
    save_to_csv(products)
```

### 9.2 爬取新闻网站

```
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json

def scrape_news(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
  
    news_list = []
  
    # 查找所有新闻
    articles = soup.find_all('article', class_='news-item')
  
    for article in articles:
        try:
            title = article.find('h2', class_='news-title').text.strip()
            content = article.find('p', class_='news-content').text.strip()
            author = article.find('span', class_='author').text.strip()
            date = article.find('span', class_='date').text.strip()
      
            news_list.append({
                'title': title,
                'content': content,
                'author': author,
                'date': date,
                'scraped_at': datetime.now().isoformat()
            })
        except AttributeError:
            continue
  
    return news_list

# 保存为 JSON
def save_to_json(news_list, filename='news.json'):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(news_list, f, ensure_ascii=False, indent=2)
    print(f"Data saved to {filename}")

# 执行爬虫
if __name__ == '__main__':
    url = 'https://www.example.com/news'
    news = scrape_news(url)
    save_to_json(news)
```

## 十、常见问题和解决方案

### 10.1 被网站封 IP

```
# 使用代理
proxies = {
    'http': 'http://proxy.example.com:8080',
    'https': 'https://proxy.example.com:8080',
}
response = requests.get(url, proxies=proxies)

# 使用随机 User-Agent
import random

user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
]

headers = {'User-Agent': random.choice(user_agents)}
response = requests.get(url, headers=headers)

# 添加延迟
import time
time.sleep(random.uniform(1, 3))
```

### 10.2 处理 JavaScript 渲染的页面

```
# 使用 Selenium
from selenium import webdriver

driver = webdriver.Chrome()
driver.get(url)

# 等待 JavaScript 加载完成
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

wait = WebDriverWait(driver, 10)
wait.until(EC.presence_of_element_located((By.CLASS_NAME, 'content')))

html = driver.page_source
driver.quit()

# 使用 BeautifulSoup 解析
soup = BeautifulSoup(html, 'html.parser')
```

### 10.3 处理编码问题

```
# 自动检测编码
import chardet

response = requests.get(url)
encoding = chardet.detect(response.content)['encoding']
response.encoding = encoding

html = response.text
```

### 10.4 处理异常

```
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

try:
    response = requests.get(url, timeout=5)
    response.raise_for_status()
except Timeout:
    print("Request timeout")
except ConnectionError:
    print("Connection error")
except RequestException as e:
    print(f"Request error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

## 十一、爬虫礼仪和最佳实践

### 11.1 遵守 robots.txt

```
from urllib.robotparser import RobotFileParser

rp = RobotFileParser()
rp.set_url('https://www.example.com/robots.txt')
rp.read()

# 检查是否可以爬取
if rp.can_fetch('*', 'https://www.example.com/page'):
    print("Can fetch this page")
else:
    print("Cannot fetch this page")
```

### 11.2 设置合理的延迟

```
import time
import random

# 随机延迟
delay = random.uniform(1, 3)
time.sleep(delay)

# 或使用固定延迟
time.sleep(2)
```

### 11.3 使用 User-Agent

```
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
response = requests.get(url, headers=headers)
```

### 11.4 记录日志

```
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.info('Starting scraper')
logger.error('Error occurred')
```

## 十二、性能优化

### 12.1 多线程爬虫

```
import threading
import queue
import requests
from bs4 import BeautifulSoup

def worker(q):
    while True:
        url = q.get()
        if url is None:
            break
  
        try:
            response = requests.get(url, timeout=5)
            soup = BeautifulSoup(response.text, 'html.parser')
            print(f"Scraped: {url}")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            q.task_done()

# 创建队列和线程
q = queue.Queue()
num_threads = 5

threads = []
for i in range(num_threads):
    t = threading.Thread(target=worker, args=(q,))
    t.start()
    threads.append(t)

# 添加 URL
urls = ['https://www.example.com/page1', 'https://www.example.com/page2']
for url in urls:
    q.put(url)

# 等待完成
q.join()

# 停止线程
for i in range(num_threads):
    q.put(None)
for t in threads:
    t.join()
```

### 12.2 异步爬虫

```
import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def fetch(session, url):
    async with session.get(url) as response:
        return await response.text()

async def scrape(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
  
        for html in results:
            soup = BeautifulSoup(html, 'html.parser')
            print(soup.title.string)

# 执行
urls = ['https://www.example.com/page1', 'https://www.example.com/page2']
asyncio.run(scrape(urls))
```

## 十三、参考资源

* **Requests 文档**：[https://requests.readthedocs.io/](https://requests.readthedocs.io/)
* **BeautifulSoup 文档**：[https://www.crummy.com/software/BeautifulSoup/](https://www.crummy.com/software/BeautifulSoup/)
* **Scrapy 文档**：[https://docs.scrapy.org/](https://docs.scrapy.org/)
* **Selenium 文档**：[https://www.selenium.dev/documentation/](https://www.selenium.dev/documentation/)
* **XPath 教程**：[https://www.w3schools.com/xml/xpath_intro.asp](https://www.w3schools.com/xml/xpath_intro.asp)

## 十四、学习路线

1. **基础阶段**：Requests + BeautifulSoup 爬取静态网页
2. **进阶阶段**：Selenium 爬取动态网页，数据存储
3. **框架阶段**：学习 Scrapy 框架，大规模爬虫
4. **优化阶段**：多线程/异步爬虫，性能优化
5. **实战阶段**：完整项目，反爬虫对抗

**最后更新**：2026年3月30日**学习建议**：

* 遵守爬虫伦理，不爬取个人隐私
* 尊重网站的 robots.txt 规则
* 设置合理的请求延迟
* 使用代理和轮换 User-Agent
* 从小项目开始，逐步提升难度
