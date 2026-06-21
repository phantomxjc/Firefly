---
title: " Selenium 自动化测试学习笔记"
published: 2026-06-22
updated: 2026-06-22
draft: false
pinned: false
description: Selenium 自动化测试学习笔记
category: 技术
tags:
  - selinum
---
## 一、Selenium 基础概念

### 1.1 什么是 Selenium？

* **定义**：Selenium 是一个开源的自动化测试框架，用于自动化 Web 应用程序的测试
* **主要用途**：

  * 自动化功能测试
  * 自动化回归测试
  * Web 爬虫和数据采集
  * 自动化重复性任务
* **支持语言**：Java、Python、C#、Ruby、JavaScript 等
* **支持浏览器**：Chrome、Firefox、Safari、Edge、IE 等

### 1.2 Selenium 的三个主要版本

* **Selenium 1.0（Selenium RC）** ：已过时
* **Selenium 2.0（WebDriver）** ：当前主流版本
* **Selenium 3.0/4.0**：最新版本，增强了功能和性能

## 二、环境搭建

### 2.1 Python 环境安装

#### 安装 Selenium 库

```
pip install selenium
```

#### 验证安装

```
import selenium
print(selenium.__version__)
```

### 2.2 WebDriver 配置

#### 下载 WebDriver

* **Chrome**：下载 ChromeDriver（[https://chromedriver.chromium.org/](https://chromedriver.chromium.org/)）
* **Firefox**：下载 GeckoDriver（[https://github.com/mozilla/geckodriver/releases](https://github.com/mozilla/geckodriver/releases)）
* **Edge**：下载 EdgeDriver（[https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/)）

#### 配置 WebDriver 路径

```
from selenium import webdriver

# 方式1：指定完整路径
driver = webdriver.Chrome('/path/to/chromedriver')

# 方式2：将 WebDriver 加入系统 PATH，直接使用
driver = webdriver.Chrome()

# 方式3：Selenium 4.0+ 自动下载
driver = webdriver.Chrome()  # 自动下载匹配版本的 ChromeDriver
```

## 三、基本操作

### 3.1 打开浏览器和网页

```
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 创建 Chrome 浏览器实例
driver = webdriver.Chrome()

# 打开网页
driver.get('https://www.example.com')

# 获取页面标题
title = driver.title
print(title)

# 获取当前 URL
url = driver.current_url
print(url)

# 关闭浏览器
driver.quit()
```

### 3.2 元素定位

#### 八种定位方式

```
from selenium.webdriver.common.by import By

# 1. ID 定位
element = driver.find_element(By.ID, 'element_id')

# 2. NAME 定位
element = driver.find_element(By.NAME, 'element_name')

# 3. CLASS_NAME 定位
element = driver.find_element(By.CLASS_NAME, 'class_name')

# 4. TAG_NAME 定位
element = driver.find_element(By.TAG_NAME, 'tag_name')

# 5. CSS_SELECTOR 定位
element = driver.find_element(By.CSS_SELECTOR, 'css_selector')

# 6. XPATH 定位
element = driver.find_element(By.XPATH, '//xpath/expression')

# 7. LINK_TEXT 定位（完全匹配链接文本）
element = driver.find_element(By.LINK_TEXT, 'link_text')

# 8. PARTIAL_LINK_TEXT 定位（部分匹配链接文本）
element = driver.find_element(By.PARTIAL_LINK_TEXT, 'partial_link_text')

# 查找多个元素
elements = driver.find_elements(By.CLASS_NAME, 'class_name')
```

#### XPath 常用表达式

```
# 绝对路径
//html/body/div/p

# 相对路径
//p

# 属性定位
//input[@id='username']
//input[@type='text']

# 多个属性
//input[@id='username' and @type='text']

# 模糊匹配
//input[contains(@id, 'user')]
//input[starts-with(@id, 'user')]

# 文本定位
//button[text()='登录']
//button[contains(text(), '登')]

# 索引定位
//p[1]  # 第一个 p 标签
//p[last()]  # 最后一个 p 标签

# 父元素定位
//input[@id='username']/..

# 兄弟元素定位
//input[@id='username']/following-sibling::button
```

### 3.3 元素交互

```
# 点击元素
element.click()

# 输入文本
element.send_keys('text_to_input')

# 清空输入框
element.clear()

# 提交表单
element.submit()

# 获取元素文本
text = element.text

# 获取元素属性
attribute = element.get_attribute('attribute_name')

# 获取元素 CSS 属性
css_value = element.value_of_css_property('property_name')

# 判断元素是否可见
is_displayed = element.is_displayed()

# 判断元素是否启用
is_enabled = element.is_enabled()

# 判断元素是否被选中
is_selected = element.is_selected()

# 获取元素大小
size = element.size  # {'width': 100, 'height': 50}

# 获取元素位置
location = element.location  # {'x': 10, 'y': 20}
```

## 四、等待机制

### 4.1 隐式等待（Implicit Wait）

```
from selenium import webdriver

driver = webdriver.Chrome()

# 设置隐式等待，单位为秒
driver.implicitly_wait(10)

# 隐式等待对所有元素查找都有效
element = driver.find_element(By.ID, 'element_id')
```

**特点**：

* 全局设置，对所有元素查找有效
* 如果元素在指定时间内找到，立即返回
* 如果超时仍未找到，抛出 NoSuchElementException

### 4.2 显式等待（Explicit Wait）

```
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

driver = webdriver.Chrome()

# 创建 WebDriverWait 对象，最多等待 10 秒
wait = WebDriverWait(driver, 10)

# 等待元素出现
element = wait.until(EC.presence_of_element_located((By.ID, 'element_id')))

# 等待元素可见
element = wait.until(EC.visibility_of_element_located((By.ID, 'element_id')))

# 等待元素可点击
element = wait.until(EC.element_to_be_clickable((By.ID, 'button_id')))

# 等待元素不可见
wait.until(EC.invisibility_of_element_located((By.ID, 'element_id')))

# 等待元素被选中
wait.until(EC.element_to_be_selected((By.ID, 'checkbox_id')))

# 等待文本出现
wait.until(EC.text_to_be_present_in_element((By.ID, 'element_id'), 'expected_text'))

# 等待属性值
wait.until(EC.text_to_be_present_in_element_value((By.ID, 'input_id'), 'expected_value'))

# 等待 URL 包含特定文本
wait.until(EC.url_contains('expected_url'))

# 等待 URL 完全匹配
wait.until(EC.url_to_be('exact_url'))

# 等待标题包含特定文本
wait.until(EC.title_contains('expected_title'))

# 等待标题完全匹配
wait.until(EC.title_is('exact_title'))

# 等待 alert 出现
alert = wait.until(EC.alert_is_present())
```

### 4.3 强制等待（Sleep）

```
import time

# 强制等待 3 秒
time.sleep(3)
```

**注意**：尽量避免使用强制等待，因为会降低测试效率。

### 4.4 等待最佳实践

```
# ✅ 推荐：使用显式等待
wait = WebDriverWait(driver, 10)
element = wait.until(EC.element_to_be_clickable((By.ID, 'button_id')))
element.click()

# ❌ 不推荐：使用隐式等待
driver.implicitly_wait(10)
element = driver.find_element(By.ID, 'button_id')
element.click()

# ❌ 不推荐：使用强制等待
time.sleep(10)
element = driver.find_element(By.ID, 'button_id')
element.click()
```

## 五、高级操作

### 5.1 鼠标操作

```
from selenium.webdriver.common.action_chains import ActionChains

driver = webdriver.Chrome()
actions = ActionChains(driver)

# 悬停
actions.move_to_element(element).perform()

# 右键点击
actions.context_click(element).perform()

# 双击
actions.double_click(element).perform()

# 拖拽
actions.drag_and_drop(source_element, target_element).perform()

# 链式操作
actions.move_to_element(element1).click().move_to_element(element2).click().perform()
```

### 5.2 键盘操作

```
from selenium.webdriver.common.keys import Keys

# 输入特殊键
element.send_keys(Keys.ENTER)
element.send_keys(Keys.TAB)
element.send_keys(Keys.ESCAPE)
element.send_keys(Keys.SPACE)
element.send_keys(Keys.BACKSPACE)
element.send_keys(Keys.DELETE)

# 组合键
element.send_keys(Keys.CONTROL + 'a')  # Ctrl + A
element.send_keys(Keys.COMMAND + 'a')  # Cmd + A (Mac)
element.send_keys(Keys.SHIFT + 'a')    # Shift + A

# 快捷键
element.send_keys(Keys.CONTROL + Keys.SHIFT + 'a')  # Ctrl + Shift + A
```

### 5.3 下拉框操作

```
from selenium.webdriver.support.select import Select

# 获取 select 元素
select_element = driver.find_element(By.ID, 'select_id')
select = Select(select_element)

# 按可见文本选择
select.select_by_visible_text('Option 1')

# 按值选择
select.select_by_value('value1')

# 按索引选择
select.select_by_index(0)

# 获取所有选项
options = select.options

# 获取当前选中的选项
selected_option = select.first_selected_option

# 取消选择（仅对多选有效）
select.deselect_by_visible_text('Option 1')
select.deselect_all()
```

### 5.4 Alert 处理

```
from selenium.webdriver.common.alert import Alert

# 获取 alert
alert = driver.switch_to.alert

# 接受 alert
alert.accept()

# 拒绝 alert
alert.dismiss()

# 获取 alert 文本
text = alert.text

# 在 alert 中输入文本
alert.send_keys('text')

# 完整示例
try:
    alert = WebDriverWait(driver, 10).until(EC.alert_is_present())
    alert.accept()
except:
    print('No alert found')
```

### 5.5 窗口和标签页操作

```
# 获取当前窗口句柄
current_handle = driver.current_window_handle

# 获取所有窗口句柄
all_handles = driver.window_handles

# 切换到指定窗口
driver.switch_to.window(all_handles[1])

# 切换到新打开的窗口
driver.switch_to.window(driver.window_handles[-1])

# 关闭当前窗口
driver.close()

# 关闭所有窗口
driver.quit()

# 获取窗口大小
size = driver.get_window_size()

# 设置窗口大小
driver.set_window_size(1024, 768)

# 最大化窗口
driver.maximize_window()

# 最小化窗口
driver.minimize_window()

# 全屏
driver.fullscreen_window()
```

### 5.6 Frame 和 IFrame 操作

```
# 切换到 iframe（按索引）
driver.switch_to.frame(0)

# 切换到 iframe（按 ID）
driver.switch_to.frame('iframe_id')

# 切换到 iframe（按 name）
driver.switch_to.frame('iframe_name')

# 切换到 iframe（按元素）
iframe_element = driver.find_element(By.TAG_NAME, 'iframe')
driver.switch_to.frame(iframe_element)

# 切换回主文档
driver.switch_to.default_content()

# 切换到父 frame
driver.switch_to.parent_frame()
```

### 5.7 JavaScript 执行

```
# 执行 JavaScript 代码
driver.execute_script('alert("Hello")')

# 执行 JavaScript 并返回结果
result = driver.execute_script('return 1 + 1')
print(result)  # 2

# 滚动页面
driver.execute_script('window.scrollTo(0, document.body.scrollHeight)')

# 获取页面高度
height = driver.execute_script('return document.body.scrollHeight')

# 修改元素样式
driver.execute_script('arguments[0].style.display="none"', element)

# 获取元素文本（绕过隐藏元素）
text = driver.execute_script('return arguments[0].innerText', element)

# 异步 JavaScript
driver.execute_async_script('var callback = arguments[arguments.length - 1]; setTimeout(function() { callback("done"); }, 1000);')
```

## 六、常见问题解决

### 6.1 元素定位问题

| 问题                   | 解决方案                                            |
| ------------------------ | ----------------------------------------------------- |
| NoSuchElementException | 检查定位器是否正确，使用显式等待                    |
| 元素不可见             | 使用 visibility\_of\_element\_located 等待 |
| 元素被遮挡             | 使用 JavaScript 滚动或点击                          |
| 动态元素               | 使用显式等待和正确的定位器                          |

### 6.2 超时问题

```
# 增加等待时间
wait = WebDriverWait(driver, 30)

# 使用 try-except 捕获超时异常
from selenium.common.exceptions import TimeoutException

try:
    element = wait.until(EC.presence_of_element_located((By.ID, 'element_id')))
except TimeoutException:
    print('Element not found within timeout')
```

### 6.3 常见异常

```
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    StaleElementReferenceException,
    ElementNotVisibleException,
    ElementNotInteractableException
)

try:
    element = driver.find_element(By.ID, 'element_id')
except NoSuchElementException:
    print('Element not found')
except TimeoutException:
    print('Timeout waiting for element')
except StaleElementReferenceException:
    print('Element is no longer attached to DOM')
except ElementNotVisibleException:
    print('Element is not visible')
except ElementNotInteractableException:
    print('Element is not interactable')
```

## 七、完整示例

### 7.1 登录测试

```
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)

try:
    # 打开网页
    driver.get('https://example.com/login')

    # 输入用户名
    username_input = wait.until(EC.presence_of_element_located((By.ID, 'username')))
    username_input.send_keys('testuser')

    # 输入密码
    password_input = driver.find_element(By.ID, 'password')
    password_input.send_keys('testpassword')

    # 点击登录按钮
    login_button = driver.find_element(By.ID, 'login_button')
    login_button.click()

    # 等待登录成功
    wait.until(EC.url_contains('dashboard'))

    print('Login successful')

finally:
    driver.quit()
```

### 7.2 数据采集

```
from selenium import webdriver
from selenium.webdriver.common.by import By
import csv

driver = webdriver.Chrome()

try:
    driver.get('https://example.com/products')

    # 获取所有产品
    products = driver.find_elements(By.CLASS_NAME, 'product')

    data = []
    for product in products:
        name = product.find_element(By.CLASS_NAME, 'product-name').text
        price = product.find_element(By.CLASS_NAME, 'product-price').text
        data.append({'name': name, 'price': price})

    # 保存到 CSV
    with open('products.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['name', 'price'])
        writer.writeheader()
        writer.writerows(data)

    print(f'Collected {len(data)} products')

finally:
    driver.quit()
```

## 八、最佳实践

### 8.1 代码组织

```
# 使用 Page Object Model (POM) 模式
class LoginPage:
    def __init__(self, driver):
        self.driver = driver
        self.username_input = (By.ID, 'username')
        self.password_input = (By.ID, 'password')
        self.login_button = (By.ID, 'login_button')

    def login(self, username, password):
        self.driver.find_element(*self.username_input).send_keys(username)
        self.driver.find_element(*self.password_input).send_keys(password)
        self.driver.find_element(*self.login_button).click()

# 使用
driver = webdriver.Chrome()
login_page = LoginPage(driver)
login_page.login('testuser', 'testpassword')
```

### 8.2 错误处理

```
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    element = driver.find_element(By.ID, 'element_id')
except Exception as e:
    logger.error(f'Error finding element: {e}')
    driver.save_screenshot('error.png')
finally:
    driver.quit()
```

### 8.3 性能优化

* 使用显式等待而不是隐式等待
* 避免使用强制等待
* 复用浏览器实例
* 使用无头模式（Headless）提高速度
* 并行执行测试

### 8.4 无头模式

```
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
```

## 九、参考资源

* **官方文档**：[https://www.selenium.dev/documentation/](https://www.selenium.dev/documentation/)
* **Python 绑定**：[https://selenium-python.readthedocs.io/](https://selenium-python.readthedocs.io/)
* **GitHub**：[https://github.com/SeleniumHQ/selenium](https://github.com/SeleniumHQ/selenium)
* **社区论坛**：[https://stackoverflow.com/questions/tagged/selenium](https://stackoverflow.com/questions/tagged/selenium)

## 十、学习路线

1. **基础阶段**：环境搭建、元素定位、基本操作
2. **进阶阶段**：等待机制、高级操作、异常处理
3. **实战阶段**：完整项目、Page Object Model、测试框架集成
4. **优化阶段**：性能优化、并行执行、CI/CD 集成

**最后更新**：2026年3月30日**学习建议**：边学边练，通过实际项目巩固知识。
