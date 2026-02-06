import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatsQueryService } from './stats-query.service';
import { LegsService } from './legs.service';
import { CheckdartsService } from './checkdarts.service';
import { PlayersService } from './players.service';
import { StatRow } from './stats.service';

export interface PlayerComparisonMetric {
  label: string;
  player1Value: number;
  player2Value: number;
  player1Better: boolean; // true wenn player1 besser
  formatType: 'number' | 'decimal' | 'percentage';
  higherIsBetter: boolean; // für Metrik-Vergleich
  absoluteMax?: number; // Optional: Absolutes Maximum für Skalierung (z.B. 170 für Checkouts, 100 für %)
}

export interface PlayerComparisonResult {
  player1Id: number;
  player2Id: number;
  player1Name: string;
  player2Name: string;
  season: string;
  metrics: PlayerComparisonMetric[];
}

@Injectable({ providedIn: 'root' })
export class PlayerComparisonService {
  constructor(
    private statsQuery: StatsQueryService,
    private legsService: LegsService,
    private checkdartsService: CheckdartsService,
    private playersService: PlayersService
  ) {}

  comparePlayersBySeason(
    player1Id: number,
    player2Id: number,
    season: string,
    matchday?: number | null
  ): Observable<PlayerComparisonResult> {
    return this.statsQuery.getFullStatsBySeason$(season).pipe(
      map((allStats) => {
        // Filter stats for each player
        let p1Stats = allStats.filter((s) => s.player_id === player1Id);
        let p2Stats = allStats.filter((s) => s.player_id === player2Id);

        // Additional filter by matchday if specified
        if (matchday !== null && matchday !== undefined) {
          p1Stats = p1Stats.filter((s) => s.matchday === matchday);
          p2Stats = p2Stats.filter((s) => s.matchday === matchday);
        }

        // Get player names
        const player1 = this.playersService.getPlayer(player1Id);
        const player2 = this.playersService.getPlayer(player2Id);
        const player1Name = player1?.name || `Player ${player1Id}`;
        const player2Name = player2?.name || `Player ${player2Id}`;

        // Calculate all metrics
        const p1Avg3Dart = this.calculateAvg3Dart(p1Stats);
        const p2Avg3Dart = this.calculateAvg3Dart(p2Stats);

        const p1AvgFirst9 = this.calculateAvgFirst9(p1Stats);
        const p2AvgFirst9 = this.calculateAvgFirst9(p2Stats);

        const p1_180s = this.calculate180s(p1Stats);
        const p2_180s = this.calculate180s(p2Stats);

        const p1_140plus = this.calculate140Plus(p1Stats);
        const p2_140plus = this.calculate140Plus(p2Stats);

        const p1_100plus = this.calculate100Plus(p1Stats);
        const p2_100plus = this.calculate100Plus(p2Stats);

        const p1_100 = this.calculate100(p1Stats);
        const p2_100 = this.calculate100(p2Stats);

        const p1SetsWon = this.calculateSetsWon(p1Stats);
        const p2SetsWon = this.calculateSetsWon(p2Stats);

        const p1LegsWon = this.calculateLegsWon(p1Stats);
        const p2LegsWon = this.calculateLegsWon(p2Stats);

        const p1Checkout1Dart = this.calculate1DartCheckoutPct(player1Id, season);
        const p2Checkout1Dart = this.calculate1DartCheckoutPct(player2Id, season);

        const p1Checkout2Dart = this.calculate2DartCheckoutPct(player1Id, season);
        const p2Checkout2Dart = this.calculate2DartCheckoutPct(player2Id, season);

        const p1Checkout3Dart = this.calculate3DartCheckoutPct(player1Id, season);
        const p2Checkout3Dart = this.calculate3DartCheckoutPct(player2Id, season);

        const p1Checkouts100 = this.calculateCheckouts100Plus(player1Id, season);
        const p2Checkouts100 = this.calculateCheckouts100Plus(player2Id, season);

        const p1HighCheckout = this.calculateHighestCheckout(p1Stats);
        const p2HighCheckout = this.calculateHighestCheckout(p2Stats);

        // Build metrics array
        const metrics: PlayerComparisonMetric[] = [
          {
            label: 'Sets gewonnen',
            player1Value: p1SetsWon,
            player2Value: p2SetsWon,
            player1Better: p1SetsWon > p2SetsWon,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Legs gewonnen',
            player1Value: p1LegsWon,
            player2Value: p2LegsWon,
            player1Better: p1LegsWon > p2LegsWon,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Durchschnitt (3-Dart)',
            player1Value: p1Avg3Dart,
            player2Value: p2Avg3Dart,
            player1Better: p1Avg3Dart > p2Avg3Dart,
            formatType: 'decimal',
            higherIsBetter: true,
            absoluteMax: 167, // Perfect 9-darter average (501 in 9 darts)
          },
          {
            label: 'Durchschnitt (First-9)',
            player1Value: p1AvgFirst9,
            player2Value: p2AvgFirst9,
            player1Better: p1AvgFirst9 > p2AvgFirst9,
            formatType: 'decimal',
            higherIsBetter: true,
            absoluteMax: 180, // Three perfect 180s (540 in 9 darts)
          },
          {
            label: '180er',
            player1Value: p1_180s,
            player2Value: p2_180s,
            player1Better: p1_180s > p2_180s,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '140+',
            player1Value: p1_140plus,
            player2Value: p2_140plus,
            player1Better: p1_140plus > p2_140plus,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '100+',
            player1Value: p1_100plus,
            player2Value: p2_100plus,
            player1Better: p1_100plus > p2_100plus,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '100',
            player1Value: p1_100,
            player2Value: p2_100,
            player1Better: p1_100 > p2_100,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '1-Dart Checkout %',
            player1Value: p1Checkout1Dart,
            player2Value: p2Checkout1Dart,
            player1Better: p1Checkout1Dart > p2Checkout1Dart,
            formatType: 'percentage',
            higherIsBetter: true,
            absoluteMax: 100,
          },
          {
            label: '2-Dart Checkout %',
            player1Value: p1Checkout2Dart,
            player2Value: p2Checkout2Dart,
            player1Better: p1Checkout2Dart > p2Checkout2Dart,
            formatType: 'percentage',
            higherIsBetter: true,
            absoluteMax: 100,
          },
          {
            label: '3-Dart Checkout %',
            player1Value: p1Checkout3Dart,
            player2Value: p2Checkout3Dart,
            player1Better: p1Checkout3Dart > p2Checkout3Dart,
            formatType: 'percentage',
            higherIsBetter: true,
            absoluteMax: 100,
          },
          {
            label: 'Checkouts 100+',
            player1Value: p1Checkouts100,
            player2Value: p2Checkouts100,
            player1Better: p1Checkouts100 > p2Checkouts100,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Höchster Checkout',
            player1Value: p1HighCheckout,
            player2Value: p2HighCheckout,
            player1Better: p1HighCheckout > p2HighCheckout,
            formatType: 'number',
            higherIsBetter: true,
            absoluteMax: 170, // Maximum possible checkout
          },
        ];

        return {
          player1Id,
          player2Id,
          player1Name,
          player2Name,
          season,
          metrics,
        };
      })
    );
  }

