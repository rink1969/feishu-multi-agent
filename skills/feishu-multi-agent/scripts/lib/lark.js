/**
 * 飞书 CLI 通用调用层：统一执行、JSON 解析与错误提示。
 * 所有 lark-cli 调用都应经过此模块，避免各脚本重复处理异常。
 */
import { spawn } from "node:child_process";

export class LarkCliError extends Error {
  constructor(message, { cause } = {}) {
    super(message);
    this.name = "LarkCliError";
    this.cause = cause;
  }
}

export async function larkCli(args, { allowFailure = false } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn("lark-cli", args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf-8");
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf-8");
    });

    proc.on("error", (err) => {
      reject(
        new LarkCliError(
          `无法执行 lark-cli：${err.message}。请确认已安装并加入 PATH。参考：https://github.com/larksuite/cli`,
          { cause: err }
        )
      );
    });

    proc.on("close", (code) => {
      if (code !== 0 && !allowFailure) {
        reject(
          new LarkCliError(
            `lark-cli 退出码 ${code}。\n命令：lark-cli ${args.join(" ")}\nstderr：${stderr || "(空)"}\nstdout：${stdout || "(空)"}`
          )
        );
        return;
      }

      let data;
      try {
        const lines = stdout.split(/\r?\n/).filter((l) => l.trim());
        const jsonLine = lines.findLast((l) => l.trim().startsWith("{") || l.trim().startsWith("["));
        if (!jsonLine) {
          throw new Error("输出中未找到 JSON 行");
        }
        data = JSON.parse(jsonLine);
      } catch (err) {
        reject(
          new LarkCliError(
            `无法解析 lark-cli 输出为 JSON：${err.message}\n原始输出：\n${stdout}`,
            { cause: err }
          )
        );
        return;
      }

      if (!allowFailure && data && data.ok === false) {
        reject(new LarkCliError(`飞书接口返回失败：${JSON.stringify(data, null, 2)}`));
        return;
      }

      resolve(data);
    });
  });
}

export async function searchUserOpenId(name) {
  if (!name || !name.trim()) {
    throw new LarkCliError("负责人名字不能为空");
  }

  const data = await larkCli([
    "contact",
    "+search-user",
    "--query",
    name.trim(),
    "--exclude-external-users",
    "--as",
    "user",
  ]);

  const users = data?.data?.users;
  if (!Array.isArray(users) || users.length === 0) {
    throw new LarkCliError(`未找到用户 "${name}"，请检查名字是否正确，或该用户是否已加入组织。`);
  }

  const openId = users[0]?.open_id;
  if (!openId) {
    throw new LarkCliError(`用户 "${name}" 的查询结果中缺少 open_id。`);
  }

  return openId;
}

export async function getChatId(chatName) {
  if (!chatName || !chatName.trim()) {
    throw new LarkCliError("群聊名称不能为空");
  }

  const data = await larkCli(["im", "+chat-list"]);
  const chats = data?.data?.chats;
  if (!Array.isArray(chats) || chats.length === 0) {
    throw new LarkCliError("当前账号没有任何群聊，请确认飞书 CLI 已正确授权。");
  }

  const chat = chats.find((c) => c.name === chatName.trim());
  if (!chat) {
    const names = chats.map((c) => `"${c.name}"`).join(", ");
    throw new LarkCliError(`未找到名为 "${chatName}" 的群聊。已找到的群聊：${names}`);
  }

  if (!chat.chat_id) {
    throw new LarkCliError(`群聊 "${chatName}" 的信息中缺少 chat_id。`);
  }

  return chat.chat_id;
}

export async function createTask({ summary, assignee, due }) {
  if (!summary || !summary.trim()) {
    throw new LarkCliError("任务标题不能为空");
  }
  if (!assignee || !assignee.trim()) {
    throw new LarkCliError("创建任务时至少需要一名负责人");
  }

  const args = ["task", "+create", "--summary", summary.trim(), "--assignee", assignee.trim(), "--as", "user"];
  if (due && due.trim()) {
    args.push("--due", due.trim());
  }

  const data = await larkCli(args);
  const guid = data?.data?.guid;
  const url = data?.data?.url;

  if (!guid || !url) {
    throw new LarkCliError(`创建任务接口返回异常，缺少 guid 或 url：${JSON.stringify(data, null, 2)}`);
  }

  return { guid, url };
}

