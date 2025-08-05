# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = '../db/dfb_stats.db'

def calculate_stats_keepbreak():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1) Alle Spielernamen sammeln
    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        # 2) Spiele + Player-IDs aus games holen
        c.execute('''
            SELECT id, player1, player2, player1_id, player2_id
            FROM games
            WHERE player1 = ? OR player2 = ?
        ''', (player, player))
        games = c.fetchall()

        for game in games:
            game_id, p1, p2, p1_id, p2_id = game
            is_p1     = (player == p1)
            player_id = p1_id if is_p1 else p2_id

            # 3) Alle Legs mit Gewinner-ID und Starter-Text
            c.execute('''
                SELECT leg_number, leg_winner_id, starter, round
                FROM legs
                WHERE game_id = ?
                ORDER BY leg_number, round
            ''', (game_id,))
            legs_data = c.fetchall()

            # 4) Starter und Gewinner pro Leg extrahieren
            starter_per_leg = {
                leg_num: starter
                for leg_num, _, starter, round_num in legs_data
                if round_num == 0 and starter
            }
            winner_per_leg = {
                leg_num: win_id
                for leg_num, win_id, _, round_num in legs_data
                if win_id is not None
            }

            # 5) Keep-/Break-Statistiken zählen
            keep_wins = break_wins = serve_legs = return_legs = 0
            for leg_num, starter in starter_per_leg.items():
                win_id = winner_per_leg.get(leg_num)
                if win_id is None:
                    continue

                is_server = (starter == 'p1' and is_p1) or (starter == 'p2' and not is_p1)
                won       = (win_id == player_id)

                if is_server:
                    serve_legs += 1
                    if won:
                        keep_wins += 1
                else:
                    return_legs += 1
                    if won:
                        break_wins += 1

            # 6) Prozent- und Verhältniswäerte berechnen
            keep_pct   = round((keep_wins   / serve_legs) * 100, 1) if serve_legs else 0.0
            break_pct  = round((break_wins  / return_legs) * 100, 1) if return_legs else 0.0
            keep_ratio = f"{keep_wins} / {serve_legs}"
            break_ratio= f"{break_wins} / {return_legs}"

            # 7) Stats-Eintrag updaten
            c.execute('''
                UPDATE stats
                SET keep_pct    = ?,
                    keep_ratio  = ?,
                    break_pct   = ?,
                    break_ratio = ?
                WHERE game_id = ? AND player_id = ?
            ''', (
                keep_pct,
                keep_ratio,
                break_pct,
                break_ratio,
                game_id,
                player_id
            ))

    conn.commit()
    conn.close()
    print("🔁 [OK] Keep/Break-Werte berechnet (Serve-Halten & Breaks)")

if __name__ == '__main__':
    calculate_stats_keepbreak()
