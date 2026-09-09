use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:enterview.db",
                    vec![Migration {
                        version: 1,
                        description: "create generic study records store",
                        sql: "CREATE TABLE IF NOT EXISTS records (collection TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (collection, id)); CREATE INDEX IF NOT EXISTS records_collection_updated_idx ON records(collection, updated_at DESC);",
                        kind: MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Enterview");
}
