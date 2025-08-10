import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { StatsQueryService, SeriesDataset } from './stats-query.service';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';

export interface SeasonChart {
  labels: string[];
  datasets: SeriesDataset[];
}

@Injectable({ providedIn: 'root' })
export class OskarstatsJahresvergleichService {
  constructor(
    private statsQuery: StatsQueryService,
    private players: PlayersService,
    private chartTheme: ChartThemeService,
  ) {}

  /** Jahresvergleich: SUM(legs_won) je Spieler & Season → Chart.js-Daten */
  buildJahresvergleichData$(): Observable<{
    labels: string[];
    datasets: any[];
  }> {
    return this.statsQuery.sumLegsWonByPlayerPerSeason$().pipe(
      map((chart: SeasonChart) => {
        const styled = chart.datasets.map((ds: SeriesDataset) => {
          const color =
            this.players.getPlayer(ds.player_id)?.color ?? '#999999';
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
