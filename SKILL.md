---
name: feishu-community-agent-orchestration
description: "Use when an AI agent needs to collaborate with other agents in a Feishu (Lark) community via groups and cloud documents. Defines message formats, task protocols, and interaction patterns for multi-agent coordination."
version: 1.0.0
author: Community
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [feishu, lark, multi-agent, collaboration, community, orchestration]
    related_skills: [mcp, kanban-orchestrator]
---

# 飞书社区多Agent协作协议

## Overview

本 Skill 定义了 AI Agent 在飞书（Lark）社区环境中与其他 Agent 及人类成员协作的标准协议。涵盖：

- 通过飞书群聊接收/发送消息
- 通过云文档进行内容创作与评审
- 通过多维表格管理任务与Agent注册
- 标准的任务卡片格式与状态流转
- 多种协作模式（串行、并行、竞争、广播）

Agent 加载本 Skill 后，即可接入已配置好的飞书社区，无需关心底层通信细节。

## When to Use

- Agent 需要加入飞书群组与其他 Agent 协作
- Agent 需要读写飞书云文档完成创作/评审任务
- Agent 需要接收任务分配、上报进度、转派工作
- Agent 需要参与话题讨论、 threaded 回复
- **Don't use for:** 非飞书环境（如 Discord、Slack、企业微信）

## Prerequisites

Agent 运行者需完成以下准备（详见 README）：

1. 拥有飞书企业账号且加入目标社区
2. 安装 cc-connect 或同类 Agent-IM 桥接工具
3. 获取飞书 App ID / App Secret（企业管理员提供）
4. 在多维表格中注册 Agent 身份

---

## 1. 身份注册

### 1.1 Agent 元数据

每个 Agent 必须在社区注册表中登记：

```json
{
  "agent_id": "claude-alice",
  "name": "Alice",
  "type": "creative",
  "capabilities": ["writing", "editing", "brainstorming"],
  "status": "online",
  "owner": "user_open_id_xxx",
  "endpoint": "ws://localhost:8080",
  "max_concurrent_tasks": 3,
  "created_at": "2025-06-01T00:00:00Z"
}
```

字段说明：

| 字段 | 必填 | 说明 |
|------|------|------|
| `agent_id` | ✅ | 全局唯一标识，小写+连字符 |
| `name` | ✅ | 显示名称，群聊中@用 |
| `type` | ✅ | `creative`/`reviewer`/`entertainment`/`general` |
| `capabilities` | ✅ | 能力标签数组 |
| `status` | ✅ | `online`/`busy`/`offline` |
| `owner` | ✅ | 飞书用户 open_id |
| `endpoint` | ❌ | 本地服务地址（可选） |
| `max_concurrent_tasks` | ❌ | 最大并行任务数，默认1 |

### 1.2 注册方式

通过飞书多维表格 API 写入注册表：

```python
# POST https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records
headers = {"Authorization": "Bearer " + tenant_access_token}
payload = {
    "fields": {
        "Agent ID": "claude-alice",
        "Name": "Alice",
        "Type": "creative",
        "Capabilities": "writing, editing",
        "Status": "online",
        "Owner": "ou_xxx",
        "Max Tasks": 3
    }
}
```

---

## 2. 消息格式

### 2.1 飞书群消息结构

Agent 接收到的消息（经 cc-connect 转发后）：

```json
{
  "msg_type": "text",
  "event_type": "im.message.receive_v1",
  "message_id": "om_xxx",
  "chat_id": "oc_xxx",
  "chat_type": "group",
  "sender": {
    "sender_id": {"open_id": "ou_xxx", "union_id": "on_xxx"},
    "sender_type": "user",
    "tenant_key": "xxx"
  },
  "content": {
    "text": "@Alice 帮我写一段关于AI的文案"
  },
  "mentions": [
    {"key": "@Alice", "id": {"open_id": "ou_agent_xxx"}, "name": "Alice"}
  ],
  "create_time": "1717200000000",
  "update_time": "1717200000000"
}
```

### 2.2 消息解析规则

Agent 收到消息后，按以下优先级处理：

1. **检查是否被@提及** — `mentions` 数组包含本 Agent
2. **检查是否包含任务指令** — 文本匹配 `/task` 或特定关键词
3. **检查是否是回复** — `message_id` 关联到已有话题
4. **普通群聊** — 根据 Agent 性格决定是否响应

### 2.3 话题（Thread）上下文

飞书群支持话题回复，Agent 需维护话题上下文：

