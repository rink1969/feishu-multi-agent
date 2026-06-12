# 飞书社区多Agent协作

## 多Agent协作

多智能体协作目前主要分为两大路线。

一条是云厂商路线，倾向于让用户将 Agent 直接托管在云端，协作平台天然集成，用户只需订阅即可使用。由于 Agent 运行在云上，多设备支持体验较好，适合小白用户。

另一条是自建平台路线，仅负责 Agent 之间的协作通信，Agent 本身由用户自行部署和管理。该方案有一定技术门槛，但更适合有技术基础、注重数据隐私的用户。

我们的方案可以看作第二条路线的轻量版——直接基于飞书平台搭建。优势在于：

1. 更加轻量。仅使用飞书作为消息通道，云文档作为协作任务记录。不像其他平台还会负责连接，skill管理等功能。
2. 更 AI Native。本质就是一个约定好的工作流，完全依赖本地的AI Agent的理解能力和指令遵循能力，不限制具体的AI Agent。
3. 更 Local First。除了协作任务记录在云文档，其他内容都在用户本地。

## 社区多Agent

目前的多Agent协作通常是用于一个人的多个Agent或者一个团队的多个Agent。

但是在社区场景中，主要面向的是社区成员的沟通交流。同时考虑社区成员已有个人Agent的情况。

这个场景下会刻意淡化人与Agent的边界。Agent直接使用个人的飞书账号，随时切换，不需要区分人和Agent。

## 技术选型

Agent连接到飞书有两个方案：

1. 飞书bot
2. 飞书cli

先考虑飞书cli的方案，因为这个方案无需管理员配置审批，只要用户把个人飞书账号授权给cli即可。

飞书cli无法在外部群中发消息，只能读取外部群中的消息。

企业认证之后，飞书bot可以在外部群中发消息，可以作为补充方案。

飞书企业在成员不足100人时是免费的，如果社区规模小于100人，可以让成员都加入组织，这样就不需要外部群了。


## 整体流程

### 注册飞书组织

社区发起人需要有公司实体，在飞书上注册组织，并完成企业认证。

创建一个名为 `AgentTasks` 的话题群 和 名为 `AgentNotify` 的普通对话群。

### 社区成员加入组织

社区成员注册个人飞书账号。

组织管理员通过邀请链接等方式邀请社区成员加入社区所属的飞书组织。

### 社区成员配置飞书cli

参考 https://github.com/larksuite/cli 安装飞书cli以及附带的skills。

或者直接把链接丢给自己的AI Agent，让它帮忙安装。

跟随安装引导，选择用户身份授权，而非机器人身份，并赋予相应的权限。

权限scope至少要包含 `contract`, `im` 和 `task`，并授予 `全部权限`。

安装本项目包含的 Skill。


## 协作设计

### 创建任务
参数：
* 负责人名字，可以多人。
* 截止日期，可以是相对时间，比如三天后。
* 任务标题和任务内容。

处理：
1. 根据负责人的名字查询对应的open_id。
2. 创建任务，但是只传一个负责人，和任务标题。获得 task_id。
3. 在AgentTasks 的话题群里创建一个thread，内容是 任务标题 和 task的链接。获取 message_id 和 thread_id。
4. 更新任务。如果有多的负责人，添加上来；添加任务截止日期；添加任务内容： message_id: im_xxxx; thread_link: https://applink.feishu.cn/client/thread/open?open_chat_id=oc_xxx&open_thread_id=omt_xxxx&thread_position=1 ; content: xxxx
5. 在AgentNotify群里发个消息。内容为：创建了新任务 <任务标题> <task链接>

### 处理任务
1. 查询与我有关且未完成的任务。
2. 获取所有任务的标题和内容，让用户选择处理哪个任务？
3. 获取待处理任务相关的thread内容，了解任务当前的情况。
4. 把任务名称，内容以及已有的回复都送给AI。让它协助推进任务，并给出反馈。
5. AI进行处理并返回回复。
6. 在任务对应的 thread 里发送回复。
7. 在AgentNotify群里发个消息。内容为：处理了任务 <任务标题> <thread链接>

## 操作示例

### 创建任务
参数：
* 负责人：张三，李四，王五。
* 截止日期：三天后。
* 任务标题：成语接龙
* 任务内容：大家一起来玩成语接龙吧


1. 查询所有负责人的open_id

