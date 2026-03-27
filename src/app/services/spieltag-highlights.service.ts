import { Injectable } from '@angular/core';
import * as rawStatsData from '../../assets/stats.json';
import * as rawLegsData from '../../assets/legs.json';
import { PlayersService } from './players.service';

export interface CheckoutEntry {
  playerName: string;
  playerImage: string;
  value: number;
}

export interface HighScoreEntry {
  playerName: string;
  playerImage: string;
  value: number;
  count: number;
}

export interface ShortGameEntry {
  playerName: string;
  playerImage: string;
  darts: number;
}

export interface AvgEntry {
  playerName: string;
  playerImage: string;
  avg: number;
}

export interface SpieltagHighlights {
  topCheckouts: CheckoutEntry[];
  highScores: HighScoreEntry[];
  shortGames: ShortGameEntry[];
  topAvg3Dart: AvgEntry[];
  topAvgFirst9: AvgEntry[];
  hasData: boolean;
}

@Injectable({ providedIn: 'root' })
export class SpieltagHighlightsService {
  private stats: any[];
  private games: any[];

  constructor(private playersService: PlayersService) {
    this.stats = (Object.create(rawStatsData) as any).default;
    this.games = (Object.create(rawLegsData) as any).default;
  }

  getHighlights(season: string, matchday: number): SpieltagHighlights {
    const mdStats = this.stats.filter(s => s.season === season && s.matchday === matchday);
    const mdGames = this.games.filter(g => g.season === season && g.matchday === matchday);

    return {
      topCheckouts: this.computeTopCheckouts(mdGames),
      highScores: this.computeHighScores(mdStats),
      shortGames: this.computeShortGames(mdGames),
      topAvg3Dart: this.computeTopAvg(mdStats, 'avg_3dart'),
      topAvgFirst9: this.computeTopAvg(mdStats, 'avg_first9'),
      hasData: mdStats.length > 0,
    };
  }

  private playerImage(p: any): string {
    return p?.image ? `assets/players/${p.image}` : 'assets/players/default-avatar.png';
  }

  private computeTopCheckouts(mdGames: any[]): CheckoutEntry[] {
    const checkouts: CheckoutEntry[] = [];

    for (const game of mdGames) {
      for (const leg of game.legs || []) {
        let prevP1Left = 501;
        let prevP2Left = 501;

        for (const round of (leg.rounds || [])) {
          if (round.round <= 0) continue;

          if (round.p1_score !== null && round.p1_score < 0) {
            const p = this.playersService.getPlayer(game.player1_id);
            checkouts.push({ playerName: p?.name || '', playerImage: this.playerImage(p), value: prevP1Left });
          }
          if (round.p2_score !== null && round.p2_score < 0) {
            const p = this.playersService.getPlayer(game.player2_id);
            checkouts.push({ playerName: p?.name || '', playerImage: this.playerImage(p), value: prevP2Left });
          }

          if (round.p1_left != null) prevP1Left = round.p1_left;
          if (round.p2_left != null) prevP2Left = round.p2_left;
        }
      }
    }

    return checkouts.sort((a, b) => b.value - a.value).slice(0, 5);
  }

  private computeHighScores(mdStats: any[]): HighScoreEntry[] {
    const map = new Map<number, { s180: number; s140: number }>();
    for (const s of mdStats) {
      const cur = map.get(s.player_id) || { s180: 0, s140: 0 };
      cur.s180 += s.score_180 || 0;
      cur.s140 += (s.score_140 || 0) + (s.score_140_plus || 0);
      map.set(s.player_id, cur);
    }

    const result: HighScoreEntry[] = [];
    for (const [pid, counts] of map) {
      const p = this.playersService.getPlayer(pid);
      if (counts.s180 > 0) result.push({ playerName: p?.name || '', playerImage: this.playerImage(p), value: 180, count: counts.s180 });
      if (counts.s140 > 0) result.push({ playerName: p?.name || '', playerImage: this.playerImage(p), value: 140, count: counts.s140 });
    }

    return result.sort((a, b) => b.value - a.value || b.count - a.count);
  }

  private computeShortGames(mdGames: any[]): ShortGameEntry[] {
    const result: ShortGameEntry[] = [];
    for (const game of mdGames) {
      for (const leg of game.legs || []) {
        const winnerId = leg.leg_winner_id;
        if (!winnerId) continue;
        const darts = winnerId === game.player1_id ? leg.p1_darts_leg : leg.p2_darts_leg;
        if (darts > 0 && darts <= 21) {
          const p = this.playersService.getPlayer(winnerId);
          result.push({ playerName: p?.name || '', playerImage: this.playerImage(p), darts });
        }
      }
    }
    return result.sort((a, b) => a.darts - b.darts);
  }

  private computeTopAvg(mdStats: any[], field: string): AvgEntry[] {
    const best = new Map<number, number>();

    for (const s of mdStats) {
      const val = s[field] || 0;
      if (val <= 0) continue;
      if (val > (best.get(s.player_id) || 0)) best.set(s.player_id, val);
    }

    const result: AvgEntry[] = [];
    for (const [pid, avg] of best) {
      const p = this.playersService.getPlayer(pid);
      result.push({ playerName: p?.name || '', playerImage: this.playerImage(p), avg });
    }
    return result.sort((a, b) => b.avg - a.avg);
  }
}