```json
{
  "thread_id": "om_thread_xxx",
  "root_message_id": "om_root_xxx",
  "context_messages": [
    {"role": "user", "content": "初始话题"},
    {"role": "agent:bob", "content": "Bob的回复"},
    {"role": "user", "content": "追问"}
  ]
}
```

获取话题历史：

```python
# GET /open-apis/im/v1/messages/{message_id}/list
# 参数: page_size=50
```

---

## 3. 任务协议

### 3.1 任务卡片格式

所有任务以标准 JSON 卡片传递：

```json
{
  "protocol_version": "1.0",
  "task_id": "task_uuid_v7",
  "type": "create|review|comment|research|code|general",
  "priority": "urgent|high|normal|low",
  "status": "pending|accepted|in_progress|completed|failed|cancelled|delegated",
  
  "title": "任务标题",
  "description": "详细描述",
  "deliverable": {
    "format": "document|message|code|image",
    "target": "云文档URL或群消息"
  },
  
  "assignee": "agent_id或null",
  "creator": "user_open_id或agent_id",
  "mentions": ["@alice", "@bob"],
  
  "context": {
    "thread_id": "om_xxx",
    "chat_id": "oc_xxx",
    "reference_docs": ["doc_xxx"],
    "previous_tasks": ["task_xxx"]
  },
  
  "deadline": "2025-06-10T18:00:00+08:00",
  "created_at": "2025-06-01T10:00:00+08:00",
  "updated_at": "2025-06-01T10:00:00+08:00",
  
  "orchestration": {
    "mode": "serial|parallel|competitive|broadcast",
    "next_tasks": ["task_xxx"],
    "dependencies": ["task_xxx"],
    "timeout_minutes": 60
  }
}
```

### 3.2 任务状态流转

```
pending → accepted → in_progress → completed
   ↓         ↓            ↓            ↓
cancelled  delegated    failed      archived
```

状态变更通过飞书消息或 API 更新多维表格。

### 3.3 任务指令文本格式

人类在群里分派任务时，可用自然语言或结构化指令：

**自然语言：**
```
@Alice @Bob 你们俩一起写个产品文案，Alice负责开头，Bob负责结尾，
 deadline明天下午6点，输出到「产品文档」里
```

**结构化（推荐）：**
```
/task
assign: @alice, @bob
mode: parallel
type: create
title: 产品文案
description: 写一段AI产品推广文案
deliverable: doc://产品文档
deadline: 2025-06-02T18:00:00+08:00
```

### 3.4 Agent 响应格式

Agent 接受/拒绝/完成任务时，回复标准格式：

```
✅ [ACCEPTED] task_xxx
我会负责「任务标题」，预计30分钟完成。

❌ [REJECTED] task_xxx
原因：超出我的能力范围（需要代码能力，我是文案Agent）
建议转派给：@codex-charlie

✅ [COMPLETED] task_xxx
已完成，输出：doc://产品文档#段落3
耗时：25分钟
```

---

## 4. 云文档交互

### 4.1 文档操作

Agent 通过飞书文档 API 读写内容：

```python
# 读取文档块
GET /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}/children

# 创建文本块
POST /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}/children
{
  "index": -1,
  "children": [{
    "block_type": 2,
    "text": {"elements": [{"text_run": {"content": "Agent生成的内容"}}]}
  }]
}

# 更新块内容
PATCH /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}
```

### 4.2 文档定位约定

任务输出到云文档时，使用以下定位方式：

```
doc://文档ID#块ID        # 精确到段落
doc://文档ID#标题名       # 按标题定位
doc://文档ID?position=end # 追加到末尾
```

### 4.3 冲突处理

多个 Agent 同时编辑同一文档时：

1. **乐观锁**：更新前检查 `revision` 版本号
2. **块级锁定**：在多维表格中标记「正在编辑」状态
3. **追加优先**：默认在文档末尾追加，而非修改现有块

---

## 5. 协作模式

### 5.1 串行（Serial）

```
User → Agent A → Agent B → Agent C → Output
```

适用：流水线作业，如「大纲 → 正文 → 润色 → 审核」

配置：
```json
{
  "orchestration": {
    "mode": "serial",
    "next_tasks": ["task_b"],
    "dependencies": []
  }
}
```

### 5.2 并行（Parallel）

```
       ┌→ Agent A →┐
User → ├→ Agent B →┼→ Agent C（汇总）→ Output
       └→ Agent D →┘
```

适用：多角度创作，最后由汇总 Agent 整合

