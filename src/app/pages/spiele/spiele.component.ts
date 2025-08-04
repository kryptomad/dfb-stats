import { Component, OnInit } from '@angular/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgForOf, NgIf } from '@angular/common';
import { Card } from 'primeng/card';
import { RouterModule } from '@angular/router';
import { GamesService } from '../../services/games.service';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-spiele',
  imports: [
    Card,
    NgForOf,
    MultiSelectModule,
    RouterModule,
    FormsModule,
    ButtonModule,
    NgIf,
    DropdownModule,
  ],
  providers: [GamesService],
  templateUrl: './spiele.component.html',
  styleUrl: './spiele.component.scss',
})
export class SpieleComponent implements OnInit {
  // ALLE Spiele (nicht nur die letzten)
  alleSpiele: any[] = [];
  filteredSpiele: any[] = [];

  seasons: string[] = [];
  matchdays: number[] = [];
  players: { name: string }[] = [];
  ergebnisOptions: string[] = ['3:0', '3:1', '3:2', '2:3', '1:3', '0:3'];

  selectedSeasons: string[] = [];
  selectedMatchdays: number[] = [];
  selectedPlayer: { name: string } | null = null;
  selectedOpponents: { name: string }[] = [];
  selectedErgebnisse: string[] = [];

  constructor(
    private gamesService: GamesService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.alleSpiele = this.gamesService.getAllGames();

    this.seasons = Array.from(
      new Set(this.alleSpiele.map((s) => s.season)),
    ).sort();
    this.matchdays = Array.from(
      new Set(this.alleSpiele.map((s) => s.matchday)),
    ).sort((a, b) => a - b);

    const spielerSet = new Set([
      ...this.alleSpiele.map((x) => x.player1),
      ...this.alleSpiele.map((x) => x.player2),
    ]);
    this.players = Array.from(spielerSet)
      .sort()
      .map((name: string) => ({ name }));

    // QueryParams abonnieren und Filter setzen
    this.route.queryParams.subscribe((params) => {
      if (params['season']) {
        this.selectedSeasons = params['season'].split(',');
      }
      if (params['player']) {
        const playerName = params['player'];
        this.selectedPlayer =
          this.players.find((p) => p.name === playerName) || null;
      }
      if (params['matchday']) {
        this.selectedMatchdays = params['matchday'].split(',').map(Number);
      }
      if (params['opponents']) {
        this.selectedOpponents = params['opponents']
          .split(',')
          .map((name: string) => ({ name }));
      }
      if (params['ergebnisse']) {
        this.selectedErgebnisse = params['ergebnisse'].split(',');
      }

      this.filterGames();
    });
  }

  filterGames() {
    const selectedPlayerName = this.selectedPlayer
      ? this.selectedPlayer.name
      : null;

    // Wenn kein Filter gesetzt ist, Liste leer lassen
    const noFiltersSet =
      this.selectedSeasons.length === 0 &&
      this.selectedMatchdays.length === 0 &&
      !selectedPlayerName &&
      this.selectedOpponents.length === 0 &&
      this.selectedErgebnisse.length === 0;

    if (noFiltersSet) {
      this.filteredSpiele = [];
      return;
    }

    // URL-QueryParams aktualisieren
    const queryParams: any = {};
    if (this.selectedSeasons.length)
      queryParams.season = this.selectedSeasons.join(',');
    if (selectedPlayerName) queryParams.player = selectedPlayerName;
    if (this.selectedMatchdays.length)
      queryParams.matchday = this.selectedMatchdays.join(',');
    if (this.selectedOpponents.length)
      queryParams.opponents = this.selectedOpponents
        .map((o) => o.name)
        .join(',');
    if (this.selectedErgebnisse.length)
      queryParams.ergebnisse = this.selectedErgebnisse.join(',');

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });

    // Filterlogik
    this.filteredSpiele = this.alleSpiele.filter((s) => {
      const p1Erg = `${s.p1_legs_won}:${s.p2_legs_won}`;
      const p2Erg = `${s.p2_legs_won}:${s.p1_legs_won}`;

      let ergebnisMatch = true;
      if (this.selectedErgebnisse.length > 0 && selectedPlayerName) {
        if (
          s.player1 === selectedPlayerName &&
          this.selectedErgebnisse.includes(p1Erg)
        ) {
          ergebnisMatch = true;
        } else if (
          s.player2 === selectedPlayerName &&
          this.selectedErgebnisse.includes(p2Erg)
        ) {
          ergebnisMatch = true;
        } else {
          ergebnisMatch = false;
        }
      } else if (this.selectedErgebnisse.length > 0) {
        ergebnisMatch =
          this.selectedErgebnisse.includes(p1Erg) ||
          this.selectedErgebnisse.includes(p2Erg);
      }

      return (
        (this.selectedSeasons.length === 0 ||
          this.selectedSeasons.includes(s.season)) &&
        (this.selectedMatchdays.length === 0 ||
          this.selectedMatchdays.includes(s.matchday)) &&
        (!selectedPlayerName ||
          s.player1 === selectedPlayerName ||
          s.player2 === selectedPlayerName) &&
        (this.selectedOpponents.length === 0 ||
          this.selectedOpponents.some(
            (g) => g.name === s.player1 || g.name === s.player2,
          )) &&
        ergebnisMatch
      );
    });
  }

  resetFilters() {
    this.selectedSeasons = [];
    this.selectedMatchdays = [];
    this.selectedPlayer = null;
    this.selectedOpponents = [];
    this.selectedErgebnisse = [];
    this.filteredSpiele = [];

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  getPlayersOrdered(spieltag: any): {
    left: any;
    right: any;
    leftIsWinner: boolean;
  } {
    const p1IsWinner = spieltag.p1_legs_won > spieltag.p2_legs_won;

    return p1IsWinner
      ? { left: spieltag.player1, right: spieltag.player2, leftIsWinner: true }
      : {
          left: spieltag.player2,
          right: spieltag.player1,
          leftIsWinner: false,
        };
  }
}
