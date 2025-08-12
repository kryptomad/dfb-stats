import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { PlayersService } from './players.service';
import * as SeasonMatchday from '../shared/season-matchday.helpers';

export interface StatRow {
  game_id: number;
  season: string;
  matchday: number;
  player_id: number;
  player1_id: number;
  player2_id: number;
  sets_won: number;
  legs_played: number;
  legs_won: number;
  legs_lost: number;
  darts_thrown: number;
  avg_darts: number;
  avg_3dart: number;
  avg_first9: number;
  best_leg: number | null;
  worst_leg: number | null;
  high_finish: number;
  high_score: number;
  score_100: number;
  score_100_plus: number;
  score_140: number;
  score_140_plus: number;
  score_180: number;
  keep_pct: number;
  keep_ratio: string;
  break_pct: number;
  break_ratio: string;
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  enrichedStats: any[] = [];

  private readonly statsUrl = 'assets/stats.json';

  private _allStats: any[] = [];

  getStatsRaw(): Observable<any[]> {
    return this.http.get<any[]>(this.statsUrl).pipe(shareReplay(1));
  }

  constructor(
    private playersService: PlayersService,
    private http: HttpClient,
  ) {}

  getStatsNorm$() {
    return this.getStatsRaw().pipe(
      map((rows) =>
        rows.map(
          (r: any) =>
            ({
              season: r.season,
              matchday: Number(r.matchday ?? r.match_day ?? r.spieltag ?? 0),
              player_id: Number(r.player_id),
              legs_won: Number(r.legs_won ?? 0),
            }) as StatRow,
        ),
      ),
      shareReplay(1),
    );
  }

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
      tap((data) => (this._allStats = Array.isArray(data) ? data : [])),
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

  /** NEU: Zugriff auf die aktuell geladenen Stats - gehört zur TIMELINE? */
  getAllStats(): any[] {
    return this.enrichedStats || [];
  }
}