```
lark-cli contact +search-user --query "张三"  --exclude-external-users --as user | jq '.data.users[0].open_id'
"ou_8c5e0af031bb94465cd4fe8d90207249"

 lark-cli contact +search-user --query "李四"  --exclude-external-users --as user | jq '.data.users[0].open_id'
"ou_ef21ae1700384f3c4b92a49e256f8b18"

 lark-cli contact +search-user --query "王五"  --exclude-external-users --as user | jq '.data.users[0].open_id'
"ou_fc194fc6264d3c76d2f24af92ebf53ef"
```

说明：飞书cli没有批量查询，只能一个一个查。

2. 创建任务

```
lark-cli task +create --summary "成语接龙" --assignee "ou_8c5e0af031bb94465cd4fe8d90207249" --as user
{
  "ok": true,
  "identity": "user",
  "data": {
    "guid": "760f80c4-0f57-4611-94b2-92fcd62c9ae8",
    "url": "https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8"
  }
}
```

说明：

参数：
* --summary 参数传任务标题。
* --assignee 参数传递任一负责人的 open_id。因为创建任务的时候只能指定一个负责人，剩下的负责人在后续更新任务时添加上去。
* 如果截止日期是具体日期，也可以通过 --due "2026-06-15" 在创建任务时传递。但是如果是相对时间 --due "+3d" 创建任务时不支持，只能等更新任务时添加。

返回值：
* 返回结果中 '.data.guid' 即是 task_id。
* 返回结果中 '.data.url' 即是 task 的链接，后面有用。

3. 在 AgentTasks 的话题群里创建任务关联的thread

获取 AgentTasks 话题群的 chat_id
```
lark-cli im +chat-list | jq '.data.chats[] | select(.name == "AgentTasks")' | jq '.chat_id'
"oc_e7c9b10dc52f4aa5d95f460f235254d5"
```

创建thread，获取 message_id
```
lark-cli im +messages-send --chat-id oc_e7c9b10dc52f4aa5d95f460f235254d5 --text "成语接龙 https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8" --as user | jq '.data.message_id'
"om_x100b6d9c3b8a1228c1e24b0319c07d4"
```

说明：

参数：
* --chat-id 参数传递前面查询到的 AgentTasks 话题群的 chat_id
* --text 参数传递的是 任务标题 和 task 的链接（来自第2步返回值）

获取 thread_id
```
lark-cli im +messages-mget --message-ids om_x100b6d9c3b8a1228c1e24b0319c07d4 --as user | jq '.data.messages[0].thread_id'
"omt_194f0f9d5fe79bb2"
```

说明：
* --message-ids 参数传递的就是刚才获取到的 message_id

4. 更新任务

增加更多的负责人

```
lark-cli task +assign --task-id "760f80c4-0f57-4611-94b2-92fcd62c9ae8" --add "ou_ef21ae1700384f3c4b92a49e256f8b18,ou_fc194fc6264d3c76d2f24af92ebf53ef" --as user
{
  "ok": true,
  "identity": "user",
  "data": {
    "guid": "760f80c4-0f57-4611-94b2-92fcd62c9ae8",
    "url": "https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8"
  }
}
```

说明：
* --task-id 参数传递是第2步结果中的 task_id。
* --add 参数传递的是另外两名负责人。

增加任务内容和截止日期

任务内容严格遵循模板：

```
message_id: om_x100b6d9c3b8a1228c1e24b0319c07d4; thread_link: https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5&open_thread_id=omt_194f0f9d5fe79bb2&thread_position=-1 ; content: 大家一起来玩成语接龙吧
```

```
lark-cli task +update --task-id "760f80c4-0f57-4611-94b2-92fcd62c9ae8" --description "message_id: om_x100b6d9c3b8a1228c1e24b0319c07d4; thread_link: https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5&open_thread_id=omt_194f0f9d5fe79bb2&thread_position=-1 ; content: 大家一起来玩成语接龙吧" --due "+3d"
{
  "ok": true,
  "identity": "user",
  "data": {
    "tasks": [
      {
        "guid": "760f80c4-0f57-4611-94b2-92fcd62c9ae8",
        "url": "https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8"
      }
    ]
  },
  "meta": {
    "count": 1
  }
}
```

说明：
* --task-id 参数传递是第2步结果中的 task_id。
* --description 参数传递的是严格按照模板组装后的 task 内容。
* --due 参数传递的是截止日期。

5. 在AgentNotify群里发个消息

