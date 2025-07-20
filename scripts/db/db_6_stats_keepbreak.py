# -*- coding: utf-8 -*-
import sqlite3
from db_utils import init_db, add_missing_columns

DB_PATH = '../db/dfb_stats.db'

def calculate_stats_keepbreak():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        c.execute('SELECT id, player1, player2 FROM games WHERE player1 = ? OR player2 = ?', (player, player))
        games = c.fetchall()

        for game in games:
            game_id, p1, p2 = game
            is_p1 = (player == p1)

            c.execute('''
                SELECT leg_number, leg_winner, starter, round
                FROM legs
                WHERE game_id = ?
                ORDER BY leg_number, round
            ''', (game_id,))
            legs_data = c.fetchall()

            starter_per_leg = {
                leg_num: starter
                for leg_num, _, starter, round_num in legs_data
                if round_num == 0 and starter
            }
            winner_per_leg = {
                leg_num: leg_winner
                for leg_num, leg_winner, _, round_num in legs_data
                if leg_winner
            }

            keep_wins = break_wins = serve_legs = return_legs = 0

            for leg_num, starter in starter_per_leg.items():
                leg_winner = winner_per_leg.get(leg_num)
                if not leg_winner:
                    continue

                is_server = (starter == 'p1' and is_p1) or (starter == 'p2' and not is_p1)
                won = (leg_winner == 'p1' and is_p1) or (leg_winner == 'p2' and not is_p1)


                if is_server:
                    serve_legs += 1
                    if won:
                        keep_wins += 1
                else:
                    return_legs += 1
                    if won:
                        break_wins += 1

            keep_pct = round((keep_wins / serve_legs) * 100, 1) if serve_legs else 0.0
            break_pct = round((break_wins / return_legs) * 100, 1) if return_legs else 0.0
            keep_ratio = f"{keep_wins} / {serve_legs}"
            break_ratio = f"{break_wins} / {return_legs}"

            c.execute('''
                UPDATE stats
                SET keep_pct = ?, keep_ratio = ?, 
                    break_pct = ?, break_ratio = ?
                WHERE game_id = ? AND player = ?
            ''', (
                keep_pct, keep_ratio, break_pct, break_ratio,
                game_id, player
            ))

    conn.commit()
    conn.close()
    print("🔁 [OK] Keep/Break-Werte berechnet (Serve-Halten & Breaks)")

if __name__ == '__main__':
    calculate_stats_keepbreak()
