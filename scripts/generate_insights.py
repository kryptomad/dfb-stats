"""
Spieler-Insights Generator
==========================
Liest games.json + players.json und erzeugt/aktualisiert insights.json.
Bestehende insight_ids bleiben erhalten, nur value/updated_at werden aktualisiert.
Neue Muster bekommen neue fortlaufende IDs.

Usage: python scripts/generate_insights.py
"""

import json
from pathlib import Path
from datetime import datetime, date
from collections import defaultdict

ASSETS = Path(__file__).parents[1] / "src" / "assets"
GAMES_PATH = ASSETS / "games.json"
PLAYERS_PATH = ASSETS / "players.json"
INSIGHTS_PATH = ASSETS / "insights.json"

TODAY = date.today().isoformat()


# ─── Helpers ───────────────────────────────────────────────────────────────────

def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def player_name(pid, players):
    for p in players:
        if p["player_id"] == pid:
            return p["name"]
    return f"Spieler {pid}"


def active_player_ids(players):
    return [p["player_id"] for p in players if p.get("isActive")]


def player_games(games, pid):
    """Alle Spiele eines Spielers mit normalisierter Perspektive."""
    result = []
    for g in games:
        if g["player1_id"] == pid:
            result.append({
                **g,
                "my_legs": g["p1_legs_won"],
                "opp_legs": g["p2_legs_won"],
                "my_avg": g["p1_avg_3dart_match"],
                "opp_avg": g["p2_avg_3dart_match"],
                "opp_id": g["player2_id"],
                "opp_name": g["player2"],
                "won": g["p1_legs_won"] > g["p2_legs_won"],
            })
        elif g["player2_id"] == pid:
            result.append({
                **g,
                "my_legs": g["p2_legs_won"],
                "opp_legs": g["p1_legs_won"],
                "my_avg": g["p2_avg_3dart_match"],
                "opp_avg": g["p1_avg_3dart_match"],
                "opp_id": g["player1_id"],
                "opp_name": g["player1"],
                "won": g["p2_legs_won"] > g["p1_legs_won"],
            })
    # Sortiere chronologisch (ältestes zuerst)
    result.sort(key=lambda x: (x["game_date"], x["game_time"]))
    return result


def game_hour(g):
    """Stunde aus game_time extrahieren."""
    try:
        return int(g["game_time"].split(":")[0])
    except (ValueError, AttributeError):
        return 0


def game_number_on_date(games):
    """Spielnummer des Abends pro Spieler (1-basiert, chronologisch nach game_time)."""
    by_date = defaultdict(list)
    for g in games:
        by_date[g["game_date"]].append(g)
    for dt in by_date:
        by_date[dt].sort(key=lambda x: x["game_time"])
    result = {}
    for dt, gs in by_date.items():
        for i, g in enumerate(gs):
            result[g["game_id"]] = i + 1
    return result


def current_streak(pg, condition):
    """Aktuelle Serie (von hinten) wo condition(game) True ist."""
    count = 0
    for g in reversed(pg):
        if condition(g):
            count += 1
        else:
            break
    return count


def longest_streak(pg, condition):
    """Längste Serie wo condition(game) True ist."""
    best = 0
    current = 0
    for g in pg:
        if condition(g):
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best


# ─── Insight Generators ───────────────────────────────────────────────────────

def generate_all_insights(games, players):
    """Generiert alle Insights für alle aktiven Spieler."""
    insights = []
    active_ids = active_player_ids(players)

    # Spielnummer des Abends für jeden Spieler vorberechnen
    all_game_numbers = {}
    for pid in active_ids:
        pg = player_games(games, pid)
        all_game_numbers[pid] = game_number_on_date(pg)

    for pid in active_ids:
        name = player_name(pid, players)
        pg = player_games(games, pid)
        if len(pg) < 5:
            continue  # Zu wenig Daten

        gn = all_game_numbers[pid]

        insights += insights_uhrzeit(pid, name, pg)
        insights += insights_spielnummer(pid, name, pg, gn)
        insights += insights_gegner(pid, name, pg, players)
        insights += insights_formkurve(pid, name, pg)
        insights += insights_legs_spielweise(pid, name, pg)
        insights += insights_saisonuebergreifend(pid, name, pg)
        insights += insights_fun(pid, name, pg)

    return insights