  /**
   * Compare all players' combined stats across two seasons.
   * Aggregates stats from ALL players for each season and compares them.
   * Returns comparison where season1 is treated as "player1" and season2 as "player2"
   */
  compareSeasonsAllPlayers(
    season1: string,
    season2: string
  ): Observable<PlayerComparisonResult> {
    return forkJoin({
      stats1: this.statsQuery.getFullStatsBySeason$(season1),
      stats2: this.statsQuery.getFullStatsBySeason$(season2),
    }).pipe(
      map(({ stats1, stats2 }) => {
        // Use ALL stats from each season (no player filtering)
        const p1Stats = stats1;
        const p2Stats = stats2;

        // Calculate all metrics for both seasons (aggregated across all players)
        const p1Avg3Dart = this.calculateAvg3Dart(p1Stats);
        const p2Avg3Dart = this.calculateAvg3Dart(p2Stats);

        const p1AvgFirst9 = this.calculateAvgFirst9(p1Stats);
        const p2AvgFirst9 = this.calculateAvgFirst9(p2Stats);

        const p1_180s = this.calculate180s(p1Stats);
        const p2_180s = this.calculate180s(p2Stats);

        const p1_140plus = this.calculate140Plus(p1Stats);
        const p2_140plus = this.calculate140Plus(p2Stats);

        const p1_100 = this.calculate100(p1Stats);
        const p2_100 = this.calculate100(p2Stats);

        const p1HighCheckout = this.calculateHighestCheckout(p1Stats);
        const p2HighCheckout = this.calculateHighestCheckout(p2Stats);

        const p1BestLeg = this.calculateBestLeg(p1Stats);
        const p2BestLeg = this.calculateBestLeg(p2Stats);

        const p1Checkouts100 = this.calculateCheckouts100PlusAllPlayers(season1);
        const p2Checkouts100 = this.calculateCheckouts100PlusAllPlayers(season2);

        // Build metrics array (using user's requested metrics)
        const metrics: PlayerComparisonMetric[] = [
          {
            label: 'Durchschnitt (3-Dart)',
            player1Value: p1Avg3Dart,
            player2Value: p2Avg3Dart,
            player1Better: p1Avg3Dart > p2Avg3Dart,
            formatType: 'decimal',
            higherIsBetter: true,
            absoluteMax: 167,
          },
          {
            label: 'Durchschnitt (First-9)',
            player1Value: p1AvgFirst9,
            player2Value: p2AvgFirst9,
            player1Better: p1AvgFirst9 > p2AvgFirst9,
            formatType: 'decimal',
            higherIsBetter: true,
            absoluteMax: 180,
          },
          {
            label: '180er',
            player1Value: p1_180s,
            player2Value: p2_180s,
            player1Better: p1_180s > p2_180s,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '140+',
            player1Value: p1_140plus,
            player2Value: p2_140plus,
            player1Better: p1_140plus > p2_140plus,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'TONs (100er)',
            player1Value: p1_100,
            player2Value: p2_100,
            player1Better: p1_100 > p2_100,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Checkouts 100+',
            player1Value: p1Checkouts100,
            player2Value: p2Checkouts100,
            player1Better: p1Checkouts100 > p2Checkouts100,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Höchster Checkout',
            player1Value: p1HighCheckout,
            player2Value: p2HighCheckout,
            player1Better: p1HighCheckout > p2HighCheckout,
            formatType: 'number',
            higherIsBetter: true,
            absoluteMax: 170,
          },
          {
            label: 'Best Leg',
            player1Value: p1BestLeg,
            player2Value: p2BestLeg,
            player1Better: p1BestLeg > 0 && (p2BestLeg === 0 || p1BestLeg < p2BestLeg), // Lower is better for legs
            formatType: 'number',
            higherIsBetter: false,
          },
        ];

        return {
          player1Id: 0, // Not applicable for season comparison
          player2Id: 0,
          player1Name: season1,
          player2Name: season2,
          season: `${season1} vs ${season2}`,
          metrics,
        };
      })
    );
  }

