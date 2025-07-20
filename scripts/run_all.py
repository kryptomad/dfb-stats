import subprocess
import time

# Hilfsfunktion fürs Logging
def log(msg):
    print(f"\n🛠️  {msg}")
    time.sleep(0.3)  # leichte Verzögerung für besseres Terminal-Feedback

# DB: Import & Berechnungen
log("Step 1: Importiere CSV in SQLite")
subprocess.run(["python", "db/db_1_import_csv.py"])

log("Step 2: Weise Seasons & Matchdays zu")
subprocess.run(["python", "db/db_2_assign_season_and_matchday.py"])

log("Step 3: Berechne Statistiken")
subprocess.run(["python", "db/db_3_calculate_stats.py"])

# JSON-Export
log("Step 4: Exportiere Spieltage")
subprocess.run(["python", "export/export_1_spieltage.py"])

log("Step 5: Exportiere Spieldetails")
subprocess.run(["python", "export/export_2_spiel_details.py"])

log("Step 6: Exportiere Stats")
subprocess.run(["python", "export/export_3_stats.py"])

# Ausgabe-Generierung
log("Step 7: Generiere Best Records (Last 10 Games)")
subprocess.run(["python", "output/output_1_best_records_last10.py"])

log("Step 8: Generiere Best Records (alltime)")
subprocess.run(["python", "output/output_2_best_records_alltime.py"])

log("\n✅ Alles erledigt!")
