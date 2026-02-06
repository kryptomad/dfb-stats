// src/app/services/stats-query.service.ts
import { Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { StatsService, StatRow } from './stats.service';
import * as SeasonMatchday from '../shared/season-matchday.helpers';
import { PlayersService } from './players.service';

export interface SeriesDataset {
  player_id: number;
  label: string;
  data: number[];
}

export interface MatchdayChart {
  labels: string[];
  datasets: SeriesDataset[];
}

export interface SeasonChart {
  labels: string[];
  datasets: SeriesDataset[];
}

@Injectable({ providedIn: 'root' })
export class StatsQueryService {
  constructor(
    private stats: StatsService,
    private players: PlayersService,
  ) {}

  getSeasons$(): Observable<string[]> {
    return this.stats
      .getStatsNorm$()
      .pipe(map((rows: StatRow[]) => SeasonMatchday.listSeasons(rows)));
  }

  getLatestSeason$(): Observable<string | null> {
    return this.stats
      .getStatsNorm$()
      .pipe(map((rows: StatRow[]) => SeasonMatchday.latestSeason(rows)));
  }

  getMatchdays$(season: string | number): Observable<number[]> {
    return this.stats
      .getStatsNorm$()
      .pipe(
        map((rows: StatRow[]) => SeasonMatchday.listMatchdays(rows, season)),
      );
  }

  getFullStatsBySeason$(season: string | number): Observable<StatRow[]> {
    return this.stats.getStatsRaw().pipe(
      map((rows) => {
        // First normalize all rows
        const normalized = rows.map(
          (r: any) =>
            ({
              game_id: Number(r.game_id),
              season: r.season,
              matchday: Number(r.matchday ?? r.match_day ?? r.spieltag ?? 0),
              player_id: Number(r.player_id),
              player1_id: Number(r.player1_id),
              player2_id: Number(r.player2_id),
              sets_won: Number(r.sets_won ?? 0),
              legs_played: Number(r.legs_played ?? 0),
              legs_won: Number(r.legs_won ?? 0),
              legs_lost: Number(r.legs_lost ?? 0),
              darts_thrown: Number(r.darts_thrown ?? 0),
              avg_darts: Number(r.avg_darts ?? 0),
              avg_3dart: Number(r.avg_3dart ?? 0),
              avg_first9: Number(r.avg_first9 ?? 0),
              best_leg: r.best_leg !== null ? Number(r.best_leg) : null,
              worst_leg: r.worst_leg !== null ? Number(r.worst_leg) : null,
              high_finish: Number(r.high_finish ?? 0),
              high_score: Number(r.high_score ?? 0),
              score_100: Number(r.score_100 ?? 0),
              score_100_plus: Number(r.score_100_plus ?? 0),
              score_140: Number(r.score_140 ?? 0),
              score_140_plus: Number(r.score_140_plus ?? 0),
              score_180: Number(r.score_180 ?? 0),
              keep_pct: Number(r.keep_pct ?? 0),
              keep_ratio: r.keep_ratio || '0 / 0',
              break_pct: Number(r.break_pct ?? 0),
              break_ratio: r.break_ratio || '0 / 0',
            }) as StatRow,
        );
        // Handle "All-Time" by returning all normalized rows
        if (season === 'All-Time' || season === null) {
          return normalized;
        }
        // Otherwise filter by season using the helper
        return SeasonMatchday.filterBySeason(normalized, season);
      }),
      shareReplay(1),
    );
  }

  sumLegsWonByPlayerPerMatchday$(season: string | number): Observable<{
    labels: string[];
    datasets: { label: string; data: number[]; player_id: number }[];
  }> {
    return this.stats.getStatsNorm$().pipe(
      map((rows: StatRow[]) => {
        const seasonRows = SeasonMatchday.filterBySeason(rows, season);
        const matchdays = SeasonMatchday.listMatchdays(rows, season);
        const playerIds = Array.from(
          new Set(seasonRows.map((r) => r.player_id)),
        );

        const datasets = playerIds.map((id) => {
          const label = this.players.getPlayer(id)?.name ?? `ID ${id}`;
          const data = matchdays.map((md) =>
            seasonRows
              .filter((r) => r.matchday === md && r.player_id === id)
              .reduce((sum, r) => sum + r.legs_won, 0),
          );
          return { label, data, player_id: id };
        });

        return { labels: matchdays.map(String), datasets };
      }),
    );
  }

  /** SUM(legs_won) je Spieler über alle Seasons (für Jahresvergleich) */
  sumLegsWonByPlayerPerSeason$(): Observable<SeasonChart> {
    return this.stats.getStatsNorm$().pipe(
      map((rows) => {
        // 1) Labels (Seasons, normalisiert & sortiert)
        const seasons = SeasonMatchday.listSeasons(rows); // string[]

        // 2) Alle beteiligten Spieler
        const playerIds = Array.from(new Set(rows.map((r) => r.player_id)));

        // 3) Datensätze pro Spieler
        const datasets = playerIds.map((id) => {
          const label = this.players.getPlayer(id)?.name ?? `ID ${id}`;
          const data = seasons.map((season) => {
            const seasonRows = SeasonMatchday.filterBySeason(rows, season);
            return seasonRows
              .filter((r) => r.player_id === id)
              .reduce((sum, r) => sum + r.legs_won, 0);
          });
          return { player_id: id, label, data } as SeriesDataset;
        });

        return { labels: seasons, datasets } as SeasonChart;
      }),
    );
  }
}
