# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = '../db/dfb_stats.db'

def calculate_stats_darts():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1) Alle Spielernamen sammeln
    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        # 2) Games mit zugehörigen Player-IDs holen
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

            # 3) Dart-Zahlen pro Leg & Winner-ID auslesen
            c.execute('''
                SELECT p1_darts_leg, p2_darts_leg, leg_winner_id
                FROM legs
                WHERE game_id = ?
            ''', (game_id,))
            leg_rows = c.fetchall()

            # 4) Summe aller geworfenen Darts
            darts_thrown = sum(
                (p1_dl if is_p1 else p2_dl)
                for p1_dl, p2_dl, _ in leg_rows
                if (p1_dl if is_p1 else p2_dl) is not None
            )

            # 5) Nur die Darts aus gewonnenen Legs für Best/Worst/Avg
            won_darts = []
            for p1_dl, p2_dl, winner_id in leg_rows:
                if winner_id == player_id:
                    dl = p1_dl if is_p1 else p2_dl
                    if dl is not None:
                        won_darts.append(dl)

            best_leg  = min(won_darts) if won_darts else None
            worst_leg = max(won_darts) if won_darts else None
            avg_darts = round(sum(won_darts) / len(won_darts), 2) if won_darts else 0.0

            # 6) Sicherstellen, dass ein Stats-Eintrag existiert
            c.execute(
                'SELECT COUNT(*) FROM stats WHERE game_id = ? AND player_id = ?',
                (game_id, player_id)
            )
            if c.fetchone()[0] == 0:
                print(f"[SKIP] Kein Stats-Eintrag für player_id={player_id} (Game {game_id})")
                continue

            # 7) Stats-Tabelle aktualisieren
            c.execute('''
                UPDATE stats
                SET 
                    darts_thrown = ?, 
                    best_leg     = ?, 
                    worst_leg    = ?, 
                    avg_darts    = ?
                WHERE game_id = ? AND player_id = ?
            ''', (
                darts_thrown, 
                best_leg, 
                worst_leg, 
                avg_darts,
                game_id, 
                player_id
            ))

    conn.commit()
    conn.close()
    print("🎯 [OK] Darts-Werte berechnet (Darts thrown, Best/Worst Leg, Avg Darts)")

if __name__ == '__main__':
    calculate_stats_darts()
