import {
  buildThreadLink,
  getChatId,
  getMessage,
  getRelatedTasks,
  LarkCliError,
  parseTaskDescription,
  replyInThread,
  sendMessage,
} from "./lib/lark.js";

function printUsage() {
  console.log(`用法：node process-task.js <子命令> [选项]

子命令：
  list              列出与我相关且未完成的任务
  show <index>      显示指定任务的 thread 详情
  reply <index>     在任务 thread 中发送回复
  notify <index>    在通知群发送"处理了任务"通知

选项：
  --tasks-chat      任务话题群名称，默认 "AgentTasks"
  --notify-chat     通知群名称，默认 "AgentNotify"
  --text            reply 子命令的回复内容
  --json            以 JSON 格式输出 list/show 结果，便于 Agent 解析
  --help            显示此帮助

示例：
  node process-task.js list
  node process-task.js show 1
  node process-task.js reply 1 --text "先发制人"
  node process-task.js notify 1
`);
}

function parseGlobalArgs(argv) {
  const args = {
    tasksChat: "AgentTasks",
    notifyChat: "AgentNotify",
    text: null,
    json: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];

    switch (key) {
      case "--tasks-chat":
        args.tasksChat = next;
        i++;
        break;
      case "--notify-chat":
        args.notifyChat = next;
        i++;
        break;
      case "--text":
        args.text = next;
        i++;
        break;
      case "--json":
        args.json = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        throw new LarkCliError(`未知参数：${key}`);
    }
  }

  return args;
}

async function fetchIndexedTask(index) {
  if (!Number.isInteger(index) || index < 1) {
    throw new LarkCliError("任务序号必须是大于等于 1 的整数");
  }

  const tasks = await getRelatedTasks();
  if (tasks.length === 0) {
    throw new LarkCliError("当前没有与我相关的未完成任务");
  }

  const task = tasks[index - 1];
  if (!task) {
    throw new LarkCliError(`任务序号 ${index} 超出范围，当前共有 ${tasks.length} 个任务`);
  }

  return { task, tasks };
}

function extractTaskContext(task) {
  const parsed = parseTaskDescription(task.description);
  return {
    taskId: task.guid,
    summary: task.summary,
    url: task.url,
    messageId: parsed.message_id,
    threadLink: parsed.thread_link,
    content: parsed.content,
  };
}

async function listCommand(args) {
  const tasks = await getRelatedTasks();

  if (args.json) {
    const list = tasks.map((task, index) => {
      const ctx = extractTaskContext(task);
      return {
        index: index + 1,
        taskId: ctx.taskId,
        summary: ctx.summary,
        url: ctx.url,
        messageId: ctx.messageId,
        threadLink: ctx.threadLink,
        content: ctx.content,
      };
    });
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  if (tasks.length === 0) {
    console.log("当前没有与我相关的未完成任务。");
    return;
  }

  console.log("您有以下任务待处理：");
  tasks.forEach((task, index) => {
    const ctx = extractTaskContext(task);
    console.log(`${index + 1}. ${ctx.summary}：${ctx.content || "(无内容)"}`);
  });
}

async function showCommand(index, args) {
  const { task } = await fetchIndexedTask(index);
  const ctx = extractTaskContext(task);

  if (!ctx.messageId) {
    throw new LarkCliError("任务描述中缺少 message_id，无法获取 thread 内容");
  }

  const message = await getMessage(ctx.messageId);
  const replies = message.thread_replies || [];

  if (args.json) {
    console.log(
      JSON.stringify(
        {
          index,
          taskId: ctx.taskId,
          summary: ctx.summary,
          content: ctx.content,
          url: ctx.url,
          messageId: ctx.messageId,
          threadId: message.thread_id,
          threadLink: ctx.threadLink,
          replies: replies.map((r) => ({ sender: r.sender?.name, content: r.content, createTime: r.create_time })),
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`任务标题：${ctx.summary}`);
  console.log(`任务内容：${ctx.content || "(无内容)"}`);
  console.log(`任务链接：${ctx.url}`);
  console.log(`已有回复数：${replies.length}`);

  if (replies.length > 0) {
    console.log("\n已有回复：");
    replies.forEach((r) => {
      console.log(`  ${r.sender?.name || "未知用户"}：${r.content}`);
    });
  }

  console.log("\n可交给 AI 的上下文：");
  const contextForAi = [
    `任务标题：${ctx.summary}`,
    `任务内容：${ctx.content || ""}`,
    "已有回复：",
    ...replies.map((r) => `${r.sender?.name || "未知用户"}："${r.content}"`),
    "\n请协助推进这个任务，并给出反馈。",
  ].join("\n");
  console.log(contextForAi);
}

async function replyCommand(index, args) {
  if (!args.text || !args.text.trim()) {
    throw new LarkCliError("reply 子命令需要 --text 参数指定回复内容");
  }

  const { task } = await fetchIndexedTask(index);
  const ctx = extractTaskContext(task);

  if (!ctx.messageId) {
    throw new LarkCliError("任务描述中缺少 message_id，无法回复 thread");
  }

  const result = await replyInThread(ctx.messageId, args.text);
  console.log(`已在 thread 中发送回复，新消息 ID：${result.message_id}`);
  return { task, ctx, result };
}

async function notifyCommand(index, args) {
  const { task } = await fetchIndexedTask(index);
  const ctx = extractTaskContext(task);

  if (!ctx.messageId) {
    throw new LarkCliError("任务描述中缺少 message_id，无法构造 thread 链接");
  }

  const message = await getMessage(ctx.messageId);
  const threadId = message.thread_id;
  if (!threadId) {
    throw new LarkCliError("消息详情中缺少 thread_id");
  }

  const tasksChatId = await getChatId(args.tasksChat);
  const threadLink = buildThreadLink(tasksChatId, threadId, 1);

  const notifyChatId = await getChatId(args.notifyChat);
  const notifyText = `处理了任务:${ctx.summary} ${threadLink}`;
  await sendMessage(notifyChatId, notifyText);
  console.log(`已在 "${args.notifyChat}" 发送处理通知`);
}

async function main() {
  try {
    const [subcommand, ...rest] = process.argv.slice(2);

    if (!subcommand || ["--help", "-h"].includes(subcommand)) {
      printUsage();
      process.exit(0);
    }

    const args = parseGlobalArgs(rest);

    switch (subcommand) {
      case "list":
        await listCommand(args);
        break;
      case "show": {
        const index = parseInt(rest.find((a) => !a.startsWith("--")) || "", 10);
        await showCommand(index, args);
        break;
      }
      case "reply": {
        const index = parseInt(rest.find((a) => !a.startsWith("--")) || "", 10);
        await replyCommand(index, args);
        break;
      }
      case "notify": {
        const index = parseInt(rest.find((a) => !a.startsWith("--")) || "", 10);
        await notifyCommand(index, args);
        break;
      }
      default:
        throw new LarkCliError(`未知子命令：${subcommand}`);
    }
  } catch (err) {
    console.error(`\n❌ 处理任务失败：${err.message}`);
    if (err.cause) {
      console.error(`原因：${err.cause.message || err.cause}`);
    }
    process.exit(1);
  }
}

main();
