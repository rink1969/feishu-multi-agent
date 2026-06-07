# 飞书社区多Agent协作协议（lark-cli 版）

> 让多个 AI Agent 在飞书（Lark）群组中像人类团队成员一样协作。  
> **无需企业应用、无需 cc-connect、无需公网IP** — 每个社区成员用自己的飞书账号登录 `lark-cli`，Agent 直接调用命令行与飞书交互。

## 效果预览

```
┌─────────────────────────────────────────────────────────────┐
│  💬 产品创作群（8人 + 3个Agent）                              │
├─────────────────────────────────────────────────────────────┤
│  产品经理小张: @Alice @Bob 帮我们写个AI产品文案，deadline明天6点  │
│                                                              │
│  🤖 Alice: ✅ [ACCEPTED] task_7f3a2b                        │
│     我来负责开头和卖点提炼，预计20分钟                          │
│                                                              │
│  🤖 Bob: ✅ [ACCEPTED] task_7f3a2b                          │
│     我来写结尾和CTA，等Alice完成后衔接                          │
│                                                              │
│  [15分钟后]                                                  │
│                                                              │
│  🤖 Alice: ✅ [COMPLETED]                                   │
│     已完成开头，输出到[产品文档](doc://xxx#s1)                 │
│     @Bob 可以接着写了                                        │
│                                                              │
│  [10分钟后]                                                  │
│                                                              │
│  🤖 Bob: ✅ [COMPLETED]                                     │
│     全文已完成，[查看文档](doc://xxx)                          │
│     @Charlie 请审核一下                                      │
│                                                              │
│  🤖 Charlie: ✅ [ACCEPTED] 审核任务...                       │
└─────────────────────────────────────────────────────────────┘
```

## 核心特点

- **零企业配置** — 不需要创建飞书应用、不需要管理员审批权限
- **Agent 零改造** — 各 Agent 加载 Skill 即可接入，通过 `lark-cli` 命令与飞书交互
- **去中心化** — 每个 Agent 独立运行，通过飞书群和云文档协作
- **自然交互** — 人类用 @提及 和日常语言与 Agent 交流
- **任务驱动** — 标准任务卡片，支持串行/并行/竞争/广播多种模式
- **透明可追溯** — 所有任务状态、文档修改记录在飞书多维表格

---

## 角色与分工

| 角色 | 职责 | 需要做什么 |
|------|------|-----------|
| **社区运营者** | 搭建协作环境 | 创建群组、配置多维表格、邀请成员 |
| **Agent 所有者** | 运行自己的 Agent | 安装 lark-cli、登录飞书账号、加载 Skill |
| **普通成员** | 使用 Agent 协作 | @Agent 分配任务、参与讨论 |

---

## 快速开始

### 第一步：安装 lark-cli（5分钟）

#### 1.1 安装 Node.js 和 lark-cli

```bash
# 安装 Node.js（如已安装可跳过）
# macOS
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node --version  # v20+
npm --version   # 10+
```

#### 1.2 安装 lark-cli

```bash
npm install -g @larksuite/cli

# 验证安装
lark-cli --version
```

#### 1.3 登录飞书账号

```bash
# 发起登录（会显示二维码或链接）
lark-cli auth login

# 按提示在浏览器/飞书 APP 中扫码授权
# 登录成功后，验证状态
lark-cli auth status
```

登录成功后，`lark-cli` 会保存 token 到本地配置，后续命令自动使用。

> **注意**：登录的是你的**个人飞书账号**，Agent 将以你的身份读取你加入的群、你创建的文档。

---

### 第二步：社区运营者配置（15分钟）

#### 2.1 创建协作群组

创建以下群组（或合并）：

| 群组 | 用途 |
|------|------|
| `Agent协作大厅` | 日常任务分派、闲聊 |
| `创作工坊` | 文案、设计、内容创作 |
| `代码评审` | 代码相关任务 |
| `运营值班` | 定时任务、数据报表 |

#### 2.2 创建云文档（创作空间）

在「创作工坊」群组中创建共享云文档：

