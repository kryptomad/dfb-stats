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

            winner = 1 if p1_last in (-1, -2, -3) else 2

            for leg_id_inner, _, _, _ in current_leg_rows:
                if leg_id_inner == current_leg_rows[-1][0]:
                    all_updates.append((p1_darts, p2_darts, leg_number, winner, leg_id_inner))
                else:
                    all_updates.append((None, None, leg_number, None, leg_id_inner))

            leg_number += 1
            current_leg_rows = []

    for p1_darts, p2_darts, leg_number, winner, leg_id in all_updates:
        conn.execute('''
            UPDATE legs
            SET
                p1_darts_leg = ?,
                p2_darts_leg = ?,
                leg_number = ?,
                leg_winner = ?
            WHERE id = ?
        ''', (p1_darts, p2_darts, leg_number, winner, leg_id))

    conn.commit()
    print(f"[OK] {len(all_updates)} Legs aktualisiert mit Dartzahlen und Gewinnern.")

def init_stats_table(conn):
    conn.execute('DELETE FROM stats')
    conn.commit()

def calculate_stats():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    add_missing_columns(conn)
    update_darts_per_leg(conn)
    init_stats_table(conn)

    c = conn.cursor()
    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        c.execute('SELECT id, player1, player2, legs1, legs2 FROM games WHERE player1 = ? OR player2 = ?', (player, player))
        games = c.fetchall()
        print(f"Berechne Stats für Spieler {player} mit {len(games)} Spielen")

        for game in games:
            game_id, p1, p2, legs1, legs2 = game
            is_p1 = (player == p1)

            c.execute('SELECT p1_darts_leg, p2_darts_leg, leg_winner FROM legs WHERE game_id = ?', (game_id,))
            leg_info = c.fetchall()
            leg_darts = [r[0] if is_p1 else r[1] for r in leg_info if r[0 if is_p1 else 1] is not None]
            darts_thrown = sum(leg_darts)
            legs_played = len(leg_darts)
            best_leg = min(leg_darts) if leg_darts else None
            worst_leg = max(leg_darts) if leg_darts else None

            legs_won = legs1 if is_p1 else legs2
            legs_lost = legs2 if is_p1 else legs1
            sets_won = 1 if (is_p1 and legs1 == 3) or (not is_p1 and legs2 == 3) else 0

            total_darts = 0
            won_legs_count = 0
            for p1_darts_leg, p2_darts_leg, leg_winner in leg_info:
                if is_p1 and leg_winner == 1:
                    total_darts += p1_darts_leg
                    won_legs_count += 1
                elif not is_p1 and leg_winner == 2:
                    total_darts += p2_darts_leg
                    won_legs_count += 1
            avg_darts = round(total_darts / won_legs_count, 2) if won_legs_count > 0 else 0.0

            c.execute('SELECT round, p1_score, p1_left, p2_score, p2_left FROM legs WHERE game_id = ? ORDER BY round ASC', (game_id,))
            rounds = c.fetchall()

            count_100 = count_100_plus = count_140 = count_140_plus = count_180 = 0
            total_scored_points = 0

            for r in rounds:
                _, s1, _, s2, _ = r
                score = s1 if is_p1 else s2
                if score is None or score < 0:
                    continue
                total_scored_points += score
                if score == 180:
                    count_180 += 1
                elif score == 140:
                    count_140 += 1
                elif score > 140:
                    count_140_plus += 1
                elif score == 100:
                    count_100 += 1
                elif 100 < score < 140:
                    count_100_plus += 1

            avg_3dart = round((total_scored_points / darts_thrown) * 3, 3) if darts_thrown else 0.0

            if is_p1:
                c.execute('UPDATE games SET p1_avg_3dart = ? WHERE id = ?', (avg_3dart, game_id))
            else:
                c.execute('UPDATE games SET p2_avg_3dart = ? WHERE id = ?', (avg_3dart, game_id))

            c.execute('SELECT DISTINCT leg_number FROM legs WHERE game_id = ?', (game_id,))
            leg_numbers = [row[0] for row in c.fetchall()]
            first9_totals = []

            for leg_num in leg_numbers:
                c.execute(f'''
                    SELECT round, { 'p1_score' if is_p1 else 'p2_score' }
                    FROM legs
                    WHERE game_id = ? AND leg_number = ?
                        AND { 'p1_score' if is_p1 else 'p2_score' } IS NOT NULL
                    ORDER BY round ASC
                    LIMIT 3
                ''', (game_id, leg_num))
                first3 = c.fetchall()
                total = sum(score for _, score in first3 if score is not None and score >= 0)
                first9_totals.append(total)

            avg_first9 = round((sum(first9_totals) / len(first9_totals)) / 3, 3) if first9_totals else 0.0

            c.execute('''
                SELECT leg_number, leg_winner, starter, round
                FROM legs
                WHERE game_id = ?
                ORDER BY leg_number, round
            ''', (game_id,))
            legs_data = c.fetchall()

            starter_per_leg = {leg_num: starter for leg_num, _, starter, round_num in legs_data if round_num == 0 and starter}
            winner_per_leg = {leg_num: leg_winner for leg_num, leg_winner, _, round_num in legs_data if leg_winner}

            keep_wins = break_wins = serve_legs = return_legs = 0
            for leg_num, starter in starter_per_leg.items():
                leg_winner = winner_per_leg.get(leg_num)
                if not leg_winner:
                    continue
                is_server = (starter == 'p1' and is_p1) or (starter == 'p2' and not is_p1)
                won = (leg_winner == 1 and is_p1) or (leg_winner == 2 and not is_p1)

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
                INSERT INTO stats (
                    game_id, player, darts_thrown, avg_3dart, avg_first9, avg_darts, 
                    legs_played, legs_won, legs_lost, sets_won,
                    best_leg, worst_leg, high_finish, high_score,
                    score_100, score_100_plus, score_140, score_140_plus, score_180,
                    keep_pct, keep_ratio, break_pct, break_ratio
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                game_id, player, darts_thrown, avg_3dart, avg_first9, avg_darts,
                legs_played, legs_won, legs_lost, sets_won,
                best_leg, worst_leg, 0, 0,
                count_100, count_100_plus, count_140, count_140_plus, count_180,
                keep_pct, keep_ratio, break_pct, break_ratio
            ))

    conn.commit()
    conn.close()
    print('[OK] Stats erfolgreich berechnet 🎯')

if __name__ == "__main__":
    calculate_stats()
