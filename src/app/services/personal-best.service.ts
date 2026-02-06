// src/app/services/personal-best.service.ts
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatsQueryService } from './stats-query.service';
import { LegsService } from './legs.service';
import { CheckdartsService } from './checkdarts.service';
import { PlayersService } from './players.service';
import { StatRow } from './stats.service';

export interface PersonalBest {
  label: string;
  value: number;
  context: string; // "2024/25, Spieltag 3"
  formatType: 'number' | 'decimal' | 'percentage';
  topRank?: number; // If in Top 3: 1, 2, or 3
}

export type TimePeriod = 'game' | 'matchday' | 'season' | 'all-time';

@Injectable({ providedIn: 'root' })
export class PersonalBestService {
  constructor(
    private statsQuery: StatsQueryService,
    private legsService: LegsService,
    private checkdartsService: CheckdartsService,
    private playersService: PlayersService
  ) {}

  /**
   * Get personal best statistics for a player filtered by time period
   * ALWAYS loads ALL data and finds the BEST result across all time
   */
  getPersonalBests(
    playerId: number,
    timePeriod: TimePeriod,
    season?: string,
    matchday?: number
  ): Observable<PersonalBest[]> {
    // ALWAYS load ALL data to find true bests
    return this.statsQuery.getFullStatsBySeason$('All-Time').pipe(
      map((allStats) => {
        // Filter stats for this player
        const playerStats = allStats.filter((s) => s.player_id === playerId);

        const bests: PersonalBest[] = [];

        // 1. Best 3-Dart Average (NOT for all-time - only game, matchday, season)
        if (timePeriod !== 'all-time') {
          const best3Dart = this.findBest3DartAverage(playerStats, timePeriod);
          if (best3Dart) bests.push(best3Dart);
        }

        // 2. Best First-9 Average (NOT for all-time - only game, matchday, season)
        if (timePeriod !== 'all-time') {
          const bestFirst9 = this.findBestFirst9Average(playerStats, timePeriod);
          if (bestFirst9) bests.push(bestFirst9);
        }

        // 3. Most TONs/100+ (all time periods)
        const most100Plus = this.findMost100Plus(playerStats, timePeriod);
        if (most100Plus) bests.push(most100Plus);

        // 4. Most 140+ (all time periods)
        const most140Plus = this.findMost140Plus(playerStats, timePeriod);
        if (most140Plus) bests.push(most140Plus);

        // 5. Most 180s (all time periods)
        const most180s = this.findMost180s(playerStats, timePeriod);
        if (most180s) bests.push(most180s);

        // 6. Highest Checkout (only for 'game' and 'all-time')
        if (timePeriod === 'game' || timePeriod === 'all-time') {
          const highestCheckout = this.findHighestCheckout(playerStats, timePeriod);
          if (highestCheckout) bests.push(highestCheckout);
        }

        // 7. Best Leg (only for 'game' and 'all-time')
        if (timePeriod === 'game' || timePeriod === 'all-time') {
          const bestLeg = this.findBestLeg(playerId, timePeriod);
          if (bestLeg) bests.push(bestLeg);
        }

        return bests;
      })
    );
  }

  // ============================================================================
  // Private helper methods for each metric
  // ============================================================================

  private findBest3DartAverage(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    if (stats.length === 0) return null;

    if (timePeriod === 'game') {
      // Find best single game average across ALL games
      const best = stats.reduce((max, s) =>
        s.avg_3dart > max.avg_3dart ? s : max
      );
      if (best.avg_3dart === 0) return null;

      return {
        label: 'Bester 3-Dart-Ø',
        value: best.avg_3dart,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'decimal',
      };
    } else if (timePeriod === 'matchday') {
      // Group by (season, matchday), find best matchday
      const matchdayGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        const key = `${s.season}_${s.matchday}`;
        if (!matchdayGroups.has(key)) {
          matchdayGroups.set(key, []);
        }
        matchdayGroups.get(key)!.push(s);
      });