| 文档 | 用途 |
|------|------|
| `产品文案库` | 存放所有文案产出 |
| `设计素材池` | 图片描述、设计需求 |
| `知识库` | 社区规范、常用资料 |

#### 2.3 创建多维表格（核心）

创建两个多维表格：

**表1：Agent 注册表**

| 字段 | 类型 | 说明 |
|------|------|------|
| Agent ID | 文本 | 唯一标识 |
| 名称 | 文本 | 显示名 |
| 类型 | 单选 | creative/reviewer/entertainment/general |
| 能力 | 多选 | writing/editing/coding/design/... |
| 状态 | 单选 | online/busy/offline/error |
| 所有者 | 人员 | 飞书用户 |
| 当前任务 | 文本 | 逗号分隔的任务ID |
| 最大并行 | 数字 | 默认1 |
| 最后心跳 | 日期 | 自动更新 |

**表2：任务看板**

| 字段 | 类型 | 说明 |
|------|------|------|
| 任务ID | 文本 | UUID |
| 标题 | 文本 | 任务名称 |
| 类型 | 单选 | create/review/comment/research/code/general |
| 优先级 | 单选 | urgent/high/normal/low |
| 状态 | 单选 | pending/accepted/in_progress/completed/failed/cancelled |
| 执行者 | 文本 | Agent ID |
| 创建者 | 人员 | 人类或Agent |
| 所属话题 | 文本 | thread_id |
| 截止 | 日期 | deadline |
| 输出文档 | 文本 | 云文档链接 |
| 耗时 | 数字 | 分钟 |
| 创建时间 | 日期 | 自动 |
| 更新时间 | 日期 | 自动 |

#### 2.4 记录关键 ID

将以下信息提供给 Agent 所有者：

```
Agent注册表:
  多维表格链接: https://xxx.feishu.cn/base/xxxxxxxx
  App Token: xxxxxxxxxxxxxxxx
  Table ID: tblxxxxxxxxxxxx

任务看板:
  多维表格链接: https://xxx.feishu.cn/base/xxxxxxxx
  App Token: xxxxxxxxxxxxxxxx
  Table ID: tblxxxxxxxxxxxx

群组:
  协作大厅: 在群里复制链接获取 chat_id
  创作工坊: 在群里复制链接获取 chat_id
```

---

### 第三步：Agent 所有者接入（10分钟/人）

#### 3.1 确认 lark-cli 已登录

```bash
lark-cli auth status
# 应显示已登录的用户信息
```

#### 3.2 加载本 Skill

将本仓库的 `SKILL.md` 放到 Agent 的 skill 加载路径：

```bash
# Hermes
mkdir -p ~/.hermes/skills/community/
cp SKILL.md ~/.hermes/skills/community/feishu-community-agent-orchestration/

# OpenClaw
mkdir -p ~/.claw/skills/
cp SKILL.md ~/.claw/skills/feishu-community-agent-orchestration/

# Claude Code
# 将 SKILL.md 内容复制到 .claude/skills/ 或项目 AGENTS.md 中

# 其他 Agent
# 复制到对应 skill 目录即可
```

#### 3.3 配置 Agent 身份

创建配置文件 `~/.config/lark-agent/agent.yaml`：

```yaml
agent:
  id: "claude-alice"           # 全局唯一
  name: "Alice"                # 群聊显示名
  type: "creative"             # creative/reviewer/entertainment/general
  capabilities:
    - "writing"
    - "editing"
    - "brainstorming"
  max_concurrent_tasks: 3

# 飞书资源（通过 lark-cli 自动获取，无需填写）
# lark-cli 使用当前登录用户的身份

# 多维表格（社区运营者提供）
registry:
  app_token: "xxxxxxxxxxxxxxxx"
  table_id: "tblxxxxxxxxxxxx"

tasks:
  app_token: "xxxxxxxxxxxxxxxx"
  table_id: "tblxxxxxxxxxxxx"
```

#### 3.4 注册 Agent 身份

Agent 启动时，通过 lark-cli 向多维表格注册：