export async function assignTask(taskId, assigneeOpenIds) {
  if (!taskId || !taskId.trim()) {
    throw new LarkCliError("taskId 不能为空");
  }
  if (!Array.isArray(assigneeOpenIds) || assigneeOpenIds.length === 0) {
    return;
  }

  await larkCli([
    "task",
    "+assign",
    "--task-id",
    taskId.trim(),
    "--add",
    assigneeOpenIds.join(","),
    "--as",
    "user",
  ]);
}

export async function updateTask(taskId, description, due) {
  if (!taskId || !taskId.trim()) {
    throw new LarkCliError("taskId 不能为空");
  }
  if (!description || !description.trim()) {
    throw new LarkCliError("任务描述不能为空");
  }

  const args = ["task", "+update", "--task-id", taskId.trim(), "--description", description.trim()];
  if (due && due.trim()) {
    args.push("--due", due.trim());
  }

  await larkCli(args);
}

export async function sendMessage(chatId, text) {
  if (!chatId || !chatId.trim()) {
    throw new LarkCliError("chatId 不能为空");
  }
  if (!text || !text.trim()) {
    throw new LarkCliError("消息内容不能为空");
  }

  const data = await larkCli([
    "im",
    "+messages-send",
    "--chat-id",
    chatId.trim(),
    "--text",
    text.trim(),
    "--as",
    "user",
  ]);

  const messageId = data?.data?.message_id;
  const returnedChatId = data?.data?.chat_id;
  if (!messageId) {
    throw new LarkCliError(`发送消息接口返回异常，缺少 message_id：${JSON.stringify(data, null, 2)}`);
  }

  return { message_id: messageId, chat_id: returnedChatId || chatId };
}

export async function getMessage(messageId) {
  if (!messageId || !messageId.trim()) {
    throw new LarkCliError("messageId 不能为空");
  }

  const data = await larkCli([
    "im",
    "+messages-mget",
    "--message-ids",
    messageId.trim(),
    "--as",
    "user",
  ]);

  const message = data?.data?.messages?.[0];
  if (!message) {
    throw new LarkCliError(`未找到 message_id 为 "${messageId}" 的消息。`);
  }

  return message;
}

export async function replyInThread(messageId, text) {
  if (!messageId || !messageId.trim()) {
    throw new LarkCliError("messageId 不能为空");
  }
  if (!text || !text.trim()) {
    throw new LarkCliError("回复内容不能为空");
  }

  const data = await larkCli([
    "im",
    "+messages-reply",
    "--message-id",
    messageId.trim(),
    "--text",
    text.trim(),
    "--reply-in-thread",
    "--as",
    "user",
  ]);

  const newMessageId = data?.data?.message_id;
  if (!newMessageId) {
    throw new LarkCliError(`回复消息接口返回异常，缺少 message_id：${JSON.stringify(data, null, 2)}`);
  }

  return { message_id: newMessageId };
}

export async function getRelatedTasks() {
  const data = await larkCli([
    "task",
    "+get-related-tasks",
    "--include-complete=false",
    "--as",
    "user",
  ]);

  const items = data?.data?.items;
  if (!Array.isArray(items)) {
    throw new LarkCliError(`查询任务接口返回异常，缺少 items：${JSON.stringify(data, null, 2)}`);
  }

  return items;
}

export function parseTaskDescription(description) {
  const result = {};
  if (!description) return result;

  const messageMatch = description.match(/message_id:\s*([^;]+)/);
  if (messageMatch) result.message_id = messageMatch[1].trim();

  const linkMatch = description.match(/thread_link:\s*([^;]+)/);
  if (linkMatch) result.thread_link = linkMatch[1].trim();

  const contentMatch = description.match(/content:\s*(.+)$/);
  if (contentMatch) result.content = contentMatch[1].trim();

  return result;
}

export function formatTaskDescription({ messageId, threadLink, content }) {
  return `message_id: ${messageId}; thread_link: ${threadLink} ; content: ${content}`;
}

export function buildThreadLink(chatId, threadId, position = 1) {
  if (!chatId || !threadId) {
    throw new LarkCliError("构建 thread 链接需要 chatId 和 threadId");
  }
  return `https://applink.feishu.cn/client/thread/open?open_chat_id=${chatId}&open_thread_id=${threadId}&thread_position=${position}`;
}

// Node < 20 没有 Array.prototype.findLast 的 polyfill
if (!Array.prototype.findLast) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.findLast = function (predicate) {
    for (let i = this.length - 1; i >= 0; i--) {
      if (predicate(this[i], i, this)) return this[i];
    }
    return undefined;
  };
}
