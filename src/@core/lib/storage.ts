import Database from "@tauri-apps/plugin-sql";
import { db, seedIfEmpty as seedBrowser, SEED_ARTICLES, SEED_FLASHCARDS, SEED_LEETCODE, SEED_SNIPPETS } from "@core/lib/db";

type Collection = "flashcards" | "leetcode_problems" | "articles" | "snippets" | "study_phases" | "diagrams";
const isDesktop = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
let sqlitePromise: ReturnType<typeof Database.load> | null = null;

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
    if (!isDesktop()) {
      if (collection === "flashcards") return db.flashcards.toArray() as unknown as T[];
      if (collection === "leetcode_problems") return db.leetcode_problems.toArray() as unknown as T[];
      if (collection === "articles") return db.articles.toArray() as unknown as T[];
      if (collection === "snippets") return db.snippets.toArray() as unknown as T[];
      if (collection === "study_phases") return db.study_phases.orderBy("updatedAt").reverse().toArray() as unknown as T[];
      return db.diagrams.orderBy("updatedAt").reverse().toArray() as unknown as T[];
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
      return db.diagrams.put(item as never);
    }
    const database = await sqlite();
    await database.execute(`INSERT INTO records (collection, id, payload, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT(collection, id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`, [collection, item.id, JSON.stringify(item), item.updatedAt ?? new Date().toISOString()]);
  },
  async bulkPut<T extends { id: string; updatedAt?: string }>(collection: Collection, items: T[]) {
    for (const item of items) await this.put(collection, item);
  },
  async remove(collection: Collection, id: string) {
    if (!isDesktop()) {
      if (collection === "flashcards") return db.flashcards.delete(id);
      if (collection === "leetcode_problems") return db.leetcode_problems.delete(id);
      if (collection === "articles") return db.articles.delete(id);
      if (collection === "snippets") return db.snippets.delete(id);
      if (collection === "study_phases") return db.study_phases.delete(id);
      return db.diagrams.delete(id);
    }
    const database = await sqlite();
    await database.execute(`DELETE FROM records WHERE collection = $1 AND id = $2`, [collection, id]);
  },
};
