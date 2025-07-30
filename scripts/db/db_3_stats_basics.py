# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = '../db/dfb_stats.db'

def calculate_stats(conn):
    c = conn.cursor()

    # 1) Alle Spielernamen sammeln
    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    # 2) Für jeden Spieler Basis-Stats berechnen
    for player in players:
        c.execute('''
            SELECT 
                id, season, matchday,
                player1, player2,
                p1_legs_won, p2_legs_won,
                player1_id, player2_id
            FROM games
            WHERE player1 = ? OR player2 = ?
        ''', (player, player))
        games = c.fetchall()

        for (game_id, season, matchday,
             p1, p2,
             p1_legs_won, p2_legs_won,
             p1_id, p2_id) in games:

            is_p1     = (player == p1)
            player_id = p1_id if is_p1 else p2_id

            legs_won    = p1_legs_won if is_p1 else p2_legs_won
            legs_lost   = p2_legs_won if is_p1 else p1_legs_won
            legs_played = legs_won + legs_lost
            sets_won    = 1 if legs_won == 3 else 0

            # vorherigen Eintrag löschen
            c.execute(
                'DELETE FROM stats WHERE game_id = ? AND player_id = ?',
                (game_id, player_id)
            )

            # neuen Basis-Stats-Eintrag inkl. season, matchday, player-IDs
            c.execute('''
                INSERT INTO stats (
                    game_id,
                    season,
                    matchday,
                    player_id,
                    player1_id,
                    player2_id,
                    sets_won,
                    legs_played,
                    legs_won,
                    legs_lost
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                game_id,
                season,
                matchday,
                player_id,
                p1_id,
                p2_id,
                sets_won,
                legs_played,
                legs_won,
                legs_lost
            ))

    conn.commit()
    print("[OK] Basics berechnet (Season, Matchday, Player-IDs, Sets & Legs)")

def update_stats_player_ids(conn):
    c = conn.cursor()
    # mappe game_id → (player1_id, player2_id)
    c.execute('SELECT game_id, player1_id, player2_id FROM games')
    game_map = {gid: (p1, p2) for gid, p1, p2 in c.fetchall()}

    # für jeden stats-Eintrag die beiden IDs nachtragen
    c.execute('SELECT id, game_id FROM stats')
    for stat_id, game_id in c.fetchall():
        p1_id, p2_id = game_map.get(game_id, (None, None))
        c.execute('''
            UPDATE stats
            SET player1_id = ?, player2_id = ?
            WHERE id = ?
        ''', (p1_id, p2_id, stat_id))

    conn.commit()
    print("[OK] player1_id und player2_id in stats aktualisiert")

if __name__ == '__main__':
    conn = sqlite3.connect(DB_PATH)
    calculate_stats(conn)
    update_stats_player_ids(conn)
    conn.close()
