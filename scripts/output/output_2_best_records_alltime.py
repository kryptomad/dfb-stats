# -*- coding: utf-8 -*-
import json
from collections import defaultdict
from statistics import mean

# Dateipfade
STATS_PATH = "../dumps/stats.json"
DETAILS_PATH = "../dumps/spiele_details.json"
SPIELTAGE_PATH = "../dumps/spieltage.json"
OUTPUT_PATH = "../dumps/best_records_alltime.json"

MODI = ["match", "session", "season", "overall"]

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

from collections import defaultdict

# MOST 100, 140, 180s
def get_most_score_key(stats, modus, key, label):
    from collections import defaultdict

    if modus == "match":
        max_val = max((row.get(key, 0) for row in stats), default=0)
        top_players = sorted(set(
            row["player"] for row in stats if row.get(key, 0) == max_val and max_val > 0
        ))

        if top_players:
            return {
                "kategorie": label,
                "wert": max_val,
                "spieler": top_players[0] if len(top_players) == 1 else top_players
            }
        return None

    # Aggregation für session, season, overall
    counter = defaultdict(int)

    for row in stats:
        player = row["player"]
        value = row.get(key, 0)

        if modus == "session":
            group_key = (player, row.get("matchday"))
        elif modus == "season":
            group_key = (player, row.get("season"))
        elif modus == "overall":
            group_key = player
        else:
            continue

        if group_key is None:
            continue
        counter[group_key] += value

    if not counter:
        return None

    # Jetzt max-Wert berechnen
    max_val = max(counter.values())
    top_players = [p[0] if isinstance(p, tuple) else p for p, v in counter.items() if v == max_val]
    top_players = sorted(set(top_players))

    return {
        "kategorie": label,
        "wert": max_val,
        "spieler": top_players[0] if len(top_players) == 1 else top_players
    }



def get_most_score_value(stats, key, label):
    # Spieler mit höchstem Wert sammeln
    max_val = 0
    result = []
    for s in stats:
        val = s.get(key)
        if val is None:
            continue
        if val > max_val:
            max_val = val
            result = [s["player"]]
        elif val == max_val:
            result.append(s["player"])
    return {
        "kategorie": label,
        "wert": max_val,
        "spieler": sorted(set(result))
    }


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
    filtered = [
        s for s in stats
        if (not winner_only or s["legs_won"] > 0)
        and s.get(key) is not None
    ]
    if not filtered:
        return None
    best = max(filtered, key=lambda x: x[key])
    return {
        "kategorie": label,
        "wert": round(best[key], 2) if isinstance(best[key], float) else best[key],
        "spieler": best["player"]
    }


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

def get_best_avg3dart(stats, modus):
    if modus == "match":
        return get_max_value(stats, "avg_3dart", "Best 3 Dart Average", winner_only=True)

    # Gruppierung für session, season, overall
    groups = defaultdict(list)
    for s in stats:
        if s.get("avg_3dart") is None or s["legs_won"] == 0:
            continue
        if modus == "session":
            key = (s["player"], s.get("session", s.get("game_id")))
        elif modus == "season":
            key = (s["player"], s.get("season", s.get("game_id")))
        else:  # overall
            key = s["player"]
        groups[key].append((s["avg_3dart"], s["legs_won"]))

    best_value = 0
    best_player = None

    for key, values in groups.items():
        player = key if isinstance(key, str) else key[0]
        total_score = sum(avg * legs for avg, legs in values)
        total_legs = sum(legs for _, legs in values)
        if total_legs == 0:
            continue
        avg = round(total_score / total_legs, 3)
        if avg > best_value:
            best_value = avg
            best_player = player

    if best_player:
        return {
            "kategorie": f"Best 3 Dart Average",
            "wert": round(best_value, 2),
            "spieler": best_player
        }
    return None


def process_mode(stats, details, modus):
    return {
        "modus": modus,
        "einträge": list(filter(None, [
            get_best_leg(details, [s["player"] for s in stats if s["legs_won"] > 0]),
            get_max_value(stats, "high_finish", "Highest Checkout", winner_only=True) if modus == "match" else None,
            get_best_avg3dart(stats, modus),
            get_max_value(stats, "avg_first9", "Best First 9 Avg", winner_only=False),
            get_most_score_key(stats, modus, "score_100", "Most TONs"),
            get_most_score_key(stats, modus, "score_140", "Most 140s"),
            get_most_score_key(stats, modus, "score_180", "Most 180s")
        ]))
    }


def main():
    stats_all = load_json(STATS_PATH)
    details_all = load_json(DETAILS_PATH)
    spieltage_data = load_json(SPIELTAGE_PATH)

    # Spiel-ID → Matchday + Season lookup
    game_to_meta = {
        eintrag["game_id"]: {"matchday": eintrag["matchday"], "season": eintrag["season"]}
        for eintrag in spieltage_data
    }

    # Anreicherung der Stats mit matchday & season
    for s in stats_all:
        meta = game_to_meta.get(s["game_id"])
        if meta:
            s["matchday"] = meta["matchday"]
            s["season"] = meta["season"]

    data = []
    for modus in MODI:
        eintrag = process_mode(stats_all, details_all, modus)
        data.append(eintrag)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ best_records_alltime.json erstellt ({OUTPUT_PATH})")



if __name__ == "__main__":
    main()