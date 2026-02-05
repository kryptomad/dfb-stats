import { Injectable } from '@angular/core';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';

export interface CheckdartsStats {
  playerId: number;
  playerName: string;
  playerColor: string;
  oneDart: number;      // Anzahl 1-Dart Checkouts (mit erstem Dart ausgecheckt)
  twoDart: number;      // Anzahl 2-Dart Checkouts (mit zweitem Dart ausgecheckt)
  threeDart: number;    // Anzahl 3-Dart Checkouts (mit drittem Dart ausgecheckt)
  total: number;        // Gesamt-Checkouts
  oneDartPct: number;   // Prozentsatz 1-Dart Checkouts
  twoDartPct: number;   // Prozentsatz 2-Dart Checkouts
  threeDartPct: number; // Prozentsatz 3-Dart Checkouts
}

type Game = {
  game_id: number;
  season: string;
  matchday: number;
  player1_id: number;
  player2_id: number;
  legs: {
    leg_number: number;
    starter_id: number;
    leg_winner_id: number | null;
    p1_darts_leg: number | null;
    p2_darts_leg: number | null;
    p1_avg_3dart_leg: number;
    p2_avg_3dart_leg: number;
    rounds: {
      round: number;
      p1_score: number | null;
      p1_left: number | null;
      p2_score: number | null;
      p2_left: number | null;
    }[];
  }[];
};

@Injectable({ providedIn: 'root' })
export class CheckdartsService {
  constructor(
    private playersService: PlayersService,
    private chartTheme: ChartThemeService,
  ) {}

  /**
   * Berechnet Checkout-Statistiken aus legs.json
   * Iteriert durch alle Games/Legs und findet negative Scores (-1, -2, -3)
   */
  calculateCheckdartsStats(
    games: Game[],
    options: { season?: string | null } = {},
  ): CheckdartsStats[] {
    const { season = null } = options;

    // 1. Initialize counters for all active players
    const players = this.playersService.getPlayers({ activeOnly: true });
    const checkoutCounts = new Map<number, { one: number; two: number; three: number }>();

    players.forEach((p) => {
      checkoutCounts.set(p.id, { one: 0, two: 0, three: 0 });
    });

    // 2. Iterate through each game
    for (const game of games) {
      // Filter by season if specified
      if (season && game.season !== season) continue;

      // 3. For each leg in the game
      for (const leg of game.legs) {
        // 4. Find the round with negative score
        for (const round of leg.rounds) {
          let checkoutDarts = 0;
          let playerId: number | null = null;

          // Check if p1_score is negative
          if (round.p1_score && round.p1_score < 0) {
            checkoutDarts = Math.abs(round.p1_score);
            playerId = game.player1_id;
          }
          // Check if p2_score is negative
          else if (round.p2_score && round.p2_score < 0) {
            checkoutDarts = Math.abs(round.p2_score);
            playerId = game.player2_id;
          }

          // 5. Count the checkout
          if (playerId && checkoutDarts > 0) {
            const counts = checkoutCounts.get(playerId);
            if (counts) {
              if (checkoutDarts === 1) {
                counts.one++;
              } else if (checkoutDarts === 2) {
                counts.two++;
              } else if (checkoutDarts === 3) {
                counts.three++;
              }
            }
            break; // Found checkout, move to next leg
          }
        }
      }
    }

    // 6. Calculate percentages and return results
    const results: CheckdartsStats[] = [];

    checkoutCounts.forEach((counts, playerId) => {
      const player = this.playersService.getPlayer(playerId);
      if (!player) return;

      const total = counts.one + counts.two + counts.three;

      results.push({
        playerId: playerId,
        playerName: player.name,
        playerColor: player.color || '#999999',
        oneDart: counts.one,
        twoDart: counts.two,
        threeDart: counts.three,
        total: total,
        oneDartPct: total > 0 ? (counts.one / total) * 100 : 0,
        twoDartPct: total > 0 ? (counts.two / total) * 100 : 0,
        threeDartPct: total > 0 ? (counts.three / total) * 100 : 0,
      });
    });

    // Sort by total checkouts descending
    return results.sort((a, b) => b.total - a.total);
  }

  /**
   * Generiert Chart-Daten für horizontales gestapeltes Balkendiagramm
   */
  getCheckdartsChartData(
    stats: CheckdartsStats[],
  ): any {
    return {
      labels: stats.map((s) => s.playerName),
      datasets: [
        {
          label: '1-Dart Checkout %',
          data: stats.map((s) => s.oneDartPct),
          backgroundColor: this.chartTheme.hexToRgba('#309f6a', 0.8), // Grün
          borderColor: '#309f6a',
          borderWidth: 1,
        },
        {
          label: '2-Dart Checkout %',
          data: stats.map((s) => s.twoDartPct),
          backgroundColor: this.chartTheme.hexToRgba('#f59e0b', 0.8), // Orange
          borderColor: '#f59e0b',
          borderWidth: 1,
        },
        {
          label: '3-Dart Checkout %',
          data: stats.map((s) => s.threeDartPct),
          backgroundColor: this.chartTheme.hexToRgba('#ef4444', 0.8), // Rot
          borderColor: '#ef4444',
          borderWidth: 1,
        },
      ],
    };
  }
}
