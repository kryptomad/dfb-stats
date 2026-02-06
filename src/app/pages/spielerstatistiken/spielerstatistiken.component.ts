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
import { PlayerComparisonService, PlayerComparisonResult } from '../../services/player-comparison.service';
import { PlayersService, Player } from '../../services/players.service';
import { PersonalBestService, PersonalBest, TimePeriod } from '../../services/personal-best.service';

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

  // Player comparison properties
  players: { label: string; value: number }[] = [];
  matchdays: { label: string; value: number | null }[] = [];
  selectedPlayer1: number | null = null;
  selectedPlayer2: number | null = null;
  selectedMatchday: number | null = null;
  comparisonResult: PlayerComparisonResult | null = null;

  // Bestleistungen properties
  allPlayers: Player[] = [];
  selectedBestPlayer: number | null = null;
  selectedTimePeriod: TimePeriod = 'all-time';
  timePeriodOptions = [
    { label: 'Spiel', value: 'game' as TimePeriod },
    { label: 'Spieltag', value: 'matchday' as TimePeriod },
    { label: 'Saison', value: 'season' as TimePeriod },
    { label: 'All-Time', value: 'all-time' as TimePeriod },
  ];
  personalBests: PersonalBest[] = [];

  private games: Game[] = []; // <<— statt legs

  constructor(
    private http: HttpClient,
    private agg: SpielerstatsScoreVergleichService,
    private chartTheme: ChartThemeService,
    private checkdartsService: CheckdartsService,
    private playerComparison: PlayerComparisonService,
    private playersService: PlayersService,
    private personalBestService: PersonalBestService,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
  ) {}

  ngOnInit(): void {
    this.chartTheme.watchDomTheme(); // reagiert auf Dark/Light
    this.radarOptions = this.chartTheme.getRadarChartOptions({ showTicks: false });
    this.checkdartsChartOptions = this.getCheckdartsChartOptions();

    // Load active players for comparison dropdowns
    const activePlayers = this.playersService.getPlayers({ activeOnly: true });
    this.players = activePlayers.map((p) => ({ label: p.name, value: p.id }));

    // Load all players for Bestleistungen
    this.allPlayers = this.playersService.getPlayers({ activeOnly: true });
    if (this.allPlayers.length > 0) {
      this.selectedBestPlayer = this.allPlayers[0].id;
      this.updateBestleistungen();
    }

    // Build matchdays list (1-10 + All)
    this.buildMatchdays();

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
    // Update comparison if players are selected
    if (this.selectedPlayer1 && this.selectedPlayer2) {
      this.updateComparison();
    }
  }

  private buildMatchdays(): void {
    // Build matchday options: All + 1-10
    this.matchdays = [
      { label: 'Alle Spieltage', value: null },
      ...Array.from({ length: 10 }, (_, i) => ({
        label: `Spieltag ${i + 1}`,
        value: i + 1,
      })),
    ];
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
            color: this.chartTheme.hexToRgba(
              this.chartTheme.getSecondary(),
              0.1,
            ),
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: this.chartTheme.getSecondary(),
            autoSkip: false,
          },
          grid: {
            display: false,
          },
        },
      },
    };
  }

  // Player comparison methods
  onPlayerSelectionChange(): void {
    if (this.selectedPlayer1 && this.selectedPlayer2) {
      this.updateComparison();
    }
  }

  onMatchdayChange(): void {
    if (this.selectedPlayer1 && this.selectedPlayer2) {
      this.updateComparison();
    }
  }

  updateComparison(): void {
    if (!this.selectedPlayer1 || !this.selectedPlayer2) return;

    const season = this.selectedSeason || 'All-Time';
    this.playerComparison
      .comparePlayersBySeason(
        this.selectedPlayer1,
        this.selectedPlayer2,
        season,
        this.selectedMatchday
      )
      .subscribe((result) => {
        this.comparisonResult = result;
      });
  }

  formatValue(value: number, type: string): string {
    if (type === 'number') return value.toFixed(0);
    if (type === 'percentage') return value.toFixed(1) + '%';
    if (type === 'decimal') return value.toFixed(2);
    return value.toString();
  }

  getBarWidth(
    v1: number,
    v2: number,
    higherBetter: boolean,
    isLeft: boolean,
    formatType?: string,
    absoluteMax?: number
  ): number {
    const value = isLeft ? v1 : v2;

    // If there's an absolute maximum, use it
    if (absoluteMax !== undefined) {
      const percentage = (value / absoluteMax) * 50; // 50 because each bar is half of track
      return Math.min(percentage, 50);
    }

    // For values without absolute max, calculate relative to max of both values
    const maxValue = Math.max(v1, v2);
    if (maxValue === 0) return 0;

    const percentage = (value / maxValue) * 50; // 50 because each bar is half of track
    return Math.min(percentage, 50);
  }

  // Bestleistungen methods
  onPlayerButtonClick(playerId: number): void {
    this.selectedBestPlayer = playerId;
    this.updateBestleistungen();
  }

  onTimePeriodChange(): void {
    this.updateBestleistungen();
  }

  updateBestleistungen(): void {
    if (!this.selectedBestPlayer) return;

    const season = this.selectedSeason || 'All-Time';
    // For matchday/game time periods, we might need additional context
    // For now, we'll pass the current season

    this.personalBestService
      .getPersonalBests(
        this.selectedBestPlayer,
        this.selectedTimePeriod,
        season
      )
      .subscribe((bests) => {
        this.personalBests = bests;
      });
  }

  formatBestValue(best: PersonalBest): string {
    return this.formatValue(best.value, best.formatType);
  }

  getMedalEmoji(rank: number | undefined): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  hasTopRankedBests(): boolean {
    return this.personalBests.some(b => b.topRank !== undefined);
  }
}
