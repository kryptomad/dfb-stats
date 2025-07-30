# -*- coding: utf-8 -*-
import sqlite3

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

        # Finde die Checkout-Zeile
        checkout_row = next(
            (r for r in reversed(leg_rows)
             if r[1] in (-1, -2, -3) or r[2] in (-1, -2, -3)),
            None
        )
        if not checkout_row:
            continue

        leg_id, p1_score, p2_score, p1_darts, p2_darts, _, _ = checkout_row

        # Letzten gültigen pX_left ziehen
        p1_left = next((row[5] for row in reversed(leg_rows) if row[5] is not None), None)
        p2_left = next((row[6] for row in reversed(leg_rows) if row[6] is not None), None)

        # Punkte berechnen wie gehabt
        if p1_score in (-1, -2, -3):
            p1_points = 501
            p2_points = 501 - p2_left if p2_left is not None else None
        else:
            p2_points = 501
            p1_points = 501 - p1_left if p1_left is not None else None

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
    c    = conn.cursor()

    # 1) Alle Spiel-IDs ermitteln
    c.execute("SELECT DISTINCT game_id FROM legs")
    game_ids = [row[0] for row in c.fetchall()]

    for game_id in game_ids:
        # 2) Spieler-IDs aus games holen
        c.execute('SELECT player1_id, player2_id FROM games WHERE id = ?', (game_id,))
        p1_id, p2_id = c.fetchone()

        # 3) Leg-Nummern ermitteln
        c.execute('''
            SELECT DISTINCT leg_number
            FROM legs
            WHERE game_id = ?
            ORDER BY leg_number
        ''', (game_id,))
        leg_numbers = [row[0] for row in c.fetchall()]

        # 4) Init für Punkte & Darts
        match_data = {
            'p1': {'points': 0, 'darts': 0},
            'p2': {'points': 0, 'darts': 0},
        }

        # 5) Pro Leg Checkout-Row & Darts aufsummieren
        for leg_number in leg_numbers:
            # lade alle Runden dieses Legs
            c.execute('''
                SELECT round, p1_score, p2_score,
                       p1_left,  p2_left,
                       p1_darts_leg, p2_darts_leg
                FROM legs
                WHERE game_id = ? AND leg_number = ?
                ORDER BY round ASC
            ''', (game_id, leg_number))
            leg_rows = c.fetchall()
            if not leg_rows:
                continue

            # Checkout-Zeile = letzte mit –1/–2/–3
            checkout = next(
                (r for r in reversed(leg_rows)
                 if r[1] in (-1, -2, -3) or r[2] in (-1, -2, -3)),
                None
            )
            if not checkout:
                continue

            _, p1_score, p2_score, _, _, p1_darts, p2_darts = checkout

            # letzten non-NULL left-Wert holen
            p1_left = next(r[3] for r in reversed(leg_rows) if r[3] is not None)
            p2_left = next(r[4] for r in reversed(leg_rows) if r[4] is not None)

            # klassische Punkte-Logik
            if p1_score in (-1, -2, -3):
                match_data['p1']['points'] += 501
                match_data['p2']['points'] += (501 - p2_left)
            else:
                match_data['p2']['points'] += 501
                match_data['p1']['points'] += (501 - p1_left)

            # Darts aufsummieren
            match_data['p1']['darts'] += (p1_darts or 0)
            match_data['p2']['darts'] += (p2_darts or 0)

        # 6) Für jeden Spieler avg_3dart und avg_first9 berechnen
        for player_col in ['p1', 'p2']:
            total_points = match_data[player_col]['points']
            total_darts  = match_data[player_col]['darts']
            avg_3dart    = round((total_points / total_darts) * 3, 2) if total_darts > 0 else None

            # --- Neue Logik: avg_first9 über die ersten 3 Scores jedes Legs ---
            first9_totals = []
            for leg_number in leg_numbers:
                # erste 3 gültige Scores für diesen Spieler in Leg leg_number
                score_col = 'p1_score' if player_col == 'p1' else 'p2_score'
                c.execute(f'''
                    SELECT {score_col}
                    FROM legs
                    WHERE game_id = ? AND leg_number = ?
                      AND {score_col} IS NOT NULL AND {score_col} >= 0
                    ORDER BY round ASC
                    LIMIT 3
                ''', (game_id, leg_number))
                first3 = [row[0] for row in c.fetchall()]
                if first3:
                    first9_totals.append(sum(first3))

            # average per 3 darts = (sum aller first3_scores / Anzahl Legs) / 3 * 3 → sum/3
            avg_first9 = round((sum(first9_totals) / len(first9_totals)) / 3, 2) \
                         if first9_totals else None

            # 7) In games updaten (bleibt avg_3dart_match)
            colname = f'{player_col}_avg_3dart_match'
            c.execute(f'UPDATE games SET {colname} = ? WHERE id = ?', (avg_3dart, game_id))

            # 8) In stats updaten (avg_3dart + avg_first9)
            player_id = p1_id if player_col == 'p1' else p2_id
            c.execute('''
                UPDATE stats
                SET avg_3dart  = ?,
                    avg_first9 = ?
                WHERE game_id = ? AND player_id = ?
            ''', (avg_3dart, avg_first9, game_id, player_id))

    conn.commit()
    conn.close()
    print("🎯 [OK] Match-Averages & First9 korrekt berechnet (Games + Stats)")



if __name__ == '__main__':
    # 8) Leg-Averages aktualisieren
    conn = sqlite3.connect(DB_PATH)
    update_leg_averages(conn)
    conn.close()

    # 9) Match-Averages berechnen
    calculate_match_averages()
