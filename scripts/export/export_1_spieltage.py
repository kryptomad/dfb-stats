import sqlite3
import json
from pathlib import Path

DB_PATH = "../db/dfb_stats.db"
OUTPUT_PATH = "../dumps/spieltage.json"
NUM_LAST_GAMES = 99999  # Wie viele Spiele sollen exportiert werden

def export_spieltage():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Neueste Spiele holen
    c.execute("""
        SELECT game_date, player1, legs1, legs2, player2, season, matchday, p1_avg_3dart, p2_avg_3dart
        FROM games
        ORDER BY game_date DESC, game_time DESC
        LIMIT ?
    """, (NUM_LAST_GAMES,))
    rows = c.fetchall()

    # Formatieren
    spiele = []
    for row in rows:
        spiele.append({
            "date": row[0],
            "p1": row[1],
            "p1_legs": row[2],
            "p2_legs": row[3],
            "p2": row[4],
            "season": row[5],
            "matchday": row[6],
            "p1_avg_3dart": row[7],
            "p2_avg_3dart": row[8]
        })

    # Sicherstellen, dass Ordner existiert
    Path(OUTPUT_PATH).parent.mkdir(parents=True, exist_ok=True)

    # Schreiben
    with open('../dumps/spieltage.json', 'w', encoding='utf-8') as f:
        json.dump(spiele, f, indent=2, ensure_ascii=False)

    print(f"✅ Spieltage exportiert: {OUTPUT_PATH} ({len(spiele)} Spiele)")

if __name__ == "__main__":
    export_spieltage()
