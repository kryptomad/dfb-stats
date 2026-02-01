-- scripts/migrations/001_create_players.sql
-- NUR die festen Stammspieler – KEIN Zugriff auf games_raw!
-- Läuft immer, egal wann

PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS players (
    player_id    INTEGER PRIMARY KEY,
    name         TEXT    NOT NULL COLLATE NOCASE,
    nickname     TEXT,
    image        TEXT,
    location     TEXT,
    roles        TEXT,
    memberSince  INTEGER,
    leftAt       INTEGER,
    isFounder    INTEGER DEFAULT 0,
    isActive     INTEGER DEFAULT 1,
    color        TEXT,
    comment      TEXT,
    first_seen   DATE,
    last_seen    DATE
);

-- Deine 8 Stammspieler – upsert (kann immer wieder laufen)
INSERT OR REPLACE INTO players (player_id, name, nickname, image, location, roles, memberSince, leftAt, isFounder, isActive, color, comment) VALUES
    (1, 'Uwe',         NULL, 'uwe.png',        'uwe-location.png',            NULL,         1993, NULL, 1, 1, '#3498db', NULL),
    (2, 'Frank',       NULL, 'frank.png',      'frank-location.png', NULL,    1993, NULL, 1, 1, '#1abc9c', NULL),
    (3, 'Rainer',      NULL, 'rainer.png',     'rainer-location.png',            NULL,         1995, 2016, 0, 0, '#2ecc71', NULL),
    (4, 'Franz-Josef', NULL, 'franz.png',      'franz-location.png', NULL,    1993, NULL, 1, 1, '#e67e22', NULL),
    (5, 'Udo',         NULL, 'udo.png',        'udo-location.png',            NULL,         1995, 2004, 0, 0, '#f1c40f', NULL),
    (6, 'Heiner',      'TC', 'heiner.png',     'heiner-location.png','Kassenwart',1996,NULL,0,1,'#9b59b6',NULL),
    (7, 'Nico',        NULL, 'nico.png',       'nico-location.png',            NULL,         2006, 2017, 0, 0, '#e74c3c', NULL),
    (8, 'Martin',      'mad','martin.png',     'martin-location.png','Statistikwart',2007,NULL,0,1,'#e91e63',NULL);

PRAGMA foreign_keys = ON;