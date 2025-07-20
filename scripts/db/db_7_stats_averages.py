# -*- coding: utf-8 -*-
import sqlite3
from db_utils import init_db, add_missing_columns

DB_PATH = '../db/dfb_stats.db'

def update_leg_averages(conn):
    c = conn.cursor()

    # Alle Legs mit leg_number je Spiel
    c.execute('SELECT DISTINCT game_id, leg_number FROM legs ORDER BY game_id, leg_number')
    legs = c.fetchall()

    updated = 0

    for game_id, leg_number in legs:
        # Hole alle Runden dieses Legs
        c.execute('''
            SELECT id, p1_score, p2_score, p1_darts_leg, p2_darts_leg, p1_left, p2_left
            FROM legs
            WHERE game_id = ? AND leg_number = ?
            ORDER BY round ASC
        ''', (game_id, leg_number))
        leg_rows = c.fetchall()
        if not leg_rows:
            continue

        # Finde die Checkout-Zeile (dort steht -1/-2/-3)
        checkout_row = next((r for r in reversed(leg_rows) if r[1] in (-1, -2, -3) or r[2] in (-1, -2, -3)), None)
        if not checkout_row:
            continue  # kein abgeschlossenes Leg → skip

        leg_id = checkout_row[0]
        p1_score = checkout_row[1]
        p2_score = checkout_row[2]
        p1_darts = checkout_row[3]
        p2_darts = checkout_row[4]

        # Gewinner bestimmen
        winner = 'p1' if p1_score in (-1, -2, -3) else 'p2' if p2_score in (-1, -2, -3) else None

        # Letzten gültigen pX_left ziehen
        p1_left = next((row[5] for row in reversed(leg_rows) if row[5] is not None), None)
        p2_left = next((row[6] for row in reversed(leg_rows) if row[6] is not None), None)

        # Punkte berechnen
        p1_points = 501 if winner == 'p1' else (501 - p1_left if p1_left is not None else None)
        p2_points = 501 if winner == 'p2' else (501 - p2_left if p2_left is not None else None)

        # Averages berechnen
        p1_avg = round((p1_points / p1_darts) * 3, 3) if p1_points is not None and p1_darts else None
        p2_avg = round((p2_points / p2_darts) * 3, 3) if p2_points is not None and p2_darts else None

        # Update nur die Checkout-Zeile
        c.execute('''
            UPDATE legs
            SET p1_avg_3dart_leg = ?, p2_avg_3dart_leg = ?
            WHERE id = ?
        ''', (p1_avg, p2_avg, leg_id))
        updated += 1

    conn.commit()
    print(f"🎯 [OK] {updated} Legs aktualisiert mit pX_avg_3dart_leg")


def calculate_match_averages():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT DISTINCT game_id FROM legs")
    game_ids = [row[0] for row in c.fetchall()]

    for game_id in game_ids:
        # Hole alle Legs (nach Nummern gruppiert)
        c.execute('''
            SELECT DISTINCT leg_number FROM legs
            WHERE game_id = ?
            ORDER BY leg_number ASC
        ''', (game_id,))
        leg_numbers = [row[0] for row in c.fetchall()]

        # Initialisierung
        match_data = {
            'p1': {'points': 0, 'darts': 0},
            'p2': {'points': 0, 'darts': 0},
        }

        for leg_number in leg_numbers:
            c.execute('''
                SELECT id, round, p1_score, p2_score, p1_darts_leg, p2_darts_leg, p1_left, p2_left
                FROM legs
                WHERE game_id = ? AND leg_number = ?
                ORDER BY round ASC
            ''', (game_id, leg_number))
            leg_rows = c.fetchall()
            if not leg_rows:
                continue

            # Checkout-Zeile finden
            checkout_row = next((r for r in reversed(leg_rows) if r[2] in (-1, -2, -3) or r[3] in (-1, -2, -3)), None)
            if not checkout_row:
                continue

            p1_score = checkout_row[2]
            p2_score = checkout_row[3]
            p1_darts = checkout_row[4]
            p2_darts = checkout_row[5]

            # Gewinner bestimmen
            winner = 'p1' if p1_score in (-1, -2, -3) else 'p2'

            # Letzten gültigen pX_left-Wert finden
            p1_left = next((r[6] for r in reversed(leg_rows) if r[6] is not None), None)
            p2_left = next((r[7] for r in reversed(leg_rows) if r[7] is not None), None)

            # Punkte berechnen wie bei Leg
            p1_points = 501 if winner == 'p1' else (501 - p1_left if p1_left is not None else None)
            p2_points = 501 if winner == 'p2' else (501 - p2_left if p2_left is not None else None)

            # Punkte & Darts addieren, wenn valide
            if p1_points is not None and p1_darts:
                match_data['p1']['points'] += p1_points
                match_data['p1']['darts'] += p1_darts
            if p2_points is not None and p2_darts:
                match_data['p2']['points'] += p2_points
                match_data['p2']['darts'] += p2_darts

        # Averages berechnen
        for player_col in ['p1', 'p2']:
            total_points = match_data[player_col]['points']
            total_darts = match_data[player_col]['darts']
            avg_3dart = round((total_points / total_darts) * 3, 3) if total_darts > 0 else None

            # Update in games
            colname = f'{player_col}_avg_3dart_match'
            c.execute(f'UPDATE games SET {colname} = ? WHERE id = ?', (avg_3dart, game_id))

            # Spielername für stats
            player_field = 'player1' if player_col == 'p1' else 'player2'
            c.execute(f'SELECT {player_field} FROM games WHERE id = ?', (game_id,))
            player_name = c.fetchone()[0]

            # Update auch in stats
            c.execute('''
                UPDATE stats SET avg_3dart = ?
                WHERE game_id = ? AND player = ?
            ''', (avg_3dart, game_id, player_name))

    conn.commit()
    conn.close()
    print("🎯 [OK] Match-Averages korrekt berechnet (Games + Stats)")





if __name__ == '__main__':
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    add_missing_columns(conn)

    update_leg_averages(conn)
    calculate_match_averages()

    conn.close()