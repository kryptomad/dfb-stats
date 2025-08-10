import { Injectable } from '@angular/core';
import { PlayersService } from './players.service';
import { ChartThemeService } from './chart-theme.service';

@Injectable({ providedIn: 'root' })
export class OskarstatsSpieltagverlaufService {
  constructor(
    private playersService: PlayersService,
    private chartTheme: ChartThemeService
  ) {}

  // x-Achse = Spieltage, y-Achse = Punkte pro Spieltag in einer Saison
buildSpieltagverlaufData(enrichedStats: any[], season: string | number) {
  if (!Array.isArray(enrichedStats) || enrichedStats.length === 0) {
    return { labels: [], datasets: [] };
  }

  // Feld-Reader
  const getLegsWon = (row: any) => Number(row.legs_won ?? 0);
  const getMatchday = (row: any) =>
    Number(row.matchday ?? row.match_day ?? row.spieltag ?? 0);
  const getPlayerId = (row: any) => Number(row.player_id);

  // Season filtern (wie bisher, ohne Helper)
  const seasonStr = String(season).trim();
  const dataSeason = enrichedStats.filter(s => String(s.season).trim() === seasonStr);

  // Spieltage (unique + sortiert)
  const matchdays = Array.from(new Set<number>(dataSeason.map(getMatchday)))
    .filter(n => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  // Spieler dieser Season
  const playerIds = Array.from(new Set<number>(dataSeason.map(getPlayerId)));

  // Datasets: SUM(legs_won) je Spieltag & Spieler
  const datasets = playerIds.map(id => {
    const name =
      this.playersService.getPlayer(id)?.name ??
      dataSeason.find(s => getPlayerId(s) === id)?.playerName ??
      `ID ${id}`;

    const color = this.playersService.getPlayer(id)?.color ?? '#999999';

    const data = matchdays.map(md =>
      dataSeason
        .filter(s => getMatchday(s) === md && getPlayerId(s) === id)
        .reduce((sum, s) => sum + getLegsWon(s), 0)
    );

    return {
      label: name,
      data,
      borderColor: color,
      backgroundColor: this.chartTheme.hexToRgba(color, 0.33),
      pointBackgroundColor: color,
      pointRadius: 3,
      fill: false,
      tension: 0.2,
    };
  });

  return { labels: matchdays.map(String), datasets };
}
}
