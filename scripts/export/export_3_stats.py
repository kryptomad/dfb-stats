import sqlite3
import json

DB_PATH = "../db/dfb_stats.db"
OUTPUT_PATH = "../dumps/stats.json"

def dump_stats():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM stats")
    rows = c.fetchall()

    daten = [dict(row) for row in rows]

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(daten, f, indent=2)

    print(f"✅ {len(daten)} Stats-Einträge erfolgreich exportiert.")

if __name__ == "__main__":
    dump_stats()
