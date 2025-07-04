# -*- coding: utf-8 -*-
import sqlite3
import json

DB_PATH = '../db/dfb_stats.db'
OUTPUT_PATH = '../dumps/spiele_details.json'

def export_spiele_details():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute("SELECT id, game_date, player1, player2, legs1, legs2 FROM games")
    games = c.fetchall()

    output = []

    for game_id, date, p1, p2, legs1, legs2 in games:
        # Spiel-Statistiken holen
        c.execute("""
            SELECT player, sets_won, legs_played, darts_thrown, avg_darts, avg_3dart, avg_first9, best_leg, worst_leg, 
                   high_finish, score_100, score_100_plus, score_140, score_140_plus, score_180, keep_pct, keep_ratio, 
                   break_pct, break_ratio 
            FROM stats WHERE game_id = ?
        """, (game_id,))
        rows = c.fetchall()
        if len(rows) != 2:
            continue  # Spiel unvollständig?

        labels = [
            "Sets Won", "Legs Played", "Darts Thrown", "Average Darts", "Average", "Average First 9",
            "Best Leg", "Worst Leg", "High-out", "TON", "100+", "140s", "140+",
            "180s", "Keep %", "Keep Ratio", "Break %", "Break Ratio"
        ]

        game_stats = []
        for i in range(len(labels)):
            p1_val = rows[0][i+1]
            p2_val = rows[1][i+1]
            game_stats.append({
                "label": labels[i],
                "p1": f"{p1_val:.2f}" if isinstance(p1_val, float) else p1_val,
                "p2": f"{p2_val:.2f}" if isinstance(p2_val, float) else p2_val
            })

        # Alle Runden für dieses Spiel holen
        c.execute("""
            SELECT leg_number, p1_score, p1_left, p2_score, p2_left, p1_darts_leg, p2_darts_leg 
            FROM legs WHERE game_id = ? ORDER BY id
        """, (game_id,))
        all_rounds = c.fetchall()

        # Starter je leg holen
        c.execute("""
            SELECT leg_number, starter FROM legs 
            WHERE game_id = ? AND round = 0
            ORDER BY id
        """, (game_id,))
        starter_map = dict(c.fetchall())  # z.B. {1: 'p1', 2: 'p2', ...}

        def format_score(score):
            return "" if score is None else str(score)

        legs = []
        leg = {
            "rounds": [], "p1_darts_leg": None, "p2_darts_leg": None,
            "p1_avg_leg": None, "p2_avg_leg": None,
            "leg_number": None, "starter": None
        }
        current_leg_number = None
        current_leg_darts_p1 = None
        current_leg_darts_p2 = None

        for row in all_rounds:
            leg_number, p1_score, p1_left, p2_score, p2_left, p1_darts_leg, p2_darts_leg = row

            if (current_leg_number is not None and leg_number != current_leg_number):
                legs.append(leg)
                leg = {
                    "rounds": [], "p1_darts_leg": None, "p2_darts_leg": None,
                    "p1_avg_leg": None, "p2_avg_leg": None,
                    "leg_number": None, "starter": None
                }

            current_leg_number = leg_number
            current_leg_darts_p1 = p1_darts_leg
            current_leg_darts_p2 = p2_darts_leg

            leg["leg_number"] = leg_number
            leg["starter"] = starter_map.get(leg_number)

            leg["p1_darts_leg"] = p1_darts_leg
            leg["p2_darts_leg"] = p2_darts_leg
            leg["p1_avg_leg"] = round((3 * 501 / p1_darts_leg), 2) if p1_darts_leg else None
            leg["p2_avg_leg"] = round((3 * 501 / p2_darts_leg), 2) if p2_darts_leg else None

            leg["rounds"].append({
                "p1_score": format_score(p1_score),
                "p1_left": p1_left if p1_left is not None else "",
                "p2_score": format_score(p2_score),
                "p2_left": p2_left if p2_left is not None else ""
            })

        # Letztes Leg anhängen
        if leg["rounds"]:
            legs.append(leg)

        output.append({
            "date": date,
            "p1": p1,
            "p2": p2,
            "legs1": legs1,
            "legs2": legs2,
            "stats": game_stats,
            "legs": legs
        })

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Spiel Details exportiert: {OUTPUT_PATH} ({len(output)} Spiele)")

if __name__ == '__main__':
    export_spiele_details()
