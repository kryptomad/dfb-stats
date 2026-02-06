import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgForOf } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { BestLegEntry } from '../../services/legs-query.service';
import { JahresstatsHighlightLegsService } from '../../services/jahresstats-highlight-legs.service';
import { SeasonSelectorService } from '../../services/season-selector.service';
import { PlayersService, Player } from '../../services/players.service';
import {
  JahresstatsTopJahreswerteService,
  TopYearStats,
  TopYearValue,
} from '../../services/jahresstats-top-jahreswerte.service';
import { LegsService, HighlightMatch } from '../../services/legs.service';
import { Observable, Subscription, of } from 'rxjs'; // of importiert für Initialisierung
import { delay } from 'rxjs/operators'; // Für simulierten Loading-Zustand

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
  ],
  templateUrl: './jahresstatistiken.component.html',
  styleUrls: ['./jahresstatistiken.component.scss'],
})
export class JahresstatistikenComponent {
  bestLegs$: Observable<BestLegEntry[]>;
  topYears$: Observable<TopYearStats[]>; // Kein explizites loading-Flag, aber simuliert
  seasons: SeasonOption[] = [];
  selectedSeason: string | null = null; // Kompatibel mit SeasonSelectorService
  highlightMatches: HighlightMatch[] = [];
  private subscription: Subscription;

  constructor(
    public jahresLegsService: JahresstatsHighlightLegsService,
    public seasonSelector: SeasonSelectorService,
    private playersService: PlayersService,
    private topJahreswerteService: JahresstatsTopJahreswerteService,
    private legsService: LegsService,
  ) {
    this.bestLegs$ = this.jahresLegsService.getBestLegsForLatestSeason();
    // Initialisiere topYears$ mit einem delayed Observable, um Loading zu simulieren
    this.topYears$ = of([]).pipe(delay(0)); // Delay(0) triggert async-Pipe-Laden
    this.subscription = this.seasonSelector
      .getSeasons$()
      .subscribe((seasons) => {
        this.seasons = [
          { label: 'All-Time', value: 'All-Time' },
          ...seasons.map((s) => ({ label: s, value: s }))
        ];
        console.log('Verfügbare Saisons:', this.seasons);
        if (!this.selectedSeason && this.seasons.length > 0) {
          this.selectedSeason = this.seasons[1]?.value || this.seasons[0].value; // Start with latest season (index 1) or All-Time if no seasons
          this.seasonSelector.setSelectedSeason(this.selectedSeason);
          this.updateTopYears();
          this.updateHighlightMatches();
          console.log('Initiale Saison gesetzt:', this.selectedSeason);
        }
      });
    this.seasonSelector.getSelectedSeason$().subscribe((season) => {
      if (this.selectedSeason !== season) {
        this.selectedSeason = season;
        this.updateTopYears();
        this.updateHighlightMatches();
        console.log('Saison aus Service:', this.selectedSeason);
      }
    });
  }

  onSeasonChange(): void {
    if (this.selectedSeason) {
      this.seasonSelector.setSelectedSeason(this.selectedSeason);
    } else if (this.seasons.length > 0) {
      this.selectedSeason = this.seasons[0].value;
      this.seasonSelector.setSelectedSeason(this.selectedSeason);
    }
    this.updateTopYears();
    this.updateHighlightMatches();
    console.log('Ausgewählte Saison:', this.selectedSeason);
  }

  private updateTopYears(): void {
    this.topYears$ = this.topJahreswerteService.getTopYearStats(
      this.selectedSeason || '',
    );
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

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}