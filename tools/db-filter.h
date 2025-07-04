SELECT * FROM legs WHERE game_id = 2


---


SELECT id, game_id, round, p1_score, p2_score
FROM legs
WHERE p1_score IN (-1, -2, -3) OR p2_score IN (-1, -2, -3);


---
#zeigt ein spiel und die stats dazu an!

SELECT * 
FROM stats s
JOIN games g ON s.game_id = g.id
WHERE s.game_id = 34;