def insights_uhrzeit(pid, name, pg):
    """Uhrzeit-basierte Insights: Vor/nach 22 Uhr."""
    results = []

    early = [g for g in pg if game_hour(g) < 22]
    late = [g for g in pg if game_hour(g) >= 22]

    if len(early) >= 3 and len(late) >= 3:
        wr_early = sum(1 for g in early if g["won"]) / len(early) * 100
        wr_late = sum(1 for g in late if g["won"]) / len(late) * 100

        if abs(wr_early - wr_late) >= 10:
            if wr_early > wr_late:
                results.append(make_insight(
                    pid, name, "uhrzeit",
                    f"{name} gewinnt vor 22 Uhr {{value}}% seiner Spiele, danach nur {{value2}}%.",
                    round(wr_early), value2=round(wr_late),
                    key="early_vs_late_wr"
                ))
            else:
                results.append(make_insight(
                    pid, name, "uhrzeit",
                    f"{name} ist ein Spätzünder: Ab 22 Uhr liegt seine Win-Rate bei {{value}}% (vorher {{value2}}%).",
                    round(wr_late), value2=round(wr_early),
                    key="late_better_wr"
                ))

        avg_early = sum(g["my_avg"] for g in early) / len(early)
        avg_late = sum(g["my_avg"] for g in late) / len(late)

        if abs(avg_early - avg_late) >= 3:
            better_time = "vor 22 Uhr" if avg_early > avg_late else "nach 22 Uhr"
            better_val = max(avg_early, avg_late)
            worse_val = min(avg_early, avg_late)
            results.append(make_insight(
                pid, name, "uhrzeit",
                f"{name} spielt {better_time} stärker: {{value}} Average vs. {{value2}} Average.",
                round(better_val, 1), value2=round(worse_val, 1),
                key="avg_by_time"
            ))

    return results


def insights_spielnummer(pid, name, pg, game_numbers):
    """Spielnummer des Abends: Spiel 1 vs. Rest."""
    results = []

    first_games = [g for g in pg if game_numbers.get(g["game_id"]) == 1]
    later_games = [g for g in pg if game_numbers.get(g["game_id"], 0) > 1]

    if len(first_games) >= 3 and len(later_games) >= 3:
        wr_first = sum(1 for g in first_games if g["won"]) / len(first_games) * 100
        wr_later = sum(1 for g in later_games if g["won"]) / len(later_games) * 100

        if abs(wr_first - wr_later) >= 15:
            if wr_first > wr_later:
                results.append(make_insight(
                    pid, name, "spielnummer",
                    f"{name} startet stark: Im ersten Spiel des Abends gewinnt er {{value}}% (danach nur {{value2}}%).",
                    round(wr_first), value2=round(wr_later),
                    key="first_game_strong"
                ))
            else:
                results.append(make_insight(
                    pid, name, "spielnummer",
                    f"{name} braucht Anlauf: Erst ab Spiel 2 liegt seine Win-Rate bei {{value}}% (Spiel 1: {{value2}}%).",
                    round(wr_later), value2=round(wr_first),
                    key="warmup_type"
                ))

    return results


def insights_gegner(pid, name, pg, players):
    """Gegner-bezogene Insights: Angst-/Lieblingsgegner, aktuelle Serien."""
    results = []
    active_ids = active_player_ids(players)

    # Head-to-Head Stats
    h2h = defaultdict(lambda: {"wins": 0, "losses": 0, "games": []})
    for g in pg:
        opp = g["opp_id"]
        if opp not in active_ids:
            continue
        h2h[opp]["games"].append(g)
        if g["won"]:
            h2h[opp]["wins"] += 1
        else:
            h2h[opp]["losses"] += 1

    for opp_id, stats in h2h.items():
        total = stats["wins"] + stats["losses"]
        if total < 5:
            continue

        opp_name = player_name(opp_id, players)
        wr = stats["wins"] / total * 100

        # Angstgegner (< 35% Win-Rate)
        if wr < 35:
            results.append(make_insight(
                pid, name, "gegner",
                f"{name} hat es schwer gegen {opp_name}: Nur {{value}} von {{value2}} Spielen gewonnen.",
                stats["wins"], value2=total,
                key=f"angstgegner_{opp_id}"
            ))

        # Lieblingsgegner (> 65% Win-Rate)
        if wr > 65:
            results.append(make_insight(
                pid, name, "gegner",
                f"{name} dominiert gegen {opp_name}: {{value}} von {{value2}} Spielen gewonnen.",
                stats["wins"], value2=total,
                key=f"lieblingsgegner_{opp_id}"
            ))

        # Aktuelle Siegesserie gegen Gegner
        streak = current_streak(stats["games"], lambda g: g["won"])
        if streak >= 3:
            results.append(make_insight(
                pid, name, "gegner",
                f"{name} hat seine letzten {{value}} Spiele gegen {opp_name} gewonnen.",
                streak,
                key=f"win_streak_vs_{opp_id}"
            ))

        # Aktuelle Niederlagenserie gegen Gegner
        loss_streak = current_streak(stats["games"], lambda g: not g["won"])
        if loss_streak >= 3:
            results.append(make_insight(
                pid, name, "gegner",
                f"{name} wartet seit {{value}} Spielen auf einen Sieg gegen {opp_name}.",
                loss_streak,
                key=f"loss_streak_vs_{opp_id}"
            ))

    return results


