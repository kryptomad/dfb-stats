-- Spalten existieren bereits, daher nur die Updates

UPDATE players
SET nationality = 'DE',
    image = 'frank.png',
    memberSince = 1993,
    isFounder = 1
WHERE player_id = 1;

UPDATE players
SET nationality = 'DE',
    image = 'franz.png',
    memberSince = 1993,
    isFounder = 1
WHERE player_id = 2;

UPDATE players
SET nationality = 'DE',
    nickname = 'TC',
    image = 'heiner.png',
    memberSince = 1996,
    isFounder = 0
WHERE player_id = 3;

UPDATE players
SET nationality = 'DE',
    nickname = 'mad',
    image = 'martin.png',
    memberSince = 2018,
    isFounder = 0
WHERE player_id = 4;

UPDATE players
SET nationality = 'DE',
    image = 'uwe.png',
    memberSince = 1993,
    isFounder = 1
WHERE player_id = 5;