获取 AgentNotify 对话群的 chat_id
```
lark-cli im +chat-list | /d/tool/jq.exe '.data.chats[] | select(.name == "AgentNotify")' | /d/tool/jq.exe '.chat_id'
"oc_98612014ac640c12515d0e45c216710a"
```

发送通知消息
```
lark-cli im +messages-send --chat-id "oc_98612014ac640c12515d0e45c216710a" --text "创建了新任务:成语接龙 https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8"
{
  "ok": true,
  "identity": "user",
  "data": {
    "chat_id": "oc_98612014ac640c12515d0e45c216710a",
    "create_time": "2026-06-11 18:44:19",
    "message_id": "om_x100b6d9d56e0b0a4c1d1d0fd892725f"
  }
}
```

说明：
* --chat-id 参数传递前面查询到的 AgentNotify 对话群的 chat_id
* --text 参数遵循模板 创建了新任务：<任务标题> <task链接>（来自第2步返回值）

### 处理任务

1. 查询与我有关且未完成的任务

```
lark-cli task +get-related-tasks --include-complete=false --as user
{
  "ok": true,
  "identity": "user",
  "data": {
    "has_more": false,
    "items": [
      {
        "created_at": "2026-06-11 17:53:41",
        "creator": {
          "id": "ou_8c5e0af031bb94465cd4fe8d90207249",
          "type": "user"
        },
        "description": "message_id: om_x100b6d9c3b8a1228c1e24b0319c07d4; thread_link: https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5&open_thread_id=omt_194f0f9d5fe79bb2&thread_position=-1 ; content: 大家一起来玩成语接龙吧",
        "guid": "760f80c4-0f57-4611-94b2-92fcd62c9ae8",
        "members": [
          {
            "id": "ou_8c5e0af031bb94465cd4fe8d90207249",
            "role": "assignee",
            "type": "user"
          },
          {
            "id": "ou_ef21ae1700384f3c4b92a49e256f8b18",
            "role": "assignee",
            "type": "user"
          },
          {
            "id": "ou_fc194fc6264d3c76d2f24af92ebf53ef",
            "role": "assignee",
            "type": "user"
          }
        ],
        "mode": 2,
        "source": 7,
        "status": "todo",
        "subtask_count": 0,
        "summary": "成语接龙",
        "tasklists": [],
        "url": "https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8"
      }
    ],
    "page_token": "1781173255041596"
  },
  "meta": {
    "count": 1
  }
}
```

2. 获取所有任务的标题和内容，让用户选择处理哪个任务？

从上一步结果中抽取 '.data.items' 每一项的 summary 和 description
整理成一个任务列表，让用户选择现在处理哪个任务？

```
您有以下任务待处理：
1. 成语接龙：message_id: om_x100b6d9c3b8a1228c1e24b0319c07d4; thread_link: https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5&open_thread_id=omt_194f0f9d5fe79bb2&thread_position=-1 ; content: 大家一起来玩成语接龙吧
```

用户回复： 处理第1个任务

3. 获取待处理任务相关的thread内容，了解任务当前的情况。

```
lark-cli im +messages-mget --message-ids om_x100b6d9c3b8a1228c1e24b0319c07d4 --as user
{
  "ok": true,
  "identity": "user",
  "data": {
    "messages": [
      {
        "chat_id": "oc_e7c9b10dc52f4aa5d95f460f235254d5",
        "content": "成语接龙 https://applink.feishu.cn/client/todo/detail?guid=760f80c4-0f57-4611-94b2-92fcd62c9ae8",
        "create_time": "2026-06-11 18:00",
        "deleted": false,
        "message_app_link": "https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5\u0026open_thread_id=omt_194f0f9d5fe79bb2\u0026openchatid=oc_e7c9b10dc52f4aa5d95f460f235254d5\u0026openthreadid=omt_194f0f9d5fe79bb2\u0026thread_position=-1",
        "message_id": "om_x100b6d9c3b8a1228c1e24b0319c07d4",
        "message_position": "1",
        "msg_type": "text",
        "sender": {
          "id": "ou_8c5e0af031bb94465cd4fe8d90207249",
          "id_type": "open_id",
          "name": "宁志伟",
          "sender_type": "user",
          "tenant_key": "19699934b5c39bbc"
        },
        "thread_id": "omt_194f0f9d5fe79bb2",
        "thread_message_position": "-1",
        "thread_replies": [
          {
            "chat_id": "oc_e7c9b10dc52f4aa5d95f460f235254d5",
            "content": "我先来：一马当先",
            "create_time": "2026-06-11 18:27",
            "deleted": false,
            "message_app_link": "https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5\u0026open_thread_id=omt_194f0f9d5fe79bb2\u0026openchatid=oc_e7c9b10dc52f4aa5d95f460f235254d5\u0026openthreadid=omt_194f0f9d5fe79bb2\u0026thread_position=0",
            "message_id": "om_x100b6d9c946fd4b0b280a93e7c928ed",
            "message_position": "2",
            "msg_type": "text",
            "sender": {
              "id": "ou_8c5e0af031bb94465cd4fe8d90207249",
              "id_type": "open_id",
              "name": "张三",
              "sender_type": "user",
              "tenant_key": "19699934b5c39bbc"
            },
            "thread_id": "omt_194f0f9d5fe79bb2",
            "thread_message_position": "0",
            "updated": false
          }
        ],
        "updated": false
      }
    ],
    "total": 1
  }
}
```

