import sqlite3
import json
from pathlib import Path

# Pfade anpassen
DB_PATH = Path(__file__).parents[2] / "db" / "dfb_stats.db"
OUTPUT_PATH = Path(__file__).parents[2] / "src" / "assets" / "players.json"

# Optional: Anzahl Datensätze begrenzen, None für alle
default_limit = None


def export_players(limit=None):
    # DB-Verbindung aufbauen
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Daten abfragen, jetzt mit neuen Spalten
    query = f"""
        SELECT
            player_id,
            name,
            nickname,
            image,
            roles,
            memberSince,
            leftAt,
            isFounder,
            isActive,
            comment
        FROM players
        ORDER BY player_id
        {"LIMIT :limit" if limit else ""}
    """
    params = {"limit": limit} if limit else {}
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # In Python dicts umwandeln
    players_list = []
    for row in rows:
        players_list.append({
            "player_id": row["player_id"],
            "name": row["name"],
            "nickname": row["nickname"],
            "image": row["image"],
            "roles": row["roles"],
            "memberSince": row["memberSince"],
            "leftAt": row["leftAt"],
            "isFounder": bool(row["isFounder"]),  # 0/1 -> True/False
            "isActive": bool(row["isActive"]),    # 0/1 -> True/False
            "comment": row["comment"]
        })

    # Sicherstellen, dass Ausgabeverzeichnis existiert
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # JSON schreiben
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(players_list, f, ensure_ascii=False, indent=2)

    print(f"✅ Players exportiert: {OUTPUT_PATH} ({len(players_list)} Einträge)")


if __name__ == "__main__":
    export_players(default_limit)
