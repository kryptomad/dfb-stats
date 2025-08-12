// src/app/services/jahresstats-top-jahreswerte.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StatsQueryService } from './stats-query.service';
import { StatRow } from './stats.service';
import { PlayersService } from './players.service';

export interface TopYearValue {
  playerName: string;
  value: string | number;
}

export interface TopYearStats {
  year: string;
  category: string;
  values: TopYearValue[];
}

@Injectable({ providedIn: 'root' })
export class JahresstatsTopJahreswerteService {
  constructor(private statsQuery: StatsQueryService, private playersService: PlayersService) {}

  getTopYearStats(season: string | number): Observable<TopYearStats[]> {
    const stats = this.statsQuery.getFullStatsBySeason$(season);
    const topYears: TopYearStats[] = [];

    if (season) {
      const seasonStr = season.toString();
      console.log('Berechnete Saison:', seasonStr);
      stats.subscribe((rows: StatRow[]) => {
        console.log('Alle Rows von getFullStatsBySeason$:', rows.map(r => ({ season: r.season, player_id: r.player_id, legs_won: r.legs_won, score_180: r.score_180 })));
        const seasonRows = rows.filter((r: StatRow) => r.season === seasonStr);
        console.log('Gefilterte Rows für Saison:', seasonRows.map(r => ({ season: r.season, player_id: r.player_id, legs_won: r.legs_won, score_180: r.score_180 })));
        if (seasonRows.length === 0) {
          console.warn('Keine Daten für Saison:', seasonStr);
        }
        const playerIds = [...new Set(seasonRows.map(r => r.player_id))];
        const categories = [
          'Anzahl Oskargewinne',
          'Short Games gespielt',
          'Anzahl 180er geworfen',
          'Anzahl 100',
          'Anzahl 140+',
          'Anzahl Highscores (+149)',
          'Anzahl Checks 100+'
        ];

        categories.forEach(category => {
          const values = playerIds.map(playerId => {
            const playerRows = seasonRows.filter((r: StatRow) => r.player_id === playerId);
            let value: number = 0;

            switch (category) {
              case 'Anzahl Oskargewinne':
                value = this.countOscarWins(playerRows, seasonRows);
                console.log(`Player ${playerId} - Oskarsiege: ${value}, Total Legs Won per Matchday:`, playerRows.reduce((sum, r) => sum + (r.legs_won || 0), 0));
                break;
              case 'Short Games gespielt':
                value = this.countShortGames(playerRows);
                break;
              case 'Anzahl 180er geworfen':
                value = this.count180s(playerRows);
                console.log(`Player ${playerId} - 180er Rows:`, playerRows.map(r => ({ score_180: r.score_180 })));
                break;
              case 'Anzahl 100':
                value = this.count100s(playerRows);
                break;
              case 'Anzahl 140+':
                value = this.count140Plus(playerRows);
                break;
              case 'Anzahl Highscores (+149)':
                value = this.countHighscores(playerRows);
                break;
              case 'Anzahl Checks 100+':
                value = this.countChecks100Plus(playerRows);
                break;
            }

            const playerName = this.playersService.getPlayer(playerId)?.name || `Player ${playerId}`;
            return { playerName, value };
          })
          .filter(value => value.value > 0) // Filtere Spieler mit Wert 0 heraus
          .sort((a, b) => (b.value as number) - (a.value as number)); // Sortiere absteigend nach value

          topYears.push({ year: seasonStr, category, values });
        });
      });
    }

    return of(topYears);
  }

  private countOscarWins(playerRows: StatRow[], seasonRows: StatRow[]): number {
    let wins = 0;
    const matchdays = [...new Set(playerRows.map(r => r.matchday))];
    matchdays.forEach(md => {
      const playerTotals = new Map<number, number>();
      seasonRows.filter(r => r.matchday === md).forEach(r => {
        const total = playerTotals.get(r.player_id) || 0;
        playerTotals.set(r.player_id, total + (r.legs_won || 0));
      });

      let maxTotal = -1;
      let matchdayWinnerId = -1;
      playerTotals.forEach((total, playerId) => {
        if (total > maxTotal) {
          maxTotal = total;
          matchdayWinnerId = playerId;
        }
      });

      if (maxTotal > 0 && playerRows[0].player_id === matchdayWinnerId) {
        wins += 1;
      }
    });
    return wins;
  }

  private countShortGames(rows: StatRow[]): number {
    return rows.reduce((sum, r) => {
      if (r.best_leg !== null && r.best_leg >= 9 && r.best_leg <= 21) return sum + 1;
      return sum;
    }, 0);
  }

  private count180s(rows: StatRow[]): number {
    return rows.reduce((sum, r) => sum + (r.score_180 || 0), 0);
  }

  private count100s(rows: StatRow[]): number {
    return rows.reduce((sum, r) => sum + (r.score_100 || 0), 0);
  }

  private count140Plus(rows: StatRow[]): number {
    return rows.reduce((sum, r) => sum + (r.score_140 || 0) + (r.score_140_plus || 0), 0);
  }

  private countHighscores(rows: StatRow[]): number {
    return rows.filter(r => r.high_score > 149).length;
  }

  private countChecks100Plus(rows: StatRow[]): number {
    return rows.filter(r => r.high_finish >= 100).length;
  }
}