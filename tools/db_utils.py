# db_utils.py
import sqlite3

def init_db(conn):
    c = conn.cursor()
    
    # Create table games
    c.execute("""
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            season TEXT,
            matchday INTEGER,
            game_date TEXT,
            game_time TEXT,
            p1_avg_3dart REAL,
            player1 TEXT,
            legs1 INTEGER,
            legs2 INTEGER,
            player2 TEXT,
            p2_avg_3dart REAL,
            filename TEXT UNIQUE
        )
    """)
    
    # Create table legs
    c.execute("""
        CREATE TABLE IF NOT EXISTS legs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER,
            leg_number INTEGER,
            p1_score INTEGER,
            p1_left INTEGER,
            round INTEGER,
            p2_score INTEGER,
            p2_left INTEGER,
            p1_darts_leg INTEGER,
            p2_darts_leg INTEGER,
            p1_avg_leg REAL,
            p2_avg_leg REAL,
            leg_winner INTEGER,
            starter TEXT,
            FOREIGN KEY(game_id) REFERENCES games(id)
        )
    """)

    # Create table stats mit neuen Spalten & neuen Bezeichnungen
    c.execute('''
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER,
            player TEXT,
            sets_won INTEGER,
            legs_played INTEGER,
            legs_won INTEGER,
            legs_lost INTEGER,
            darts_thrown INTEGER,
            avg_darts REAL,
            avg_3dart REAL,
            avg_first9 REAL,
            best_leg INTEGER,
            worst_leg INTEGER,
            high_finish INTEGER,
            high_score INTEGER,
            score_100 INTEGER,
            score_100_plus INTEGER,
            score_140 INTEGER,
            score_140_plus INTEGER,
            score_180 INTEGER,
            keep_pct REAL,
            keep_ratio TEXT,
            break_pct REAL,
            break_ratio TEXT,
            FOREIGN KEY(game_id) REFERENCES games(id)
        )
    ''')

    conn.commit()

def add_missing_columns(conn):
    c = conn.cursor()
    c.execute("PRAGMA table_info(legs)")
    columns = [row[1] for row in c.fetchall()]
    
    if "p1_darts_leg" not in columns:
        c.execute("ALTER TABLE legs ADD COLUMN p1_darts_leg INTEGER")
    if "p2_darts_leg" not in columns:
        c.execute("ALTER TABLE legs ADD COLUMN p2_darts_leg INTEGER")
    if "leg_number" not in columns:
        c.execute("ALTER TABLE legs ADD COLUMN leg_number INTEGER")
    if "starter" not in columns:
        c.execute("ALTER TABLE legs ADD COLUMN starter TEXT")
        
    conn.commit()