说明：

参数：
* --message-ids 参数传递的第2步用户选择的任务 description 中解析出 message_id

返回值：

* 抽取 '.data.messages.thread_replies' 每一项的 content 和 sender.name


4. 把任务任务标题，内容以及已有的回复都送给AI。让它协助推进任务，并给出反馈。

任务标题：第2步中用户选择任务的 summary
内容：第2步中用户选择任务的内容解析后的 content
已有的回复：第3步的返回值

给AI的内容：

```
任务标题：成语接龙
任务内容：大家一起来玩成语接龙吧
已有回复：张三："我先来：一马当先"

请协助推进这个任务，并给出反馈。
```

5. AI进行处理并返回回复。

AI 回复：

```
先发制人
```

6. 在任务对应的 thread 里发送回复。

```
lark-cli im +messages-reply --message-id om_x100b6d9c3b8a1228c1e24b0319c07d4 --text "先发制人" --reply-in-thread --as user
{
  "ok": true,
  "identity": "user",
  "data": {
    "chat_id": "oc_e7c9b10dc52f4aa5d95f460f235254d5",
    "create_time": "2026-06-11 18:33:24",
    "message_id": "om_x100b6d9ca18edcb4c3a84c1f541bdde"
  }
}
```

说明：
* --message-ids 参数传递的第2步用户选择的任务 description 中解析出 message_id

7. 在AgentNotify群里发个消息。内容为：处理了任务 <任务标题> <thread链接>

获取 AgentNotify 对话群的 chat_id

```
lark-cli im +chat-list | jq.exe '.data.chats[] | select(.name == "AgentNotify")' | /d/tool/jq.exe '.chat_id'
"oc_98612014ac640c12515d0e45c216710a"
```

组装 <thread链接>

```
https://applink.feishu.cn/client/thread/open?open_chat_id=<AgentTask话题群的chat_id>&open_thread_id=<任务对应的thread_id>&thread_position=1
```

获取 AgentTasks 话题群的 chat_id
```
lark-cli im +chat-list | jq '.data.chats[] | select(.name == "AgentTasks")' | jq '.chat_id'
"oc_e7c9b10dc52f4aa5d95f460f235254d5"
```

获取任务对应的 thread_id
```
lark-cli im +messages-mget --message-ids om_x100b6d9c3b8a1228c1e24b0319c07d4 --as user | jq '.data.messages[0].thread_id'
"omt_194f0f9d5fe79bb2"
```
说明：
* --message-ids 参数传递的第2步用户选择的任务 description 中解析出 message_id


发送通知消息
```
lark-cli im +messages-send --chat-id "oc_98612014ac640c12515d0e45c216710a" --text "处理了任务:成语接龙 https://applink.feishu.cn/client/thread/open?open_chat_id=oc_e7c9b10dc52f4aa5d95f460f235254d5&open_thread_id=omt_194f0f9d5fe79bb2&thread_position=1"
{
  "ok": true,
  "identity": "user",
  "data": {
    "chat_id": "oc_98612014ac640c12515d0e45c216710a",
    "create_time": "2026-06-11 18:44:19",
    "message_id": "om_x100b6d9d56e0b0a4c1d1d0fd892725f"
  }
}
```

说明：
* --chat-id 参数传递前面查询到的 AgentNotify 对话群的 chat_id
* --text 参数遵循模板 处理了任务 <任务标题> <thread链接>

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
