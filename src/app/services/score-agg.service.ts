import { Injectable } from '@angular/core';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';

type Game = {
  game_id: number;
  season: string;
  matchday: number;
  player1_id: number;
  player2_id: number;
  legs: {
    leg_number: number;
    rounds: {
      round: number;
      p1_score: number | null;
      p2_score: number | null;
    }[];
  }[];
};

const BUCKETS = [26, 41, 45, 60, 100, 140, 180] as const;

@Injectable({ providedIn: 'root' })
export class ScoreAggService {
  constructor(
    private playersService: PlayersService,
    private chartTheme: ChartThemeService,
  ) {}

  /** Top‑5 Scores pro aktiven Spieler (häufigste Werte, Tie‑Break: höherer Score) */
  top5ByPlayerFromGames(
    games: Game[],
    opts: { season?: string | null; first9Only?: boolean } = {},
  ): Record<string, { score: number; freq: number }[]> {
    const { season = null, first9Only = false } = opts;

    const active = this.playersService.getPlayers({ activeOnly: true });
    const activeIds = new Set(active.map((p) => p.id));

    // player_id -> (score -> freq)
    const counts = new Map<number, Map<number, number>>();
    const add = (pid: number, val: number | null) => {
      if (!activeIds.has(pid)) return;
      const s = Number(val);
      if (!Number.isFinite(s) || s <= 0) return; // skip null/0/-1/-2/-3/0
      const m = counts.get(pid) ?? new Map<number, number>();
      m.set(s, (m.get(s) ?? 0) + 1);
      counts.set(pid, m);
    };

    for (const g of games) {
      if (season && g.season !== season) continue;
      for (const leg of g.legs) {
        for (const r of leg.rounds) {
          if (first9Only && r.round > 3) continue;
          add(g.player1_id, r.p1_score);
          add(g.player2_id, r.p2_score);
        }
      }
    }

    const out: Record<string, { score: number; freq: number }[]> = {};
    counts.forEach((m, pid) => {
      const arr = [...m.entries()]
        .map(([score, freq]) => ({ score, freq }))
        .sort((a, b) => b.freq - a.freq || b.score - a.score)
        .slice(0, 5);
      const name = this.playersService.getPlayer(pid)?.name ?? `ID ${pid}`;
      out[name] = arr;
    });

    return out;
  }

  /** Radar‑Daten (Häufigkeit je Bucket pro aktiven Spieler) */
  radarData(
    games: Game[],
    opts: { season?: string | null; first9Only?: boolean } = {},
  ) {
    const { season = null, first9Only = false } = opts;

    const players = this.playersService.getPlayers({ activeOnly: true });
    const activeIds = new Set(players.map((p) => p.id));

    // player_id -> counts pro Bucket
    const mat = new Map<number, number[]>();
    players.forEach((p) =>
      mat.set(
        p.id,
        BUCKETS.map(() => 0),
      ),
    );

    const bump = (pid: number, raw: number | null) => {
      if (!activeIds.has(pid)) return;
      const s = Number(raw);
      if (!Number.isFinite(s) || s <= 0) return; // skip null/0/-1/-2/-3/0
      const idx = BUCKETS.indexOf(s as any);
      if (idx === -1) return;
      mat.get(pid)![idx] += 1;
    };

    for (const g of games) {
      if (season && g.season !== season) continue;
      for (const leg of g.legs) {
        for (const r of leg.rounds) {
          if (first9Only && r.round > 3) continue;
          bump(g.player1_id, r.p1_score);
          bump(g.player2_id, r.p2_score);
        }
      }
    }

    return {
      labels: BUCKETS.map(String),
      datasets: players.map((p) => {
        const color = this.playersService.getPlayer(p.id)?.color ?? '#999999';
        return {
          label: p.name,
          data: mat.get(p.id) ?? BUCKETS.map(() => 0),
          borderColor: color,
          backgroundColor: this.chartTheme.hexToRgba(color, 0.33),
          pointRadius: 2,
          fill: true,
        };
      }),
    };
  }
}
