import { Injectable } from '@angular/core';
import games from '../../assets/games.json';

@Injectable({
  providedIn: 'root'
})
export class GamesService {
  getAllGames() {
    return games;
  }

  getLastNSpieltage(n: number) {
    // Sortieren nach Saison (String) und Spieltag (Number), passe Feldnamen ggf. an!
    return games
      .sort((a, b) => {
        if (a.season !== b.season) {
          return b.season.localeCompare(a.season);
        }
        return b.matchday - a.matchday;
      })
      .slice(0, n);
  }

  getGameById(gameId: number) {
    return games.find(g => +g.game_id === +gameId);
  }

  // Hier können später weitere Filter/Hilfsfunktionen rein
}
