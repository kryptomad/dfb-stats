import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PlayersService } from './players.service';

@Injectable({ providedIn: 'root' })
export class StatsService {
  enrichedStats: any[] = [];

  constructor(
    private playersService: PlayersService,
    private http: HttpClient,
  ) {}

  loadEnrichedStats(): Observable<any> {
    return this.http.get<any[]>('../../assets/stats.json').pipe(
      map((stats) =>
        stats.map((stat) => ({
          ...stat,
          playerName:
            this.playersService.getPlayer(stat.player_id)?.name ??
            `ID ${stat.player_id}`,
        })),
      ),
      tap((data) => (this.enrichedStats = data)),
    );
  }

  getAllWithBestValue(
    field: string,
    comparator: 'min' | 'max',
    filterFn?: (s: any) => boolean,
  ) {
    if (!this.enrichedStats.length) return [];
    let filtered = this.enrichedStats.filter(
      (s) => s[field] !== undefined && s[field] !== null && s[field] > 0,
    );
    if (filterFn) filtered = filtered.filter(filterFn);
    if (!filtered.length) return [];
    const bestValue =
      comparator === 'min'
        ? Math.min(...filtered.map((s) => s[field]))
        : Math.max(...filtered.map((s) => s[field]));
    const bestStats = filtered.filter((s) => s[field] === bestValue);
    // Einmal pro Spieler!
    const uniquePlayers = new Map();
    bestStats.forEach((stat) => {
      if (!uniquePlayers.has(stat.player_id)) {
        uniquePlayers.set(stat.player_id, stat);
      }
    });
    return Array.from(uniquePlayers.values());
  }

  // --- Wrapper für alle gewünschten Kategorien ---

  // Best Leg (nur gewonnene Spiele)
  getBestLegMatch() {
    return this.getAllWithBestValue('best_leg', 'min', (s) => s.legs_won > 0);
  }
  // Highest Checkout (alle)
  getHighestCheckoutMatch() {
    return this.getAllWithBestValue('high_finish', 'max');
  }
  // Most TONs (score_100, alle)
  getMostTONsMatch() {
    return this.getAllWithBestValue('score_100', 'max');
  }
  // Most 140s (alle)
  getMost140sMatch() {
    return this.getAllWithBestValue('score_140', 'max');
  }
  // Most 180s (alle)
  getMost180sMatch() {
    return this.getAllWithBestValue('score_180', 'max');
  }
  // Best 3 Dart Average (nur Sieger, legs_won == 3)
  getBest3DAMatch() {
    return this.getAllWithBestValue(
      'avg_3dart',
      'max',
      (s) => s.legs_won === 3,
    );
  }
  // Best First 9 Average (alle)
  getBestFirst9Match() {
    return this.getAllWithBestValue('avg_first9', 'max');
  }

  getFormkurveData(): any {
    if (!this.enrichedStats.length) return { labels: [], datasets: [] };

    // Alle Seasons, aufsteigend sortiert
    const seasons = Array.from(
      new Set(this.enrichedStats.map((s) => s.season)),
    ).sort();

    // Alle Spieler (Namen, um Farben/Legende schöner zu haben)
    const playerNames = Array.from(
      new Set(this.enrichedStats.map((s) => s.playerName)),
    );

    const datasets = playerNames.map((player) => {
      return {
        label: player,
        data: seasons.map((season) =>
          this.enrichedStats
            .filter((s) => s.season === season && s.playerName === player)
            .reduce((sum, s) => sum + (s.legs_won || 0), 0),
        ),
        fill: false, // Nur Linie, keine Fläche
        tension: 0.2, // Etwas smooth
      };
    });

    return {
      labels: seasons.map((s) => s.toString()), // z.B. ['2018', '2019', ...]
      datasets,
    };
  }
  /** NEU: Zugriff auf die aktuell geladenen Stats */
  getAllStats(): any[] {
    return this.enrichedStats || [];
  }
}