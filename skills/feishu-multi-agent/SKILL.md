---
name: feishu-multi-agent-collaboration
description: Use when setting up or running a Feishu-based multi-agent collaboration workflow where local AI agents create and process community tasks through lark-cli.
version: 1.0.0
---

# 飞书社区多 Agent 协作

## 概述

基于飞书 CLI 搭建的轻量多 Agent 协作方案。Agent 使用个人飞书账号，通过 `lark-cli` 完成任务的创建、分发、回复和通知。协作任务记录保存在飞书任务和话题群中，其他内容全部在用户本地。

## 何时使用

- 需要在社区场景下让多个本地 Agent 协作
- 希望通过飞书消息通道+任务记录实现 Agent 间通信
- 已经安装 `lark-cli` 并完成个人身份授权

## 前置条件

1. 社区发起人注册飞书组织并完成企业认证。
2. 创建名为 `AgentTasks` 的话题群和名为 `AgentNotify` 的普通对话群。
3. 所有社区成员已加入该飞书组织。
4. 本地安装 `lark-cli`（参考 https://github.com/larksuite/cli）。
5. 授权 scope 至少包含 `contact`、`im`、`task`，并授予全部权限。
6. Node.js >= 18。

## 安装脚本

脚本位于本 skill 的 `scripts/` 目录下，依赖 `lark-cli` 命令：

```bash
cd <本 skill 目录>
npm install  # 可选，仅用于注册 npm scripts
```

## 创建任务

使用 `scripts/create-task.js`：

```bash
node scripts/create-task.js \
  --assignees "张三,李四,王五" \
  --summary "成语接龙" \
  --content "大家一起来玩成语接龙吧" \
  --due "+3d"
```

脚本会自动完成以下步骤：

1. 将每个负责人名字转换为 open_id。
2. 以第一个负责人创建飞书任务，获取 task_id 和任务链接。
3. 在 `AgentTasks` 话题群发送初始消息，创建 thread。
4. 获取 message_id 和 thread_id。
5. 更新任务描述，写入 `message_id`、`thread_link` 和 `content`。
6. 添加其余负责人。
7. 设置截止日期。
8. 在 `AgentNotify` 群发送创建通知。

### 参数说明

| 参数 | 必填 | 说明 |
|---|---|---|
| `--assignees` | 是 | 负责人名字，多个用逗号分隔 |
| `--summary` | 是 | 任务标题 |
| `--content` | 是 | 任务内容 |
| `--due` | 否 | 截止日期，如 `+3d` 或 `2026-06-15` |
| `--tasks-chat` | 否 | 任务话题群名称，默认 `AgentTasks` |
| `--notify-chat` | 否 | 通知群名称，默认 `AgentNotify` |

## 处理任务

使用 `scripts/process-task.js`，按子命令操作：

### 1. 列出未完成任务

```bash
node scripts/process-task.js list
```

加上 `--json` 让 Agent 更容易解析：

```bash
node scripts/process-task.js list --json
```

### 2. 查看任务 thread 详情

```bash
node scripts/process-task.js show 1
```

脚本会输出任务标题、内容、已有回复，以及可直接交给 AI 的上下文文本。

### 3. 在 thread 中回复

```bash
node scripts/process-task.js reply 1 --text "先发制人"
```

回复内容由 Agent 自己生成或经用户确认后传入。

### 4. 发送处理通知

```bash
node scripts/process-task.js notify 1
```

脚本会自动构造 thread 链接，并在 `AgentNotify` 群发送：`处理了任务:<标题> <thread链接>`。

## 标准处理流程

Agent 处理任务时的推荐顺序：

1. `process-task.js list --json` 获取任务列表。
2. 将任务标题、内容展示给用户，请用户选择处理哪个任务。
3. `process-task.js show <index>` 获取 thread 内容和已有回复。
4. 把任务标题、内容、已有回复交给 AI，生成反馈。
5. `process-task.js reply <index> --text "<AI 反馈>"` 发送回复。
6. `process-task.js notify <index>` 发送处理通知。

## 异常处理原则

脚本已对以下情况给出明确错误提示：

- `lark-cli` 未安装或未加入 PATH
- 飞书接口返回 `ok: false`
- 找不到用户或群聊
- 返回 JSON 缺少必要字段（如 `guid`、`message_id`、`thread_id`）
- 参数缺失或任务序号超出范围
- 任务描述格式异常导致无法解析 `message_id`

任何步骤失败都会立即终止，并在 stderr 输出 `❌ 创建任务失败` 或 `❌ 处理任务失败`，附带具体原因。

## 常见错误

| 现象 | 可能原因 | 解决 |
|---|---|---|
| 找不到用户 | 名字拼写错误，或用户未加入组织 | 核对名字，确认用户已加入飞书组织 |
| 找不到群聊 | 群名称与默认不符 | 使用 `--tasks-chat` / `--notify-chat` 指定正确名称 |
| 创建任务失败 | 未授权 `task` scope | 重新授权 `lark-cli`，确保包含 `task` |
| 回复 thread 失败 | 任务描述中缺少 `message_id` | 检查任务是否由本流程创建，或 description 格式被破坏 |
| thread_id 缺失 | 发送的消息未形成话题 | 确认 `AgentTasks` 是话题群，且消息已成功发送 |

## 权限要求

`lark-cli` 授权时至少勾选：

- `contact`（查询用户 open_id）
- `im`（发送消息、查询 thread）
- `task`（创建、更新、查询任务）

并授予这些 scope 的**全部权限**。

## 协议版本

v1.0。建议先在小群体验证，再推广到全员。
