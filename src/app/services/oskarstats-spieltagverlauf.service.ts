import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';
import { StatsQueryService } from './stats-query.service';

@Injectable({ providedIn: 'root' })
export class OskarstatsSpieltagverlaufService {
  constructor(
    private chartTheme: ChartThemeService,
    private playersService: PlayersService,
    private statsQueryService: StatsQueryService,
  ) {}

  buildSpieltagverlaufData$(season: string | number) {
    return this.statsQueryService.sumLegsWonByPlayerPerMatchday$(season).pipe(
      map((result: any) => {
        const datasets = result.datasets.map((ds: any) => {
          const color =
            this.playersService.getPlayer(ds.player_id)?.color ?? '#999';
          return {
            ...ds,
            borderColor: color,
            backgroundColor: this.chartTheme.hexToRgba(color, 0.33),
            pointBackgroundColor: color,
            pointRadius: 3,
            fill: false,
            tension: 0.2,
          };
        });
        return { labels: result.labels, datasets };
      }),
    );
  }
}