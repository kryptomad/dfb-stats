import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { Card } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TableModule } from 'primeng/table';
import { SpielerstatsScoreVergleichService } from '../../services/spielerstats-score-vergleich.service';
import { ChartThemeService } from '../../services/chart-theme.service';
import { CheckdartsService, CheckdartsStats } from '../../services/checkdarts.service';

// Typen passend zu deiner legs.json (verschachtelt)
type Game = {
  game_id: number;
  season: string;
  matchday: number;
  player1_id: number;
  player2_id: number;
  legs: {
    leg_number: number;
    starter_id: number;
    leg_winner_id: number | null;
    p1_darts_leg: number | null;
    p2_darts_leg: number | null;
    p1_avg_3dart_leg: number;
    p2_avg_3dart_leg: number;
    rounds: {
      round: number;
      p1_score: number | null;
      p1_left: number | null;
      p2_score: number | null;
      p2_left: number | null;
    }[];
  }[];
};

@Component({
  selector: 'app-spielerstatistiken',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    Card,
    DropdownModule,
    FormsModule,
    ToggleButtonModule,
    SelectButtonModule,
    InputSwitchModule,
    TableModule,
    RouterModule,
  ],
  templateUrl: './spielerstatistiken.component.html',
  styleUrls: ['./spielerstatistiken.component.scss'],
})
export class SpielerstatistikenComponent implements OnInit {
  radarData: any = { labels: [], datasets: [] };
  radarOptions: any = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { r: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  seasons: { label: string; value: string | null }[] = [];
  selectedSeason: string | null = null; // null = All-Time
  first9Only = false;

  // Checkdarts properties
  checkdartsData: CheckdartsStats[] = [];
  checkdartsChartData: any = { labels: [], datasets: [] };
  checkdartsChartOptions: any = {};
  currentFragment: string | null = null;

  private games: Game[] = []; // <<— statt legs

  constructor(
    private http: HttpClient,
    private agg: SpielerstatsScoreVergleichService,
    private chartTheme: ChartThemeService,
    private checkdartsService: CheckdartsService,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
  ) {}

  ngOnInit(): void {
    this.chartTheme.watchDomTheme(); // reagiert auf Dark/Light
    this.radarOptions = this.chartTheme.getRadarChartOptions({ showTicks: false });
    this.checkdartsChartOptions = this.getCheckdartsChartOptions();

    this.http.get<Game[]>('assets/legs.json').subscribe((games) => {
      this.games = games ?? [];
      this.buildSeasons();
      this.updateRadar();
      this.updateCheckdarts();
    });

    // Fragment navigation
    this.route.fragment.subscribe((fragment) => {
      this.currentFragment = fragment;
      if (fragment) {
        setTimeout(() => {
          this.viewportScroller.scrollToAnchor(fragment);
        }, 100);
      }
    });
  }

  private buildSeasons(): void {
    // Alle Saisons einsammeln
    const set = new Set<string>();
    for (const g of this.games) if (g.season != null) set.add(String(g.season));

    // Helper: Startjahr extrahieren (funktioniert für "2024/2025" und "2019")
    const startYear = (s: string) => {
      const m = s.match(/\d{4}/);
      return m ? Number(m[0]) : -Infinity;
    };

    // Absteigend sortieren nach Startjahr
    const list = Array.from(set).sort((a, b) => startYear(b) - startYear(a));

    // Default-Auswahl: neueste Saison
    this.selectedSeason ??= list[0] ?? null;

    // Optionen: alle Saisons (absteigend), dann All‑Time am Ende
    this.seasons = [
      ...list.map((s) => ({ label: s, value: s })),
      { label: 'All-Time', value: null },
    ];
  }

  onSeasonChange(): void {
    this.updateRadar();
    this.updateCheckdarts();
  }
  onFirst9Toggle(): void {
    this.updateRadar();
  }

  updateRadar(): void {
    this.radarOptions = this.chartTheme.getRadarChartOptions(); // <-- IMMER vom Service
    this.radarData = this.agg.radarData(this.games, {
      season: this.selectedSeason,
      first9Only: this.first9Only,
    });
  }

  updateCheckdarts(): void {
    this.checkdartsData = this.checkdartsService.calculateCheckdartsStats(
      this.games,
      { season: this.selectedSeason },
    );
    this.checkdartsChartData = this.checkdartsService.getCheckdartsChartData(
      this.checkdartsData,
    );
  }

  private getCheckdartsChartOptions(): any {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: this.chartTheme.getSecondary(),
            font: { size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed.x;
              return `${context.dataset.label}: ${value.toFixed(1)}%`;
            },
          },
        },
        datalabels: {
          display: false, // Deaktiviere Datalabels auf den Balken
        },
      },
      scales: {
        x: {
          stacked: true,
          max: 100,
          ticks: {
            callback: (val: number) => val.toFixed(0) + '%',
            color: this.chartTheme.getSecondary(),
          },
          grid: {
            color: this.chartTheme.hexToRgba(this.chartTheme.getSecondary(), 0.1),
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: this.chartTheme.getSecondary(),
          },
          grid: {
            display: false,
          },
        },
      },
    };
  }
}
