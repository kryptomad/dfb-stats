import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { StatsService, StatRow } from './stats.service';
import * as SeasonMatchday from '../shared/season-matchday.helpers';
import { PlayersService } from './players.service';

export interface SeriesDataset {
  player_id: number;
  label: string;   // Spielername
  data: number[];  // Werte je Label (hier: je Season)
}

export interface MatchdayChart {
  labels: string[];        // Spieltage als Strings: ["1","2","3",...]
  datasets: SeriesDataset[];
}

export interface SeasonChart {
  labels: string[];        // Seasons, z. B. ["2018","2019","2020/2021",...]
  datasets: SeriesDataset[]; // je Spieler eine Serie
}

@Injectable({ providedIn: 'root' })
export class StatsQueryService {
  constructor(private stats: StatsService, private players: PlayersService) {}

  getSeasons$(): Observable<string[]> {
    return this.stats.getStatsNorm$().pipe(map(rows => SeasonMatchday.listSeasons(rows)));
  }

  getMatchdays$(season: string | number): Observable<number[]> {
    return this.stats.getStatsNorm$().pipe(map(rows => SeasonMatchday.listMatchdays(rows, season)));
  }

  /** Spieltagsverlauf: SUM(legs_won) je Spieler & Spieltag */
  sumLegsWonByPlayerPerMatchday$(season: string | number):
    Observable<{ labels: string[]; datasets: { label: string; data: number[]; player_id: number }[] }>
  {
    return this.stats.getStatsNorm$().pipe(
      map((rows: StatRow[]) => {
        const seasonRows = SeasonMatchday.filterBySeason(rows, season);
        const matchdays = SeasonMatchday.listMatchdays(rows, season);
        const playerIds = Array.from(new Set(seasonRows.map(r => r.player_id)));

        const datasets = playerIds.map(id => {
          const label = this.players.getPlayer(id)?.name ?? `ID ${id}`;
          const data = matchdays.map(md =>
            seasonRows
              .filter(r => r.matchday === md && r.player_id === id)
              .reduce((sum, r) => sum + r.legs_won, 0)
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
    map(rows => {
      // 1) Labels (Seasons, normalisiert & sortiert)
      const seasons = SeasonMatchday.listSeasons(rows); // string[]

      // 2) Alle beteiligten Spieler
      const playerIds = Array.from(new Set(rows.map(r => r.player_id)));

      // 3) Datensätze pro Spieler
      const datasets = playerIds.map(id => {
        const label = this.players.getPlayer(id)?.name ?? `ID ${id}`;
        const data = seasons.map(season => {
          const seasonRows = SeasonMatchday.filterBySeason(rows, season);
          return seasonRows
            .filter(r => r.player_id === id)
            .reduce((sum, r) => sum + r.legs_won, 0);
        });
        return { player_id: id, label, data } as SeriesDataset;
      });

      return { labels: seasons, datasets } as SeasonChart;
    }),
  );
}
}
