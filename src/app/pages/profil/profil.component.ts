import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Card } from 'primeng/card';
import { FieldsetModule } from 'primeng/fieldset';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { NgIf } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { CommonModule } from '@angular/common'; // Für number-Pipe
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { PlayersService, Player } from '../../services/players.service';
import { StatsQueryService } from '../../services/stats-query.service';
import { SeasonSelectorService } from '../../services/season-selector.service';
import { ChartThemeService } from '../../services/chart-theme.service';
import {
  LegsService,
  CheckoutData,
  WonLegData,
} from '../../services/legs.service';
import {
  PlayerComparisonService,
  PlayerComparisonResult,
} from '../../services/player-comparison.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StatRow } from '../../services/stats.service';

@Component({
  selector: 'app-profil',
  imports: [
    Card,
    RouterModule,
    FieldsetModule,
    TagModule,
    TabsModule,
    NgIf,
    BadgeModule,
    CommonModule,
    ChartModule,
    DropdownModule,
    FormsModule,
  ],
  providers: [PlayersService, StatsQueryService, SeasonSelectorService],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss'],
})
export class ProfilComponent implements OnInit {
  playerId!: number;
  player: Player | undefined;
  selectedSeason: string = '2024/2025';
  stats$: Observable<StatRow[]>;
  totalLegsWon: number = 0;
  total180s: number = 0;
  avgDarts: number = 0;
  setsWon: number = 0;
  setsPlayed: number = 0;
  setsWonPercent: string = 'TBD';
  bestLeg: number = 0;
  worstLeg: number = 0;
  highFinish: number = 0;
  highScore: number = 0;
  score100: number = 0;
  score140: number = 0;
  score180: number = 0;
  shortGames: number = 0;
  avgDartsNeeded: string = 'TBD';
  breakCount: number = 0;
  breakPercent: string = 'TBD';
  legsPlayed: number = 0;
  legsWon: number = 0;
  legsWonPercent: string = 'TBD';
  keepPercent: string = 'TBD';
  keepCount: number = 0;
  best3DAMatch: number = 0;
  bestFirst9Match: number = 0;

  // Letzten 5 Saisonspiele
  lastFiveGames: StatRow[] = [];
  trendArrow: string = '→';
  trendColor: string = '#f97316'; // orange

  // Chart data for Saisontrend
  trendChartData: any = { labels: [], datasets: [] };
  trendChartOptions: any = {};

  // Last 5 checkouts and won legs
  lastCheckouts: CheckoutData[] = [];
  lastWonLegs: WonLegData[] = [];

  // Season comparison properties
  seasons: { label: string; value: string }[] = [];
  matchdays: { label: string; value: number | null }[] = [];
  selectedSeason1: string | null = null;
  selectedSeason2: string | null = null;
  selectedComparisonMatchday: number | null = null;
  seasonComparisonResult: PlayerComparisonResult | null = null;

  constructor(
    private route: ActivatedRoute,
    private playersService: PlayersService,
    private statsQuery: StatsQueryService,
    private seasonSelector: SeasonSelectorService,
    private chartTheme: ChartThemeService,
    private legsService: LegsService,
    private playerComparison: PlayerComparisonService,
  ) {
    this.playerId = Number(this.route.snapshot.paramMap.get('id'));
    this.stats$ = this.statsQuery.getFullStatsBySeason$(this.selectedSeason);
  }

  async ngOnInit() {
    this.chartTheme.watchDomTheme();
    this.trendChartOptions = this.getTrendChartOptions();

    // Ensure legs data is loaded
    await this.legsService.ensureLoaded();

    this.player = this.playersService.getPlayer(this.playerId);

    // Build matchdays list (1-10 + All)
    this.buildMatchdays();

    // Load seasons from StatsQueryService for comparison
    this.statsQuery.getSeasons$().subscribe((seasons) => {
      // Build seasons dropdown for comparison (descending order - newest first)
      const sortedSeasons = [...seasons].reverse();
      this.seasons = sortedSeasons.map((s) => ({ label: s, value: s }));

      // Default to comparing latest two seasons if available
      if (sortedSeasons.length >= 2) {
        this.selectedSeason1 = sortedSeasons[1]; // Second newest
        this.selectedSeason2 = sortedSeasons[0]; // Newest
        this.updateSeasonComparison();
      }
    });

    this.seasonSelector.getSeasons$().subscribe((seasons) => {
      if (seasons.length > 0 && !seasons.includes(this.selectedSeason)) {
        this.selectedSeason = seasons[0];
      }
      this.updateStats();
    });
    this.updateStats();
  }

  onSeasonChange(season: string) {
    this.selectedSeason = season;
    this.updateStats();
  }