def insights_formkurve(pid, name, pg):
    """Formkurve: Trend, Serien, Saisonhälfte."""
    results = []

    # Aktuelle Siegesserie
    win_streak = current_streak(pg, lambda g: g["won"])
    if win_streak >= 3:
        results.append(make_insight(
            pid, name, "formkurve",
            f"{name} ist on fire: {{value}} Siege in Folge!",
            win_streak,
            key="current_win_streak"
        ))

    # Aktuelle Niederlagenserie
    loss_streak = current_streak(pg, lambda g: not g["won"])
    if loss_streak >= 3:
        results.append(make_insight(
            pid, name, "formkurve",
            f"{name} steckt in einer Durststrecke: {{value}} Niederlagen in Folge.",
            loss_streak,
            key="current_loss_streak"
        ))

    # Längste Siegesserie aller Zeiten
    best_streak = longest_streak(pg, lambda g: g["won"])
    if best_streak >= 4:
        results.append(make_insight(
            pid, name, "formkurve",
            f"Die längste Siegesserie von {name}: {{value}} Spiele am Stück.",
            best_streak,
            key="longest_win_streak_alltime"
        ))

    # Letzte 10 Spiele Trend
    last10 = pg[-10:]
    if len(last10) == 10:
        wins_last10 = sum(1 for g in last10 if g["won"])
        avg_last10 = sum(g["my_avg"] for g in last10) / 10

        results.append(make_insight(
            pid, name, "formkurve",
            f"{name} hat {{value}} seiner letzten 10 Spiele gewonnen (Ø {{value2}} Average).",
            wins_last10, value2=round(avg_last10, 1),
            key="last10_form"
        ))

    # Aufwärtstrend: Letzte 5 besser als vorherige 5
    if len(pg) >= 10:
        last5 = pg[-5:]
        prev5 = pg[-10:-5]
        avg_last5 = sum(g["my_avg"] for g in last5) / 5
        avg_prev5 = sum(g["my_avg"] for g in prev5) / 5

        if avg_last5 - avg_prev5 >= 5:
            results.append(make_insight(
                pid, name, "formkurve",
                f"{name} zeigt Aufwärtstrend: Ø {{value}} in den letzten 5 Spielen (vorher {{value2}}).",
                round(avg_last5, 1), value2=round(avg_prev5, 1),
                key="upward_trend"
            ))
        elif avg_prev5 - avg_last5 >= 5:
            results.append(make_insight(
                pid, name, "formkurve",
                f"{name} im Formtief: Ø {{value}} in den letzten 5 Spielen (vorher {{value2}}).",
                round(avg_last5, 1), value2=round(avg_prev5, 1),
                key="downward_trend"
            ))

    return results


