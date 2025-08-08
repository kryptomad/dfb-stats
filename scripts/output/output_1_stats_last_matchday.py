import json
from collections import defaultdict
from pathlib import Path

# Konfiguration
ANZAHL_SPIELE = 10
BASE = Path(__file__).parents[2]
STATS_PATH = BASE / "src" / "assets" / "stats.json"
PLAYERS_PATH = BASE / "src" / "assets" / "players.json"
OUTPUT_PATH = BASE / "src" / "assets" / "last_stats.json"


def load_players():
    """
    Lädt die players.json und gibt ein Dict player_id -> name zurück.
    """
    with open(PLAYERS_PATH, 'r', encoding='utf-8') as f:
        players = json.load(f)
    # Erwartet, dass jeder Eintrag mindestens 'player_id' und 'name' enthält
    return {p['player_id']: p.get('name', f"ID_{p['player_id']}") for p in players}


def collect_top_totals(stats, key, players_map):
    totals = defaultdict(int)
    for s in stats:
        if s[key] > 0:
            totals[s["player_id"]] += s[key]

    if not totals:
        return None

    max_val = max(totals.values())
    # IDs der Top-Werte sammeln
    top_ids = [pid for pid, val in totals.items() if val == max_val]
    # in Namen umwandeln
    names = [players_map.get(pid, f"ID_{pid}") for pid in sorted(top_ids)]

    return {
        "wert": max_val,
        "spieler": names if len(names) > 1 else names[0]
    }


def main():
    # Stats-Daten laden
    with open(STATS_PATH, "r", encoding="utf-8") as f:
        stats = json.load(f)

    # Player-Mapping laden
    players_map = load_players()

    # Sortieren nach game_id absteigend (neueste zuerst)
    stats_sorted = sorted(stats, key=lambda x: x["game_id"], reverse=True)
    # Je Spiel sind zwei Einträge (zwei Spieler)
    stats_last = stats_sorted[:ANZAHL_SPIELE * 2]

    # Nur Einträge mit mindestens 1 gewonnenem Leg
    stats_winners = [s for s in stats_last if s.get("legs_won", 0) > 0]

    # Einzelkategorien ermitteln und Name ersetzen
    def choose_stat(stat_list, key, reverse=False):
        func = max if reverse else min if not reverse and key in ("best_leg",) else max
        return func(stat_list, key=lambda x: x[key])

    checkout = max(stats_winners, key=lambda x: x["high_finish"])
    best_leg = min(stats_winners, key=lambda x: x["best_leg"])
    avg3 = max(stats_winners, key=lambda x: x["avg_3dart"])
    first9 = max(stats_last, key=lambda x: x["avg_first9"])

    output = [
        {"kategorie": "Highest Checkout", "wert": checkout["high_finish"],
         "spieler": players_map.get(checkout["player_id"])},
        {"kategorie": "Best Leg", "wert": best_leg["best_leg"],
         "spieler": players_map.get(best_leg["player_id"])},
        {"kategorie": "Highest 3-Dart Average", "wert": round(avg3["avg_3dart"], 2),
         "spieler": players_map.get(avg3["player_id"])},
        {"kategorie": "Highest First 9 Average", "wert": round(first9["avg_first9"], 2),
         "spieler": players_map.get(first9["player_id"])},
    ]

    # Summenkategorien
    for key, label in [("score_140", "Most 140s"), ("score_180", "Most 180s")]:
        result = collect_top_totals(stats_last, key, players_map)
        if result:
            output.append({"kategorie": label, **result})

    # Sicherstellen, dass Ausgabeordner existiert
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Ausgabe schreiben
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ {OUTPUT_PATH.name} erfolgreich erstellt ({len(output)} Einträge)")

if __name__ == "__main__":
    main()