  /**
   * Compare the same player across two different seasons.
   * Returns comparison where season1 is treated as "player1" and season2 as "player2"
   */
  comparePlayerAcrossSeasons(
    playerId: number,
    season1: string,
    season2: string,
    matchday?: number | null
  ): Observable<PlayerComparisonResult> {
    return forkJoin({
      stats1: this.statsQuery.getFullStatsBySeason$(season1),
      stats2: this.statsQuery.getFullStatsBySeason$(season2),
    }).pipe(
      map(({ stats1, stats2 }) => {
        // Filter stats for this player from each season
        let p1Stats = stats1.filter((s) => s.player_id === playerId);
        let p2Stats = stats2.filter((s) => s.player_id === playerId);

        // Additional filter by matchday if specified
        if (matchday !== null && matchday !== undefined) {
          p1Stats = p1Stats.filter((s) => s.matchday === matchday);
          p2Stats = p2Stats.filter((s) => s.matchday === matchday);
        }

        // Get player name
        const player = this.playersService.getPlayer(playerId);
        const playerName = player?.name || `Player ${playerId}`;

        // Calculate all metrics for both seasons
        const p1Avg3Dart = this.calculateAvg3Dart(p1Stats);
        const p2Avg3Dart = this.calculateAvg3Dart(p2Stats);

        const p1AvgFirst9 = this.calculateAvgFirst9(p1Stats);
        const p2AvgFirst9 = this.calculateAvgFirst9(p2Stats);

        const p1_180s = this.calculate180s(p1Stats);
        const p2_180s = this.calculate180s(p2Stats);

        const p1_140plus = this.calculate140Plus(p1Stats);
        const p2_140plus = this.calculate140Plus(p2Stats);

        const p1_100plus = this.calculate100Plus(p1Stats);
        const p2_100plus = this.calculate100Plus(p2Stats);

        const p1_100 = this.calculate100(p1Stats);
        const p2_100 = this.calculate100(p2Stats);

        const p1SetsWon = this.calculateSetsWon(p1Stats);
        const p2SetsWon = this.calculateSetsWon(p2Stats);

        const p1LegsWon = this.calculateLegsWon(p1Stats);
        const p2LegsWon = this.calculateLegsWon(p2Stats);

        const p1Checkout1Dart = this.calculate1DartCheckoutPct(playerId, season1);
        const p2Checkout1Dart = this.calculate1DartCheckoutPct(playerId, season2);

        const p1Checkout2Dart = this.calculate2DartCheckoutPct(playerId, season1);
        const p2Checkout2Dart = this.calculate2DartCheckoutPct(playerId, season2);

        const p1Checkout3Dart = this.calculate3DartCheckoutPct(playerId, season1);
        const p2Checkout3Dart = this.calculate3DartCheckoutPct(playerId, season2);

        const p1Checkouts100 = this.calculateCheckouts100Plus(playerId, season1);
        const p2Checkouts100 = this.calculateCheckouts100Plus(playerId, season2);

        const p1HighCheckout = this.calculateHighestCheckout(p1Stats);
        const p2HighCheckout = this.calculateHighestCheckout(p2Stats);

        // Build metrics array
        const metrics: PlayerComparisonMetric[] = [
          {
            label: 'Sets gewonnen',
            player1Value: p1SetsWon,
            player2Value: p2SetsWon,
            player1Better: p1SetsWon > p2SetsWon,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Legs gewonnen',
            player1Value: p1LegsWon,
            player2Value: p2LegsWon,
            player1Better: p1LegsWon > p2LegsWon,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Durchschnitt (3-Dart)',
            player1Value: p1Avg3Dart,
            player2Value: p2Avg3Dart,
            player1Better: p1Avg3Dart > p2Avg3Dart,
            formatType: 'decimal',
            higherIsBetter: true,
            absoluteMax: 167,
          },
          {
            label: 'Durchschnitt (First-9)',
            player1Value: p1AvgFirst9,
            player2Value: p2AvgFirst9,
            player1Better: p1AvgFirst9 > p2AvgFirst9,
            formatType: 'decimal',
            higherIsBetter: true,
            absoluteMax: 180,
          },
          {
            label: '180er',
            player1Value: p1_180s,
            player2Value: p2_180s,
            player1Better: p1_180s > p2_180s,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '140+',
            player1Value: p1_140plus,
            player2Value: p2_140plus,
            player1Better: p1_140plus > p2_140plus,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '100+',
            player1Value: p1_100plus,
            player2Value: p2_100plus,
            player1Better: p1_100plus > p2_100plus,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '100',
            player1Value: p1_100,
            player2Value: p2_100,
            player1Better: p1_100 > p2_100,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: '1-Dart Checkout %',
            player1Value: p1Checkout1Dart,
            player2Value: p2Checkout1Dart,
            player1Better: p1Checkout1Dart > p2Checkout1Dart,
            formatType: 'percentage',
            higherIsBetter: true,
            absoluteMax: 100,
          },
          {
            label: '2-Dart Checkout %',
            player1Value: p1Checkout2Dart,
            player2Value: p2Checkout2Dart,
            player1Better: p1Checkout2Dart > p2Checkout2Dart,
            formatType: 'percentage',
            higherIsBetter: true,
            absoluteMax: 100,
          },
          {
            label: '3-Dart Checkout %',
            player1Value: p1Checkout3Dart,
            player2Value: p2Checkout3Dart,
            player1Better: p1Checkout3Dart > p2Checkout3Dart,
            formatType: 'percentage',
            higherIsBetter: true,
            absoluteMax: 100,
          },
          {
            label: 'Checkouts 100+',
            player1Value: p1Checkouts100,
            player2Value: p2Checkouts100,
            player1Better: p1Checkouts100 > p2Checkouts100,
            formatType: 'number',
            higherIsBetter: true,
          },
          {
            label: 'Höchster Checkout',
            player1Value: p1HighCheckout,
            player2Value: p2HighCheckout,
            player1Better: p1HighCheckout > p2HighCheckout,
            formatType: 'number',
            higherIsBetter: true,
            absoluteMax: 170,
          },
        ];

        return {
          player1Id: playerId,
          player2Id: playerId,
          player1Name: season1, // Use season names for display
          player2Name: season2,
          season: `${season1} vs ${season2}`,
          metrics,
        };
      })
    );
  }