def insights_legs_spielweise(pid, name, pg):
    """Legs & Spielweise: 3:0 Quote, knappe Spiele, Average bei Sieg vs. Niederlage."""
    results = []

    wins = [g for g in pg if g["won"]]
    losses = [g for g in pg if not g["won"]]

    if len(wins) >= 3 and len(losses) >= 3:
        avg_win = sum(g["my_avg"] for g in wins) / len(wins)
        avg_loss = sum(g["my_avg"] for g in losses) / len(losses)
        results.append(make_insight(
            pid, name, "spielweise",
            f"{name} spielt bei Siegen Ø {{value}} Average, bei Niederlagen nur Ø {{value2}}.",
            round(avg_win, 1), value2=round(avg_loss, 1),
            key="avg_win_vs_loss"
        ))

    # 3:0 Siege
    clean_wins = [g for g in wins if g["opp_legs"] == 0]
    if len(wins) >= 5:
        pct = round(len(clean_wins) / len(wins) * 100)
        if pct >= 20:
            results.append(make_insight(
                pid, name, "spielweise",
                f"{{value}}% der Siege von {name} sind 3:0-Siege ({{value2}} von {len(wins)}).",
                pct, value2=len(clean_wins),
                key="clean_win_rate"
            ))

    # Knappe Spiele (2:3 Niederlagen)
    close_losses = [g for g in losses if g["my_legs"] == 2 and g["opp_legs"] == 3]
    if len(close_losses) >= 3:
        results.append(make_insight(
            pid, name, "spielweise",
            f"{name} hat {{value}} knappe 2:3-Niederlagen – Pechvogel oder Nervensache?",
            len(close_losses),
            key="close_losses_23"
        ))

    # 3:0 Niederlagen
    clean_losses = [g for g in losses if g["my_legs"] == 0]
    if len(losses) >= 5:
        pct = round(len(clean_losses) / len(losses) * 100)
        if len(clean_losses) >= 3:
            results.append(make_insight(
                pid, name, "spielweise",
                f"{name} wurde {{value}} Mal 0:3 besiegt ({{value2}}% seiner Niederlagen).",
                len(clean_losses), value2=pct,
                key="clean_loss_count"
            ))

    return results


def insights_saisonuebergreifend(pid, name, pg):
    """Saisonübergreifend: Saisonvergleich, bester Spieltag."""
    results = []

    # Saisonvergleich
    seasons = defaultdict(list)
    for g in pg:
        seasons[g["season"]].append(g)

    season_stats = {}
    for s, gs in seasons.items():
        if len(gs) < 5:
            continue
        wr = sum(1 for g in gs if g["won"]) / len(gs) * 100
        avg = sum(g["my_avg"] for g in gs) / len(gs)
        season_stats[s] = {"wr": round(wr), "avg": round(avg, 1), "games": len(gs)}

    if len(season_stats) >= 2:
        best_season = max(season_stats.items(), key=lambda x: x[1]["wr"])
        results.append(make_insight(
            pid, name, "saison",
            f"Beste Saison von {name}: {{value}} mit {{value2}}% Win-Rate.",
            best_season[0], value2=best_season[1]["wr"],
            key="best_season_wr"
        ))

    # Bester Spieltag (mind. 3 verschiedene)
    matchday_stats = defaultdict(lambda: {"wins": 0, "total": 0})
    for g in pg:
        md = g["matchday"]
        matchday_stats[md]["total"] += 1
        if g["won"]:
            matchday_stats[md]["wins"] += 1

    valid_mds = {md: s for md, s in matchday_stats.items() if s["total"] >= 3}
    if len(valid_mds) >= 3:
        best_md = max(valid_mds.items(), key=lambda x: x[1]["wins"] / x[1]["total"])
        wr = round(best_md[1]["wins"] / best_md[1]["total"] * 100)
        if wr >= 60:
            results.append(make_insight(
                pid, name, "saison",
                f"Spieltag {{value}} ist der Glücksspieltag von {name}: {{value2}}% Win-Rate.",
                best_md[0], value2=wr,
                key="best_matchday"
            ))

    return results


def insights_fun(pid, name, pg):
    """Fun/Kuriositäten: Perfekte/schwarze Abende."""
    results = []

    # Gruppiere nach Datum
    by_date = defaultdict(list)
    for g in pg:
        by_date[g["game_date"]].append(g)

    perfect_evenings = 0
    black_evenings = 0

    for dt, gs in by_date.items():
        if len(gs) < 2:
            continue
        if all(g["won"] for g in gs):
            perfect_evenings += 1
        if all(not g["won"] for g in gs):
            black_evenings += 1

    if perfect_evenings >= 1:
        results.append(make_insight(
            pid, name, "fun",
            f"{name} hatte {{value}} perfekte Abende (alle Spiele gewonnen).",
            perfect_evenings,
            key="perfect_evenings"
        ))

    if black_evenings >= 2:
        results.append(make_insight(
            pid, name, "fun",
            f"{name} hatte {{value}} schwarze Abende (kein einziger Sieg).",
            black_evenings,
            key="black_evenings"
        ))

    # Erstes Spiel = schlechtestes Spiel des Abends?
    first_worst = 0
    total_multi_evenings = 0
    for dt, gs in by_date.items():
        if len(gs) < 2:
            continue
        total_multi_evenings += 1
        gs_sorted = sorted(gs, key=lambda g: g["game_time"])
        worst_avg = min(g["my_avg"] for g in gs)
        if gs_sorted[0]["my_avg"] == worst_avg:
            first_worst += 1

    if total_multi_evenings >= 5:
        pct = round(first_worst / total_multi_evenings * 100)
        if pct >= 55:
            results.append(make_insight(
                pid, name, "fun",
                f"Bei {name} ist das erste Spiel in {{value}}% der Abende das schwächste.",
                pct,
                key="first_game_worst"
            ))

    return results


