# -*- coding: utf-8 -*-
import json
from collections import defaultdict
from statistics import mean

# Dateipfade
STATS_PATH = "../dumps/stats.json"
DETAILS_PATH = "../dumps/spiele_details.json"
OUTPUT_PATH = "../dumps/best_records_alltime.json"

MODI = ["match", "session", "season", "overall"]

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def get_best_leg(details, winner_names):
    best = None
    for leg in details:
        if leg.get("winner") not in winner_names:
            continue
        if not isinstance(leg.get("darts"), int):
            continue
        if best is None or leg["darts"] < best["darts"]:
            best = leg
    return {
        "kategorie": "Best Leg",
        "wert": best["darts"],
        "spieler": best["winner"]
    } if best else None

def get_max_value(stats, key, label, winner_only=False):
    filtered = stats if not winner_only else [s for s in stats if s["legs_won"] > 0]
    best = max(filtered, key=lambda x: x[key], default=None)
    return {
        "kategorie": label,
        "wert": round(best[key], 2) if isinstance(best[key], float) else best[key],
        "spieler": best["player"]
    } if best else None

def get_most_total(stats, key, label):
    totals = defaultdict(int)
    for s in stats:
        totals[s["player"]] += s.get(key, 0)
    if not totals:
        return None
    max_val = max(totals.values())
    names = sorted([k for k, v in totals.items() if v == max_val])
    return {
        "kategorie": label,
        "wert": max_val,
        "spieler": names[0] if len(names) == 1 else names
    }

def process_mode(stats, details, modus):
    return {
        "modus": modus,
        "einträge": list(filter(None, [
            get_best_leg(details, [s["player"] for s in stats if s["legs_won"] > 0]),
            get_max_value(stats, "high_finish", "Highest Checkout"),
            get_max_value(stats, "avg_3dart", "Best 3 Dart Average", winner_only=True),
            get_max_value(stats, "avg_first9", "Best First 9 Avg", winner_only=False),
            get_most_total(stats, "score_100", "Most TONs"),
            get_most_total(stats, "score_140", "Most 140s"),
            get_most_total(stats, "score_180", "Most 180s"),
        ]))
    }

def main():
    stats_all = load_json(STATS_PATH)
    details_all = load_json(DETAILS_PATH)

    data = []  # <- hier jetzt sauber definiert
    for modus in MODI:
        # TODO: Später echte Filter je nach Modus
        eintrag = process_mode(stats_all, details_all, modus)
        data.append(eintrag)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ best_records_alltime.json erstellt ({OUTPUT_PATH})")

if __name__ == "__main__":
    main()
