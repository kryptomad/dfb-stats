import sqlite3
import json
from pathlib import Path

# Pfade anpassen
DB_PATH     = Path(__file__).parents[2] / "db"   / "dfb_stats.db"
OUTPUT_PATH = Path(__file__).parents[2] / "dumps" / "legs.json"

# Maximale Anzahl an Legs, None für unbegrenzt
NUM_LEGS = None


def export_legs():
    # Verbindung aufsetzen
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Abfrage aller Legs mit Kontext aus Games\    
    query = f"""
        SELECT
            l.game_id,
            g.season,
            g.matchday,
            l.leg_number,
            g.player1_id,
            l.p1_score,
            l.p1_left,
            l.round,
            l.p2_score,
            l.p2_left,
            g.player2_id,
            l.p1_darts_leg,
            l.p2_darts_leg,
            l.p1_avg_3dart_leg,
            l.p2_avg_3dart_leg,
            l.leg_winner_id   AS leg_winner_id,
            l.starter_id      AS starter_id
        FROM legs l
        JOIN games g ON l.game_id = g.game_id
        ORDER BY l.game_id, l.leg_number, l.round
        {"LIMIT :limit" if NUM_LEGS else ""}
    """
    params = {"limit": NUM_LEGS} if NUM_LEGS else {}
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # Daten formatieren
    legs_list = []
    for row in rows:
        legs_list.append({
            "game_id":             row["game_id"],
            "season":              row["season"],
            "matchday":            row["matchday"],
            "leg_number":          row["leg_number"],
            "player1_id":          row["player1_id"],
            "p1_score":            row["p1_score"],
            "p1_left":             row["p1_left"],
            "round":               row["round"],
            "p2_score":            row["p2_score"],
            "p2_left":             row["p2_left"],
            "player2_id":          row["player2_id"],
            "p1_darts_leg":        row["p1_darts_leg"],
            "p2_darts_leg":        row["p2_darts_leg"],
            "p1_avg_3dart_leg":    row["p1_avg_3dart_leg"],
            "p2_avg_3dart_leg":    row["p2_avg_3dart_leg"],
            "leg_winner_id":       row["leg_winner_id"],
            "starter_id":          row["starter_id"],
        })

    # Sicherstellen, dass das Zielverzeichnis existiert
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # JSON schreiben
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(legs_list, f, ensure_ascii=False, indent=2)

    print(f"✅ Legs exportiert: {OUTPUT_PATH} ({len(legs_list)} Datensätze)")


if __name__ == "__main__":
    export_legs()
