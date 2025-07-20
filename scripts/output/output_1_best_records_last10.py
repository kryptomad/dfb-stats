import json
from collections import defaultdict

# Konfiguration
ANZAHL_SPIELE = 10
INPUT_PATH = "../dumps/stats.json"
OUTPUT_PATH = "../dumps/last_stats.json"

def collect_top_totals(stats, key):
    totals = defaultdict(int)
    for s in stats:
        if s[key] > 0:
            totals[s["player"]] += s[key]

    if not totals:
        return None

    max_val = max(totals.values())
    spieler = sorted([name for name, val in totals.items() if val == max_val])

    return {
        "wert": max_val,
        "spieler": spieler if len(spieler) > 1 else spieler[0]
    }

def main():
    # Stats-Daten laden
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        stats = json.load(f)

    # Sortieren nach game_id absteigend (neueste zuerst)
    stats_sorted = sorted(stats, key=lambda x: x["game_id"], reverse=True)
    stats_last = stats_sorted[:ANZAHL_SPIELE * 2]

    # Nur Spieler mit mind. 1 gewonnenem Leg
    stats_winners = [s for s in stats_last if s["legs_won"] > 0]

    # Einzelkategorien
    checkout_stat = max(stats_winners, key=lambda x: x["high_finish"])
    best_leg_stat = min(stats_winners, key=lambda x: x["best_leg"])
    avg3_stat = max(stats_winners, key=lambda x: x["avg_3dart"])
    first9_stat = max(stats_last, key=lambda x: x["avg_first9"])

    # Ausgabe vorbereiten
    output = [
        {
            "kategorie": "Highest Checkout",
            "wert": checkout_stat["high_finish"],
            "spieler": checkout_stat["player"]
        },
        {
            "kategorie": "Best Leg",
            "wert": best_leg_stat["best_leg"],
            "spieler": best_leg_stat["player"]
        },
        {
            "kategorie": "Highest 3-Dart Average",
            "wert": round(avg3_stat["avg_3dart"], 2),
            "spieler": avg3_stat["player"]
        },
        {
            "kategorie": "Highest First 9 Average",
            "wert": round(first9_stat["avg_first9"], 2),
            "spieler": first9_stat["player"]
        }
    ]

    # Zählwerte über Summen auswerten (z. B. 140er & 180er)
    for key, label in [
        ("score_140", "Most 140s"),
        ("score_180", "Most 180s")
    ]:
        result = collect_top_totals(stats_last, key)
        if result:
            output.append({
                "kategorie": label,
                "wert": result["wert"],
                "spieler": result["spieler"]
            })

    # Speichern
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"✅ last_stats.json erfolgreich erstellt ({OUTPUT_PATH})")

if __name__ == "__main__":
    main()