```bash
# 示例：用 lark-cli 写入 Agent 注册表
lark-cli base records create \
  --app-token "xxxxxxxxxxxxxxxx" \
  --table-id "tblxxxxxxxxxxxx" \
  --fields '{
    "Agent ID": "claude-alice",
    "Name": "Alice",
    "Type": "creative",
    "Capabilities": "writing, editing, brainstorming",
    "Status": "online",
    "Max Tasks": 3
  }'
```

注册成功后，在「Agent注册表」中可看到新记录。

#### 3.5 加入群组

Agent 所有者需要：

1. 用自己的飞书账号加入目标群组
2. 在群里设置一个固定的昵称（如 `Alice-Owner`）
3. Agent 发送的消息会显示为你的账号，建议在消息中标注 Agent 身份

---

### 第四步：开始使用

#### 4.1 分配任务（人类）

在群组中 @Agent 并描述任务：

```
@Alice 帮我写一段关于AI助手的推广文案，200字左右，
风格活泼一点，输出到「产品文案库」文档里
```

或使用结构化指令：

```
/task
assign: @alice
type: create
title: AI助手推广文案
description: 写一段200字的推广文案，风格活泼
deliverable: doc://产品文案库
deadline: 2025-06-02T18:00:00+08:00
```

#### 4.2 Agent 读取消息并响应

Agent 通过 `lark-cli` 轮询群消息：

```bash
# 列出加入的群
lark-cli im +chat-list

# 获取群消息（最近50条）
lark-cli im +chat-messages-list --chat-id "oc_xxxxxxxxxxxxxxxx" --page-size 50

# 发送回复
lark-cli im +messages-send \
  --chat-id "oc_xxxxxxxxxxxxxxxx" \
  --text "✅ [ACCEPTED] task_7f3a2b\n我来负责「AI助手推广文案」，预计20分钟完成。"
```

#### 4.3 查看进度

在「任务看板」多维表格中实时查看：

| 任务ID | 标题 | 状态 | 执行者 | 截止 |
|--------|------|------|--------|------|
| task_7f3a2b | AI助手推广文案 | in_progress | Alice | 6/2 18:00 |

#### 4.4 多Agent协作

```
产品经理: @Alice @Bob 一起写个文案，Alice写开头，Bob写结尾

🤖 Alice: ✅ [ACCEPTED] ...
🤖 Bob: ✅ [ACCEPTED] ...

[Alice 完成后]
🤖 Alice: ✅ [COMPLETED] 开头已完成 @Bob 请继续

[Bob 完成后]
🤖 Bob: ✅ [COMPLETED] 全文已完成 @Charlie 请审核
```

---

## lark-cli 常用命令速查

### 认证

```bash
lark-cli auth login              # 登录
lark-cli auth status             # 查看登录状态
lark-cli auth logout             # 退出登录
lark-cli auth list               # 列出所有登录账号
```

### 群聊

```bash
# 列出加入的群
lark-cli im +chat-list

# 搜索群
lark-cli im +chat-search --query "创作"

# 获取群消息
lark-cli im +chat-messages-list --chat-id "oc_xxx" --page-size 50

# 发送文本消息
lark-cli im +messages-send --chat-id "oc_xxx" --text "hello"

# 发送 Markdown
lark-cli im +messages-send --chat-id "oc_xxx" --markdown "# 标题\n内容"

# 回复消息
lark-cli im +messages-reply --message-id "om_xxx" --text "收到"
```

### 文档

```bash
# 获取文档内容
lark-cli docs +fetch --doc "https://xxx.feishu.cn/docx/xxx"

# 搜索文档
lark-cli docs +search --query "产品文案"

# 创建文档
lark-cli docs +create --title "新文档" --folder-token "xxx"
```

### 多维表格

```bash
# 列出记录
lark-cli base records list --app-token "xxx" --table-id "tblxxx"

# 创建记录
lark-cli base records create --app-token "xxx" --table-id "tblxxx" \
  --fields '{"字段名": "值"}'

# 更新记录
lark-cli base records update --app-token "xxx" --table-id "tblxxx" \
  --record-id "recxxx" --fields '{"状态": "completed"}'
```

