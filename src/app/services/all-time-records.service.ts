// src/app/services/all-time-records.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatsQueryService } from './stats-query.service';
import { PlayersService } from './players.service';
import { StatRow } from './stats.service';

export interface TopPlayerRecord {
  rank: number;
  playerId: number;
  playerName: string;
  value: number;
  season: string;
  matchday: number;
}

export interface AllTimeRecord {
  metricKey: string;
  metricName: string;
  topValue: number;
  topPlayerId: number;
  topPlayerName: string;
  formatType: 'number' | 'decimal' | 'percentage';
  top5: TopPlayerRecord[];
}

@Injectable({ providedIn: 'root' })
export class AllTimeRecordsService {
  constructor(
    private statsQuery: StatsQueryService,
    private playersService: PlayersService
  ) {}

  /**
   * Get all-time records across all players for all metrics
   */
  getAllTimeRecords(): Observable<AllTimeRecord[]> {
    return this.statsQuery.getFullStatsBySeason$('All-Time').pipe(
      map((allStats) => {
        const records: AllTimeRecord[] = [];

        // 1. Best 3-Dart Average
        records.push(this.calculateBest3DartAverage(allStats));

        // 2. Best First-9 Average
        records.push(this.calculateBestFirst9Average(allStats));

        // 3. Most 180s (single game)
        records.push(this.calculateMost180sSingleGame(allStats));

        // 4. Most 180s (total)
        records.push(this.calculateMost180sTotal(allStats));

        // 5. Most 140+ (single game)
        records.push(this.calculateMost140PlusSingleGame(allStats));

        // 6. Most 140+ (total)
        records.push(this.calculateMost140PlusTotal(allStats));

        // 7. Most 100+ (single game)
        records.push(this.calculateMost100PlusSingleGame(allStats));

        // 8. Most 100+ (total)
        records.push(this.calculateMost100PlusTotal(allStats));

        // 9. Highest Checkout
        records.push(this.calculateHighestCheckout(allStats));

        // 10. Most Legs Won (single game)
        records.push(this.calculateMostLegsWonSingleGame(allStats));

        // 11. Most Legs Won (total)
        records.push(this.calculateMostLegsWonTotal(allStats));

        return records;
      })
    );
  }

  // ============================================================================
  // Private calculation methods for each metric
  // ============================================================================

