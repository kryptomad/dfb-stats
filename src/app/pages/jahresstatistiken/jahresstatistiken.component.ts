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
  ],
  templateUrl: './jahresstatistiken.component.html',
  styleUrls: ['./jahresstatistiken.component.scss'],
})
export class JahresstatistikenComponent {
  bestLegs$: Observable<BestLegEntry[]>;
  topYears$: Observable<TopYearStats[]>;
  seasons: SeasonOption[] = [];
  selectedSeason: string | null = null; // Zurück zu string | null, kompatibel mit SeasonSelectorService
  private subscription: Subscription;

  constructor(
    public jahresLegsService: JahresstatsHighlightLegsService,
    public seasonSelector: SeasonSelectorService,
    private playersService: PlayersService,
    private topJahreswerteService: JahresstatsTopJahreswerteService,
  ) {
    this.bestLegs$ = this.jahresLegsService.getBestLegsForLatestSeason();
    this.topYears$ = this.topJahreswerteService.getTopYearStats(
      this.selectedSeason || '',
    );
    this.subscription = this.seasonSelector
      .getSeasons$()
      .subscribe((seasons) => {
        this.seasons = seasons.map((s) => ({ label: s, value: s })); // Keine toString() nötig, da seasons schon strings sind
        console.log('Verfügbare Saisons:', this.seasons);
        if (!this.selectedSeason && this.seasons.length > 0) {
          this.selectedSeason = this.seasons[0].value;
          this.seasonSelector.setSelectedSeason(this.selectedSeason);
          this.updateTopYears();
          console.log('Initiale Saison gesetzt:', this.selectedSeason);
        }
      });
    this.seasonSelector.getSelectedSeason$().subscribe((season) => {
      if (this.selectedSeason !== season) {
        this.selectedSeason = season; // Nur string oder null
        this.updateTopYears();
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
    console.log('Ausgewählte Saison:', this.selectedSeason);
  }

  private updateTopYears(): void {
    this.topYears$ = this.topJahreswerteService.getTopYearStats(
      this.selectedSeason || '',
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