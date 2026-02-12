import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgForOf } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { BestLegEntry } from '../../services/legs-query.service';
import { JahresstatsHighlightLegsService } from '../../services/jahresstats-highlight-legs.service';
import { SeasonSelectorService } from '../../services/season-selector.service';
import { PlayersService } from '../../services/players.service';
import { LegsService, HighlightMatch } from '../../services/legs.service';
import { StatsService } from '../../services/stats.service';
import { PlayerComparisonService, PlayerComparisonResult } from '../../services/player-comparison.service';
import { ChartThemeService } from '../../services/chart-theme.service';
import { OskarstatsJahresvergleichService } from '../../services/oskarstats-Jahresvergleich.service';
import { Observable, Subscription } from 'rxjs';

interface SeasonOption {
  label: string;
  value: string; // Zurück zu string, da SeasonSelectorService strings liefert
}

@Component({
  selector: 'app-jahresstatistiken',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgForOf,
    CardModule,
    AvatarModule,
    DropdownModule,
    TableModule,
    FormsModule,
    ChartModule,
  ],
  templateUrl: './jahresstatistiken.component.html',
  styleUrls: ['./jahresstatistiken.component.scss'],
})
export class JahresstatistikenComponent {
  bestLegs$: Observable<BestLegEntry[]>;
  seasons: SeasonOption[] = [];
  selectedSeason: string | null = null;
  highlightMatches: HighlightMatch[] = [];
  private subscription: Subscription | null = null;

  // Saisonvergleich
  comparisonSeasons: { label: string; value: string }[] = [];
  selectedCompSeason1: string | null = null;
  selectedCompSeason2: string | null = null;
  seasonComparisonResult: PlayerComparisonResult | null = null;

  // Trendverlauf
  trendChartData: any = { labels: [], datasets: [] };
  trendChartOptions: any = {};

  // Jahresvergleich
  jahresvergleichData: any = {};
  jahresvergleichOptions: any = {};

  constructor(
    public jahresLegsService: JahresstatsHighlightLegsService,
    public seasonSelector: SeasonSelectorService,
    private playersService: PlayersService,
    private legsService: LegsService,
    private statsService: StatsService,
    private playerComparisonService: PlayerComparisonService,
    private chartTheme: ChartThemeService,
    private jahresvergleichService: OskarstatsJahresvergleichService,
  ) {
    this.bestLegs$ = this.jahresLegsService.getBestLegsForLatestSeason();

    this.statsService.loadEnrichedStats().subscribe(() => {
      this.subscription = this.seasonSelector
        .getSeasons$()
        .subscribe((seasons) => {
          this.seasons = [
            { label: 'All-Time', value: 'All-Time' },
            ...seasons.map((s) => ({ label: s, value: s }))
          ];
          if (!this.selectedSeason && this.seasons.length > 0) {
            this.selectedSeason = this.seasons[1]?.value || this.seasons[0].value;
            this.seasonSelector.setSelectedSeason(this.selectedSeason);
            this.updateHighlightMatches();
          }
        });
      this.seasonSelector.getSelectedSeason$().subscribe((season) => {
        if (this.selectedSeason !== season) {
          this.selectedSeason = season;
          this.updateHighlightMatches();
        }
      });

      // Saisonvergleich: Seasons laden
      this.loadComparisonSeasons();
      // Trendverlauf bauen
      this.buildTrendChart();
      this.trendChartOptions = this.getTrendChartOptions();

      // Jahresvergleich laden
      this.jahresvergleichOptions = this.chartTheme.getLineChartOptions({});
      this.jahresvergleichService
        .buildJahresvergleichData$()
        .subscribe((data: any) => {
          this.jahresvergleichData = data;
          this.jahresvergleichOptions = this.chartTheme.getLineChartOptions({});
        });
    });
  }

  onSeasonChange(): void {
    if (this.selectedSeason) {
      this.seasonSelector.setSelectedSeason(this.selectedSeason);
    } else if (this.seasons.length > 0) {
      this.selectedSeason = this.seasons[0].value;
      this.seasonSelector.setSelectedSeason(this.selectedSeason);
    }
    this.updateHighlightMatches();
  }