  private calculateBest3DartAverage(allStats: StatRow[]): AllTimeRecord {
    // Find best single-game 3-dart average
    const sorted = [...allStats]
      .filter((s) => s.avg_3dart > 0)
      .sort((a, b) => b.avg_3dart - a.avg_3dart)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.avg_3dart,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'best_3dart_avg',
      metricName: 'Bester 3-Dart-Ø',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'decimal',
      top5,
    };
  }

  private calculateBestFirst9Average(allStats: StatRow[]): AllTimeRecord {
    // Find best single-game first-9 average
    const sorted = [...allStats]
      .filter((s) => s.avg_first9 > 0)
      .sort((a, b) => b.avg_first9 - a.avg_first9)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.avg_first9,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'best_first9_avg',
      metricName: 'Bester First-9-Ø',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'decimal',
      top5,
    };
  }

  private calculateMost180sSingleGame(allStats: StatRow[]): AllTimeRecord {
    const sorted = [...allStats]
      .filter((s) => s.score_180 > 0)
      .sort((a, b) => b.score_180 - a.score_180)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.score_180,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_180s_game',
      metricName: 'Meiste 180er (Spiel)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMost180sTotal(allStats: StatRow[]): AllTimeRecord {
    // Aggregate total 180s per player
    const playerTotals = new Map<number, { total: number; stats: StatRow[] }>();

    allStats.forEach((s) => {
      if (!playerTotals.has(s.player_id)) {
        playerTotals.set(s.player_id, { total: 0, stats: [] });
      }
      const entry = playerTotals.get(s.player_id)!;
      entry.total += s.score_180;
      entry.stats.push(s);
    });

    const sorted = Array.from(playerTotals.entries())
      .map(([playerId, data]) => ({
        playerId,
        total: data.total,
        // Use most recent stat for season/matchday context
        lastStat: data.stats[data.stats.length - 1],
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((item, index) => ({
      rank: index + 1,
      playerId: item.playerId,
      playerName:
        this.playersService.getPlayer(item.playerId)?.name || 'Unknown',
      value: item.total,
      season: 'All-Time',
      matchday: 0,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_180s_total',
      metricName: 'Meiste 180er (Gesamt)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMost140PlusSingleGame(allStats: StatRow[]): AllTimeRecord {
    const statsWithTotal = allStats.map((s) => ({
      ...s,
      count140Plus: s.score_140 + s.score_140_plus,
    }));

    const sorted = statsWithTotal
      .filter((s) => s.count140Plus > 0)
      .sort((a, b) => b.count140Plus - a.count140Plus)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.count140Plus,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_140plus_game',
      metricName: 'Meiste 140+ (Spiel)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMost140PlusTotal(allStats: StatRow[]): AllTimeRecord {
    const playerTotals = new Map<number, number>();

    allStats.forEach((s) => {
      const total = playerTotals.get(s.player_id) || 0;
      playerTotals.set(s.player_id, total + s.score_140 + s.score_140_plus);
    });

    const sorted = Array.from(playerTotals.entries())
      .map(([playerId, total]) => ({ playerId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((item, index) => ({
      rank: index + 1,
      playerId: item.playerId,
      playerName:
        this.playersService.getPlayer(item.playerId)?.name || 'Unknown',
      value: item.total,
      season: 'All-Time',
      matchday: 0,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_140plus_total',
      metricName: 'Meiste 140+ (Gesamt)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMost100PlusSingleGame(allStats: StatRow[]): AllTimeRecord {
    const statsWithTotal = allStats.map((s) => ({
      ...s,
      count100Plus: s.score_100 + s.score_100_plus,
    }));

    const sorted = statsWithTotal
      .filter((s) => s.count100Plus > 0)
      .sort((a, b) => b.count100Plus - a.count100Plus)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.count100Plus,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_100plus_game',
      metricName: 'Meiste 100+ (Spiel)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMost100PlusTotal(allStats: StatRow[]): AllTimeRecord {
    const playerTotals = new Map<number, number>();

    allStats.forEach((s) => {
      const total = playerTotals.get(s.player_id) || 0;
      playerTotals.set(s.player_id, total + s.score_100 + s.score_100_plus);
    });

    const sorted = Array.from(playerTotals.entries())
      .map(([playerId, total]) => ({ playerId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((item, index) => ({
      rank: index + 1,
      playerId: item.playerId,
      playerName:
        this.playersService.getPlayer(item.playerId)?.name || 'Unknown',
      value: item.total,
      season: 'All-Time',
      matchday: 0,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_100plus_total',
      metricName: 'Meiste 100+ (Gesamt)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateHighestCheckout(allStats: StatRow[]): AllTimeRecord {
    const sorted = [...allStats]
      .filter((s) => s.high_finish > 0)
      .sort((a, b) => b.high_finish - a.high_finish)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.high_finish,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'highest_checkout',
      metricName: 'Höchster Checkout',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMostLegsWonSingleGame(allStats: StatRow[]): AllTimeRecord {
    const sorted = [...allStats]
      .filter((s) => s.legs_won > 0)
      .sort((a, b) => b.legs_won - a.legs_won)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((s, index) => ({
      rank: index + 1,
      playerId: s.player_id,
      playerName: this.playersService.getPlayer(s.player_id)?.name || 'Unknown',
      value: s.legs_won,
      season: s.season,
      matchday: s.matchday,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_legs_won_game',
      metricName: 'Meiste Legs gewonnen (Spiel)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }

  private calculateMostLegsWonTotal(allStats: StatRow[]): AllTimeRecord {
    const playerTotals = new Map<number, number>();

    allStats.forEach((s) => {
      const total = playerTotals.get(s.player_id) || 0;
      playerTotals.set(s.player_id, total + s.legs_won);
    });

    const sorted = Array.from(playerTotals.entries())
      .map(([playerId, total]) => ({ playerId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const top5: TopPlayerRecord[] = sorted.map((item, index) => ({
      rank: index + 1,
      playerId: item.playerId,
      playerName:
        this.playersService.getPlayer(item.playerId)?.name || 'Unknown',
      value: item.total,
      season: 'All-Time',
      matchday: 0,
    }));

    const topRecord = top5[0];

    return {
      metricKey: 'most_legs_won_total',
      metricName: 'Meiste Legs gewonnen (Gesamt)',
      topValue: topRecord?.value || 0,
      topPlayerId: topRecord?.playerId || 0,
      topPlayerName: topRecord?.playerName || 'N/A',
      formatType: 'number',
      top5,
    };
  }
}
