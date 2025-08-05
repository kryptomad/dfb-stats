import sqlite3
import json
from pathlib import Path
from collections import defaultdict

# Pfade anpassen
DB_PATH = Path(__file__).parents[2] / "db" / "dfb_stats.db"
OUTPUT_PATH = Path(__file__).parents[2] / "dumps" / "legs.json"

# Maximale Anzahl an Legs, None für unbegrenzt
NUM_LEGS = None

def export_legs():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Daten abfragen
    query = f"""
        SELECT
            l.game_id,
            g.season,
            g.matchday,
            g.player1_id,
            g.player2_id,
            l.leg_number,
            l.round,
            l.p1_score,
            l.p1_left,
            l.p2_score,
            l.p2_left,
            l.p1_darts_leg,
            l.p2_darts_leg,
            l.p1_avg_3dart_leg,
            l.p2_avg_3dart_leg,
            l.leg_winner_id,
            l.starter_id
        FROM legs l
        JOIN games g ON l.game_id = g.game_id
        ORDER BY l.game_id, l.leg_number, l.round
        {"LIMIT :limit" if NUM_LEGS else ""}
    """
    params = {"limit": NUM_LEGS} if NUM_LEGS else {}
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Gruppieren: Game → Legs → Rounds
    games_dict = defaultdict(lambda: {
        "game_id": None,
        "season": None,
        "matchday": None,
        "player1_id": None,
        "player2_id": None,
        "legs": {}
    })

    for row in rows:
        game_id = row["game_id"]
        leg_number = row["leg_number"]

        game = games_dict[game_id]
        game["game_id"] = game_id
        game["season"] = row["season"]
        game["matchday"] = row["matchday"]
        game["player1_id"] = row["player1_id"]
        game["player2_id"] = row["player2_id"]

        if leg_number not in game["legs"]:
            game["legs"][leg_number] = {
                "leg_number": leg_number,
                "starter_id": row["starter_id"],
                "leg_winner_id": None,
                "p1_darts_leg": None,
                "p2_darts_leg": None,
                "p1_avg_3dart_leg": None,
                "p2_avg_3dart_leg": None,
                "rounds": []
            }

        leg = game["legs"][leg_number]
        leg["rounds"].append({
            "round": row["round"],
            "p1_score": row["p1_score"],
            "p1_left": row["p1_left"],
            "p2_score": row["p2_score"],
            "p2_left": row["p2_left"]
        })

        # Aus letzter Runde die Leg-Infos übernehmen
        leg["leg_winner_id"] = row["leg_winner_id"] or leg["leg_winner_id"]
        leg["p1_darts_leg"] = row["p1_darts_leg"] or leg["p1_darts_leg"]
        leg["p2_darts_leg"] = row["p2_darts_leg"] or leg["p2_darts_leg"]
        leg["p1_avg_3dart_leg"] = row["p1_avg_3dart_leg"] or leg["p1_avg_3dart_leg"]
        leg["p2_avg_3dart_leg"] = row["p2_avg_3dart_leg"] or leg["p2_avg_3dart_leg"]

    # In kompakte Liste umwandeln
    result = []
    for game in games_dict.values():
        game["legs"] = list(game["legs"].values())
        result.append(game)

    # Sicherstellen, dass das Zielverzeichnis existiert
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # JSON schreiben
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ Kompakte Legs exportiert: {OUTPUT_PATH} ({len(result)} Spiele)")

if __name__ == "__main__":
    export_legs()