# ─── Insight Builder & ID Management ──────────────────────────────────────────

_insight_counter = 0


def make_insight(pid, name, category, text, value, value2=None, key=""):
    """Erzeugt ein Insight-Dict. Key wird für ID-Stabilität verwendet."""
    global _insight_counter
    _insight_counter += 1
    result = {
        "player_id": pid,
        "player": name,
        "category": category,
        "text": text,
        "value": value,
        "key": f"{pid}_{key}",  # Für spätere ID-Zuweisung
        "generated_at": TODAY,
        "updated_at": TODAY,
    }
    if value2 is not None:
        result["value2"] = value2
    return result


def merge_with_existing(new_insights, existing_data):
    """
    Merge neue Insights mit bestehenden:
    - Bestehende Keys behalten ihre insight_id, value wird aktualisiert
    - Neue Keys bekommen neue fortlaufende IDs
    """
    existing_insights = existing_data.get("insights", [])

    # Baue Lookup: key -> existing insight
    existing_by_key = {}
    max_id = 0
    for ins in existing_insights:
        existing_by_key[ins["key"]] = ins
        num = int(ins["insight_id"].replace("INS_", ""))
        max_id = max(max_id, num)

    merged = []
    next_id = max_id + 1

    for ins in new_insights:
        key = ins["key"]
        if key in existing_by_key:
            # Update bestehenden Insight
            old = existing_by_key[key]
            old_value = old.get("value")
            ins["insight_id"] = old["insight_id"]
            ins["generated_at"] = old["generated_at"]
            ins["value_prev"] = old_value
            if ins["value"] != old_value:
                ins["updated_at"] = TODAY
            else:
                ins["updated_at"] = old.get("updated_at", TODAY)
        else:
            # Neuer Insight
            ins["insight_id"] = f"INS_{next_id:03d}"
            ins["value_prev"] = None
            next_id += 1

        merged.append(ins)

    return merged


def resolve_text(insight):
    """Ersetzt {value} und {value2} Platzhalter im Text."""
    text = insight["text"]
    text = text.replace("{value}", str(insight["value"]))
    if "value2" in insight:
        text = text.replace("{value2}", str(insight["value2"]))
    return text


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    games = load_json(GAMES_PATH)
    players = load_json(PLAYERS_PATH)

    # Lade bestehende Insights falls vorhanden
    existing_data = {}
    if INSIGHTS_PATH.exists():
        existing_data = load_json(INSIGHTS_PATH)

    # Generiere alle Insights
    new_insights = generate_all_insights(games, players)
    print(f"  Generiert: {len(new_insights)} Insights")

    # Merge mit bestehenden (ID-Stabilität)
    merged = merge_with_existing(new_insights, existing_data)

    # Sortiere nach player_id, dann category
    merged.sort(key=lambda x: (x["player_id"], x["category"], x["key"]))

    # Speichere
    output = {
        "generated_at": TODAY,
        "total": len(merged),
        "insights": merged
    }
    save_json(INSIGHTS_PATH, output)

    # Summary pro Spieler
    by_player = defaultdict(int)
    for ins in merged:
        by_player[ins["player"]] += 1

    print(f"\n  Insights Summary:")
    for name, count in sorted(by_player.items()):
        print(f"     {name}: {count} Insights")

    # Preview: zeige ein paar Beispiele
    print(f"\n  Beispiele:")
    shown = set()
    for ins in merged[:30]:
        cat = ins["category"]
        if cat not in shown and len(shown) < 5:
            shown.add(cat)
            print(f"     [{cat}] {resolve_text(ins)}")

    print(f"\n  {len(merged)} Insights gespeichert in {INSIGHTS_PATH.name}")


if __name__ == "__main__":
    main()
