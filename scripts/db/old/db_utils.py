import sqlite3

def init_db(conn):
    c = conn.cursor()
    
    # Create table players
    c.execute("""
        CREATE TABLE IF NOT EXISTS players (
            player_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
    """)
    
    # Create table games
    c.execute("""
        CREATE TABLE IF NOT EXISTS games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER,
            season TEXT,
            matchday INTEGER,
            game_date TEXT,
            game_time TEXT,
            p1_avg_3dart_match REAL,
            player1_id INTEGER,
            player1 TEXT,
            p1_legs_won INTEGER,
            p2_legs_won INTEGER,
            player2 TEXT,
            player2_id INTEGER,
            p2_avg_3dart_match REAL,
            filename TEXT UNIQUE
        )
    """)
    
    # Create table legs
    c.execute("""
        CREATE TABLE IF NOT EXISTS legs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER,
            season TEXT,
            matchday INTEGER,
            leg_number INTEGER,
            p1_score INTEGER,
            p1_left INTEGER,
            round INTEGER,
            p2_score INTEGER,
            p2_left INTEGER,
            p1_darts_leg INTEGER,
            p2_darts_leg INTEGER,
            p1_avg_3dart_leg REAL,
            p2_avg_3dart_leg REAL,
            leg_winner_id INTEGER,
            starter TEXT,
            starter_id INTEGER,
            FOREIGN KEY(game_id) REFERENCES games(id)
        )
    """)

    # Create table stats
    c.execute('''
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id INTEGER,
            season TEXT,
            matchday INTEGER,
            player_id INTEGER,
            player1_id INTEGER,
            player2_id INTEGER,
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

    # --- Legs ---
    c.execute("PRAGMA table_info(legs)")
    leg_columns = [row[1] for row in c.fetchall()]
    
    for col, typ in [
        ("p1_darts_leg", "INTEGER"),
        ("p2_darts_leg", "INTEGER"),
        ("leg_number", "INTEGER"),
        ("starter", "TEXT"),
        ("starter_id", "INTEGER"),
        ("p1_avg_3dart_leg", "REAL"),
        ("p2_avg_3dart_leg", "REAL"),
        ("leg_winner_id", "INTEGER"),
        ("season", "TEXT"),
        ("matchday", "INTEGER"),
    ]:
        if col not in leg_columns:
            c.execute(f"ALTER TABLE legs ADD COLUMN {col} {typ}")

    # --- Stats ---
    c.execute("PRAGMA table_info(stats)")
    stats_columns = [row[1] for row in c.fetchall()]
    
    for col, typ in [
        ("season", "TEXT"),
        ("matchday", "INTEGER"),
        ("player_id", "INTEGER"),
        ("player1_id", "INTEGER"),
        ("player2_id", "INTEGER"),
        ("sets_won", "INTEGER"),
        ("legs_played", "INTEGER"),
        ("legs_won", "INTEGER"),
        ("legs_lost", "INTEGER"),
        ("darts_thrown", "INTEGER"),
        ("avg_darts", "REAL"),
        ("avg_3dart", "REAL"),
        ("avg_first9", "REAL"),
        ("best_leg", "INTEGER"),
        ("worst_leg", "INTEGER"),
        ("high_finish", "INTEGER"),
        ("high_score", "INTEGER"),
        ("score_100", "INTEGER"),
        ("score_100_plus", "INTEGER"),
        ("score_140", "INTEGER"),
        ("score_140_plus", "INTEGER"),
        ("score_180", "INTEGER"),
        ("keep_pct", "REAL"),
        ("keep_ratio", "TEXT"),
        ("break_pct", "REAL"),
        ("break_ratio", "TEXT"),
    ]:
        if col not in stats_columns:
            c.execute(f"ALTER TABLE stats ADD COLUMN {col} {typ}")

    # --- Games ---
    c.execute("PRAGMA table_info(games)")
    games_columns = [row[1] for row in c.fetchall()]

    for col, typ in [
        ("season", "TEXT"),
        ("matchday", "INTEGER"),
        ("player1_id", "INTEGER"),
        ("player2_id", "INTEGER"),
        ("p1_legs_won", "INTEGER"),
        ("p2_legs_won", "INTEGER")
    ]:
        if col not in games_columns:
            c.execute(f"ALTER TABLE games ADD COLUMN {col} {typ}")

    conn.commit()
