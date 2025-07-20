# -*- coding: utf-8 -*-
import sqlite3
from db_utils import init_db, add_missing_columns

DB_PATH = '../db/dfb_stats.db'

def calculate_stats_darts():
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

            c.execute('SELECT p1_darts_leg, p2_darts_leg, leg_winner FROM legs WHERE game_id = ?', (game_id,))
            leg_rows = c.fetchall()

            # Alle Darts aufsummieren
            darts_thrown = sum(
                r[0] if is_p1 else r[1]
                for r in leg_rows
                if r[0 if is_p1 else 1] is not None
            )

            # Nur gewonnene Legs für Best/Worst/Avg Darts
            won_darts = []
            for p1_dl, p2_dl, winner in leg_rows:
                if is_p1 and winner == 'p1' and p1_dl is not None:
                    won_darts.append(p1_dl)
                elif not is_p1 and winner == 'p2' and p2_dl is not None:
                    won_darts.append(p2_dl)


            best_leg = min(won_darts) if won_darts else None
            worst_leg = max(won_darts) if won_darts else None
            avg_darts = round(sum(won_darts) / len(won_darts), 2) if won_darts else 0.0

            # Nur aktualisieren, wenn stats-Eintrag vorhanden ist
            c.execute('SELECT COUNT(*) FROM stats WHERE game_id = ? AND player = ?', (game_id, player))
            if c.fetchone()[0] == 0:
                print(f"[SKIP] Kein Stats-Eintrag für {player} (Game {game_id})")
                continue

            c.execute('''
                UPDATE stats SET 
                    darts_thrown = ?, best_leg = ?, worst_leg = ?, avg_darts = ?
                WHERE game_id = ? AND player = ?
            ''', (
                darts_thrown, best_leg, worst_leg, avg_darts,
                game_id, player
            ))

    conn.commit()
    conn.close()
    print("🎯 [OK] Darts-Werte berechnet (Darts thrown, Best/Worst Leg, Avg Darts)")

if __name__ == '__main__':
    calculate_stats_darts()
