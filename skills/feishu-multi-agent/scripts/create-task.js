import {
  assignTask,
  buildThreadLink,
  createTask,
  formatTaskDescription,
  getChatId,
  getMessage,
  LarkCliError,
  searchUserOpenId,
  sendMessage,
  updateTask,
} from "./lib/lark.js";

function printUsage() {
  console.log(`用法：node create-task.js [选项]

选项：
  --assignees       负责人名字，多个用逗号分隔（必填）
  --summary         任务标题（必填）
  --content         任务内容（必填）
  --due             截止日期，如 "+3d" 或 "2026-06-15"
  --tasks-chat      任务话题群名称，默认 "AgentTasks"
  --notify-chat     通知群名称，默认 "AgentNotify"
  --help            显示此帮助

示例：
  node create-task.js --assignees "张三,李四" --summary "成语接龙" --content "大家一起来玩成语接龙" --due "+3d"
`);
}

function parseArgs(argv) {
  const args = {
    assignees: null,
    summary: null,
    content: null,
    due: null,
    tasksChat: "AgentTasks",
    notifyChat: "AgentNotify",
  };

  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];

    switch (key) {
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      case "--assignees":
        args.assignees = next;
        i++;
        break;
      case "--summary":
        args.summary = next;
        i++;
        break;
      case "--content":
        args.content = next;
        i++;
        break;
      case "--due":
        args.due = next;
        i++;
        break;
      case "--tasks-chat":
        args.tasksChat = next;
        i++;
        break;
      case "--notify-chat":
        args.notifyChat = next;
        i++;
        break;
      default:
        throw new LarkCliError(`未知参数：${key}`);
    }
  }

  if (!args.assignees || !args.assignees.trim()) {
    throw new LarkCliError("缺少 --assignees 参数");
  }
  if (!args.summary || !args.summary.trim()) {
    throw new LarkCliError("缺少 --summary 参数");
  }
  if (!args.content || !args.content.trim()) {
    throw new LarkCliError("缺少 --content 参数");
  }

  return args;
}

async function resolveAssignees(names) {
  const trimmedNames = names
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (trimmedNames.length === 0) {
    throw new LarkCliError("至少需要一名负责人");
  }

  const openIds = [];
  for (const name of trimmedNames) {
    try {
      const openId = await searchUserOpenId(name);
      openIds.push(openId);
    } catch (err) {
      throw new LarkCliError(`查询负责人 "${name}" 失败：${err.message}`);
    }
  }

  return openIds;
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const assigneeOpenIds = await resolveAssignees(args.assignees);

    console.log(`正在创建任务：${args.summary}`);
    const [firstAssignee, ...extraAssignees] = assigneeOpenIds;
    const { guid: taskId, url: taskUrl } = await createTask({
      summary: args.summary,
      assignee: firstAssignee,
    });
    console.log(`任务已创建：${taskId}，链接：${taskUrl}`);

    const tasksChatId = await getChatId(args.tasksChat);
    const initialMessage = `${args.summary} ${taskUrl}`;
    const { message_id: messageId } = await sendMessage(tasksChatId, initialMessage);
    console.log(`已在 "${args.tasksChat}" 创建 thread，message_id：${messageId}`);

    const message = await getMessage(messageId);
    const threadId = message.thread_id;
    if (!threadId) {
      throw new LarkCliError("消息详情中缺少 thread_id，无法关联任务与话题");
    }
    console.log(`thread_id：${threadId}`);

    const threadLink = buildThreadLink(tasksChatId, threadId, -1);
    const description = formatTaskDescription({
      messageId,
      threadLink,
      content: args.content,
    });
    await updateTask(taskId, description, args.due);
    console.log("任务描述和截止日期已更新");

    if (extraAssignees.length > 0) {
      await assignTask(taskId, extraAssignees);
      console.log(`已添加额外负责人：${extraAssignees.join(", ")}`);
    }

    const notifyChatId = await getChatId(args.notifyChat);
    const notifyText = `创建了新任务:${args.summary} ${taskUrl}`;
    await sendMessage(notifyChatId, notifyText);
    console.log(`已在 "${args.notifyChat}" 发送通知`);

    console.log("\n任务创建完成：");
    console.log(`  task_id：${taskId}`);
    console.log(`  task_url：${taskUrl}`);
    console.log(`  message_id：${messageId}`);
    console.log(`  thread_id：${threadId}`);
  } catch (err) {
    console.error(`\n❌ 创建任务失败：${err.message}`);
    if (err.cause) {
      console.error(`原因：${err.cause.message || err.cause}`);
    }
    process.exit(1);
  }
}

main();
