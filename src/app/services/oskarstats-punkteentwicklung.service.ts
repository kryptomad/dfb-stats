import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';

@Injectable({ providedIn: 'root' })
export class OskarstatsPunkteentwicklungService {
  enrichedStats: any[] = [];

  constructor(
    private playersService: PlayersService,
    private chartTheme: ChartThemeService,
    private http: HttpClient,
  ) {}

  loadEnrichedStats2(): Observable<any> {
    return this.http.get<any[]>('../../assets/stats.json').pipe(
      map((stats) =>
        stats.map((stat) => ({
          ...stat,
          playerName:
            this.playersService.getPlayer(stat.player_id)?.name ??
            `ID ${stat.player_id}`,
        })),
      ),
      tap((data) => (this.enrichedStats = data)),
    );
  }

  getFormkurveData2(): any {
    if (!this.enrichedStats.length) return { labels: [], datasets: [] };

    const seasons = Array.from(
      new Set(this.enrichedStats.map((s) => s.season)),
    ).sort();

    const playerNames = Array.from(
      new Set(this.enrichedStats.map((s) => s.playerName)),
    );

    const datasets = playerNames.map((player) => {
      // Player-ID aus den Stats holen
      const playerId = this.enrichedStats.find(
        (s) => s.playerName === player,
      )?.player_id;
      const color = this.playersService.getPlayer(playerId)?.color ?? '#999999';

      return {
        label: player,
        data: seasons.map((season) =>
          this.enrichedStats
            .filter((s) => s.season === season && s.playerName === player)
            .reduce((sum, s) => sum + (s.legs_won || 0), 0),
        ),
        borderColor: color,
        backgroundColor: this.chartTheme.hexToRgba(color, 0.15),
        fill: false,
        tension: 0.2,
      };
    });

    return {
      labels: seasons.map((s) => s.toString()),
      datasets,
    };
  }
}
