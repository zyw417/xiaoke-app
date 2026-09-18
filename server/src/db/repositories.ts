import { randomUUID } from "node:crypto";
import type { AppDatabase } from "./database.js";

type Session = { id: string; userId: string; title: string; createdAt: number; updatedAt: number };
type Message = { id: string; sessionId: string; role: "user" | "assistant" | "system"; content: string; createdAt: number };
type Memory = { id: string; userId: string; content: string; source: string; createdAt: number };
type Task = { id: string; userId: string; title: string; status: "pending" | "completed"; createdAt: number; completedAt: number | null };

function now(): number {
  return Date.now();
}

export function createRepositories(database: AppDatabase) {
  return {
    sessions: {
      create(input: { userId: string; title: string }): Session {
        const timestamp = now();
        const id = randomUUID();
        database.prepare(
          "INSERT INTO sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        ).run(id, input.userId, input.title, timestamp, timestamp);
        return { id, userId: input.userId, title: input.title, createdAt: timestamp, updatedAt: timestamp };
      }
    },
    messages: {
      append(input: { sessionId: string; role: Message["role"]; content: string }): Message {
        const timestamp = now();
        const id = randomUUID();
        database.prepare(
          "INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(id, input.sessionId, input.role, input.content, timestamp);
        database.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").run(timestamp, input.sessionId);
        return { id, sessionId: input.sessionId, role: input.role, content: input.content, createdAt: timestamp };
      },
      list(sessionId: string): Message[] {
        const rows = database.prepare(
          "SELECT id, session_id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY created_at, rowid"
        ).all(sessionId) as Array<Record<string, unknown>>;
        return rows.map((row) => ({
          id: String(row.id),
          sessionId: String(row.session_id),
          role: row.role as Message["role"],
          content: String(row.content),
          createdAt: Number(row.created_at)
        }));
      }
    },
    memories: {
      upsert(input: { userId: string; content: string; source: string }): Memory {
        const timestamp = now();
        const id = randomUUID();
        database.prepare(
          "INSERT INTO memories (id, user_id, content, source, created_at) VALUES (?, ?, ?, ?, ?)"
        ).run(id, input.userId, input.content, input.source, timestamp);
        return { id, userId: input.userId, content: input.content, source: input.source, createdAt: timestamp };
      },
      list(userId: string): Memory[] {
        const rows = database.prepare(
          "SELECT id, user_id, content, source, created_at FROM memories WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at, id"
        ).all(userId) as Array<Record<string, unknown>>;
        return rows.map((row) => ({
          id: String(row.id),
          userId: String(row.user_id),
          content: String(row.content),
          source: String(row.source),
          createdAt: Number(row.created_at)
        }));
      },
      delete(userId: string, id: string): void {
        database.prepare("UPDATE memories SET deleted_at = ? WHERE id = ? AND user_id = ?").run(now(), id, userId);
      }
    },
    tasks: {
      create(input: { userId: string; title: string }): Task {
        const timestamp = now();
        const id = randomUUID();
        database.prepare(
          "INSERT INTO tasks (id, user_id, title, status, created_at) VALUES (?, ?, ?, 'pending', ?)"
        ).run(id, input.userId, input.title, timestamp);
        return { id, userId: input.userId, title: input.title, status: "pending", createdAt: timestamp, completedAt: null };
      },
      complete(userId: string, id: string): Task {
        const timestamp = now();
        database.prepare(
          "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ? AND user_id = ?"
        ).run(timestamp, id, userId);
        const row = database.prepare(
          "SELECT id, user_id, title, status, created_at, completed_at FROM tasks WHERE id = ? AND user_id = ?"
        ).get(id, userId) as Record<string, unknown>;
        return {
          id: String(row.id),
          userId: String(row.user_id),
          title: String(row.title),
          status: row.status as Task["status"],
          createdAt: Number(row.created_at),
          completedAt: row.completed_at == null ? null : Number(row.completed_at)
        };
      }
    }
  };
}
