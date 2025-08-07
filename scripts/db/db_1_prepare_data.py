# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = '../db/dfb_stats.db'

def update_game_player_ids(conn):
    c = conn.cursor()
    # Mapping direkt von unserer Fix-Tabelle übernehmen
    c.execute('SELECT player_id, name FROM players')
    player_map = {name: pid for pid, name in c.fetchall()}

    # Jetzt player1_id/player2_id in games updaten
    for name, pid in player_map.items():
        c.execute('UPDATE games SET player1_id = ? WHERE player1 = ?', (pid, name))
        c.execute('UPDATE games SET player2_id = ? WHERE player2 = ?', (pid, name))
    conn.commit()
    print("[OK] player1_id und player2_id in games aktualisiert")

def update_darts_per_leg(conn):
    c = conn.cursor()
    # 0) Hole für jedes Spiel das Mapping auf die beiden Spieler-IDs
    c.execute('SELECT game_id, player1_id, player2_id FROM games')
    game_map = {gid: (p1, p2) for gid, p1, p2 in c.fetchall()}

    # 1) Alle Runden aus legs einlesen
    c.execute('SELECT id, game_id, round, p1_score, p2_score FROM legs ORDER BY game_id, id')
    rows = c.fetchall()

    current_game = None
    leg_number   = 1
    current_leg_rows = []

    for leg_id, game_id, rnd, p1_score, p2_score in rows:
        # Bei neuem Spiel zurücksetzen
        if game_id != current_game:
            current_game = game_id
            leg_number   = 1
            current_leg_rows = []

        current_leg_rows.append((leg_id, rnd, p1_score, p2_score))

        # Checkout-Erkennung: wenn p1_score oder p2_score negativ ist
        if p1_score in (-1, -2, -3) or p2_score in (-1, -2, -3):
            # Darts zählen
            p1_rounds = sum(1 for _, _, ps, _ in current_leg_rows if ps is not None)
            p2_rounds = sum(1 for _, _, _, ps in current_leg_rows if ps is not None)
            p1_darts  = p1_rounds * 3
            p2_darts  = p2_rounds * 3

            # Korrektur für Checkout-Wurf
            _, _, p1_last, p2_last = current_leg_rows[-1]
            if p1_last in (-1, -2, -3):
                p1_darts = (p1_darts - 3) + abs(p1_last)
            if p2_last in (-1, -2, -3):
                p2_darts = (p2_darts - 3) + abs(p2_last)

            # ID der aktuellen Leg-Zeile (letzter Eintrag)
            last_leg_id = current_leg_rows[-1][0]
            # die beiden Spieler-IDs
            p1_id, p2_id = game_map.get(game_id, (None, None))

            # 2) UPDATE direkt in dieser Checkout-Zeile, inkl. Player-IDs
            c.execute('''
                UPDATE legs
                SET
                    p1_darts_leg = ?,
                    p2_darts_leg = ?,
                    leg_number   = ?,
                    player1_id   = ?,
                    player2_id   = ?
                WHERE id = ?
            ''', (p1_darts, p2_darts, leg_number, p1_id, p2_id, last_leg_id))

            leg_number += 1
            current_leg_rows = []

    conn.commit()
    print(f"[OK] Legs aktualisiert (Darts, Nummern, player1_id & player2_id)")

def assign_leg_winner_and_starter_ids(conn):
    c = conn.cursor()

    # Mapping game_id → (player1_id, player2_id)
    c.execute('SELECT game_id, player1_id, player2_id FROM games')
    game_map = {gid: (p1, p2) for gid, p1, p2 in c.fetchall()}

    # Alle Legs mit Starter-Text und Scores lesen
    c.execute('SELECT id, game_id, starter, p1_score, p2_score FROM legs')
    rows = c.fetchall()

    for leg_id, game_id, starter, p1_score, p2_score in rows:
        p1_id, p2_id = game_map.get(game_id, (None, None))

        # Gewinner über negativen Score ermitteln
        if p1_score in (-1, -2, -3):
            winner_id = p1_id
        elif p2_score in (-1, -2, -3):
            winner_id = p2_id
        else:
            winner_id = None

        # starter_id ermitteln
        starter_id = p1_id if starter == 'p1' else p2_id if starter == 'p2' else None

        # In die Tabelle schreiben
        c.execute('''
            UPDATE legs
            SET
                starter_id    = ?,
                leg_winner_id = ?
            WHERE id = ?
        ''', (starter_id, winner_id, leg_id))

    conn.commit()
    print("[OK] starter_id und leg_winner_id in legs aktualisiert")


def assign_legs_player_ids(conn):
    c = conn.cursor()

    # 1) Mapping game_id → (player1_id, player2_id) aus games holen
    c.execute('SELECT game_id, player1_id, player2_id FROM games')
    game_map = {gid: (p1, p2) for gid, p1, p2 in c.fetchall()}

    # 2) Jede leg-Zeile durchlaufen
    c.execute('SELECT id, game_id FROM legs')
    for leg_id, game_id in c.fetchall():
        p1_id, p2_id = game_map.get(game_id, (None, None))
        # 3) In legs schreiben
        c.execute('''
            UPDATE legs
            SET player1_id = ?, player2_id = ?
            WHERE id = ?
        ''', (p1_id, p2_id, leg_id))

    conn.commit()
    print("[OK] player1_id und player2_id in legs aktualisiert")


if __name__ == '__main__':
    conn = sqlite3.connect(DB_PATH)

    # 1) Darts & Leg-Nummern berechnen
    update_darts_per_leg(conn)

    # 2) games IDs setzen
    update_game_player_ids(conn)

    # 3) legs starter_id & leg_winner_id aktualisieren
    assign_leg_winner_and_starter_ids(conn)
    assign_legs_player_ids(conn)

    conn.close()
