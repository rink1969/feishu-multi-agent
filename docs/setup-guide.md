# lark-cli 安装与配置指南

## 1. 安装 Node.js

lark-cli 基于 Node.js，需要 v20 或更高版本。

### macOS

```bash
# 使用 Homebrew
brew install node

# 验证
node --version  # v20.x.x
npm --version   # 10.x.x
```

### Ubuntu/Debian

```bash
# 使用 NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version
npm --version
```

### Windows

1. 下载安装包：https://nodejs.org/
2. 运行安装程序，按提示完成
3. 打开 PowerShell 验证：`node --version`

---

## 2. 安装 lark-cli

```bash
npm install -g @larksuite/cli

# 验证安装
lark-cli --version
```

---

## 3. 登录飞书账号

### 3.1 发起登录（交互式）

```bash
lark-cli auth login
```

执行后会显示：
- 一个二维码（ASCII 艺术）
- 或一个验证链接

**方式一：飞书 APP 扫码**
1. 打开飞书 APP
2. 点击右上角「+」→「扫一扫」
3. 扫描终端显示的二维码

**方式二：浏览器访问链接**
1. 复制终端显示的链接
2. 在浏览器中打开
3. 按提示登录并授权

### 3.2 Headless 环境登录（服务器/容器）

服务器无图形界面时，使用 `--no-wait` 模式：

```bash
# 1. 发起非阻塞登录，获取 device_code
lark-cli auth login --no-wait --json

# 输出示例：
# {
#   "device_code": "AQAAxxxx",
#   "user_code": "123456",
#   "verification_uri": "https://open.feishu.cn/open-apis/authen/v1/index.html"
# }
```

```bash
# 2. 复制 verification_uri 和 user_code 到手机/另一台电脑
#    在浏览器打开链接，输入 6 位 user_code，扫码授权
```

```bash
# 3. 检查登录状态（轮询）
lark-cli auth status

# 成功后输出：
# {
#   "ok": true,
#   "user": {"name": "张三", "open_id": "ou_xxx"},
#   "tenant": {"name": "示例企业"}
# }
```

**完整 Headless 脚本**（见 [scripts/headless-login.sh](../scripts/headless-login.sh)）

### 3.3 验证登录

```bash
lark-cli auth status
```

预期输出：
```json
{
  "ok": true,
  "user": {
    "name": "张三",
    "open_id": "ou_xxxxxxxxxxxxxxxx"
  },
  "tenant": {
    "name": "示例企业"
  }
}
```

---

## 4. 基本功能测试

### 4.1 列出加入的群

```bash
lark-cli im +chat-list
```

预期输出（JSON 格式）：
```json
{
  "items": [
    {
      "chat_id": "oc_xxxxxxxxxxxxxxxx",
      "name": "Agent协作大厅",
      "description": "..."
    }
  ]
}
```

### 4.2 读取群消息

```bash
lark-cli im +chat-messages-list \
  --chat-id "oc_xxxxxxxxxxxxxxxx" \
  --page-size 10
```

### 4.3 发送测试消息

```bash
lark-cli im +messages-send \
  --chat-id "oc_xxxxxxxxxxxxxxxx" \
  --text "Hello from lark-cli! 👋"
```

---

## 5. 多账号管理（可选）

如果你需要管理多个飞书账号：

```bash
# 查看已登录的账号
lark-cli auth list

# 切换账号（使用 profile）
lark-cli --profile work auth login
lark-cli --profile personal auth login

# 使用指定 profile 执行命令
lark-cli --profile work im +chat-list
```

---

## 6. 故障排查

### 6.1 安装失败

| 问题 | 解决 |
|------|------|
| `npm: command not found` | 先安装 Node.js |
| `permission denied` | 使用 `sudo npm install -g @larksuite/cli` |
| 网络超时 | 切换 npm 镜像：`npm config set registry https://registry.npmmirror.com` |

### 6.2 登录失败

| 问题 | 解决 |
|------|------|
| 二维码无法扫描 | 使用浏览器访问链接方式 |
| 授权后无响应 | 检查网络，重新执行 `auth login` |
| `auth status` 显示未登录 | 重新执行 `auth login` |

### 6.3 命令执行失败

| 问题 | 解决 |
|------|------|
| `not_configured` | 先执行 `auth login` |
| `permission denied` | 检查是否有相应权限（如群成员、文档权限） |
| API 限流 | 减少调用频率，稍后重试 |

---

## 7. 更新 lark-cli

```bash
npm update -g @larksuite/cli

# 或重新安装
npm install -g @larksuite/cli@latest
```

---

## 8. 卸载

```bash
npm uninstall -g @larksuite/cli
```
