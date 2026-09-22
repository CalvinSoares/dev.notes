use serde::Serialize;
use std::{
    io::{Read, Write},
    net::{TcpListener, TcpStream, UdpSocket},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri_plugin_sql::{Migration, MigrationKind};

static SYNC_STOP: OnceLock<Mutex<Option<Arc<AtomicBool>>>> = OnceLock::new();

#[derive(Clone, Serialize)]
struct SyncHostInfo {
    address: String,
    token: String,
    expires_at: u64,
}

fn sync_stop_state() -> &'static Mutex<Option<Arc<AtomicBool>>> {
    SYNC_STOP.get_or_init(|| Mutex::new(None))
}

fn local_ip() -> String {
    UdpSocket::bind("0.0.0.0:0")
        .and_then(|socket| {
            socket.connect("8.8.8.8:80")?;
            socket.local_addr()
        })
        .map(|address| address.ip().to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string())
}

fn http_response(status: &str, content_type: &str, body: &str) -> String {
    format!(
        "HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Authorization, Content-Type\r\nAccess-Control-Allow-Methods: GET, OPTIONS\r\nConnection: close\r\n\r\n{body}",
        body.as_bytes().len()
    )
}

fn handle_sync_connection(mut stream: TcpStream, package: &str, token: &str) {
    let mut buffer = [0_u8; 8192];
    let Ok(size) = stream.read(&mut buffer) else {
        return;
    };
    let request = String::from_utf8_lossy(&buffer[..size]);
    if request.starts_with("OPTIONS ") {
        let _ = stream.write_all(http_response("204 No Content", "text/plain", "").as_bytes());
        return;
    }
    let authorized = request.lines().any(|line| line.trim() == format!("Authorization: Bearer {token}"));
    let requested_path = request.lines().next().unwrap_or_default().split_whitespace().nth(1).unwrap_or_default();
    if authorized && requested_path.starts_with("/dunots-sync") {
        let _ = stream.write_all(http_response("200 OK", "application/json", package).as_bytes());
    } else {
        let _ = stream.write_all(http_response("401 Unauthorized", "application/json", r#"{"error":"invalid pairing token"}"#).as_bytes());
    }
}

#[tauri::command]
fn start_sync_host(package: String, token: String) -> Result<SyncHostInfo, String> {
    if package.is_empty() || token.trim().is_empty() {
        return Err("Pacote ou token de pareamento vazio.".to_string());
    }
    let listener = TcpListener::bind("0.0.0.0:0").map_err(|error| format!("Não foi possível abrir a porta local: {error}"))?;
    listener.set_nonblocking(true).map_err(|error| format!("Não foi possível preparar o servidor: {error}"))?;
    let port = listener.local_addr().map_err(|error| error.to_string())?.port();
    let stop = Arc::new(AtomicBool::new(false));
    if let Ok(mut current) = sync_stop_state().lock() {
        if let Some(previous) = current.take() {
            previous.store(true, Ordering::Relaxed);
        }
        *current = Some(stop.clone());
    }
    let server_token = token.clone();
    thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(600);
        while !stop.load(Ordering::Relaxed) && Instant::now() < deadline {
            match listener.accept() {
                Ok((stream, _)) => handle_sync_connection(stream, &package, &server_token),
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => thread::sleep(Duration::from_millis(100)),
                Err(_) => break,
            }
        }
        stop.store(true, Ordering::Relaxed);
    });
    let expires_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_secs() + 600;
    Ok(SyncHostInfo {
        address: format!("http://{}:{port}", local_ip()),
        token,
        expires_at,
    })
}

#[tauri::command]
fn stop_sync_host() {
    if let Ok(mut current) = sync_stop_state().lock() {
        if let Some(stop) = current.take() {
            stop.store(true, Ordering::Relaxed);
        }
    }
}

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
        .invoke_handler(tauri::generate_handler![start_sync_host, stop_sync_host])
        .run(tauri::generate_context!())
        .expect("error while running dunots");
}