  // Private helper methods for metric calculations

  private calculateAvg3Dart(statsRows: StatRow[]): number {
    if (statsRows.length === 0) return 0;

    const totalPoints = statsRows.reduce(
      (sum, s) => sum + (s.avg_3dart * s.darts_thrown) / 3,
      0
    );
    const totalDarts = statsRows.reduce((sum, s) => sum + s.darts_thrown, 0);

    return totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;
  }

  private calculateAvgFirst9(statsRows: StatRow[]): number {
    const validStats = statsRows.filter((s) => s.avg_first9 && s.avg_first9 > 0);
    if (validStats.length === 0) return 0;

    return (
      validStats.reduce((sum, s) => sum + s.avg_first9, 0) / validStats.length
    );
  }

  private calculate180s(statsRows: StatRow[]): number {
    return statsRows.reduce((sum, s) => sum + (s.score_180 || 0), 0);
  }

  private calculate140Plus(statsRows: StatRow[]): number {
    return statsRows.reduce(
      (sum, s) => sum + (s.score_140 || 0) + (s.score_140_plus || 0),
      0
    );
  }

  private calculate100Plus(statsRows: StatRow[]): number {
    return statsRows.reduce(
      (sum, s) => sum + (s.score_100 || 0) + (s.score_100_plus || 0),
      0
    );
  }