  private updateStats() {
    this.stats$ = this.statsQuery.getFullStatsBySeason$(this.selectedSeason);
    this.stats$.subscribe((rows) => {
      const seasonStr = this.selectedSeason.toString();
      const playerRows = rows.filter(
        (r) => r.player_id === this.playerId && r.season === seasonStr,
      );
      console.log('Gefilterte Player Rows für Saison:', playerRows);
      this.setsPlayed = playerRows.length;
      this.totalLegsWon = playerRows.reduce(
        (sum, r) => sum + (r.legs_won || 0),
        0,
      );
      this.total180s = playerRows.reduce(
        (sum, r) => sum + (r.score_180 || 0),
        0,
      );
      // Gewichteter Durchschnitt: (sum(avg_darts * legs_played)) / sum(legs_played)
      const totalDartsWeighted = playerRows.reduce(
        (sum, r) => sum + (r.avg_darts || 0) * (r.legs_played || 0),
        0,
      );
      const totalLegs = playerRows.reduce(
        (sum, r) => sum + (r.legs_played || 0),
        0,
      );
      this.avgDarts = totalLegs > 0 ? totalDartsWeighted / totalLegs : 0;
      this.setsWon = playerRows.reduce((sum, r) => sum + (r.sets_won || 0), 0);
      this.bestLeg =
        playerRows.reduce(
          (min, r) =>
            r.best_leg !== null && (min === 0 || r.best_leg < min)
              ? r.best_leg
              : min,
          Infinity,
        ) || 0;
      this.worstLeg =
        playerRows.reduce(
          (min, r) =>
            r.worst_leg !== null && (min === 0 || r.worst_leg < min)
              ? r.worst_leg
              : min,
          Infinity,
        ) || 0;
      this.highFinish = playerRows.reduce(
        (max, r) => Math.max(max, r.high_finish || 0),
        0,
      );
      this.highScore = playerRows.reduce(
        (max, r) => Math.max(max, r.high_score || 0),
        0,
      );
      this.score100 = playerRows.reduce(
        (sum, r) => sum + (r.score_100 || 0) + (r.score_100_plus || 0),
        0,
      );
      this.score140 = playerRows.reduce(
        (sum, r) => sum + (r.score_140 || 0) + (r.score_140_plus || 0), // Geändert
        0,
      );
      this.score180 = playerRows.reduce(
        (sum, r) => sum + (r.score_180 || 0),
        0,
      );
      this.shortGames = playerRows.reduce(
        (sum, r) =>
          sum +
          (r.best_leg !== null && r.best_leg >= 9 && r.best_leg <= 21 ? 1 : 0),
        0,
      );
      this.avgDartsNeeded =
        this.avgDarts > 0 ? this.avgDarts.toFixed(1) : '0.0';
      this.breakCount = playerRows.reduce(
        (sum, r) => sum + Number(r.break_ratio.split('/')[0] || 0),
        0,
      );
      const breakOpportunities = playerRows.reduce(
        (sum, r) => sum + Number(r.break_ratio.split('/')[1]?.trim() || 0),
        0,
      );
      this.breakPercent =
        breakOpportunities > 0
          ? ((this.breakCount / breakOpportunities) * 100).toFixed(1) + '%'
          : '0%';
      this.legsPlayed = playerRows.reduce(
        (sum, r) => sum + (r.legs_played || 0),
        0,
      );
      this.legsWon = playerRows.reduce((sum, r) => sum + (r.legs_won || 0), 0);
      this.legsWonPercent =
        this.legsPlayed > 0
          ? ((this.legsWon / this.legsPlayed) * 100).toFixed(1) + '%'
          : '0%';
      this.setsWonPercent =
        this.setsPlayed > 0
          ? ((this.setsWon / this.setsPlayed) * 100).toFixed(1) + '%'
          : '0%';
      this.keepCount = playerRows.reduce(
        (sum, r) => sum + Number(r.keep_ratio.split('/')[0] || 0),
        0,
      );
      const keepOpportunities = playerRows.reduce(
        (sum, r) => sum + Number(r.keep_ratio.split('/')[1]?.trim() || 0),
        0,
      );
      this.keepPercent =
        keepOpportunities > 0
          ? ((this.keepCount / keepOpportunities) * 100).toFixed(1) + '%'
          : '0%';
      this.best3DAMatch = playerRows.reduce(
        (max, r) => Math.max(max, r.avg_3dart || 0),
        0,
      );
      this.bestFirst9Match = playerRows.reduce(
        (max, r) => Math.max(max, r.avg_first9 || 0),
        0,
      );

      // Letzten 5 Spiele extrahieren und Trend berechnen
      const sortedGames = [...playerRows].sort(
        (a, b) => b.matchday - a.matchday,
      );
      this.lastFiveGames = sortedGames.slice(0, 5).reverse(); // Ältestes links, Neuestes rechts
      this.calculateTrend();

      // Build trend chart data
      this.buildTrendChart(playerRows);

      // Load last 5 checkouts and won legs
      this.lastCheckouts = this.legsService.getPlayerCheckouts(
        this.playerId,
        seasonStr,
        5,
      );
      this.lastWonLegs = this.legsService.getPlayerWonLegs(
        this.playerId,
        seasonStr,
        5,
      );
    });
  }

