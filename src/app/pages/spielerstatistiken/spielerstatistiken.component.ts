import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChartModule } from 'primeng/chart';
import { Card } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SpielerstatsScoreVergleichService } from '../../services/spielerstats-score-vergleich.service';
import { ChartThemeService } from '../../services/chart-theme.service';

// Typen passend zu deiner legs.json (verschachtelt)
type Game = {
  game_id: number;
  season: string;
  matchday: number;
  player1_id: number;
  player2_id: number;
  legs: {
    leg_number: number;
    rounds: {
      round: number;
      p1_score: number | null;
      p2_score: number | null;
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

  private games: Game[] = []; // <<— statt legs

  constructor(
    private http: HttpClient,
    private agg: SpielerstatsScoreVergleichService,
    private chartTheme: ChartThemeService,
  ) {}

  ngOnInit(): void {
    this.chartTheme.watchDomTheme(); // reagiert auf Dark/Light
    this.radarOptions = this.chartTheme.getRadarChartOptions({ showTicks: false });

    this.http.get<Game[]>('assets/legs.json').subscribe((games) => {
      this.games = games ?? [];
      this.buildSeasons();
      this.updateRadar();
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
}
