import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';

import { StatsService } from '../../services/stats.service';
import { PlayersService } from '../../services/players.service';

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
  providers: [StatsService, PlayersService],
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

  constructor(
    private statsService: StatsService,
    private playersService: PlayersService,
  ) {}

  ngOnInit() {
    // 2. Dann Stats-Daten laden (async)
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.bestLegs = this.statsService.getBestLegMatch();
      this.highestCheckout = this.statsService.getHighestCheckoutMatch();
      this.best3DA = this.statsService.getBest3DAMatch();
      this.bestFirst9 = this.statsService.getBestFirst9Match();
      this.mostTONs = this.statsService.getMostTONsMatch();
      this.most140s = this.statsService.getMost140sMatch();
      this.most180s = this.statsService.getMost180sMatch();
    });
  }
}