  private calculateTrend(): void {
    if (this.lastFiveGames.length === 0) {
      this.trendArrow = '→';
      this.trendColor = '#f97316'; // orange
      return;
    }

    // Nimm die letzten 3 Spiele (oder weniger falls < 3 Spiele vorhanden)
    const recentGames = this.lastFiveGames.slice(-3);

    // Zähle Siege und Niederlagen
    const wins = recentGames.filter((game) => game.sets_won === 1).length;
    const losses = recentGames.length - wins;

    // Bestimme Trend
    if (wins > losses) {
      this.trendArrow = '↗';
      this.trendColor = '#10b981'; // grün
    } else if (wins < losses) {
      this.trendArrow = '↘';
      this.trendColor = '#ef4444'; // rot
    } else {
      this.trendArrow = '→';
      this.trendColor = '#f97316'; // orange
    }
  }

  private buildTrendChart(playerRows: StatRow[]): void {
    console.log('buildTrendChart called with', playerRows.length, 'rows');
    if (playerRows.length > 0) {
      console.log('Season:', playerRows[0]?.season);
      console.log('Player:', playerRows[0]?.player_id);
      console.log(
        'Matchdays:',
        playerRows.map((r) => r.matchday),
      );
    }

    if (playerRows.length === 0) {
      this.trendChartData = { labels: [], datasets: [] };
      return;
    }

    // Group by matchday (each matchday has 4 games)
    const groupedByMatchday = playerRows.reduce(
      (acc, row) => {
        if (!acc[row.matchday]) {
          acc[row.matchday] = [];
        }
        acc[row.matchday].push(row);
        return acc;
      },
      {} as Record<number, StatRow[]>,
    );

    // Calculate average per matchday
    const matchdayAverages = Object.entries(groupedByMatchday).map(
      ([matchday, rows]) => ({
        matchday: Number(matchday),
        avg_3dart:
          rows.reduce((sum, r) => sum + (r.avg_3dart || 0), 0) / rows.length,
        avg_first9:
          rows.reduce((sum, r) => sum + (r.avg_first9 || 0), 0) / rows.length,
        gameCount: rows.length,
      }),
    );

    console.log('Matchday averages:', matchdayAverages);

    // Sort by matchday ascending and take last 5 matchdays
    const sortedMatchdays = matchdayAverages
      .sort((a, b) => a.matchday - b.matchday)
      .slice(-5);

    console.log('Last 5 matchdays:', sortedMatchdays);

    // Extract labels and data
    const labels = sortedMatchdays.map((m) => `${m.matchday}`);
    console.log('Chart labels:', labels);
    const avg3DartData = sortedMatchdays.map((m) => m.avg_3dart);
    const avgFirst9Data = sortedMatchdays.map((m) => m.avg_first9);

    // Get colors from theme
    const primaryColor = this.chartTheme.getPrimary();
    const secondaryColor = '#f97316'; // Orange for contrast

    this.trendChartData = {
      labels,
      datasets: [
        {
          label: '3-Dart-Average',
          data: avg3DartData,
          borderColor: primaryColor,
          backgroundColor: this.chartTheme.hexToRgba(primaryColor, 0.2),
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: primaryColor,
        },
        {
          label: 'First-9-Average',
          data: avgFirst9Data,
          borderColor: secondaryColor,
          backgroundColor: this.chartTheme.hexToRgba(secondaryColor, 0.2),
          tension: 0.4,
          fill: true,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: secondaryColor,
        },
      ],
    };
  }

  private getTrendChartOptions(): any {
    return this.chartTheme.getLineChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 0,
        },
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context: any) =>
              `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`,
          },
        },
        datalabels: {
          display: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Spieltag',
            font: { size: 12 },
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            font: { size: 11 },
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 11 } },
          title: {
            display: true,
            text: 'Average',
            font: { size: 12 },
          },
        },
      },
    });
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

  onSeasonComparisonChange(): void {
    if (this.selectedSeason1 && this.selectedSeason2) {
      this.updateSeasonComparison();
    }
  }

  onComparisonMatchdayChange(): void {
    if (this.selectedSeason1 && this.selectedSeason2) {
      this.updateSeasonComparison();
    }
  }

  updateSeasonComparison(): void {
    if (!this.selectedSeason1 || !this.selectedSeason2) return;

    this.playerComparison
      .comparePlayerAcrossSeasons(
        this.playerId,
        this.selectedSeason1,
        this.selectedSeason2,
        this.selectedComparisonMatchday
      )
      .subscribe((result) => {
        this.seasonComparisonResult = result;
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
}