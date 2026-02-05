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
      tap((data) => (this.enrichedStats = Array.isArray(data) ? data : [])),
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

  // ====================================================================
  // AGGREGATIONS-METHODEN FÜR SPIELTAG / SAISON / ALLTIME
  // ====================================================================

  /**
   * Hilfsmethode: Gruppiert Stats nach einem oder mehreren Keys
   * @param stats Array von Stats
   * @param keyFn Funktion die den Gruppen-Key zurückgibt
   * @returns Map mit Key -> Stats[]
   */
  private groupBy(stats: any[], keyFn: (s: any) => string): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    stats.forEach((stat) => {
      const key = keyFn(stat);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(stat);
    });
    return groups;
  }

  /**
   * Berechnet gewichteten 3-Dart-Average über mehrere Stats
   */
  private getWeighted3DAvg(stats: any[]): number {
    const totalPoints = stats.reduce(
      (sum, s) => sum + (s.avg_3dart * s.darts_thrown) / 3,
      0,
    );
    const totalDarts = stats.reduce((sum, s) => sum + s.darts_thrown, 0);
    return totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;
  }

  /**
   * Berechnet durchschnittlichen First 9 Average über mehrere Stats
   */
  private getAvgFirst9(stats: any[]): number {
    const validStats = stats.filter(
      (s) => s.avg_first9 !== undefined && s.avg_first9 > 0,
    );
    if (validStats.length === 0) return 0;
    const sum = validStats.reduce((acc, s) => acc + s.avg_first9, 0);
    return sum / validStats.length;
  }

  /**
   * Summiert einen Score-Wert (z.B. score_100, score_140, score_180)
   */
  private sumScore(stats: any[], field: string): number {
    return stats.reduce((sum, s) => sum + (s[field] ?? 0), 0);
  }

  /**
   * Findet alle Gruppen mit dem besten aggregierten Wert
   */
  private getBestAggregatedGroups(
    groups: Map<string, any[]>,
    aggregateFn: (stats: any[]) => number,
    comparator: 'min' | 'max',
  ): any[] {
    if (groups.size === 0) return [];

    // Berechne Wert für jede Gruppe
    const groupValues = Array.from(groups.entries()).map(([key, stats]) => ({
      key,
      stats,
      value: aggregateFn(stats),
    }));

    // Finde besten Wert
    const bestValue =
      comparator === 'min'
        ? Math.min(...groupValues.map((g) => g.value))
        : Math.max(...groupValues.map((g) => g.value));

    // Filtere Gruppen mit bestem Wert
    const bestGroups = groupValues.filter((g) => g.value === bestValue);

    // Erstelle Ergebnis-Objekte mit Spielernamen
    return bestGroups.map((g) => {
      const firstStat = g.stats[0];
      return {
        ...firstStat,
        aggregatedValue: g.value,
        groupKey: g.key,
      };
    });
  }

  // ====================================================================
  // SPIELTAG-AGGREGATIONEN (pro Spieler pro Spieltag)
  // ====================================================================

  getBest3DAMatchday(): any[] {
    if (!this.enrichedStats.length) return [];
    // Gruppiere nach (player_id, season, matchday)
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}_${s.matchday}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.getWeighted3DAvg(stats),
      'max',
    );
    return result.map((r) => ({ ...r, avg_3dart: r.aggregatedValue }));
  }

  getBestFirst9Matchday(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}_${s.matchday}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.getAvgFirst9(stats),
      'max',
    );
    return result.map((r) => ({ ...r, avg_first9: r.aggregatedValue }));
  }

  getMostTONsMatchday(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}_${s.matchday}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_100'),
      'max',
    );
    return result.map((r) => ({ ...r, score_100: r.aggregatedValue }));
  }

  getMost140sMatchday(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}_${s.matchday}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_140'),
      'max',
    );
    return result.map((r) => ({ ...r, score_140: r.aggregatedValue }));
  }

  getMost180sMatchday(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}_${s.matchday}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_180'),
      'max',
    );
    return result.map((r) => ({ ...r, score_180: r.aggregatedValue }));
  }

  // ====================================================================
  // SAISON-AGGREGATIONEN (pro Spieler pro Saison)
  // ====================================================================

  getBest3DASeason(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.getWeighted3DAvg(stats),
      'max',
    );
    return result.map((r) => ({ ...r, avg_3dart: r.aggregatedValue }));
  }

  getBestFirst9Season(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.getAvgFirst9(stats),
      'max',
    );
    return result.map((r) => ({ ...r, avg_first9: r.aggregatedValue }));
  }

  getMostTONsSeason(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_100'),
      'max',
    );
    return result.map((r) => ({ ...r, score_100: r.aggregatedValue }));
  }

  getMost140sSeason(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_140'),
      'max',
    );
    return result.map((r) => ({ ...r, score_140: r.aggregatedValue }));
  }

  getMost180sSeason(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(
      this.enrichedStats,
      (s) => `${s.player_id}_${s.season}`,
    );
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_180'),
      'max',
    );
    return result.map((r) => ({ ...r, score_180: r.aggregatedValue }));
  }

  // ====================================================================
  // ALLTIME-AGGREGATIONEN (pro Spieler über alle Zeit)
  // ====================================================================

  getBest3DAAlltime(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(this.enrichedStats, (s) => `${s.player_id}`);
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.getWeighted3DAvg(stats),
      'max',
    );
    return result.map((r) => ({ ...r, avg_3dart: r.aggregatedValue }));
  }

  getBestFirst9Alltime(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(this.enrichedStats, (s) => `${s.player_id}`);
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.getAvgFirst9(stats),
      'max',
    );
    return result.map((r) => ({ ...r, avg_first9: r.aggregatedValue }));
  }

  getMostTONsAlltime(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(this.enrichedStats, (s) => `${s.player_id}`);
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_100'),
      'max',
    );
    return result.map((r) => ({ ...r, score_100: r.aggregatedValue }));
  }

  getMost140sAlltime(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(this.enrichedStats, (s) => `${s.player_id}`);
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_140'),
      'max',
    );
    return result.map((r) => ({ ...r, score_140: r.aggregatedValue }));
  }

  getMost180sAlltime(): any[] {
    if (!this.enrichedStats.length) return [];
    const groups = this.groupBy(this.enrichedStats, (s) => `${s.player_id}`);
    const result = this.getBestAggregatedGroups(
      groups,
      (stats) => this.sumScore(stats, 'score_180'),
      'max',
    );
    return result.map((r) => ({ ...r, score_180: r.aggregatedValue }));
  }
}