import { Injectable } from '@angular/core';
import games from '../../assets/games.json';

@Injectable({
  providedIn: 'root',
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
    return games.find((g) => +g.game_id === +gameId);
  }

  // Jahrestabelle

  getCurrentSeason(): string {
    // Holt die neuste Saison
    const seasons = this.getAllGames().map((spiel) => spiel.season);
    return seasons.sort().reverse()[0];
  }

  getJahrestabelle() {
    const latestSeason = this.getCurrentSeason();
    const punkte: Record<string, number> = {};

    this.getAllGames()
      .filter((spiel) => spiel.season === latestSeason)
      .forEach((spiel) => {
        // Passe Feldnamen an, wie sie bei dir in games.json heißen!
        punkte[spiel.player1] =
          (punkte[spiel.player1] || 0) + (spiel.p1_legs_won || 0);
        punkte[spiel.player2] =
          (punkte[spiel.player2] || 0) + (spiel.p2_legs_won || 0);
      });

    // Sortieren nach Punkten absteigend
    return Object.entries(punkte)
      .sort((a, b) => b[1] - a[1])
      .map(([name, punkte], i) => ({ platz: i + 1, name, punkte }));
  }

  // check ob ein Spieler ein Platz gut gemacht hat oder nicht

  getJahrestabelleBisSpieltag(matchday: number): any[] {
    const latestSeason = this.getCurrentSeason();
    const punkte: Record<string, number> = {};

    this.getAllGames()
      .filter(
        (spiel) => spiel.season === latestSeason && spiel.matchday <= matchday,
      )
      .forEach((spiel) => {
        punkte[spiel.player1] =
          (punkte[spiel.player1] || 0) + (spiel.p1_legs_won || 0);
        punkte[spiel.player2] =
          (punkte[spiel.player2] || 0) + (spiel.p2_legs_won || 0);
      });

    return Object.entries(punkte)
      .sort((a, b) => b[1] - a[1])
      .map(([name, punkte], i) => ({ platz: i + 1, name, punkte }));
  }
}