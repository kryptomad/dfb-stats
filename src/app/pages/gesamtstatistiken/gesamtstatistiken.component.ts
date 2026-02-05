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

  constructor(
    private statsService: StatsService,
    private playersService: PlayersService,
  ) {}

  ngOnInit() {
    // Lade alle Daten für alle Ansichten
    this.statsService.loadEnrichedStats().subscribe(() => {
      this.loadSpielData();
      this.loadSpieltagData();
      this.loadJahrData();
      this.loadAlltimeData();
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
}