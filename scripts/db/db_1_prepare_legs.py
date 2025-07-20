# -*- coding: utf-8 -*-
import sqlite3
from db_utils import init_db, add_missing_columns

DB_PATH = '../db/dfb_stats.db'

def update_darts_per_leg(conn):
    c = conn.cursor()
    c.execute('SELECT id, game_id, round, p1_score, p2_score FROM legs ORDER BY game_id, id')
    rows = c.fetchall()

    all_updates = []
    current_game = None
    leg_number = 1
    current_leg_rows = []

    for row in rows:
        leg_id, game_id, rnd, p1_score, p2_score = row

        if game_id != current_game:
            current_game = game_id
            leg_number = 1
            current_leg_rows = []

        current_leg_rows.append((leg_id, rnd, p1_score, p2_score))

        if p1_score in (-1, -2, -3) or p2_score in (-1, -2, -3):
            p1_rounds = sum(1 for _, _, ps, _ in current_leg_rows if ps is not None)
            p2_rounds = sum(1 for _, _, _, ps in current_leg_rows if ps is not None)

            p1_darts = p1_rounds * 3
            p2_darts = p2_rounds * 3

            _, _, p1_last, p2_last = current_leg_rows[-1]
            if p1_last in (-1, -2, -3):
                p1_darts = (p1_darts - 3) + abs(p1_last)
            if p2_last in (-1, -2, -3):
                p2_darts = (p2_darts - 3) + abs(p2_last)

            for leg_id_inner, _, _, _ in current_leg_rows:
                if leg_id_inner == current_leg_rows[-1][0]:
                    all_updates.append((p1_darts, p2_darts, leg_number, leg_id_inner))
                else:
                    all_updates.append((None, None, leg_number, leg_id_inner))

            leg_number += 1
            current_leg_rows = []

    for p1_darts, p2_darts, leg_number, leg_id in all_updates:
        c.execute('''
            UPDATE legs
            SET
                p1_darts_leg = ?,
                p2_darts_leg = ?,
                leg_number = ?
            WHERE id = ?
        ''', (p1_darts, p2_darts, leg_number, leg_id))

    conn.commit()
    print(f"[OK] {len(all_updates)} Legs aktualisiert (Darts, Nummern)")

def assign_leg_winner(conn):
    c = conn.cursor()
    c.execute('SELECT id, p1_score, p2_score FROM legs')
    rows = c.fetchall()

    for row in rows:
        leg_id, p1_score, p2_score = row
        winner = None
        if p1_score in (-1, -2, -3):
            winner = 'p1'
        elif p2_score in (-1, -2, -3):
            winner = 'p2'
        c.execute('UPDATE legs SET leg_winner = ? WHERE id = ?', (winner, leg_id))

    conn.commit()
    print("[INFO] leg_winner Werte aktualisiert")

if __name__ == '__main__':
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    add_missing_columns(conn)
    update_darts_per_leg(conn)
    assign_leg_winner(conn)
    conn.close()