      let bestAvg = 0;
      let bestContext = '';

      matchdayGroups.forEach((groupStats, key) => {
        const totalPoints = groupStats.reduce(
          (sum, s) => sum + (s.avg_3dart * s.darts_thrown) / 3,
          0
        );
        const totalDarts = groupStats.reduce((sum, s) => sum + s.darts_thrown, 0);
        const avg = totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;

        if (avg > bestAvg) {
          bestAvg = avg;
          bestContext = `${groupStats[0].season}, ST ${groupStats[0].matchday}`;
        }
      });

      if (bestAvg === 0) return null;

      return {
        label: 'Bester 3-Dart-Ø',
        value: bestAvg,
        context: bestContext,
        formatType: 'decimal',
      };
    } else if (timePeriod === 'season') {
      // Group by season, find best season
      const seasonGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        if (!seasonGroups.has(s.season)) {
          seasonGroups.set(s.season, []);
        }
        seasonGroups.get(s.season)!.push(s);
      });

      let bestAvg = 0;
      let bestSeason = '';

      seasonGroups.forEach((groupStats, season) => {
        const totalPoints = groupStats.reduce(
          (sum, s) => sum + (s.avg_3dart * s.darts_thrown) / 3,
          0
        );
        const totalDarts = groupStats.reduce((sum, s) => sum + s.darts_thrown, 0);
        const avg = totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;

        if (avg > bestAvg) {
          bestAvg = avg;
          bestSeason = season;
        }
      });

      if (bestAvg === 0) return null;

      return {
        label: 'Bester 3-Dart-Ø',
        value: bestAvg,
        context: bestSeason,
        formatType: 'decimal',
      };
    } else {
      // all-time: aggregate over everything
      const totalPoints = stats.reduce(
        (sum, s) => sum + (s.avg_3dart * s.darts_thrown) / 3,
        0
      );
      const totalDarts = stats.reduce((sum, s) => sum + s.darts_thrown, 0);
      const avg = totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;

      if (avg === 0) return null;

      return {
        label: 'Bester 3-Dart-Ø',
        value: avg,
        context: 'All-Time',
        formatType: 'decimal',
      };
    }
  }

  private findBestFirst9Average(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    const validStats = stats.filter((s) => s.avg_first9 && s.avg_first9 > 0);
    if (validStats.length === 0) return null;

    if (timePeriod === 'game') {
      const best = validStats.reduce((max, s) =>
        s.avg_first9 > max.avg_first9 ? s : max
      );

      return {
        label: 'Bester First-9-Ø',
        value: best.avg_first9,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'decimal',
      };
    } else if (timePeriod === 'matchday') {
      const matchdayGroups = new Map<string, StatRow[]>();
      validStats.forEach(s => {
        const key = `${s.season}_${s.matchday}`;
        if (!matchdayGroups.has(key)) {
          matchdayGroups.set(key, []);
        }
        matchdayGroups.get(key)!.push(s);
      });

      let bestAvg = 0;
      let bestContext = '';

      matchdayGroups.forEach((groupStats, key) => {
        const avg = groupStats.reduce((sum, s) => sum + s.avg_first9, 0) / groupStats.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestContext = `${groupStats[0].season}, ST ${groupStats[0].matchday}`;
        }
      });

      return {
        label: 'Bester First-9-Ø',
        value: bestAvg,
        context: bestContext,
        formatType: 'decimal',
      };
    } else if (timePeriod === 'season') {
      const seasonGroups = new Map<string, StatRow[]>();
      validStats.forEach(s => {
        if (!seasonGroups.has(s.season)) {
          seasonGroups.set(s.season, []);
        }
        seasonGroups.get(s.season)!.push(s);
      });

      let bestAvg = 0;
      let bestSeason = '';

      seasonGroups.forEach((groupStats, season) => {
        const avg = groupStats.reduce((sum, s) => sum + s.avg_first9, 0) / groupStats.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestSeason = season;
        }
      });

      return {
        label: 'Bester First-9-Ø',
        value: bestAvg,
        context: bestSeason,
        formatType: 'decimal',
      };
    } else {
      const avg = validStats.reduce((sum, s) => sum + s.avg_first9, 0) / validStats.length;

      return {
        label: 'Bester First-9-Ø',
        value: avg,
        context: 'All-Time',
        formatType: 'decimal',
      };
    }
  }

  private findMost180s(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    if (stats.length === 0) return null;

    if (timePeriod === 'game') {
      const best = stats.reduce((max, s) =>
        s.score_180 > max.score_180 ? s : max
      );
      if (best.score_180 === 0) return null;

      return {
        label: 'Most 180',
        value: best.score_180,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'number',
      };
    } else if (timePeriod === 'matchday') {
      const matchdayGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        const key = `${s.season}_${s.matchday}`;
        if (!matchdayGroups.has(key)) {
          matchdayGroups.set(key, []);
        }
        matchdayGroups.get(key)!.push(s);
      });

      let bestCount = 0;
      let bestContext = '';

      matchdayGroups.forEach((groupStats, key) => {
        const total = groupStats.reduce((sum, s) => sum + s.score_180, 0);
        if (total > bestCount) {
          bestCount = total;
          bestContext = `${groupStats[0].season}, ST ${groupStats[0].matchday}`;
        }
      });

      if (bestCount === 0) return null;

      return {
        label: 'Most 180',
        value: bestCount,
        context: bestContext,
        formatType: 'number',
      };
    } else if (timePeriod === 'season') {
      const seasonGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        if (!seasonGroups.has(s.season)) {
          seasonGroups.set(s.season, []);
        }
        seasonGroups.get(s.season)!.push(s);
      });

      let bestCount = 0;
      let bestSeason = '';

      seasonGroups.forEach((groupStats, season) => {
        const total = groupStats.reduce((sum, s) => sum + s.score_180, 0);
        if (total > bestCount) {
          bestCount = total;
          bestSeason = season;
        }
      });

      if (bestCount === 0) return null;

      return {
        label: 'Most 180',
        value: bestCount,
        context: bestSeason,
        formatType: 'number',
      };
    } else {
      const total = stats.reduce((sum, s) => sum + s.score_180, 0);
      if (total === 0) return null;

      return {
        label: 'Most 180',
        value: total,
        context: 'All-Time',
        formatType: 'number',
      };
    }
  }

  private findMost140Plus(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    if (stats.length === 0) return null;

    if (timePeriod === 'game') {
      const best = stats.reduce((max, s) =>
        s.score_140 > max.score_140 ? s : max
      );
      if (best.score_140 === 0) return null;

      return {
        label: 'Most 140',
        value: best.score_140,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'number',
      };
    } else if (timePeriod === 'matchday') {
      const matchdayGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        const key = `${s.season}_${s.matchday}`;
        if (!matchdayGroups.has(key)) {
          matchdayGroups.set(key, []);
        }
        matchdayGroups.get(key)!.push(s);
      });

      let bestCount = 0;
      let bestContext = '';

      matchdayGroups.forEach((groupStats, key) => {
        const total = groupStats.reduce((sum, s) => sum + s.score_140, 0);
        if (total > bestCount) {
          bestCount = total;
          bestContext = `${groupStats[0].season}, ST ${groupStats[0].matchday}`;
        }
      });

      if (bestCount === 0) return null;

      return {
        label: 'Most 140',
        value: bestCount,
        context: bestContext,
        formatType: 'number',
      };
    } else if (timePeriod === 'season') {
      const seasonGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        if (!seasonGroups.has(s.season)) {
          seasonGroups.set(s.season, []);
        }
        seasonGroups.get(s.season)!.push(s);
      });

      let bestCount = 0;
      let bestSeason = '';

      seasonGroups.forEach((groupStats, season) => {
        const total = groupStats.reduce((sum, s) => sum + s.score_140, 0);
        if (total > bestCount) {
          bestCount = total;
          bestSeason = season;
        }
      });

      if (bestCount === 0) return null;

      return {
        label: 'Most 140',
        value: bestCount,
        context: bestSeason,
        formatType: 'number',
      };
    } else {
      const total = stats.reduce((sum, s) => sum + s.score_140, 0);
      if (total === 0) return null;

      return {
        label: 'Most 140',
        value: total,
        context: 'All-Time',
        formatType: 'number',
      };
    }
  }

  private findMost100Plus(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    if (stats.length === 0) return null;

    if (timePeriod === 'game') {
      const best = stats.reduce((max, s) =>
        s.score_100 > max.score_100 ? s : max
      );
      if (best.score_100 === 0) return null;

      return {
        label: 'Most TONs',
        value: best.score_100,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'number',
      };
    } else if (timePeriod === 'matchday') {
      const matchdayGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        const key = `${s.season}_${s.matchday}`;
        if (!matchdayGroups.has(key)) {
          matchdayGroups.set(key, []);
        }
        matchdayGroups.get(key)!.push(s);
      });

      let bestCount = 0;
      let bestContext = '';

      matchdayGroups.forEach((groupStats, key) => {
        const total = groupStats.reduce((sum, s) => sum + s.score_100, 0);
        if (total > bestCount) {
          bestCount = total;
          bestContext = `${groupStats[0].season}, ST ${groupStats[0].matchday}`;
        }
      });

      if (bestCount === 0) return null;

      return {
        label: 'Most TONs',
        value: bestCount,
        context: bestContext,
        formatType: 'number',
      };
    } else if (timePeriod === 'season') {
      const seasonGroups = new Map<string, StatRow[]>();
      stats.forEach(s => {
        if (!seasonGroups.has(s.season)) {
          seasonGroups.set(s.season, []);
        }
        seasonGroups.get(s.season)!.push(s);
      });

      let bestCount = 0;
      let bestSeason = '';

      seasonGroups.forEach((groupStats, season) => {
        const total = groupStats.reduce((sum, s) => sum + s.score_100, 0);
        if (total > bestCount) {
          bestCount = total;
          bestSeason = season;
        }
      });

      if (bestCount === 0) return null;

      return {
        label: 'Most TONs',
        value: bestCount,
        context: bestSeason,
        formatType: 'number',
      };
    } else {
      const total = stats.reduce((sum, s) => sum + s.score_100, 0);
      if (total === 0) return null;

      return {
        label: 'Most TONs',
        value: total,
        context: 'All-Time',
        formatType: 'number',
      };
    }
  }

  private findHighestCheckout(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    if (stats.length === 0) return null;

    // For highest checkout, we ALWAYS want the absolute highest across all data
    // regardless of time period (makes most sense for a "highest" metric)
    const best = stats.reduce((max, s) =>
      s.high_finish > max.high_finish ? s : max
    );

    if (best.high_finish === 0) return null;

    return {
      label: 'Höchster Checkout',
      value: best.high_finish,
      context: `${best.season}, ST ${best.matchday}`,
      formatType: 'number',
    };
  }

  private findBestCheckoutPercentage(
    playerId: number,
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    // For checkout percentage, we need to use CheckdartsService
    // For simplicity, we'll calculate it based on available data
    // In a real scenario, you might need to call CheckdartsService methods

    // For now, we'll use a simplified calculation based on legs_won vs legs_played
    // This is a placeholder - you may want to refine this with actual checkout data

    if (timePeriod === 'game') {
      // Find game with best checkout ratio
      const gamesWithCheckouts = stats.filter(
        (s) => s.legs_played > 0 && s.legs_won > 0
      );
      if (gamesWithCheckouts.length === 0) return null;

      const best = gamesWithCheckouts.reduce((max, s) => {
        const ratio = (s.legs_won / s.legs_played) * 100;
        const maxRatio = (max.legs_won / max.legs_played) * 100;
        return ratio > maxRatio ? s : max;
      });

      const pct = (best.legs_won / best.legs_played) * 100;

      return {
        label: 'Beste Checkout %',
        value: pct,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'percentage',
      };
    } else {
      const totalLegsWon = stats.reduce((sum, s) => sum + s.legs_won, 0);
      const totalLegsPlayed = stats.reduce((sum, s) => sum + s.legs_played, 0);

      if (totalLegsPlayed === 0) return null;

      const pct = (totalLegsWon / totalLegsPlayed) * 100;

      let context = '';
      if (timePeriod === 'matchday') {
        context = `${stats[0]?.season}, ST ${stats[0]?.matchday}`;
      } else if (timePeriod === 'season') {
        context = `${stats[0]?.season}`;
      } else {
        context = 'All-Time';
      }

      return {
        label: 'Beste Checkout %',
        value: pct,
        context,
        formatType: 'percentage',
      };
    }
  }

  private findMostLegsWon(
    stats: StatRow[],
    timePeriod: TimePeriod
  ): PersonalBest | null {
    if (timePeriod === 'game') {
      const best = stats.reduce((max, s) =>
        s.legs_won > max.legs_won ? s : max
      );
      if (best.legs_won === 0) return null;

      return {
        label: 'Meiste Legs gewonnen',
        value: best.legs_won,
        context: `${best.season}, ST ${best.matchday}`,
        formatType: 'number',
      };
    } else {
      const total = stats.reduce((sum, s) => sum + s.legs_won, 0);
      if (total === 0) return null;

      let context = '';
      if (timePeriod === 'matchday') {
        context = `${stats[0]?.season}, ST ${stats[0]?.matchday}`;
      } else if (timePeriod === 'season') {
        context = `${stats[0]?.season}`;
      } else {
        context = 'All-Time';
      }

      return {
        label: 'Meiste Legs gewonnen',
        value: total,
        context,
        formatType: 'number',
      };
    }
  }

  private findBestLeg(
    playerId: number,
    timePeriod: TimePeriod
  ): PersonalBest | null {
    // Get all legs from LegsService
    const allLegs = this.legsService.getLegs();

    // Filter legs for this player and where darts data exists
    const playerLegs = allLegs.filter(leg => {
      const isPlayer1 = leg.player1_id === playerId;
      const isPlayer2 = leg.player2_id === playerId;

      if (!isPlayer1 && !isPlayer2) return false;

      // Get darts for this player
      const darts = isPlayer1 ? leg.p1_darts_leg : leg.p2_darts_leg;

      // Only include legs where darts data exists and is valid
      return darts !== null && darts !== undefined && darts > 0;
    });

    if (playerLegs.length === 0) return null;

    // Find the leg with minimum darts
    const bestLeg = playerLegs.reduce((min, leg) => {
      const isPlayer1 = leg.player1_id === playerId;
      const currentDarts = isPlayer1 ? leg.p1_darts_leg! : leg.p2_darts_leg!;
      const minDarts = min.player1_id === playerId ? min.p1_darts_leg! : min.p2_darts_leg!;

      return currentDarts < minDarts ? leg : min;
    });

    const isPlayer1 = bestLeg.player1_id === playerId;
    const dartsUsed = isPlayer1 ? bestLeg.p1_darts_leg! : bestLeg.p2_darts_leg!;

    return {
      label: 'Best Leg',
      value: dartsUsed,
      context: `${bestLeg.season}, ST ${bestLeg.matchday}`,
      formatType: 'number',
    };
  }

  /**
   * Calculate all-time ranking for a specific metric
   * Returns the rank (1-based) or undefined if not in top rankings
   */
  calculateTopRank(
    playerId: number,
    metricLabel: string,
    playerValue: number
  ): Observable<number | undefined> {
    // This would need to compare against all players
    // For now, returning undefined - will be implemented in all-time-records service
    return of(undefined);
  }
}
