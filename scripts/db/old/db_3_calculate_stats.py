# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = '../db/dfb_stats.db'

def init_stats_table(conn):
    conn.execute('DELETE FROM stats')
    conn.commit()

def calculate_stats():
    conn = sqlite3.connect(DB_PATH)

    init_stats_table(conn)

    c = conn.cursor()
    players = set()
    for row in c.execute('SELECT player1 FROM games'):
        players.add(row[0])
    for row in c.execute('SELECT player2 FROM games'):
        players.add(row[0])

    for player in players:
        # 1) Hole id, player1, player2 und die neuen Spalten p1_legs_won, p2_legs_won
        c.execute('''
            SELECT 
                id,
                player1,
                player2,
                p1_legs_won,
                p2_legs_won,
                player1_id,
                player2_id
            FROM games
            WHERE player1 = ? OR player2 = ?
        ''', (player, player))
        games = c.fetchall()

        for game in games:
            game_id, p1, p2, p1_legs_won, p2_legs_won, p1_id, p2_id = game
            is_p1     = (player == p1)
            player_id = p1_id if is_p1 else p2_id

            # 3) Berechne gewonnen/verlieren
            legs_won  = p1_legs_won if is_p1 else p2_legs_won
            legs_lost = p2_legs_won if is_p1 else p1_legs_won

            c.execute(
                'SELECT p1_darts_leg, p2_darts_leg, leg_winner_id '
                'FROM legs WHERE game_id = ?', (game_id,)
            )
            leg_info = c.fetchall()
            leg_darts = [r[0] if is_p1 else r[1] for r in leg_info if r[0 if is_p1 else 1] is not None]
            darts_thrown = sum(leg_darts)
            legs_played = len(leg_darts)
            best_leg = min(leg_darts) if leg_darts else None
            worst_leg = max(leg_darts) if leg_darts else None

            legs_won  = p1_legs_won if is_p1 else p2_legs_won
            legs_lost = p2_legs_won if is_p1 else p1_legs_won
            sets_won = 1 if (is_p1 and p1_legs_won == 3) or (not is_p1 and p2_legs_won == 3) else 0

            total_darts = 0
            won_legs_count = 0
            for p1_darts_leg, p2_darts_leg, leg_winner_id in leg_info:
                # wenn das hier True ist, hat der aktuelle Spieler dieses Leg gewonnen
                if leg_winner_id == (p1_id if is_p1 else p2_id):
                    total_darts   += (p1_darts_leg if is_p1 else p2_darts_leg)
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
                c.execute('UPDATE games SET p1_avg_3dart_match = ? WHERE id = ?', (avg_3dart, game_id))
            else:
                c.execute('UPDATE games SET p2_avg_3dart_match = ? WHERE id = ?', (avg_3dart, game_id))

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
                SELECT leg_number, leg_winner_id, starter, round
                FROM legs
                WHERE game_id = ?
                ORDER BY leg_number, round
            ''', (game_id,))
            legs_data = c.fetchall()

            starter_per_leg = {leg_num: starter for leg_num, _, starter, round_num in legs_data if round_num == 0}
            winner_per_leg  = {leg_num: leg_win_id for leg_num, leg_win_id, _, round_num in legs_data if leg_win_id}

            keep_wins = break_wins = serve_legs = return_legs = 0
            for leg_num, starter in starter_per_leg.items():
                leg_win_id = winner_per_leg.get(leg_num)
                if not leg_win_id:
                    continue
                is_server = (starter == 'p1' and is_p1) or (starter == 'p2' and not is_p1)
                won       = (leg_win_id == p1_id and is_p1) or (leg_win_id == p2_id and not is_p1)

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
                    game_id,
                    player_id,      -- hier statt "player"
                    darts_thrown,
                    avg_3dart,
                    avg_first9,
                    avg_darts,
                    legs_played,
                    legs_won,
                    legs_lost,
                    sets_won,
                    best_leg,
                    worst_leg,
                    high_finish,
                    high_score,
                    score_100,
                    score_100_plus,
                    score_140,
                    score_140_plus,
                    score_180,
                    keep_pct,
                    keep_ratio,
                    break_pct,
                    break_ratio
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                game_id,
                player_id,
                darts_thrown,
                avg_3dart,
                avg_first9,
                avg_darts,
                legs_played,
                legs_won,
                legs_lost,
                sets_won,
                best_leg,
                worst_leg,
                0,   # high_finish (falls noch nicht berechnet)
                0,   # high_score
                count_100,
                count_100_plus,
                count_140,
                count_140_plus,
                count_180,
                keep_pct,
                keep_ratio,
                break_pct,
                break_ratio
            ))

    conn.commit()
    conn.close()
    print('[OK] Stats erfolgreich berechnet 🎯')

if __name__ == "__main__":
    calculate_stats()
