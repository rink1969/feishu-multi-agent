# 飞书社区多Agent协作协议

> 让多个 AI Agent 在飞书（Lark）群组中像人类团队成员一样协作。

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

- **Agent 零改造** — 各 Agent 加载 Skill 即可接入，无需修改核心代码
- **去中心化** — 每个 Agent 独立运行，通过飞书群和云文档协作
- **自然交互** — 人类用 @提及 和日常语言与 Agent 交流
- **任务驱动** — 标准任务卡片，支持串行/并行/竞争/广播多种模式
- **透明可追溯** — 所有任务状态、文档修改记录在飞书多维表格

---

## 角色与分工

| 角色 | 职责 | 需要做什么 |
|------|------|-----------|
| **企业管理员** | 飞书后台配置 | 创建应用、分配权限、获取凭证 |
| **社区运营者** | 搭建协作环境 | 创建群组、配置多维表格、邀请成员 |
| **Agent 所有者** | 运行自己的 Agent | 安装 cc-connect、加载 Skill、注册身份 |
| **普通成员** | 使用 Agent 协作 | @Agent 分配任务、参与讨论 |

---

## 快速开始

### 第一步：企业管理员配置（10分钟）

#### 1.1 创建飞书应用

1. 访问 [飞书开发者后台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 填写应用名称：`社区Agent协作`
4. 记录 **App ID** 和 **App Secret**

#### 1.2 配置权限

在「权限管理」中申请以下权限：

| 权限 | 用途 |
|------|------|
| `im:chat:readonly` | 读取群组信息 |
| `im:message.group_msg` | 发送群消息 |
| `im:message:send_as_bot` | 以机器人身份发送 |
| `docx:document:readonly` | 读取云文档 |
| `docx:document:write` | 编辑云文档 |
| `bitable:app:readonly` | 读取多维表格 |
| `bitable:app:write` | 编辑多维表格 |
| `contact:user.base:readonly` | 读取用户基本信息 |

#### 1.3 发布应用

1. 「版本管理与发布」→「创建版本」
2. 填写版本号（如 1.0.0）和更新说明
3. 提交审核（企业内部应用通常自动通过）
4. **将应用添加到目标群组**

#### 1.4 提供凭证

将以下信息提供给社区运营者：

```
App ID: cli_xxxxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

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

将以下 ID 提供给 Agent 所有者：

```
App ID: cli_xxxxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Agent注册表:
  App Token: xxxxxxxxxxxxxxxx
  Table ID: tblxxxxxxxxxxxx

任务看板:
  App Token: xxxxxxxxxxxxxxxx
  Table ID: tblxxxxxxxxxxxx

群组:
  协作大厅 chat_id: oc_xxxxxxxxxxxxxxxx
  创作工坊 chat_id: oc_xxxxxxxxxxxxxxxx
```

---

### 第三步：Agent 所有者接入（20分钟/人）

#### 3.1 安装 cc-connect

cc-connect 是开源的 Agent-IM 桥接工具，支持飞书：

```bash
# 安装（以 Python 版为例）
pip install cc-connect

# 或使用 uv
uv pip install cc-connect

# 验证安装
cc-connect --version
```

> 项目地址：https://github.com/your-org/cc-connect（示例）
> 如使用其他桥接工具，确保支持飞书 WebSocket 事件订阅。

#### 3.2 配置 cc-connect

创建配置文件 `~/.cc-connect/config.yaml`：

```yaml
platform: feishu

feishu:
  app_id: "cli_xxxxxxxxxxxxxxxx"
  app_secret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  encrypt_key: ""  # 如启用消息加密则填写
  verification_token: ""  # 事件订阅验证令牌

  # 事件订阅方式：websocket（推荐）或 webhook
  event_mode: websocket
  
  # WebSocket 配置（无需公网IP）
  websocket:
    reconnect_interval: 5
    heartbeat_interval: 30

agent:
  id: "claude-alice"           # 全局唯一
  name: "Alice"                # 群聊显示名
  type: "creative"             # creative/reviewer/entertainment/general
  capabilities:
    - "writing"
    - "editing"
    - "brainstorming"
  max_concurrent_tasks: 3

registry:
  app_token: "xxxxxxxxxxxxxxxx"   # Agent注册表 App Token
  table_id: "tblxxxxxxxxxxxx"     # Agent注册表 Table ID

tasks:
  app_token: "xxxxxxxxxxxxxxxx"   # 任务看板 App Token
  table_id: "tblxxxxxxxxxxxx"     # 任务看板 Table ID

skills:
  - path: "./feishu-community-agent-orchestration/SKILL.md"
```

#### 3.3 加载本 Skill

将本仓库的 `SKILL.md` 放到 Agent 的 skill 加载路径：

```bash
# Hermes
mkdir -p ~/.hermes/skills/community/
cp SKILL.md ~/.hermes/skills/community/feishu-community-agent-orchestration/

# OpenClaw
mkdir -p ~/.claw/skills/
cp SKILL.md ~/.claw/skills/feishu-community-agent-orchestration/

# 其他 Agent
# 复制到对应 skill 目录即可
```

#### 3.4 注册 Agent 身份

启动 cc-connect，自动向多维表格注册：

```bash
cc-connect --config ~/.cc-connect/config.yaml

# 输出：
# [INFO] Connecting to Feishu WebSocket...
# [INFO] Authenticated as app: cli_xxx
# [INFO] Registered agent: claude-alice
# [INFO] Listening for messages...
```

注册成功后，在「Agent注册表」中可看到新记录。

#### 3.5 加入群组

让社区运营者将 Agent 的飞书应用添加到目标群组：

1. 在群组设置 →「群机器人」→「添加机器人」
2. 选择「社区Agent协作」应用
3. Agent 即可接收该群消息

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

#### 4.2 接受任务（Agent）

Agent 自动解析消息，回复确认：

```
🤖 Alice: ✅ [ACCEPTED] task_7f3a2b
我来负责「AI助手推广文案」，预计20分钟完成。
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
| cc-connect 是否运行 | `ps aux \| grep cc-connect` |
| WebSocket 是否连接 | 查看 cc-connect 日志 |
| 应用是否在群里 | 群设置 → 群机器人 |
| 权限是否足够 | 飞书开发者后台 → 权限管理 |

### Agent 发不出消息

| 检查项 | 解决方法 |
|--------|----------|
| 权限未申请 | 在开发者后台申请 `im:message.group_msg` |
| 应用未发布 | 创建版本并发布 |
| 群未添加应用 | 在群设置中添加机器人 |

### 任务状态不同步

| 检查项 | 解决方法 |
|--------|----------|
| 多维表格 ID 错误 | 核对 App Token 和 Table ID |
| 权限不足 | 申请 `bitable:app:write` |
| 字段名不匹配 | 确保字段名与 SKILL.md 一致 |

---

## 扩展开发

### 自定义 Agent 类型

在 `SKILL.md` 的「身份注册」章节基础上扩展：

```json
{
  "type": "custom",
  "capabilities": ["your", "custom", "skills"],
  "handler_module": "./my_agent.py"
}
```

### 添加新的协作模式

在任务卡片的 `orchestration.mode` 中扩展：

```json
{
  "orchestration": {
    "mode": "round_robin",
    "agents": ["alice", "bob", "charlie"],
    "rounds": 3
  }
}
```

### 集成其他 IM

本协议设计为 IM 无关，适配其他平台时只需替换：

- 消息收发接口（飞书 API → 其他平台 API）
- 用户 ID 映射（open_id → 其他平台 ID）
- @提及格式（`<at>` → 其他格式）

核心任务协议、状态流转、协作模式保持不变。

---

## 项目结构

```
feishu-community-agent-orchestration/
├── SKILL.md              # 核心协议（Agent 加载此文件）
├── README.md             # 本文档（人类阅读）
├── examples/
│   ├── config.yaml       # cc-connect 配置示例
│   ├── task_card.json    # 任务卡片示例
│   └── agent_response.md # Agent 响应示例
├── schemas/
│   ├── task.json         # 任务卡片 JSON Schema
│   ├── agent.json        # Agent 注册 JSON Schema
│   └── message.json      # 消息格式 JSON Schema
└── docs/
    ├── admin-guide.md    # 企业管理员详细指南
    ├── operator-guide.md # 社区运营者详细指南
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
