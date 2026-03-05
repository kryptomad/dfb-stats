import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { GamesService } from '../../services/games.service';
import { PlayersService } from '../../services/players.service';
import { NgForOf, NgIf, NgClass, AsyncPipe } from '@angular/common';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { OskarstatsSpieltagverlaufService } from '../../services/oskarstats-spieltagverlauf.service';
import { ChartThemeService } from '../../services/chart-theme.service';
import {
  JahresstatsTopJahreswerteService,
  TopYearStats,
} from '../../services/jahresstats-top-jahreswerte.service';
import { SeasonSelectorService } from '../../services/season-selector.service';
import { StatsService } from '../../services/stats.service';
import { LegsService } from '../../services/legs.service';
import { SpieltagHighlightsService, SpieltagHighlights } from '../../services/spieltag-highlights.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-spieltag',
  imports: [Card, NgForOf, NgIf, NgClass, ChartModule, TableModule, RouterModule, AvatarModule, DropdownModule, FormsModule, AsyncPipe],
  providers: [GamesService],
  templateUrl: './spieltag.component.html',
  styleUrl: './spieltag.component.scss',
})
export class SpieltagComponent implements OnInit {
  letzteSpieltage: any[] = [];
  jahrestabelle: any[] = [];
  aktuelleSaison: string = '';

  // Chart Properties nur DEKLARIEREN (nicht befüllen!)
  barChartData: any;
  barChartOptions: any;
  barChartPlugins = [ChartDataLabels];

  // Spieltagverlauf
  spieltagverlaufSeasons: string[] = [];
  selectedSpieltagverlaufSeason: string | number = '';
  spieltagverlaufData: any;
  formkurveOptions: any = {};

  // Saisonwertungen (Top Jahreswerte)
  topYearsSeasons: { label: string; value: string }[] = [];
  selectedTopYearsSeason: string | null = null;
  topYears$: Observable<TopYearStats[]> = of([]);

  // Spieltag Highlights
  highlights: SpieltagHighlights | null = null;

  constructor(
    private gamesService: GamesService,
    private playersService: PlayersService,
    private spieltagverlaufService: OskarstatsSpieltagverlaufService,
    private chartTheme: ChartThemeService,
    private topJahreswerteService: JahresstatsTopJahreswerteService,
    private seasonSelector: SeasonSelectorService,
    private statsService: StatsService,
    private _legsService: LegsService,
    private highlightsService: SpieltagHighlightsService,
  ) {}

  ngOnInit() {
    this.letzteSpieltage = this.gamesService.getLastNSpieltage(10);
    this.aktuelleSaison = this.gamesService.getCurrentSeason();

    const rootStyle = getComputedStyle(document.documentElement);
    const primaryColor =
      rootStyle.getPropertyValue('--primary-color').trim() || '#2196F3';
    const secondaryColor =
      rootStyle.getPropertyValue('--text-color-secondary').trim() || '#aaa';

    // Helper: HEX nach RGBA konvertieren
    function hexToRgba(hex: string, alpha: number): string {
      // Entferne das '#' falls vorhanden
      hex = hex.replace('#', '');
      // Kurzform (#abc) → #aabbcc
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map((x) => x + x)
          .join('');
      }
      const num = parseInt(hex, 16);
      return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
    }

    const primaryColorRgba = hexToRgba(primaryColor, 0.55);
    const secondaryColorRgba = hexToRgba(secondaryColor, 0.4);

    // 1. Alle Spiele der aktuellen Saison holen
    const aktuelleSpiele = this.gamesService
      .getAllGames()
      .filter((s) => s.season === this.aktuelleSaison);

    // 2. Aktuellster Spieltag bestimmen
    const maxMatchday = Math.max(...aktuelleSpiele.map((s) => s.matchday));

    // Spieltag Highlights
    this.highlights = this.highlightsService.getHighlights(this.aktuelleSaison, maxMatchday);

    // 3. Tabellen für jetzt und für den vorigen Spieltag berechnen
    const tabelleJetzt =
      this.gamesService.getJahrestabelleBisSpieltag(maxMatchday);
    const tabelleVorher = this.gamesService.getJahrestabelleBisSpieltag(
      maxMatchday - 1,
    );

    // 4. Abstand zum Spieler darüber berechnen (inkl. Farbindikator)
    const sorted = [...tabelleJetzt].sort((a, b) => a.platz - b.platz);

