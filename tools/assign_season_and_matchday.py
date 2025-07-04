import sqlite3

SEASON_DEFINITION = {
    "2018": 100,
    "2019": 100,
    "2020/2021": 100,
    "2021/2022": 100,
    "2023/2024": 100,
    "2024/2025": 40  # Stand jetzt
}

DB_PATH = "../db/dfb_stats.db"

def assign_season_and_matchday():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT id FROM games ORDER BY game_date, game_time, id")
    rows = c.fetchall()

    index = 0
    for season, num_games in SEASON_DEFINITION.items():
        for matchday in range(1, 11):
            for _ in range(10):
                if index >= len(rows):
                    break
                game_id = rows[index][0]
                c.execute("""
                    UPDATE games
                    SET season = ?, matchday = ?
                    WHERE id = ?
                """, (season, matchday, game_id))
                index += 1

    conn.commit()
    conn.close()
    print("Fertig: Season- und Matchday-Zuweisung abgeschlossen.")

if __name__ == "__main__":
    assign_season_and_matchday()
