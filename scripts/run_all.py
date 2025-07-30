import subprocess
import time
import sqlite3
from pathlib import Path

# === Konfiguration ===
BASE_DIR        = Path(__file__).parent
REPO_ROOT       = BASE_DIR.parent
DB_PATH         = REPO_ROOT / 'db' / 'dfb_stats.db'
MIGRATIONS_DIR  = BASE_DIR / 'migrations'
EXPORT_SCRIPTS  = [
    ('export/export_1_games.py',    'Exportiere Games'),
    ('export/export_2_legs.py',     'Exportiere Legs'),
    ('export/export_3_stats.py',    'Exportiere Stats'),
    ('export/export_4_players.py',  'Exportiere Players'),
]
OUTPUT_SCRIPTS  = [
    ('output/output_1_stats_last_matchday.py', 'Generiere Best Records (Last 10 Games/Matchday)'),
    ('output/output_2_best_records_alltime.py','Generiere Best Records (alltime)'),
]

def log(msg: str):
    print(f"\n🛠️  {msg}")
    time.sleep(0.2)

def run_script(path: Path, description: str):
    log(description)
    subprocess.run(["python", str(path)], check=True)

def apply_migrations(db_path: Path, migrations_dir: Path):
    log("Wende SQL-Migrationen an")
    sql_files = sorted(migrations_dir.glob('*.sql'))
    conn = sqlite3.connect(db_path)
    try:
        for sql_file in sql_files:
            log(f"  – {sql_file.name}")
            conn.executescript(sql_file.read_text(encoding='utf-8'))
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    # 0) DB Preparations: CSV-Import & Stat-Berechnungen
    db_scripts = [
        "db_0_import_csv.py",
        "db_1_prepare_data.py",
        "db_2_assign_season_and_matchday.py",
        "db_3_stats_basics.py",
        "db_4_stats_scoring.py",
        "db_5_stats_darts.py",
        "db_6_stats_keepbreak.py",
        "db_7_stats_averages.py",
    ]
    for idx, script_name in enumerate(db_scripts):
        run_script(REPO_ROOT / 'scripts' / 'db' / script_name,
                   f"Step {idx}: db/{script_name}")

    # 1) SQL-Migrationen anwenden
    apply_migrations(DB_PATH, MIGRATIONS_DIR)

    # 2) JSON-Exports
    for script, desc in EXPORT_SCRIPTS:
        run_script(REPO_ROOT / 'scripts' / script, desc)

    # 3) Ausgabe-Generierung
    for script, desc in OUTPUT_SCRIPTS:
        run_script(REPO_ROOT / 'scripts' / script, desc)

    log("✅ Alles erledigt!")
