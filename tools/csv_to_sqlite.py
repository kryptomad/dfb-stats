# -*- coding: utf-8 -*-

from db_utils import init_db, add_missing_columns

import sqlite3
import os
import csv
from datetime import datetime

DB_PATH = '../db/dfb_stats.db'
CSV_DIR = '../data/csv'

conn = sqlite3.connect(DB_PATH)
init_db(conn)
add_missing_columns(conn)

def parse_csv(file_path):
    with open(file_path, encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        rows = [row for row in reader if any(cell.strip() for cell in row)]

    header = rows[0]
    player1 = header[1].strip()
    player2 = header[3].strip()
    filename = os.path.basename(file_path)

    # Parse date and time from filename
    try:
        date_str = filename.split('_')[1]  # e.g. 20240719
        time_str = filename.split('_')[2].split('.')[0]  # e.g. 231042
        dt = datetime.strptime(date_str + time_str, '%Y%m%d%H%M%S')
        game_date = dt.strftime('%Y-%m-%d')
        game_time = dt.strftime('%H:%M:%S')
    except Exception:
        game_date = '1970-01-01'
        game_time = '00:00:00'

    legs_line = next((row for row in rows if len(row) > 1 and "Legs" in row[1]), None)
    legs1 = int(legs_line[2]) if legs_line else 0
    legs2 = int(legs_line[4]) if legs_line else 0

    rounds = []
    pending_starter = None
    leg_number = 0
    for row in rows:
        if not row or len(row) < 5:
            continue

        # Starter-Zeile erkennen (z. B. ['', '*', '501', '', '501'])
        if row[:5] == ['', '*', '501', '', '501']:
            pending_starter = 'p1'
            leg_number += 1

            # 501 nicht als Score, sondern als Left!
            rounds.append((
                leg_number,
                0,
                None,
                501,
                None,
                501,
                'p1'
            ))
            continue

        elif row[:5] == ['', '', '501', '*', '501']:
            pending_starter = 'p2'
            leg_number += 1

            rounds.append((
                leg_number,
                0,
                None,
                501,
                None,
                501,
                'p2'
            ))
            continue


        # Echte Runde erkennen
        round_raw = row[0].strip()
        if not round_raw.isdigit():
            continue
        round_num = int(round_raw)

        def safe(idx):
            return row[idx].strip() if len(row) > idx and row[idx].strip() != "" else None

        try:
            p1_score = safe(1)
            p1_left = safe(2)
            p2_score = safe(3)
            p2_left = safe(4)

            # Prüfe und korrigiere 501-Zuordnung
            if p1_score == '501':
                p1_score, p1_left = None, '501'
            if p2_score == '501':
                p2_score, p2_left = None, '501'

#            print(f"DEBUG: p1_score={p1_score}, p1_left={p1_left}, p2_score={p2_score}, p2_left={p2_left}")


            rounds.append((
                leg_number,
                round_num,
                int(p1_score) if p1_score is not None else None,
                int(p1_left) if p1_left is not None else None,
                int(p2_score) if p2_score is not None else None,
                int(p2_left) if p2_left is not None else None,
                None  # starter nur bei round == 0 erlaubt
            ))

            pending_starter = None  # nach erstem Round verbraucht

        except ValueError:
            continue

#    print("\n=== Parsed Rounds ===")
#    for r in rounds:
#        print(r)        

    return {
        'game_date': game_date,
        'game_time': game_time,
        'player1': player1,
        'player2': player2,
        'legs1': legs1,
        'legs2': legs2,
        'filename': filename,
        'rounds': rounds
    }


def import_csvs(conn):
    c = conn.cursor()
    for file in os.listdir(CSV_DIR):
        if file.endswith('.csv'):
            path = os.path.join(CSV_DIR, file)
            data = parse_csv(path)
            try:
                c.execute('INSERT INTO games (game_date, game_time, player1, player2, legs1, legs2, filename) VALUES (?, ?, ?, ?, ?, ?, ?)',
                          (data['game_date'], data['game_time'], data['player1'], data['player2'], data['legs1'], data['legs2'], data['filename']))
                game_id = c.lastrowid
                for r in data['rounds']:
                    c.execute('INSERT INTO legs (game_id, leg_number, round, p1_score, p1_left, p2_score, p2_left, starter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', (game_id, *r))
                print(f'[OK] Importiert: {file}')  # <--- hier hinzufügen
            except sqlite3.IntegrityError:
                print(f'[SKIP] Uebersprungen (bereits vorhanden): {file}')
    conn.commit()

if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    import_csvs(conn)
    conn.close()