    this.jahrestabelle = sorted.map((eintrag, index) => {
      const vorher = tabelleVorher.find((e) => e.name === eintrag.name);
      const altePunkteEintrag = vorher ? vorher.punkte : eintrag.punkte;

      let gapOben: number | null = null;
      let gapChange = 0; // positiv = verbessert, negativ = verschlechtert

      if (index === 0) {
        // 1. Platz: Vorsprung auf 2. Platz
        const zweiter = sorted[1];
        if (zweiter) {
          const vorherZweiter = tabelleVorher.find((e) => e.name === zweiter.name);
          const currentLead = eintrag.punkte - zweiter.punkte;
          const prevLead = altePunkteEintrag - (vorherZweiter ? vorherZweiter.punkte : zweiter.punkte);
          gapOben = currentLead;
          gapChange = currentLead - prevLead;
        }
      } else {
        const oben = sorted[index - 1];
        if (oben) {
          const vorherOben = tabelleVorher.find((e) => e.name === oben.name);
          const currentGap = oben.punkte - eintrag.punkte;
          const prevGap = (vorherOben ? vorherOben.punkte : oben.punkte) - altePunkteEintrag;
          gapOben = currentGap;
          gapChange = -(currentGap - prevGap);
        }
      }

      let gapFarbe: string;
      if (gapChange >= 0) {
        gapFarbe = 'green';
      } else {
        const loss = Math.abs(gapChange);
        if (loss <= 3) gapFarbe = 'orange';
        else if (loss <= 5) gapFarbe = 'red';
        else gapFarbe = 'darkred';
      }

      return {
        ...eintrag,
        altePunkte: altePunkteEintrag,
        alterPlatz: vorher ? vorher.platz : eintrag.platz,
        gapOben,
        gapChange,
        gapFarbe,
      };
    });

    const aktuellerSpieltag = maxMatchday; // wie in deiner Logik
    const altLabel = `Vor Spieltag ${aktuellerSpieltag}`;
    const neuLabel = `Punkte hinzu nach Spieltag ${aktuellerSpieltag}`;

    const isDark = document.documentElement.className.includes('dark');
    const axisColor = isDark ? '#e5e7eb' : '#575757ff';

    // **JETZT** Chartdaten befüllen!
    this.barChartData = {
      labels: this.jahrestabelle.map((e) => e.name),
      datasets: [
        {
          label: 'Punkte vorher',
          backgroundColor: secondaryColorRgba,
          data: this.jahrestabelle.map((e) => Number(e.altePunkte)),
          datalabels: { display: false },
        },
        {
          label: neuLabel,
          backgroundColor: primaryColorRgba,
          data: this.jahrestabelle.map(
            (e) => Number(e.punkte) - Number(e.altePunkte),
          ),
          datalabels: {
            display: (ctx: any) => ctx.dataset.data[ctx.dataIndex] > 0,
            anchor: 'end' as const,
            align: 'end' as const,
            color: primaryColor,
            font: { weight: 'bold' as const, size: 12 },
            formatter: (value: number) => value,
          },
        },
      ],
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            color: axisColor, // <--- Legenden-Textfarbe
          },
        },
        datalabels: { display: false }, // Labels im Balken aus!
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: axisColor, // <--- X-Achsen-Beschriftung
          },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: {
            color: axisColor, // <--- Y-Achsen-Beschriftung
            stepSize: 40,
          },
          max: 120,
        },
      },
    };

    // Spieltagverlauf
    this.formkurveOptions = this.chartTheme.getLineChartOptions({});
    this.spieltagverlaufService.getSeasons$().subscribe((seasons: string[]) => {
      this.spieltagverlaufSeasons = [...seasons].reverse();
      const latest = this.spieltagverlaufSeasons[0] ?? '';
      this.selectedSpieltagverlaufSeason = latest;
      if (latest) {
        this.spieltagverlaufService
          .buildSpieltagverlaufData$(latest)
          .subscribe((chart: any) => {
            this.spieltagverlaufData = chart;
            this.formkurveOptions = this.chartTheme.getLineChartOptions({});
          });
      }
    });

    // Saisonwertungen (Top Jahreswerte)
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.seasonSelector.getSeasons$().subscribe((seasons) => {
        this.topYearsSeasons = seasons.map((s) => ({ label: s, value: s }));
        if (!this.selectedTopYearsSeason && this.topYearsSeasons.length > 0) {
          this.selectedTopYearsSeason = this.topYearsSeasons[0].value;
          this.updateTopYears();
        }
      });
    });
  }

  onSpieltagverlaufSeasonChange(season: string | number) {
    this.selectedSpieltagverlaufSeason = season;
    this.spieltagverlaufService
      .buildSpieltagverlaufData$(season)
      .subscribe((chart: any) => {
        this.spieltagverlaufData = chart;
        this.formkurveOptions = this.chartTheme.getLineChartOptions({});
      });
  }

  onTopYearsSeasonChange() {
    this.updateTopYears();
  }

  private updateTopYears() {
    this.topYears$ = this.topJahreswerteService.getTopYearStats(
      this.selectedTopYearsSeason || '',
    );
  }

  getPlayersOrdered(spieltag: any): {
    left: any;
    right: any;
    leftIsWinner: boolean;
  } {
    const p1IsWinner = spieltag.p1_legs_won > spieltag.p2_legs_won;

    return p1IsWinner
      ? { left: spieltag.player1, right: spieltag.player2, leftIsWinner: true }
      : {
          left: spieltag.player2,
          right: spieltag.player1,
          leftIsWinner: false,
        };
  }

  padTo5(arr: any[]): any[] {
    const result = [...arr];
    while (result.length < 5) result.push(null);
    return result;
  }

  getPlayerData(playerId: number): {
    name: string;
    nickname: string | null;
    image: string;
  } {
    const player = this.playersService.getPlayer(playerId);
    return {
      name: player?.name || 'Unbekannter Spieler',
      nickname: player?.nickname || null,
      image: player?.image
        ? `assets/players/${player.image}`
        : 'assets/players/default-avatar.png',
    };
  }
}
