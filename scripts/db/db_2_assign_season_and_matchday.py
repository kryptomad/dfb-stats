# scripts/db/db_2_assign_season_and_matchday.py

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "db" / "dfb_stats.db"

SEASON_DEFINITION = {
    "2018/2019": 100,
    "2019/2020": 100,
    "2020/2021": 100,
    "2021/2022": 100,
    "2023/2024": 100,
    "2024/2025": 100,
    "2026/2027": 100, # aktuell aktiv
    # "2027/2028": 100, # erst im September 2025 aktivieren
}

def assign_season_and_matchday():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    print("→ Weise Season & Matchday zu (eure 10×10-Regel)")

    # ← Das war der entscheidende Fix!
    c.execute("UPDATE games SET season = NULL, matchday = NULL")
    c.execute("UPDATE legs  SET season = NULL, matchday = NULL")

    c.execute("SELECT id FROM games ORDER BY game_date, game_time, id")
    game_ids = [row[0] for row in c.fetchall()]

    if not game_ids:
        print("   Keine Spiele gefunden.")
        conn.close()
        return

    index = 0
    total = len(game_ids)

    for season, max_games in SEASON_DEFINITION.items():
        if index >= total:
            break

        matchday = 1
        games_in_season = 0

        while games_in_season < max_games and index < total:
            for _ in range(10):
                if index >= total:
                    break
                game_id = game_ids[index]
                c.execute("UPDATE games SET season = ?, matchday = ? WHERE id = ?", (season, matchday, game_id))
                c.execute("UPDATE legs  SET season = ?, matchday = ? WHERE game_id = ?", (season, matchday, game_id))
                index += 1
                games_in_season += 1
            matchday += 1

        print(f"   {season}: {games_in_season} Spiele → Spieltag {matchday-1}")

    print(f"✅ Zuweisung abgeschlossen – {index} von {total} Spielen verarbeitet.")
    conn.commit()
    conn.close()

if __name__ == "__main__":
    assign_season_and_matchday()