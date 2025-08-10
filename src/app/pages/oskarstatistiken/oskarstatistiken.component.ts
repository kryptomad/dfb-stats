import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { TableModule } from 'primeng/table';
import { GamesService } from '../../services/games.service';
import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarsiegerService } from '../../services/oskarsieger.service';
import { ChartThemeService } from '../../services/chart-theme.service';

interface Jahreszeile {
  name: string;
  altePunkte: number;
  punkte: number;
}

@Component({
  standalone: true,
  selector: 'app-oskarstatistiken',
  imports: [CommonModule, NgIf, Card, ChartModule, TimelineModule, TableModule],
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
  barChartData: any = { labels: [], datasets: [] };
  barChartOptions: any = {};

  constructor(
    private statsService: StatsService,
    private oskarsiegerService: OskarsiegerService,
    private playersService: PlayersService,
    private gamesService: GamesService,
    private chartTheme: ChartThemeService,
  ) {}

  ngOnInit() {
    this.barChartOptions = this.chartTheme.cartesianOptions({
      maintainAspectRatio: false,
    });

    this.chartTheme.watchDomTheme();

    this.oskarsiegerRaw = this.oskarsiegerService.getManualWinners();

    this.statsService.loadEnrichedStats().subscribe(() => {
      this.oskarsiegerRaw = this.oskarsiegerService.getAllWinnersMerged();

      this.formkurveData = this.statsService.getFormkurveData();
      this.formkurveOptions = this.chartTheme.cartesianOptions();

      this.buildOskarCharts();
    });
  }

  // -------- Helpers --------

  private parseSeasonStartYear(season: unknown): number | null {
    if (typeof season === 'number' && Number.isFinite(season)) return season;
    const s = String(season ?? '');
    const m = s.match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  private buildOskarCharts() {
    // Fills aus Theme/CSS
    const primaryFill = this.chartTheme.getPrimaryFill(0.55);
    const secondary = this.chartTheme.getCssVar(
      '--text-color-secondary',
      '#aaaaaa',
    );
    const secondaryFill = this.chartTheme.hexToRgba(secondary, 0.4);

    // aktuelle Saison (neueste Season nach Startjahr)
    const allGames = this.gamesService.getAllGames();
    const seasons = Array.from(
      new Set(allGames.map((g) => String(g.season))),
    ).sort(
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

    // Chart-Daten
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

    // Optionen zentral + Stack/No-Grid als Extra
    this.barChartOptions = this.chartTheme.cartesianOptions({
      maintainAspectRatio: false,
      plugins: { datalabels: { display: false } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { display: false } },
      },
    });
  }

  // Timeline-Getter (mit Player-Daten)
  get oskarsiegerTimeline() {
    return this.oskarsiegerRaw.map((entry) => ({
      ...entry,
      player: this.playersService.getPlayer(entry.player_id),
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
