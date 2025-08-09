import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { TableModule } from 'primeng/table';

import { GamesService } from '../../services/games.service';
import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarsiegerService } from '../../services/oskarsieger.service';

@Component({
  standalone: true,
  selector: 'app-oskarstatistiken',
  imports: [
    CommonModule,
    NgForOf,
    NgIf,
    Card,
    ChartModule,
    TimelineModule,
    TableModule,
  ],
  // providers: [StatsService, PlayersService, OskarsiegerService, GamesService], // brauchst du i.d.R. nicht, da providedIn:'root'
  templateUrl: './oskarstatistiken.component.html',
  styleUrls: ['./oskarstatistiken.component.scss'],
})
export class OskarstatistikenComponent implements OnInit {
  formkurveData: any = {};
  formkurveOptions: any = {};
  oskarsiegerRaw: { jahr: number; player_id: number }[] = [];
  letzteSpieltage: any[] = [];
  jahrestabelle: any[] = [];
  aktuelleSaison = '';
  barChartData: any;
  barChartOptions: any;

  constructor(
    private statsService: StatsService,
    private oskarsiegerService: OskarsiegerService,
    private playersService: PlayersService,
    private gamesService: GamesService,
  ) {}

  ngOnInit() {
    // 1) Oskarsieger (manuell) sofort
    this.oskarsiegerRaw = this.oskarsiegerService.getManualWinners();

    // 2) Stats laden → danach Formkurve + Oskarsieger (auto)
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.oskarsiegerRaw = this.oskarsiegerService.getAllWinnersMerged();

      const dark = this.isDarkMode();
      const color = dark ? '#f3f3f3ff' : '#464646ff';
      const gridColor = dark ? '#363636ff' : '#dadadaff';

      this.formkurveData = this.statsService.getFormkurveData();
      this.formkurveOptions = {
        responsive: true,
        plugins: {
          legend: { labels: { color } },
          datalabels: { color },
        },
        scales: {
          x: { ticks: { color }, grid: { color: gridColor } },
          y: { ticks: { color }, grid: { color: gridColor } },
        },
      };

      // 3) Oskar – aktuelle Saison & gestapelte Punktevorher/neu
      this.buildOskarCharts();
    });
  }

  // -------- Helpers --------

  private isDarkMode() {
    return (
      document.documentElement.classList.contains('app-dark') ||
      document.documentElement.classList.contains('dark')
    );
  }

  private parseSeasonStartYear(season: unknown): number | null {
    if (typeof season === 'number' && Number.isFinite(season)) return season;
    const s = String(season ?? '');
    const m = s.match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  private hexToRgba(hex: string, alpha: number): string {
    hex = hex.replace('#', '');
    if (hex.length === 3)
      hex = hex
        .split('')
        .map((x) => x + x)
        .join('');
    const num = parseInt(hex, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  private buildOskarCharts() {
    // Primär-/Sekundärfarben aus CSS-Variablen ziehen
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyle.getPropertyValue('--primary-color').trim() || '#2196F3';
    const secondaryColor =
      rootStyle.getPropertyValue('--text-color-secondary').trim() || '#aaaaaa';
    const primaryColorRgba = this.hexToRgba(primaryColor, 0.55);
    const secondaryColorRgba = this.hexToRgba(secondaryColor, 0.4);

    // aktuelle Saison (neueste Season nach Startjahr)
    const allGames = this.gamesService.getAllGames();
    const seasons = Array.from(new Set(allGames.map((g) => String(g.season))));
    seasons.sort(
      (a, b) =>
        (this.parseSeasonStartYear(b) ?? 0) -
        (this.parseSeasonStartYear(a) ?? 0),
    );
    this.aktuelleSaison = seasons[0] ?? '';

    // Spiele der aktuellen Saison
    const aktuelleSpiele = allGames.filter(
      (s) => String(s.season) === this.aktuelleSaison,
    );
    if (!aktuelleSpiele.length) return;

    // aktuellster Spieltag
    const matchdays = aktuelleSpiele
      .map((s) => Number(s.matchday))
      .filter((n) => Number.isFinite(n));
    const maxMatchday = matchdays.length ? Math.max(...matchdays) : 0;

    // Tabellenstände jetzt und vorher
    const tabelleJetzt =
      this.gamesService.getJahrestabelleBisSpieltag(maxMatchday);
    const tabelleVorher = this.gamesService.getJahrestabelleBisSpieltag(
      Math.max(0, maxMatchday - 1),
    );

    // Trends + Diff-Punkte
    this.jahrestabelle = tabelleJetzt.map((eintrag) => {
      const vorher = tabelleVorher.find((e) => e.name === eintrag.name);
      const altePunkte = vorher ? Number(vorher.punkte) : 0;
      const alterPlatz = vorher ? vorher.platz : eintrag.platz;
      const trend = !vorher
        ? 'same'
        : vorher.platz > eintrag.platz
          ? 'up'
          : vorher.platz < eintrag.platz
            ? 'down'
            : 'same';
      return { ...eintrag, altePunkte, alterPlatz, trend };
    });

    const aktuellerSpieltag = maxMatchday;
    const neuLabel = `Punkte hinzu nach Spieltag ${aktuellerSpieltag}`;
    const axisColor = this.isDarkMode() ? '#e5e7eb' : '#575757ff';

    // Chart-Daten
    this.barChartData = {
      labels: this.jahrestabelle.map((e) => e.name),
      datasets: [
        {
          label: 'Punkte vorher',
          backgroundColor: secondaryColorRgba,
          data: this.jahrestabelle.map((e) => Number(e.altePunkte)),
          stack: 'punkte',
        },
        {
          label: neuLabel,
          backgroundColor: primaryColorRgba,
          data: this.jahrestabelle.map(
            (e) => Number(e.punkte) - Number(e.altePunkte),
          ),
          stack: 'punkte',
        },
      ],
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: true,
          labels: { color: axisColor },
        },
        datalabels: { display: false },
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: axisColor },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { color: axisColor },
        },
      },
    };
  }

  // Timeline-Getter (mit Player-Daten)
  get oskarsiegerTimeline() {
    return this.oskarsiegerRaw.map((entry) => ({
      ...entry,
      player: this.playersService.getPlayerById(entry.player_id),
    }));
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (!img.dataset['fallback']) {
      img.dataset['fallback'] = '1';
      img.src = 'assets/players/dummy.png';
    }
  }
}
