import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';

import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { AllTimeRecordsService, AllTimeRecord } from '../../services/all-time-records.service';
import { PlayerComparisonService, PlayerComparisonResult } from '../../services/player-comparison.service';
import { ChartThemeService } from '../../services/chart-theme.service';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

@Component({
  selector: 'app-gesamtstatistiken',
  standalone: true,
  imports: [
    CommonModule,
    NgForOf,
    NgIf,
    Card,
    ButtonModule,
    ChartModule,
    TimelineModule,
    FormsModule,
    DropdownModule,
  ],
  providers: [StatsService, PlayersService],
  templateUrl: './gesamtstatistiken.component.html',
  styleUrl: './gesamtstatistiken.component.scss',
})
export class GesamtstatistikenComponent implements OnInit {
  // Aktive Ansicht
  selectedView: 'spiel' | 'spieltag' | 'jahr' | 'alltime' = 'spiel';

  // Spiel-Ansicht (Einzelspiel-Rekorde)
  bestLegs: any[] = [];
  highestCheckout: any[] = [];
  best3DA: any[] = [];
  bestFirst9: any[] = [];
  mostTONs: any[] = [];
  most140s: any[] = [];
  most180s: any[] = [];

  // Spieltag-Ansicht
  spieltagBest3DA: any[] = [];
  spieltagBestFirst9: any[] = [];
  spieltagMostTONs: any[] = [];
  spieltagMost140s: any[] = [];
  spieltagMost180s: any[] = [];

  // Jahr-Ansicht
  jahrBest3DA: any[] = [];
  jahrBestFirst9: any[] = [];
  jahrMostTONs: any[] = [];
  jahrMost140s: any[] = [];
  jahrMost180s: any[] = [];

  // Alltime-Ansicht
  alltimeBestLegs: any[] = [];
  alltimeHighestCheckout: any[] = [];
  alltimeBest3DA: any[] = [];
  alltimeBestFirst9: any[] = [];
  alltimeMostTONs: any[] = [];
  alltimeMost140s: any[] = [];
  alltimeMost180s: any[] = [];

  // Allzeit-Rekorde with Top 5
  allTimeRecords: AllTimeRecord[] = [];

  // Saisonvergleich (Season Comparison)
  seasons: { label: string; value: string }[] = [];
  selectedSeason1: string | null = null;
  selectedSeason2: string | null = null;
  seasonComparisonResult: PlayerComparisonResult | null = null;

  // Trendverlauf (Trend Over Time)
  trendChartData: any = { labels: [], datasets: [] };
  trendChartOptions: any = {};

  constructor(
    private statsService: StatsService,
    private playersService: PlayersService,
    private allTimeRecordsService: AllTimeRecordsService,
    private playerComparisonService: PlayerComparisonService,
    private chartTheme: ChartThemeService,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
  ) {}

