import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';
import { StatsQueryService, SeriesDataset } from './stats-query.service';

export interface SeasonChart {
  labels: string[];
  datasets: SeriesDataset[];
}

@Injectable({ providedIn: 'root' })
export class OskarstatsJahresvergleichService {
  constructor(
    private chartTheme: ChartThemeService,
    private playersService: PlayersService,
    private statsQueryService: StatsQueryService,
  ) {}

  /** Jahresvergleich: SUM(legs_won) je Spieler & Season → Chart.js-Daten */
  buildJahresvergleichData$(): Observable<{
    labels: string[];
    datasets: any[];
  }> {
    return this.statsQueryService.sumLegsWonByPlayerPerSeason$().pipe(
      map((chart: SeasonChart) => {
        const styled = chart.datasets.map((ds: SeriesDataset) => {
          const color =
            this.playersService.getPlayer(ds.player_id)?.color ?? '#999999';
          return {
            label: ds.label,
            data: ds.data,
            borderColor: color,
            backgroundColor: this.chartTheme.hexToRgba(color, 0.33),
            pointBackgroundColor: color,
            pointRadius: 3,
            fill: false,
            tension: 0.2,
          };
        });

        return { labels: chart.labels, datasets: styled };
      }),
    );
  }
}
