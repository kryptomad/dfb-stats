import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgForOf } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { DropdownModule } from 'primeng/dropdown'; // Hinzugefügt für p-dropdown
import { FormsModule } from '@angular/forms';
import { JahresstatsHighlightLegsService } from '../../services/jahresstats-highlight-legs.service';
import { SeasonSelectorService } from '../../services/season-selector.service';
import { PlayersService, Player } from '../../services/players.service';
import { Observable, Subscription } from 'rxjs';
import { BestLegEntry } from '../../services/legs-query.service';

interface SeasonOption {
  label: string;
  value: string;
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
    FormsModule,
  ], // DropdownModule hinzugefügt
  templateUrl: './jahresstatistiken.component.html',
  styleUrls: ['./jahresstatistiken.component.scss'],
})
export class JahresstatistikenComponent {
  bestLegs$: Observable<BestLegEntry[]>;
  seasons: SeasonOption[] = [];
  selectedSeason: string | null = null;
  private subscription: Subscription;

  constructor(
    public jahresLegsService: JahresstatsHighlightLegsService,
    public seasonSelector: SeasonSelectorService,
    private playersService: PlayersService,
  ) {
    this.bestLegs$ = this.jahresLegsService.getBestLegsForLatestSeason();
    this.subscription = this.seasonSelector
      .getSeasons$()
      .subscribe((seasons) => {
        this.seasons = seasons.map((s) => ({ label: s, value: s }));
        console.log('Verfügbare Saisons:', this.seasons);
        if (!this.selectedSeason && this.seasons.length > 0) {
          this.selectedSeason = this.seasons[0].value;
          this.seasonSelector.setSelectedSeason(this.selectedSeason);
          console.log('Initiale Saison gesetzt:', this.selectedSeason);
        }
      });
    this.seasonSelector.getSelectedSeason$().subscribe((season) => {
      if (this.selectedSeason !== season) {
        this.selectedSeason = season;
        console.log('Saison aus Service:', this.selectedSeason);
      }
    });
  }

  onSeasonChange(): void {
    // Anpassung für (onChange) ohne Parameter
    if (this.selectedSeason) {
      this.seasonSelector.setSelectedSeason(this.selectedSeason);
    } else if (this.seasons.length > 0) {
      this.selectedSeason = this.seasons[0].value;
      this.seasonSelector.setSelectedSeason(this.selectedSeason);
    }
    console.log('Ausgewählte Saison:', this.selectedSeason);
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