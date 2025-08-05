# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = '../db/dfb_stats.db'

def calculate_stats_scoring():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1) Alle Spieler ermitteln
    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        # 2) Hol dir neben den Namen jetzt auch die IDs
        c.execute('''
            SELECT id, player1, player2, player1_id, player2_id
            FROM games
            WHERE player1 = ? OR player2 = ?
        ''', (player, player))
        games = c.fetchall()

        for game in games:
            game_id, p1, p2, p1_id, p2_id = game
            is_p1    = (player == p1)
            player_id = p1_id if is_p1 else p2_id

            # 3) TON-Statistiken zählen
            c.execute('''
                SELECT round, p1_score, p2_score
                FROM legs
                WHERE game_id = ?
            ''', (game_id,))
            rounds = c.fetchall()

            count_100 = count_100_plus = count_140 = count_140_plus = count_180 = 0
            for _, s1, s2 in rounds:
                score = s1 if is_p1 else s2
                if score is None or score < 0:
                    continue
                if score == 180:
                    count_180 += 1
                elif score == 140:
                    count_140 += 1
                elif score > 140:
                    count_140_plus += 1
                elif score == 100:
                    count_100 += 1
                elif 100 < score < 140:
                    count_100_plus += 1

            # 4) High Score
            c.execute(f'''
                SELECT MAX(
                    CASE WHEN ? THEN p1_score ELSE p2_score END
                )
                FROM legs
                WHERE game_id = ?
            ''', (is_p1, game_id))
            high_score = c.fetchone()[0] or 0

            # 5) High Finish (Checkout ≤ 170)
            c.execute('''
                SELECT id, leg_number, p1_score, p1_left, p2_score, p2_left
                FROM legs
                WHERE game_id = ?
                ORDER BY leg_number, id
            ''', (game_id,))
            rows = c.fetchall()

            leg_last_left = {}
            for i in range(1, len(rows)):
                _, leg_num, s1, l1, s2, l2 = rows[i]
                _, _, _, prev_l1, _, prev_l2 = rows[i - 1]

                if is_p1 and s1 in (-1, -2, -3) and isinstance(prev_l1, int) and 0 < prev_l1 <= 170:
                    leg_last_left[leg_num] = prev_l1
                elif not is_p1 and s2 in (-1, -2, -3) and isinstance(prev_l2, int) and 0 < prev_l2 <= 170:
                    leg_last_left[leg_num] = prev_l2

            high_finish = max(leg_last_left.values()) if leg_last_left else 0

            # 6) Nur aktualisieren, wenn stats-Eintrag vorhanden
            c.execute('SELECT COUNT(*) FROM stats WHERE game_id = ? AND player_id = ?', (game_id, player_id))
            if c.fetchone()[0] == 0:
                print(f"[SKIP] Kein Stats-Eintrag für player_id={player_id} (Game {game_id})")
                continue

            # 7) Update stats
            c.execute('''
                UPDATE stats
                SET high_finish     = ?,
                    high_score      = ?,
                    score_100       = ?,
                    score_100_plus  = ?,
                    score_140       = ?,
                    score_140_plus  = ?,
                    score_180       = ?
                WHERE game_id = ? AND player_id = ?
            ''', (
                high_finish,
                high_score,
                count_100,
                count_100_plus,
                count_140,
                count_140_plus,
                count_180,
                game_id,
                player_id
            ))

    conn.commit()
    conn.close()
    print("🎯 [OK] Statistiken 'Scoring' erfolgreich berechnet")

if __name__ == '__main__':
    calculate_stats_scoring()
