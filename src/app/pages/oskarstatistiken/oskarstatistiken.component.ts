import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { TableModule } from 'primeng/table';

import { GamesService } from '../../services/games.service';
import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarstatsOskarsiegerTimelineService } from '../../services/oskarstats-oskarsieger-timeline.service';
import { OskarstatsPunkteentwicklungService } from '../../services/oskarstats-punkteentwicklung.service';
import { ChartThemeService } from '../../services/chart-theme.service';

@Component({
  standalone: true,
  selector: 'app-oskarstatistiken',
  imports: [CommonModule, NgIf, Card, ChartModule, TimelineModule, TableModule],
  templateUrl: './oskarstatistiken.component.html',
  styleUrls: ['./oskarstatistiken.component.scss'],
})
export class OskarstatistikenComponent implements OnInit {
  constructor(
    private statsService: StatsService,
    private oskarstatsOskarsiegerTimelineService: OskarstatsOskarsiegerTimelineService,
    private oskarstatsPunkteentwicklungService: OskarstatsPunkteentwicklungService,
    private playersService: PlayersService,
    private gamesService: GamesService,
    private chartTheme: ChartThemeService,
  ) {}

  //#region 1) JAHRESTABELLE (Bar-Chart + Tabelle)
  aktuelleSaison = '';
  jahrestabelle: any[] = [];
  barChartData: any = { labels: [], datasets: [] };
  barChartOptions: any = {};

  /** Hilfsparser für Seasons (Startjahr extrahieren) */
  private parseSeasonStartYear(season: unknown): number | null {
    if (typeof season === 'number' && Number.isFinite(season)) return season;
    const s = String(season ?? '');
    const m = s.match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  /** Berechnet aktuelle Jahrestabelle + gestapeltes Balkendiagramm */
  private buildOskarCharts() {
    // Fills aus Theme/CSS
    const primaryFill = this.chartTheme.getPrimaryFill(0.55);
    const secondary = this.chartTheme.getCssVar(
      '--text-color-secondary',
      '#aaaaaa',
    );
    const secondaryFill = this.chartTheme.hexToRgba(secondary, 0.4);

    // neueste Saison nach Startjahr
    const allGames = this.gamesService.getAllGames();
    const seasons = Array.from(
      new Set(allGames.map((g) => String(g.season))),
    ).sort(
      (a, b) =>
        (this.parseSeasonStartYear(b) ?? 0) -
        (this.parseSeasonStartYear(a) ?? 0),
    );
    this.aktuelleSaison = seasons[0] ?? '';

    // Spiele & letzter Spieltag
    const aktuelleSpiele = allGames.filter(
      (s) => String(s.season) === this.aktuelleSaison,
    );
    if (!aktuelleSpiele.length) return;

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

    // Trends + Diff-Punkte einrechnen
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

    const neuLabel = `Punkte hinzu nach Spieltag ${maxMatchday}`;

    // Chart-Daten & Optionen
    this.barChartData = {
      labels: this.jahrestabelle.map((e) => e.name),
      datasets: [
        {
          label: 'Punkte vorher',
          backgroundColor: secondaryFill,
          data: this.jahrestabelle.map((e) => Number(e.altePunkte)),
          stack: 'punkte',
        },
        {
          label: neuLabel,
          backgroundColor: primaryFill,
          data: this.jahrestabelle.map(
            (e) => Number(e.punkte) - Number(e.altePunkte),
          ),
          stack: 'punkte',
        },
      ],
    };

    this.barChartOptions = this.chartTheme.cartesianOptions({
      maintainAspectRatio: false,
      plugins: { datalabels: { display: false } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { display: false } },
      },
    });
  }
  //#endregion

  //#region 2) OSKARSIEGER (Timeline)
  oskarsiegerRaw: { jahr: number; player_id: number }[] = [];

  /** Angereicherte Timeline-Einträge inkl. Player-Objekt */
  get oskarsiegerTimeline() {
    return this.oskarsiegerRaw.map((entry) => ({
      ...entry,
      player: this.playersService.getPlayer(entry.player_id),
    }));
  }
  //#endregion

  //#region 3) PUNKTEENTWICKLUNG (Formkurve/Liniendiagramm)
  formkurveData: any = {};
  formkurveOptions: any = {};
  //#endregion

  //#region LEBENSZYKLUS
  ngOnInit() {
    // 1) Theme / Options initialisieren
    this.barChartOptions = this.chartTheme.cartesianOptions({
      maintainAspectRatio: false,
    });
    this.chartTheme.watchDomTheme();

    // 2) Startzustand: manuelle Sieger zeigen (optional)
    this.oskarsiegerRaw =
      this.oskarstatsOskarsiegerTimelineService.getManualWinners();

    // 3) Stats laden -> danach alles aufbauen
    this.statsService.loadEnrichedStats().subscribe((enriched) => {
      // Timeline
      this.oskarsiegerRaw =
        this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();

      // Punkteentwicklung
      this.formkurveData =
        this.oskarstatsPunkteentwicklungService.buildFormkurveData(enriched);

      // Chart-Optionen für Punkteentwicklung
      this.formkurveOptions = this.chartTheme.cartesianOptions({});

      // Jahrestabelle inkl. Chart
      this.buildOskarCharts();
    });
  }
  //#endregion
}
