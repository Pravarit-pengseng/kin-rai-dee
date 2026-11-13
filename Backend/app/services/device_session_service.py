import sqlite3
import os
from pathlib import Path
from typing import Optional, Dict

DB_PATH = Path(__file__).resolve().parent.parent.parent / "device_sessions.db"


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    with _get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS device_sessions (
                device_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                platform TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()


_init_db()


def bind_device_session(device_id: str, user_id: str, refresh_token: str, platform: str = "unknown") -> bool:
    if not device_id or not user_id or not refresh_token:
        return False
    try:
        with _get_connection() as conn:
            conn.execute("""
                INSERT INTO device_sessions (device_id, user_id, refresh_token, platform, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(device_id) DO UPDATE SET
                    user_id = excluded.user_id,
                    refresh_token = excluded.refresh_token,
                    platform = excluded.platform,
                    updated_at = CURRENT_TIMESTAMP
            """, (device_id.strip(), user_id.strip(), refresh_token.strip(), platform.strip()))
            conn.commit()
            return True
    except Exception as e:
        import logging
        logging.error(f"Error binding device session: {e}")
        return False


def get_device_session(device_id: str) -> Optional[Dict[str, str]]:
    if not device_id:
        return None
    try:
        with _get_connection() as conn:
            cursor = conn.execute("""
                SELECT device_id, user_id, refresh_token, platform, updated_at
                FROM device_sessions
                WHERE device_id = ?
            """, (device_id.strip(),))
            row = cursor.fetchone()
            if row:
                return {
                    "device_id": row["device_id"],
                    "user_id": row["user_id"],
                    "refresh_token": row["refresh_token"],
                    "platform": row["platform"],
                    "updated_at": str(row["updated_at"]),
                }
            return None
    except Exception as e:
        import logging
        logging.error(f"Error retrieving device session: {e}")
        return None


def unbind_device_session(device_id: str) -> bool:
    if not device_id:
        return False
    try:
        with _get_connection() as conn:
            conn.execute("DELETE FROM device_sessions WHERE device_id = ?", (device_id.strip(),))
            conn.commit()
            return True
    except Exception as e:
        import logging
        logging.error(f"Error unbinding device session: {e}")
        return False


def unbind_user_devices(user_id: str) -> bool:
    if not user_id:
        return False
    try:
        with _get_connection() as conn:
            conn.execute("DELETE FROM device_sessions WHERE user_id = ?", (user_id.strip(),))
            conn.commit()
            return True
    except Exception as e:
        import logging
        logging.error(f"Error unbinding user devices: {e}")
        return False

