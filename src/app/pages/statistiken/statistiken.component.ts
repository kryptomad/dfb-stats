import { Component, OnInit } from '@angular/core';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

import { StatsService } from '../../services/stats.service';

@Component({
  selector: 'app-statistiken',
  imports: [CommonModule, NgForOf, NgIf, Card, ButtonModule],
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

  ngOnInit() {
    setTimeout(() => {
      this.bestLegs = this.statsService.getBestLegMatch();
      this.highestCheckout = this.statsService.getHighestCheckoutMatch();
      this.best3DA = this.statsService.getBest3DAMatch();
      this.bestFirst9 = this.statsService.getBestFirst9Match();
      this.mostTONs = this.statsService.getMostTONsMatch();
      this.most140s = this.statsService.getMost140sMatch();
      this.most180s = this.statsService.getMost180sMatch();
    }, 400);
  }
}