配置：
```json
{
  "orchestration": {
    "mode": "parallel",
    "next_tasks": ["task_merge"],
    "dependencies": ["task_a", "task_b", "task_d"]
  }
}
```

### 5.3 竞争（Competitive）

```
User → Agent A ─┐
         Agent B ─┼→ 择优 → Output
         Agent C ─┘
```

适用：创意竞标，多个 Agent 出方案，人类或评审 Agent 选择最优

配置：
```json
{
  "orchestration": {
    "mode": "competitive",
    "timeout_minutes": 30,
    "voting": {"method": "human_select", "voters": ["@user1"]}
  }
}
```

### 5.4 广播（Broadcast）

```
User → [Agent A, Agent B, Agent C] → 各自独立输出
```

适用：通知类任务，无需协作，各自处理

---

## 6. 状态管理

### 6.1 Agent 状态

| 状态 | 含义 | 行为 |
|------|------|------|
| `online` | 在线空闲 | 可接收新任务 |
| `busy` | 忙碌中 | 不接收新任务，除非高优先级 |
| `offline` | 离线 | 任务进入队列，上线后推送 |
| `error` | 异常 | 管理员需介入检查 |

状态更新：
```python
# PATCH 多维表格记录
{"fields": {"Status": "busy", "Current Tasks": "task_xxx, task_yyy"}}
```

### 6.2 心跳机制

Agent 每 5 分钟上报心跳：

```json
{
  "agent_id": "claude-alice",
  "heartbeat_at": "2025-06-01T10:05:00Z",
  "status": "online",
  "active_tasks": ["task_xxx"],
  "queue_depth": 0,
  "load": 0.3
}
```

超过 15 分钟无心跳，标记为 `offline`。

---

## 7. 消息模板

### 7.1 任务创建

```markdown
🎯 **新任务** #task_xxx
**类型**: 创作 | **优先级**: 高 | **截止**: 明天 18:00

@Alice 请为「AI助手产品」写一段推广文案（200字以内），
输出到[产品文档](doc://xxx)。

**上下文**: 这是Q2营销活动的一部分，风格要求活泼亲切。

**接受任务请回复**: ✅ ACCEPTED
**拒绝请回复**: ❌ REJECTED + 原因
```

### 7.2 任务完成

```markdown
✅ **任务完成** #task_xxx
**执行者**: @Alice
**耗时**: 25分钟
**输出**: [产品文档-第3段](doc://xxx#block_yyy)

---
**内容预览**:
> 在这个信息爆炸的时代，让AI成为你的超级助手...

**下一步**: @Bob 请审核这段文案
```

### 7.3 协作请求

```markdown
🤝 **协作请求** #task_xxx
@Charlie 我需要你帮我生成一张配图，
文案主题是「AI改变生活」，风格要科技感+温暖。

**我的进度**: 文案已完成，等你配图后一起提交
**阻塞**: 是 — 我在等待你的输出
```

---

## 8. 安全与权限

### 8.1 最小权限原则

- Agent 只能访问被明确授权的云文档
- Agent 只能在被添加的群组中收发消息
- Agent 不能修改其他 Agent 的任务状态

### 8.2 敏感操作确认

以下操作需人类确认：

- 删除云文档内容
- 向外部群发送消息
- 访问标记为「机密」的文档
- 批量操作（一次修改 >10 个块）

确认方式：@提及任务创建者，等待 ✅ 回复。

---

## Common Pitfalls

1. **忽略话题上下文** — Agent 回复时必须关联 `thread_id`，否则消息会散落到主聊天流
2. **任务ID冲突** — 必须使用 UUID v7 或雪花算法生成，禁止简单自增
3. **状态更新丢失** — 更新多维表格后需检查响应码，失败时重试3次
4. **文档编辑冲突** — 多人编辑同一文档时未检查 `revision`，导致覆盖
5. **消息过长** — 飞书单条消息限制 10000 字符，长内容需分片或转云文档
6. **@提及格式错误** — 必须使用 `<at id="ou_xxx">@Name</at>` 格式，纯文本 @ 不会触发通知

## Verification Checklist

- [ ] Agent 已在多维表格注册，状态为 online
- [ ] cc-connect 或同类工具已配置并连接飞书
- [ ] 能正确解析被@提及的消息
- [ ] 能发送标准格式的任务响应（ACCEPTED/COMPLETED）
- [ ] 能读写云文档指定位置
- [ ] 心跳上报正常（每5分钟）
- [ ] 任务状态变更同步到多维表格
- [ ] 话题回复正确关联 thread_id
