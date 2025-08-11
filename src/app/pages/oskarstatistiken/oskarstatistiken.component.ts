import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { TableModule } from 'primeng/table';
import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarstatsOskarsiegerTimelineService } from '../../services/oskarstats-oskarsieger-timeline.service';
import { OskarstatsJahresvergleichService } from '../../services/oskarstats-Jahresvergleich.service';
import { OskarstatsSpieltagverlaufService } from '../../services/oskarstats-spieltagverlauf.service';
import { OskarstatsAktuellerTabellenstandService } from '../../services/oskarstats-aktuellerTabellenstand.service';
import { ChartThemeService } from '../../services/chart-theme.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-oskarstatistiken',
  imports: [
    CommonModule,
    NgIf,
    Card,
    ChartModule,
    TimelineModule,
    TableModule,
    DropdownModule,
    FormsModule,
  ],
  templateUrl: './oskarstatistiken.component.html',
  styleUrls: ['./oskarstatistiken.component.scss'],
})
export class OskarstatistikenComponent implements OnInit {
  constructor(
    private statsService: StatsService,
    private oskarstatsOskarsiegerTimelineService: OskarstatsOskarsiegerTimelineService,
    private oskarstatsJahresvergleichService: OskarstatsJahresvergleichService,
    private oskarstatsSpieltagverlaufService: OskarstatsSpieltagverlaufService,
    private aktuellerTabellenstand: OskarstatsAktuellerTabellenstandService,
    private playersService: PlayersService,
    private chartTheme: ChartThemeService,
  ) {}

  aktuelleSaison = '';
  jahrestabelle: any[] = [];
  barChartData: any = { labels: [], datasets: [] };
  barStackedOptions: any = {};
  seasons: string[] = [];
  selectedSeason: string | number = '';

  //OSKARSIEGER (Timeline)
  oskarsiegerRaw: { jahr: number; player_id: number }[] = [];

  /** Angereicherte Timeline-Einträge inkl. Player-Objekt */
  get oskarsiegerTimeline() {
    return this.oskarsiegerRaw.map((entry) => ({
      ...entry,
      player: this.playersService.getPlayer(entry.player_id),
    }));
  }

  private refreshChartOptions() {
    this.barStackedOptions = this.chartTheme.getLineChartOptions({});
    this.formkurveOptions = this.chartTheme.getLineChartOptions({});
  }

  ngAfterViewInit() {
    this.refreshChartOptions();
  }

  //#region 3) PUNKTEENTWICKLUNG (Formkurve/Liniendiagramm)
  formkurveData: any = {};
  formkurveOptions: any = {};
  spieltagverlaufData: any;

  ngOnInit() {
    this.statsService.loadEnrichedStats().subscribe(() => {
      // Oskarsieger (manuell + automatisch)
      this.oskarsiegerRaw =
        this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();
      this.statsService.getStatsNorm$().subscribe((normRows: any[]) => {
        // >>> Timeline jetzt aus NORMALISIERTEN Rows:
        this.oskarsiegerRaw =
          this.oskarstatsOskarsiegerTimelineService.getAllWinnersMergedFromNormalizedRows(
            normRows,
          );
      });

      // Tabellenstand
      const res = this.aktuellerTabellenstand.build();
      this.aktuelleSaison = res.aktuelleSaison;
      this.jahrestabelle = res.jahrestabelle;
      this.barChartData = res.barChartData;
      this.barStackedOptions = this.chartTheme.getLineChartOptions({
        maintainAspectRatio: false,
      });
    });

    this.formkurveOptions = this.chartTheme.getLineChartOptions({});
    this.barStackedOptions = this.chartTheme.getLineChartOptions({});
    this.chartTheme.watchDomTheme();

    // 1) Seasons laden und Default setzen
    this.oskarstatsSpieltagverlaufService
      .getSeasons$()
      .subscribe((seasons: string[]) => {
        this.seasons = seasons;

        const latest = seasons[seasons.length - 1] ?? '';
        this.selectedSeason = latest;

        if (latest) {
          // 2) Chart für die vorgewählte Season laden
          this.oskarstatsSpieltagverlaufService
            .buildSpieltagverlaufData$(latest)
            .subscribe((chart: any) => {
              this.spieltagverlaufData = chart;
              this.refreshChartOptions();
            });
        }
      });

    // Timeline + Jahresvergleich + Tabelle
    this.oskarsiegerRaw =
      this.oskarstatsOskarsiegerTimelineService.getAllWinnersMerged();

    const res = this.aktuellerTabellenstand.build();
    this.aktuelleSaison = res.aktuelleSaison;
    this.jahrestabelle = res.jahrestabelle;
    this.barChartData = res.barChartData;
    this.barStackedOptions = res.barStackedOptions;

    this.oskarstatsJahresvergleichService
      .buildJahresvergleichData$()
      .subscribe((data: any) => {
        this.formkurveData = data;
        this.refreshChartOptions();
      });
  }

  onSeasonChange(season: string | number) {
    this.selectedSeason = season;
    this.oskarstatsSpieltagverlaufService
      .buildSpieltagverlaufData$(season)
      .subscribe((chart: any) => {
        this.spieltagverlaufData = chart;
        this.refreshChartOptions();
      });
  }
}