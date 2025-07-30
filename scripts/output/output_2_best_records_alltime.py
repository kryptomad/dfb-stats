import json
from collections import defaultdict
from pathlib import Path

# Pfade
BASE = Path(__file__).parents[2]
STATS_PATH     = BASE / "dumps" / "stats.json"
DETAILS_PATH   = BASE / "dumps" / "legs.json"
SPIELTAGE_PATH = BASE / "dumps" / "games.json"
PLAYERS_PATH   = BASE / "dumps" / "players.json"
OUTPUT_PATH    = BASE / "dumps" / "best_records_alltime.json"

MODI = ["match", "session", "season", "overall"]

# JSON-Lader
def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

# Lade Player-Mapping (player_id -> name)
def load_players():
    players = load_json(PLAYERS_PATH)
    return {p["player_id"]: p.get("name", f"ID_{p['player_id']}") for p in players}

# Hilfsfunktion für Summenkategorien
def collect_totals(stats, key):
    totals = defaultdict(int)
    for s in stats:
        val = s.get(key, 0)
        if val and s.get("player_id") is not None:
            totals[s["player_id"]] += val
    if not totals:
        return None
    max_val = max(totals.values())
    top_ids = [pid for pid, v in totals.items() if v == max_val]
    return max_val, top_ids

# Verarbeitung pro Modus
def process_mode(stats, details, players_map, modus):
    # Filter nach legs_won >0 für gravierende Kategorien
    winners = [s for s in stats if s.get("legs_won", 0) > 0]
    entries = []
    if modus == "match":
        # Highest Checkout
        if winners:
            best = max(winners, key=lambda x: x.get("high_finish", 0))
            entries.append({
                "kategorie": "Highest Checkout",
                "wert": best.get("high_finish"),
                "spieler": players_map.get(best.get("player_id"))
            })
        # Best Leg
        if details:
            # details entries have leg_winner_id and darts thrown as sum ? take minimal darts per leg
            best_leg = None
            for d in details:
                if d.get("leg_winner_id") in players_map:
                    darts = d.get("p1_darts_leg") if d.get("leg_winner_id") == d.get("player1_id") else d.get("p2_darts_leg")
                    if darts is None:
                        continue
                    if best_leg is None or darts < best_leg["darts"]:
                        best_leg = {"darts": darts, "winner_id": d.get("leg_winner_id")}
            if best_leg:
                entries.append({
                    "kategorie": "Best Leg",
                    "wert": best_leg["darts"],
                    "spieler": players_map.get(best_leg["winner_id"])
                })
        # 3-Dart Average
        if winners:
            best_avg = max(winners, key=lambda x: x.get("avg_3dart", 0))
            entries.append({
                "kategorie": "Highest 3-Dart Average",
                "wert": round(best_avg.get("avg_3dart", 0), 2),
                "spieler": players_map.get(best_avg.get("player_id"))
            })
        # First9 Average
        if stats:
            best_first9 = max(stats, key=lambda x: x.get("avg_first9", 0))
            entries.append({
                "kategorie": "Highest First 9 Average",
                "wert": round(best_first9.get("avg_first9", 0), 2),
                "spieler": players_map.get(best_first9.get("player_id"))
            })
    # Summenkategorien für session, season, overall
    for key, label in [("score_100", "Most TONs"), ("score_140", "Most 140s"), ("score_180", "Most 180s")]:
        if modus == "match":
            # already covered as single-match
            continue
        # Aggregation dimension
        grouped = defaultdict(int)
        for s in stats:
            pid = s.get("player_id")
            if pid is None:
                continue
            val = s.get(key, 0)
            if not val:
                continue
            if modus == "session":
                group = (pid, s.get("matchday"))
            elif modus == "season":
                group = (pid, s.get("season"))
            else:  # overall
                group = pid
            grouped[group] += val
        if not grouped:
            continue
        max_val = max(grouped.values())
        top = [g[0] if isinstance(g, tuple) else g for g, v in grouped.items() if v == max_val]
        names = [players_map.get(pid) for pid in sorted(set(top))]
        entries.append({"kategorie": label, "wert": max_val, "spieler": names[0] if len(names)==1 else names})
    return {"modus": modus, "einträge": entries}


def main():
    stats = load_json(STATS_PATH)
    details = load_json(DETAILS_PATH)
    spiele = load_json(SPIELTAGE_PATH)
    players_map = load_players()

    # Enrich stats with season & matchday
    meta = {g["game_id"]: {"season": g.get("season"), "matchday": g.get("matchday")} for g in spiele}
    for s in stats:
        m = meta.get(s.get("game_id"), {})
        s.update(m)

    data = [process_mode(stats, details, players_map, modus) for modus in MODI]

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ best_records_alltime.json erstellt ({OUTPUT_PATH})")

if __name__ == "__main__":
    main()
