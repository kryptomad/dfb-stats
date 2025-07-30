-- Spalten existieren bereits, daher nur die Updates
UPDATE players
  SET nationality = 'DE'
  WHERE player_id = 1;

UPDATE players
  SET nationality = 'DE'
  WHERE player_id = 2;

UPDATE players
  SET nationality = 'DE', nickname = 'TC'
  WHERE player_id = 3;

UPDATE players
  SET nationality = 'DE', nickname = 'mad'
  WHERE player_id = 4;

UPDATE players
  SET nationality = 'DE'
  WHERE player_id = 5;
