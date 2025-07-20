# -*- coding: utf-8 -*-
import sqlite3
from db_utils import init_db, add_missing_columns

DB_PATH = '../db/dfb_stats.db'

def calculate_stats(conn):
    c = conn.cursor()

    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        c.execute('SELECT id, player1, player2, legs1, legs2 FROM games WHERE player1 = ? OR player2 = ?', (player, player))
        games = c.fetchall()

        for game in games:
            game_id, p1, p2, legs1, legs2 = game
            is_p1 = (player == p1)

            legs_won = legs1 if is_p1 else legs2
            legs_lost = legs2 if is_p1 else legs1
            legs_played = legs_won + legs_lost
            sets_won = 1 if (is_p1 and legs1 == 3) or (not is_p1 and legs2 == 3) else 0

            # Neue Zeile: vorherige Stats-Einträge für diesen Spieler & Game löschen
            c.execute('DELETE FROM stats WHERE game_id = ? AND player = ?', (game_id, player))

            c.execute('''
                INSERT INTO stats (
                    game_id, player, sets_won, legs_played, legs_won, legs_lost
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                game_id, player, sets_won, legs_played, legs_won, legs_lost
            ))

    conn.commit()
    print("[OK] Basics berechnet (Sets, Legs, Spielerzuordnung)")

if __name__ == '__main__':
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    add_missing_columns(conn)
    calculate_stats(conn)
    conn.close()
