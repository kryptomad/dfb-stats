import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';

import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-statistiken',
  imports: [
    CommonModule,
    NgForOf,
    NgIf,
    Card,
    ButtonModule,
    ChartModule,
    TimelineModule,
  ],
  providers: [StatsService],
  templateUrl: './statistiken.component.html',
  styleUrl: './statistiken.component.scss',
})
export class StatistikenComponent implements OnInit {
  constructor(private statsService: StatsService) {}

  bestLegs: any[] = [];
  highestCheckout: any[] = [];
  best3DA: any[] = [];
  bestFirst9: any[] = [];
  mostTONs: any[] = [];
  most140s: any[] = [];
  most180s: any[] = [];
  formkurveData: any = {};
  formkurveOptions: any = {};

  ngOnInit() {
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.bestLegs = this.statsService.getBestLegMatch();
      this.highestCheckout = this.statsService.getHighestCheckoutMatch();
      this.best3DA = this.statsService.getBest3DAMatch();
      this.bestFirst9 = this.statsService.getBestFirst9Match();
      this.mostTONs = this.statsService.getMostTONsMatch();
      this.most140s = this.statsService.getMost140sMatch();
      this.most180s = this.statsService.getMost180sMatch();

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
}