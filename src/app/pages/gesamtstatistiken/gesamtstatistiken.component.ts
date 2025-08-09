import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';

import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';
import { OskarsiegerService } from '../../services/oskarsieger.service';

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
  ],
  providers: [StatsService, PlayersService, OskarsiegerService],
  templateUrl: './gesamtstatistiken.component.html',
  styleUrl: './gesamtstatistiken.component.scss',
})
export class GesamtstatistikenComponent implements OnInit {
  bestLegs: any[] = [];
  highestCheckout: any[] = [];
  best3DA: any[] = [];
  bestFirst9: any[] = [];
  mostTONs: any[] = [];
  most140s: any[] = [];
  most180s: any[] = [];
  formkurveData: any = {};
  formkurveOptions: any = {};
  oskarsiegerRaw: { jahr: number; player_id: number }[] = [];

  constructor(
    private statsService: StatsService,
    private oskarsiegerService: OskarsiegerService,
    private playersService: PlayersService,
  ) {}

  ngOnInit() {
    // 1) Sofort manuell anzeigen
    this.oskarsiegerRaw = this.oskarsiegerService.getManualWinners();

    // 2. Dann Stats-Daten laden (async)
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.bestLegs = this.statsService.getBestLegMatch();
      this.highestCheckout = this.statsService.getHighestCheckoutMatch();
      this.best3DA = this.statsService.getBest3DAMatch();
      this.bestFirst9 = this.statsService.getBestFirst9Match();
      this.mostTONs = this.statsService.getMostTONsMatch();
      this.most140s = this.statsService.getMost140sMatch();
      this.most180s = this.statsService.getMost180sMatch();
      this.oskarsiegerRaw = this.oskarsiegerService.getAllWinnersMerged();

      const dark = this.isDarkMode();
      const color = dark ? '#f3f3f3ff' : '#464646ff';
      const gridColor = dark ? '#363636ff' : '#dadadaff';

      this.formkurveData = this.statsService.getFormkurveData();
      this.formkurveOptions = {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: color },
          },
          datalabels: { color: color },
        },
        scales: {
          x: {
            ticks: { color: color },
            grid: { color: gridColor },
          },
          y: {
            ticks: { color: color },
            grid: { color: gridColor },
          },
        },
      };
    });
  }

  isDarkMode() {
    return document.documentElement.classList.contains('app-dark');
  }

  // Getter für Timeline (join von Player-Daten)
  get oskarsiegerTimeline() {
    return this.oskarsiegerRaw.map((entry) => ({
      ...entry,
      player: this.playersService.getPlayerById(entry.player_id),
    }));
  }

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (!img.dataset['fallback']) {
      img.dataset['fallback'] = '1';
      img.src = 'assets/players/dummy.png';
    }
  }
}