  private updateHighlightMatches(): void {
    this.highlightMatches = this.legsService.getHighlightMatches(
      this.selectedSeason || 'All-Time',
      10
    );
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

  // Saisonvergleich methods
  private loadComparisonSeasons() {
    const allStats = this.statsService.enrichedStats;
    const uniqueSeasons = [
      ...new Set(allStats.map((s: any) => s.season as string)),
    ].sort((a: string, b: string) => {
      const [yearA] = a.split('/').map(Number);
      const [yearB] = b.split('/').map(Number);
      return yearB - yearA;
    });
    this.comparisonSeasons = uniqueSeasons.map((s: string) => ({ label: s, value: s }));

    if (this.comparisonSeasons.length >= 2) {
      this.selectedCompSeason1 = this.comparisonSeasons[0].value;
      this.selectedCompSeason2 = this.comparisonSeasons[1].value;
      this.updateSeasonComparison();
    }
  }

  onCompSeasonChange(): void {
    if (this.selectedCompSeason1 && this.selectedCompSeason2) {
      this.updateSeasonComparison();
    }
  }

  private updateSeasonComparison(): void {
    if (!this.selectedCompSeason1 || !this.selectedCompSeason2) return;
    this.playerComparisonService
      .compareSeasonsAllPlayers(this.selectedCompSeason1, this.selectedCompSeason2)
      .subscribe((result) => {
        this.seasonComparisonResult = result;
      });
  }

  formatComparisonValue(value: number, type: string): string {
    if (type === 'number') return value.toFixed(0);
    if (type === 'percentage') return value.toFixed(1) + '%';
    if (type === 'decimal') return value.toFixed(2);
    return value.toString();
  }

  getCompBarWidth(v1: number, v2: number, higherBetter: boolean, isLeft: boolean): number {
    if (!higherBetter) {
      if (v1 === 0 && v2 === 0) return 0;
      if (v1 === 0) return isLeft ? 0 : 100;
      if (v2 === 0) return isLeft ? 100 : 0;
      const maxValue = Math.max(v1, v2);
      const value = isLeft ? v1 : v2;
      const percentage = ((maxValue - value + 1) / (maxValue + 1)) * 100;
      return Math.min(percentage, 100);
    }
    const maxValue = Math.max(v1, v2);
    if (maxValue === 0) return 0;
    const value = isLeft ? v1 : v2;
    return Math.min((value / maxValue) * 100, 100);
  }

  // Trendverlauf methods
  private buildTrendChart(): void {
    const allStats = this.statsService.enrichedStats;
    if (allStats.length === 0) {
      this.trendChartData = { labels: [], datasets: [] };
      return;
    }

    const groupedBySeason = allStats.reduce((acc: Record<string, any[]>, row: any) => {
      const season = row.season as string;
      if (!acc[season]) acc[season] = [];
      acc[season].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    const seasonAverages = (Object.entries(groupedBySeason) as [string, any[]][]).map(([season, rows]) => {
      const totalPoints = rows.reduce((sum: number, r: any) => sum + (r.avg_3dart * r.darts_thrown) / 3, 0);
      const totalDarts = rows.reduce((sum: number, r: any) => sum + r.darts_thrown, 0);
      const avg_3dart = totalDarts > 0 ? (totalPoints / totalDarts) * 3 : 0;

      const validFirst9 = rows.filter((r: any) => r.avg_first9 && r.avg_first9 > 0);
      const avg_first9 = validFirst9.length > 0
        ? validFirst9.reduce((sum: number, r: any) => sum + r.avg_first9, 0) / validFirst9.length
        : 0;

      return { season, avg_3dart, avg_first9 };
    });

    const sortedSeasons = seasonAverages.sort((a, b) => {
      const [yearA] = a.season.split('/').map(Number);
      const [yearB] = b.season.split('/').map(Number);
      return yearA - yearB;
    });

    const labels = sortedSeasons.map((s) => s.season);
    const avg3DartData = sortedSeasons.map((s) => s.avg_3dart);
    const avgFirst9Data = sortedSeasons.map((s) => s.avg_first9);

    const primaryColor = this.chartTheme.getPrimary();
    const secondaryColor = '#f97316';

    this.trendChartData = {
      labels,
      datasets: [
        {
          label: '3-Dart-Average',
          data: avg3DartData,
          borderColor: primaryColor,
          backgroundColor: this.chartTheme.hexToRgba(primaryColor, 0.2),
          tension: 0.4, fill: true, borderWidth: 2, pointRadius: 4,
          pointBackgroundColor: primaryColor,
        },
        {
          label: 'First-9-Average',
          data: avgFirst9Data,
          borderColor: secondaryColor,
          backgroundColor: this.chartTheme.hexToRgba(secondaryColor, 0.2),
          tension: 0.4, fill: true, borderWidth: 2, pointRadius: 4,
          pointBackgroundColor: secondaryColor,
        },
      ],
    };
  }

  private getTrendChartOptions(): any {
    return this.chartTheme.getLineChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true } },
        tooltip: {
          mode: 'index', intersect: false,
          callbacks: { label: (context: any) => `${context.dataset.label}: ${context.parsed.y.toFixed(2)}` },
        },
        datalabels: { display: false },
      },
      scales: {
        x: {
          title: { display: true, text: 'Jahr', font: { size: 12 } },
          ticks: { autoSkip: false, maxRotation: 45, minRotation: 45, font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 11 } },
          title: { display: true, text: 'Average', font: { size: 12 } },
        },
      },
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}