  private calculate100(statsRows: StatRow[]): number {
    return statsRows.reduce((sum, s) => sum + (s.score_100 || 0), 0);
  }

  private calculateSetsWon(statsRows: StatRow[]): number {
    return statsRows.reduce((sum, s) => sum + (s.sets_won || 0), 0);
  }

  private calculateLegsWon(statsRows: StatRow[]): number {
    return statsRows.reduce((sum, s) => sum + (s.legs_won || 0), 0);
  }

  private calculate1DartCheckoutPct(playerId: number, season: string): number {
    const games = (this.legsService as any).gamesDataSignal?.();
    if (!games || games.length === 0) return 0;

    const stats = this.checkdartsService.calculateCheckdartsStats(games, { season });
    const playerStats = stats.find((s) => s.playerId === playerId);

    if (!playerStats || playerStats.total === 0) return 0;

    return playerStats.oneDartPct;
  }

  private calculate2DartCheckoutPct(playerId: number, season: string): number {
    const games = (this.legsService as any).gamesDataSignal?.();
    if (!games || games.length === 0) return 0;

    const stats = this.checkdartsService.calculateCheckdartsStats(games, { season });
    const playerStats = stats.find((s) => s.playerId === playerId);

    if (!playerStats || playerStats.total === 0) return 0;

    return playerStats.twoDartPct;
  }

  private calculate3DartCheckoutPct(playerId: number, season: string): number {
    const games = (this.legsService as any).gamesDataSignal?.();
    if (!games || games.length === 0) return 0;

    const stats = this.checkdartsService.calculateCheckdartsStats(games, { season });
    const playerStats = stats.find((s) => s.playerId === playerId);

    if (!playerStats || playerStats.total === 0) return 0;

    return playerStats.threeDartPct;
  }

  private calculateCheckouts100Plus(playerId: number, season: string): number {
    const checkouts = this.legsService.getPlayerCheckouts(playerId, season, 999);
    return checkouts.filter((c) => c.value >= 100).length;
  }

  private calculateHighestCheckout(statsRows: StatRow[]): number {
    return statsRows.reduce((max, s) => Math.max(max, s.high_finish || 0), 0);
  }

  private calculateBestLeg(statsRows: StatRow[]): number {
    const validLegs = statsRows.filter((s) => s.best_leg && s.best_leg > 0);
    if (validLegs.length === 0) return 0;
    return Math.min(...validLegs.map((s) => s.best_leg as number));
  }

  private calculateOverallCheckoutPct(season: string): number {
    const games = (this.legsService as any).gamesDataSignal?.();
    if (!games || games.length === 0) return 0;

    const stats = this.checkdartsService.calculateCheckdartsStats(games, { season });
    if (stats.length === 0) return 0;

    // Aggregate across all players
    const totalCheckouts = stats.reduce((sum, s) => sum + s.total, 0);
    const totalSuccessful = stats.reduce((sum, s) => sum + s.oneDart + s.twoDart + s.threeDart, 0);

    return totalCheckouts > 0 ? (totalSuccessful / totalCheckouts) * 100 : 0;
  }

  private calculateCheckouts100PlusAllPlayers(season: string): number {
    const games = (this.legsService as any).gamesDataSignal?.();
    if (!games || games.length === 0) return 0;

    // Get all active players
    const players = this.playersService.getPlayers({ activeOnly: false });
    let total = 0;

    // Sum checkouts 100+ for all players
    players.forEach((player) => {
      const checkouts = this.legsService.getPlayerCheckouts(player.id, season, 999);
      total += checkouts.filter((c) => c.value >= 100).length;
    });

    return total;
  }
}
