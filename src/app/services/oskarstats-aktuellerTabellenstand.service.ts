import { Injectable } from '@angular/core';
import { GamesService } from './games.service';
import { ChartThemeService } from './chart-theme.service';
import * as SeasonMatchday from '../shared/season-matchday.helpers';

export interface TabellenstandResult {
  aktuelleSaison: string;
  jahrestabelle: any[];
  barChartData: { labels: string[]; datasets: any[] };
  barStackedOptions: any;
}

@Injectable({ providedIn: 'root' })
export class OskarstatsAktuellerTabellenstandService {
  constructor(
    private gamesService: GamesService,
    private chartTheme: ChartThemeService,
  ) {}

  /** Baut aktuelle Jahrestabelle + gestapeltes Bar‑Chart (wie vorher in der Komponente) */
  build(): TabellenstandResult {
    // neueste Saison nach Startjahr (jetzt mit Helper)
    const allGames = this.gamesService.getAllGames();
    const seasons = Array.from(
      new Set(allGames.map((g) => String(g.season))),
    ).sort(
      (a, b) =>
        SeasonMatchday.seasonStartYear(b) - SeasonMatchday.seasonStartYear(a),
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
        barStackedOptions: this.chartTheme.getBarStackedOptions({}),
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
    const jahrestabelle = tabelleJetzt.map((eintrag: any) => {
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
    const primary = this.chartTheme.getPrimary();
    const primaryFill = this.chartTheme.getPrimaryFill(0.55);
    const secondary = this.chartTheme.getSecondary();
    const secondaryFill = this.chartTheme.getSecondaryFill(0.4);

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

    console.log('PRIMARY ->', primary, 'FILL ->', primaryFill);
    console.log(
      'DATASET COLORS ->',
      barChartData.datasets.map((d) => d.backgroundColor),
    );
    return {
      aktuelleSaison,
      jahrestabelle,
      barChartData,
      barStackedOptions: this.chartTheme.getBarStackedOptions(),
    };
  }
}
