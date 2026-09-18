import { afterEach, describe, expect, it } from "vitest";
import { migrate, openDatabase } from "../server/src/db/database.js";
import { createRepositories } from "../server/src/db/repositories.js";

const databases: Array<{ close(): void }> = [];

afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function repositories() {
  const database = openDatabase(":memory:");
  databases.push(database);
  migrate(database);
  return createRepositories(database);
}

describe("SQLite repositories", () => {
  it("creates a session and lists its messages in insertion order", () => {
    const repos = repositories();
    const session = repos.sessions.create({ userId: "user-1", title: "学习" });

    repos.messages.append({ sessionId: session.id, role: "user", content: "开始学习" });
    repos.messages.append({ sessionId: session.id, role: "assistant", content: "现在开始" });

    expect(repos.messages.list(session.id).map((message) => message.content)).toEqual([
      "开始学习",
      "现在开始"
    ]);
  });

  it("upserts and deletes a user memory", () => {
    const repos = repositories();
    const memory = repos.memories.upsert({ userId: "user-1", content: "喜欢被叫小狗", source: "explicit" });

    expect(repos.memories.list("user-1")).toHaveLength(1);
    repos.memories.delete("user-1", memory.id);
    expect(repos.memories.list("user-1")).toHaveLength(0);
  });

  it("marks a task complete", () => {
    const repos = repositories();
    const task = repos.tasks.create({ userId: "user-1", title: "阅读 30 分钟" });

    expect(repos.tasks.complete("user-1", task.id).status).toBe("completed");
  });
});