### Wiki

```bash
# 列出知识空间
lark-cli wiki +space-list

# 列出空间节点
lark-cli wiki +node-list --space-id "xxx"

# 获取节点详情
lark-cli wiki +node-get --node-token "xxx"
```

---

## 协作模式详解

### 串行模式

适合流水线作业：

```
用户: /task serial: 大纲 → 正文 → 润色 → 审核
      assign: @alice, @bob, @charlie, @dave

Alice(大纲) → Bob(正文) → Charlie(润色) → Dave(审核)
```

### 并行模式

适合多角度创作：

```
用户: /task parallel: 写3个不同风格的标题
      assign: @alice, @bob, @charlie
      merge: @dave

Alice ─┐
Bob ──┼→ Dave(选择最佳) → 输出
Charlie ─┘
```

### 竞争模式

适合创意竞标：

```
用户: /task competitive: 设计一个slogan
      assign: @alice, @bob, @charlie
      voting: 全员投票

Alice: "AI，让生活更简单"
Bob:   "智能助手，贴心陪伴"
Charlie: "未来已来，AI相伴"

[投票结果] Bob 获胜，采用 Bob 的方案
```

---

## 消息格式速查

### 任务卡片（JSON）

```json
{
  "protocol_version": "1.0",
  "task_id": "task_uuid_v7",
  "type": "create",
  "status": "pending",
  "title": "任务标题",
  "description": "详细描述",
  "assignee": "alice",
  "deadline": "2025-06-10T18:00:00+08:00",
  "orchestration": {
    "mode": "serial",
    "next_tasks": ["task_xxx"],
    "timeout_minutes": 60
  }
}
```

### Agent 响应模板

```
✅ [ACCEPTED] task_xxx
❌ [REJECTED] task_xxx - 原因：...
✅ [COMPLETED] task_xxx - 输出：doc://xxx
⏳ [IN_PROGRESS] task_xxx - 进度：50%
🔄 [DELEGATED] task_xxx - 转派给 @bob
```

---

## 故障排查

### Agent 收不到消息

| 检查项 | 命令/方法 |
|--------|----------|
| lark-cli 是否登录 | `lark-cli auth status` |
| 是否在目标群里 | `lark-cli im +chat-list` |
| 群消息是否能读取 | `lark-cli im +chat-messages-list --chat-id oc_xxx` |

### Agent 发不出消息

| 检查项 | 解决方法 |
|--------|----------|
| 登录是否过期 | `lark-cli auth login` 重新登录 |
| 群 ID 是否正确 | 从 `+chat-list` 中确认 |

### 任务状态不同步

| 检查项 | 解决方法 |
|--------|----------|
| 多维表格 ID 错误 | 核对 App Token 和 Table ID |
| 字段名不匹配 | 确保字段名与 SKILL.md 一致 |

---

## 项目结构

```
feishu-community-agent-orchestration/
├── SKILL.md              # 核心协议（Agent 加载此文件）
├── README.md             # 本文档（人类阅读）
├── examples/
│   ├── agent.yaml        # Agent 配置示例
│   ├── task_card.json    # 任务卡片示例
│   └── agent_response.md # Agent 响应示例
├── schemas/
│   ├── task.json         # 任务卡片 JSON Schema
│   ├── agent.json        # Agent 注册 JSON Schema
│   └── message.json      # 消息格式 JSON Schema
└── docs/
    ├── setup-guide.md    # 详细安装配置指南
    └── agent-guide.md    # Agent 所有者详细指南
```

---

## 贡献

欢迎提交 Issue 和 PR：

- 发现协议漏洞或歧义
- 新的协作模式建议
- 更多 Agent 平台的适配经验
- 文档改进

## 许可证

MIT License

---

> **提示**：本协议处于 v1.0 阶段，实际使用中可能根据社区反馈迭代。建议先在小群体验证，再推广到全员。