  ngOnInit() {
    // Lade alle Daten für alle Ansichten
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.loadSpielData();
      this.loadSpieltagData();
      this.loadJahrData();
      this.loadAlltimeData();
      this.loadSeasons();
      this.buildTrendChart();
    });

    // Load all-time records with top 5
    this.allTimeRecordsService.getAllTimeRecords().subscribe((records) => {
      this.allTimeRecords = records;
    });

    // Fragment navigation - scroll to sections without changing view
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        setTimeout(() => {
          this.viewportScroller.scrollToAnchor(fragment);
        }, 100);
      }
    });

    // Initialize chart options
    this.trendChartOptions = this.getTrendChartOptions();
  }

  // Load available seasons for comparison
  private loadSeasons() {
    const allStats = this.statsService.enrichedStats;
    const uniqueSeasons = [
      ...new Set(allStats.map((s: any) => s.season as string)),
    ].sort((a: string, b: string) => {
      const [yearA] = a.split('/').map(Number);
      const [yearB] = b.split('/').map(Number);
      return yearB - yearA; // Neueste zuerst
    });
    this.seasons = uniqueSeasons.map((s: string) => ({ label: s, value: s }));

    // Set default selections if we have at least 2 seasons
    if (this.seasons.length >= 2) {
      this.selectedSeason1 = this.seasons[0].value;
      this.selectedSeason2 = this.seasons[1].value;
      this.updateSeasonComparison();
    }
  }

  // Handle season selection change
  onSeasonSelectionChange(): void {
    if (this.selectedSeason1 && this.selectedSeason2) {
      this.updateSeasonComparison();
    }
  }

  // Update season comparison
  private updateSeasonComparison(): void {
    if (!this.selectedSeason1 || !this.selectedSeason2) return;

    this.playerComparisonService
      .compareSeasonsAllPlayers(this.selectedSeason1, this.selectedSeason2)
      .subscribe((result) => {
        this.seasonComparisonResult = result;
      });
  }

  // Ansicht wechseln
  selectView(view: 'spiel' | 'spieltag' | 'jahr' | 'alltime') {
    this.selectedView = view;
  }

  // Lade Spiel-Daten
  private loadSpielData() {
    this.bestLegs = this.statsService.getBestLegMatch();
    this.highestCheckout = this.statsService.getHighestCheckoutMatch();
    this.best3DA = this.statsService.getBest3DAMatch();
    this.bestFirst9 = this.statsService.getBestFirst9Match();
    this.mostTONs = this.statsService.getMostTONsMatch();
    this.most140s = this.statsService.getMost140sMatch();
    this.most180s = this.statsService.getMost180sMatch();
  }

  // Lade Spieltag-Daten
  private loadSpieltagData() {
    this.spieltagBest3DA = this.statsService.getBest3DAMatchday();
    this.spieltagBestFirst9 = this.statsService.getBestFirst9Matchday();
    this.spieltagMostTONs = this.statsService.getMostTONsMatchday();
    this.spieltagMost140s = this.statsService.getMost140sMatchday();
    this.spieltagMost180s = this.statsService.getMost180sMatchday();
  }

  // Lade Jahr-Daten
  private loadJahrData() {
    this.jahrBest3DA = this.statsService.getBest3DASeason();
    this.jahrBestFirst9 = this.statsService.getBestFirst9Season();
    this.jahrMostTONs = this.statsService.getMostTONsSeason();
    this.jahrMost140s = this.statsService.getMost140sSeason();
    this.jahrMost180s = this.statsService.getMost180sSeason();
  }

  // Lade Alltime-Daten
  private loadAlltimeData() {
    // Beste Einzelwerte (gleich wie Spiel)
    this.alltimeBestLegs = this.statsService.getBestLegMatch();
    this.alltimeHighestCheckout = this.statsService.getHighestCheckoutMatch();
    this.alltimeBest3DA = this.statsService.getBest3DAMatch();
    this.alltimeBestFirst9 = this.statsService.getBestFirst9Match();
    // Gesamt-Summen
    this.alltimeMostTONs = this.statsService.getMostTONsAlltime();
    this.alltimeMost140s = this.statsService.getMost140sAlltime();
    this.alltimeMost180s = this.statsService.getMost180sAlltime();
  }

  // Helper methods for AllTimeRecords
  formatRecordValue(record: AllTimeRecord): string {
    if (record.formatType === 'number') return record.topValue.toFixed(0);
    if (record.formatType === 'percentage')
      return record.topValue.toFixed(1) + '%';
    if (record.formatType === 'decimal') return record.topValue.toFixed(2);
    return record.topValue.toString();
  }

  formatTop5Value(value: number, formatType: string): string {
    if (formatType === 'number') return value.toFixed(0);
    if (formatType === 'percentage') return value.toFixed(1) + '%';
    if (formatType === 'decimal') return value.toFixed(2);
    return value.toString();
  }

  getMedalEmoji(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  // Helper methods for season comparison
  formatComparisonValue(value: number, type: string): string {
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
  ): number {
    // For "lower is better" metrics (like Best Leg), we need to invert
    if (!higherBetter) {
      // Treat 0 as no value
      if (v1 === 0 && v2 === 0) return 0;
      if (v1 === 0) return isLeft ? 0 : 100;
      if (v2 === 0) return isLeft ? 100 : 0;

      // For lower-is-better, use reciprocal for scaling
      const maxValue = Math.max(v1, v2);
      const value = isLeft ? v1 : v2;
      // Invert: smaller values should get larger bars
      const percentage = ((maxValue - value + 1) / (maxValue + 1)) * 100;
      return Math.min(percentage, 100);
    }

    // For "higher is better" metrics
    const maxValue = Math.max(v1, v2);
    if (maxValue === 0) return 0;

    const value = isLeft ? v1 : v2;
    const percentage = (value / maxValue) * 100;

    return Math.min(percentage, 100);
  }

  // Build Trendverlauf Chart
  private buildTrendChart(): void {
    const allStats = this.statsService.enrichedStats;

    if (allStats.length === 0) {
      this.trendChartData = { labels: [], datasets: [] };
      return;
    }

    // Group stats by season
    const groupedBySeason = allStats.reduce(
      (acc, row) => {
        const season = row.season as string;
        if (!acc[season]) {
          acc[season] = [];
        }
        acc[season].push(row);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Calculate averages per season (aggregated across all players)
    const seasonAverages = (
      Object.entries(groupedBySeason) as [string, any[]][]
    ).map(([season, rows]) => {
      // Weighted average for 3-Dart
      const totalPoints = rows.reduce(
        (sum: number, r: any) => sum + (r.avg_3dart * r.darts_thrown) / 3,
        0,
      );
      const totalDarts = rows.reduce(
        (sum: number, r: any) => sum + r.darts_thrown,
        0,
      );
      const avg_3dart = totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;

      // Simple average for First-9
      const validFirst9 = rows.filter(
        (r: any) => r.avg_first9 && r.avg_first9 > 0,
      );
      const avg_first9 =
        validFirst9.length > 0
          ? validFirst9.reduce((sum: number, r: any) => sum + r.avg_first9, 0) /
            validFirst9.length
          : 0;

      return {
        season,
        avg_3dart,
        avg_first9,
      };
    });

    // Sort by season (chronologically)
    const sortedSeasons = seasonAverages.sort((a, b) => {
      const [yearA] = a.season.split('/').map(Number);
      const [yearB] = b.season.split('/').map(Number);
      return yearA - yearB; // Oldest first
    });

    // Extract labels and data
    const labels = sortedSeasons.map((s) => s.season);
    const avg3DartData = sortedSeasons.map((s) => s.avg_3dart);
    const avgFirst9Data = sortedSeasons.map((s) => s.avg_first9);

    // Get colors from theme (same as profil component)
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
            text: 'Jahr',
            font: { size: 12 },
          },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
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
}