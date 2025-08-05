import sqlite3
import json
from pathlib import Path

# Pfade anpassen: von scripts/export aus zwei Ebenen hoch ins Projekt-Root
DB_PATH = Path(__file__).parents[2] / "db" / "dfb_stats.db"
OUTPUT_PATH = Path(__file__).parents[2] / "dumps" / "games.json"
NUM_LAST_GAMES = 99999  # Wie viele Spiele sollen maximal exportiert werden

def export_games():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Spiele mit allen benötigten Spalten und Spieler-Namen
    c.execute(f"""
        SELECT
            g.game_id,
            g.season,
            g.matchday,
            g.game_date,
            g.game_time,
            g.p1_avg_3dart_match,
            g.player1_id,
            p1.name   AS player1,
            g.p1_legs_won   AS p1_legs_won,
            g.p2_legs_won   AS p2_legs_won,
            p2.name   AS player2,
            g.player2_id,
            g.p2_avg_3dart_match
        FROM games g
        JOIN players p1 ON g.player1_id = p1.id
        JOIN players p2 ON g.player2_id = p2.id
        ORDER BY g.game_date DESC, g.game_time DESC
        LIMIT ?
    """, (NUM_LAST_GAMES,))

    rows = c.fetchall()

    # Reihenfolge und Keys im JSON
    games = []
    for row in rows:
        games.append({
            "game_id":               row["game_id"],
            "season":                row["season"],
            "matchday":              row["matchday"],
            "game_date":             row["game_date"],
            "game_time":             row["game_time"],
            "p1_avg_3dart_match":    row["p1_avg_3dart_match"],
            "player1_id":            row["player1_id"],
            "player1":               row["player1"],
            "p1_legs_won":           row["p1_legs_won"],
            "p2_legs_won":           row["p2_legs_won"],
            "player2":               row["player2"],
            "player2_id":            row["player2_id"],
            "p2_avg_3dart_match":    row["p2_avg_3dart_match"],
        })

    # Ordner anlegen, falls nicht vorhanden
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # JSON schreiben
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(games, f, ensure_ascii=False, indent=2)

    print(f"✅ Games exportiert: {OUTPUT_PATH} ({len(games)} Spiele)")

if __name__ == "__main__":
    export_games()
