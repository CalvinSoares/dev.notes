import Database from "@tauri-apps/plugin-sql";
import { db, seedIfEmpty as seedBrowser, SEED_ARTICLES, SEED_FLASHCARDS, SEED_LEETCODE, SEED_SNIPPETS } from "@core/lib/db";
import type { SyncTombstone } from "@core/types";

export type Collection = "flashcards" | "leetcode_problems" | "articles" | "snippets" | "study_phases" | "diagrams" | "quiz_exams" | "quiz_questions" | "quiz_attempts" | "study_roadmaps" | "roadmap_nodes" | "roadmap_links" | "sync_tombstones";
const isDesktop = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
let sqlitePromise: ReturnType<typeof Database.load> | null = null;
let quizMigrationPromise: Promise<void> | null = null;
const quizCollections: Collection[] = ["quiz_exams", "quiz_questions", "quiz_attempts"];
const quizMigrationKey = "dunots.quiz-storage-migrated";

async function migrateLegacyQuizStorage() {
  if (!isDesktop() || typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(quizMigrationKey)) return;
  } catch {
    // A migração continua segura mesmo quando o WebView não disponibiliza localStorage.
  }
  const database = await sqlite();
  const counts = await Promise.all(quizCollections.map(async (collection) => {
    const rows = await database.select<{ count: number }[]>("SELECT COUNT(*) as count FROM records WHERE collection = $1", [collection]);
    return rows[0]?.count ?? 0;
  }));
  if (counts.every((count) => count === 0)) {
    const legacy = await Promise.all([db.quiz_exams.toArray(), db.quiz_questions.toArray(), db.quiz_attempts.toArray()]);
    await storage.bulkPut("quiz_exams", legacy[0]);
    await storage.bulkPut("quiz_questions", legacy[1]);
    await storage.bulkPut("quiz_attempts", legacy[2]);
  }
  try {
    window.localStorage.setItem(quizMigrationKey, "1");
  } catch {
    // Sem marcador, a checagem de contagem evita duplicação e mantém a migração idempotente.
  }
}

async function ensureQuizStorageMigrated(collection: Collection) {
  if (!quizCollections.includes(collection)) return;
  quizMigrationPromise ??= migrateLegacyQuizStorage();
  await quizMigrationPromise;
}
async function sqlite() {
  if (!sqlitePromise) sqlitePromise = Database.load("sqlite:enterview.db");
  return sqlitePromise;
}

export const storage = {
  async seedIfEmpty() {
    if (!isDesktop()) return seedBrowser();
    const database = await sqlite();
    const seeds: [Collection, { id: string; updatedAt?: string }[]][] = [
      ["flashcards", SEED_FLASHCARDS],
      ["leetcode_problems", SEED_LEETCODE],
      ["articles", SEED_ARTICLES],
      ["snippets", SEED_SNIPPETS],
    ];
    for (const [collection, rows] of seeds) {
      const result = await database.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM records WHERE collection = $1`, [collection]);
      if (!result[0]?.count) await this.bulkPut(collection, rows);
    }
  },
  async list<T>(collection: Collection): Promise<T[]> {
    await ensureQuizStorageMigrated(collection);
    if (!isDesktop()) {
      if (collection === "flashcards") return db.flashcards.toArray() as unknown as T[];
      if (collection === "leetcode_problems") return db.leetcode_problems.toArray() as unknown as T[];
      if (collection === "articles") return db.articles.toArray() as unknown as T[];
      if (collection === "snippets") return db.snippets.toArray() as unknown as T[];
      if (collection === "study_phases") return db.study_phases.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      if (collection === "diagrams") return db.diagrams.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      if (collection === "quiz_exams") return db.quiz_exams.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      if (collection === "quiz_questions") return db.quiz_questions.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      if (collection === "study_roadmaps") return db.study_roadmaps.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      if (collection === "roadmap_nodes") return db.roadmap_nodes.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      if (collection === "roadmap_links") return db.roadmap_links.toArray().then((items) => items.sort((left, right) => left.createdAt.localeCompare(right.createdAt))) as unknown as T[];
      if (collection === "sync_tombstones") return db.sync_tombstones.toArray() as unknown as T[];
      return db.quiz_attempts.orderBy("startedAt").reverse().toArray() as unknown as T[];
    }
    const database = await sqlite();
    const rows = await database.select<{ payload: string }[]>(`SELECT payload FROM records WHERE collection = $1 ORDER BY updated_at DESC`, [collection]);
    return rows.map((row) => JSON.parse(row.payload) as T);
  },
  async put<T extends { id: string; updatedAt?: string }>(collection: Collection, item: T) {
    if (!isDesktop()) {
      if (collection === "flashcards") return db.flashcards.put(item as never);
      if (collection === "leetcode_problems") return db.leetcode_problems.put(item as never);
      if (collection === "articles") return db.articles.put(item as never);
      if (collection === "snippets") return db.snippets.put(item as never);
      if (collection === "study_phases") return db.study_phases.put(item as never);
      if (collection === "diagrams") return db.diagrams.put(item as never);
      if (collection === "quiz_exams") return db.quiz_exams.put(item as never);
      if (collection === "quiz_questions") return db.quiz_questions.put(item as never);
      if (collection === "study_roadmaps") return db.study_roadmaps.put(item as never);
      if (collection === "roadmap_nodes") return db.roadmap_nodes.put(item as never);
      if (collection === "roadmap_links") return db.roadmap_links.put(item as never);
      if (collection === "sync_tombstones") return db.sync_tombstones.put(item as never);
      return db.quiz_attempts.put(item as never);
    }
    const database = await sqlite();
    await database.execute(`INSERT INTO records (collection, id, payload, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT(collection, id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`, [collection, item.id, JSON.stringify(item), item.updatedAt ?? new Date().toISOString()]);
  },
  async bulkPut<T extends { id: string; updatedAt?: string }>(collection: Collection, items: T[]) {
    for (const item of items) await this.put(collection, item);
  },
  async remove(collection: Collection, id: string) {
    if (collection !== "sync_tombstones") {
      const deletedAt = new Date().toISOString();
      const tombstone: SyncTombstone = { id: collection + ":" + id, collection, recordId: id, deletedAt, updatedAt: deletedAt };
      await this.put("sync_tombstones", tombstone);
    }
    if (!isDesktop()) {
      if (collection === "flashcards") return db.flashcards.delete(id);
      if (collection === "leetcode_problems") return db.leetcode_problems.delete(id);
      if (collection === "articles") return db.articles.delete(id);
      if (collection === "snippets") return db.snippets.delete(id);
      if (collection === "study_phases") return db.study_phases.delete(id);
      if (collection === "diagrams") return db.diagrams.delete(id);
      if (collection === "quiz_exams") return db.quiz_exams.delete(id);
      if (collection === "quiz_questions") return db.quiz_questions.delete(id);
      if (collection === "study_roadmaps") return db.study_roadmaps.delete(id);
      if (collection === "roadmap_nodes") return db.roadmap_nodes.delete(id);
      if (collection === "roadmap_links") return db.roadmap_links.delete(id);
      if (collection === "sync_tombstones") return db.sync_tombstones.delete(id);
      return db.quiz_attempts.delete(id);
    }
    const database = await sqlite();
    await database.execute(`DELETE FROM records WHERE collection = $1 AND id = $2`, [collection, id]);
  },
  async removeMany(collection: Collection, ids: string[]) {
    await Promise.all(ids.map((id) => this.remove(collection, id)));
  },
};
