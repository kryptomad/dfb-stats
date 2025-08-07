import sqlite3
import json
from pathlib import Path

# Pfade anpassen
DB_PATH = Path(__file__).parents[2] / "db" / "dfb_stats.db"
OUTPUT_PATH = Path(__file__).parents[2] / "src" / "assets" / "stats.json"

# Optional: Anzahl Datensätze begrenzen, None für alle
default_limit = None


def export_stats(limit=None):
    # DB-Verbindung
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Daten abfragen (legs_lost direkt aus der Tabelle)
    query = f"""
        SELECT
            g.game_id,
            g.season,
            g.matchday,
            s.player_id,
            g.player1_id,
            g.player2_id,
            s.sets_won,
            s.legs_played,
            s.legs_won,
            s.legs_lost,
            s.darts_thrown,
            s.avg_darts,
            s.avg_3dart,
            s.avg_first9,
            s.best_leg,
            s.worst_leg,
            s.high_finish,
            s.high_score,
            s.score_100,
            s.score_100_plus,
            s.score_140,
            s.score_140_plus,
            s.score_180,
            s.keep_pct,
            s.keep_ratio,
            s.break_pct,
            s.break_ratio
        FROM stats s
        JOIN games g ON s.game_id = g.game_id
        ORDER BY g.game_id, s.player_id
        {"LIMIT :limit" if limit else ""}
    """
    params = {"limit": limit} if limit else {}
    cursor.execute(query, params)
    rows = cursor.fetchall()

    # In Python dicts umwandeln
    stats_list = []
    for row in rows:
        stats_list.append({
            "game_id":       row["game_id"],
            "season":        row["season"],
            "matchday":      row["matchday"],
            "player_id":     row["player_id"],
            "player1_id":    row["player1_id"],
            "player2_id":    row["player2_id"],
            "sets_won":      row["sets_won"],
            "legs_played":   row["legs_played"],
            "legs_won":      row["legs_won"],
            "legs_lost":     row["legs_lost"],
            "darts_thrown":  row["darts_thrown"],
            "avg_darts":     row["avg_darts"],
            "avg_3dart":     row["avg_3dart"],
            "avg_first9":    row["avg_first9"],
            "best_leg":      row["best_leg"],
            "worst_leg":     row["worst_leg"],
            "high_finish":   row["high_finish"],
            "high_score":    row["high_score"],
            "score_100":     row["score_100"],
            "score_100_plus":row["score_100_plus"],
            "score_140":     row["score_140"],
            "score_140_plus":row["score_140_plus"],
            "score_180":     row["score_180"],
            "keep_pct":      row["keep_pct"],
            "keep_ratio":    row["keep_ratio"],
            "break_pct":     row["break_pct"],
            "break_ratio":   row["break_ratio"],
        })

    # Sicherstellen, dass Ausgabe-Ordner existiert
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # JSON schreiben
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(stats_list, f, ensure_ascii=False, indent=2)

    print(f"✅ Stats exportiert: {OUTPUT_PATH} ({len(stats_list)} Einträge)")


if __name__ == "__main__":
    export_stats(default_limit)
