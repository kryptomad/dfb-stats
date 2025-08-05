import sqlite3

SEASON_DEFINITION = {
    "2018": 100,
    "2019": 100,
    "2020/2021": 100,
    "2021/2022": 100,
    "2023/2024": 100,
    "2024/2025": 100  # Max mögliche Spiele – wird automatisch gestoppt
}

DB_PATH = "../db/dfb_stats.db"

def assign_season_and_matchday():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1) Alle game-IDs in zeitlicher Reihenfolge holen
    c.execute("SELECT id FROM games ORDER BY game_date, game_time, id")
    rows = c.fetchall()

    index = 0
    for season, max_games in SEASON_DEFINITION.items():
        matchday = 1
        games_in_season = 0
        # Solange wir noch Spiele in dieser Season haben und nicht am Ende der Liste sind
        while games_in_season < max_games and index < len(rows):
            # 10 Spiele pro Matchday
            for _ in range(10):
                if games_in_season >= max_games or index >= len(rows):
                    break
                game_id = rows[index][0]

                # ------ games updaten ------
                c.execute("""
                    UPDATE games
                    SET season = ?, matchday = ?
                    WHERE id = ?
                """, (season, matchday, game_id))

                # ------ legs updaten ------
                c.execute("""
                    UPDATE legs
                    SET season = ?, matchday = ?
                    WHERE game_id = ?
                """, (season, matchday, game_id))

                index += 1
                games_in_season += 1

            matchday += 1

    conn.commit()
    conn.close()
    print("✅ Season- und Matchday-Zuweisung für games und legs abgeschlossen.")

if __name__ == "__main__":
    assign_season_and_matchday()
