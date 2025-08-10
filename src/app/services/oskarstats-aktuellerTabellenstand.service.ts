// src/app/services/oskarstats-aktueller-tabellenstand.service.ts
import { Injectable } from '@angular/core';
import { GamesService } from './games.service';
import { ChartThemeService } from './chart-theme.service';

export interface TabellenstandResult {
  aktuelleSaison: string;
  jahrestabelle: any[];
  barChartData: { labels: string[]; datasets: any[] };
  barChartOptions: any;
}

@Injectable({ providedIn: 'root' })
export class OskarstatsAktuellerTabellenstandService {
  constructor(
    private gamesService: GamesService,
    private chartTheme: ChartThemeService,
  ) {}

  /** kleines Helferlein: Startjahr aus Season ermitteln */
  private parseSeasonStartYear(season: unknown): number | null {
    if (typeof season === 'number' && Number.isFinite(season)) return season;
    const s = String(season ?? '');
    const m = s.match(/\b(19|20)\d{2}\b/);
    return m ? parseInt(m[0], 10) : null;
  }

  /** Baut aktuelle Jahrestabelle + gestapeltes Bar‑Chart (wie vorher in der Komponente) */
  build(): TabellenstandResult {
    // Theme-Farben
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
    const aktuelleSaison = seasons[0] ?? '';

    // Spiele & letzter Spieltag
    const aktuelleSpiele = allGames.filter(
      (s) => String(s.season) === aktuelleSaison,
    );
    if (!aktuelleSpiele.length) {
      return {
        aktuelleSaison,
        jahrestabelle: [],
        barChartData: { labels: [], datasets: [] },
        barChartOptions: this.chartTheme.getLineChartOptions({
          maintainAspectRatio: false,
        }),
      };
    }

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
    const jahrestabelle = tabelleJetzt.map((eintrag) => {
      const vorher = tabelleVorher.find((e: any) => e.name === eintrag.name);
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

    const barChartData = {
      labels: jahrestabelle.map((e: any) => e.name),
      datasets: [
        {
          label: 'Punkte vorher',
          backgroundColor: secondaryFill,
          data: jahrestabelle.map((e: any) => Number(e.altePunkte)),
          stack: 'punkte',
        },
        {
          label: neuLabel,
          backgroundColor: primaryFill,
          data: jahrestabelle.map(
            (e: any) => Number(e.punkte) - Number(e.altePunkte),
          ),
          stack: 'punkte',
        },
      ],
    };

    const barChartOptions = this.chartTheme.getLineChartOptions({
      maintainAspectRatio: false,
      plugins: { datalabels: { display: false } },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { display: false } },
      },
    });

    return { aktuelleSaison, jahrestabelle, barChartData, barChartOptions };
  }
}
