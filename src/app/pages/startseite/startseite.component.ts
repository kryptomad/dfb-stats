import { Component, computed, inject, signal } from '@angular/core';
import { LastStatsService } from '../../services/lastStats.service';
import { NextMatchDayService } from '../../services/nextMatchDay.service';
import { PlayersService } from '../../services/players.service';
import { TableModule } from 'primeng/table';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { Card } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  styleUrls: ['./startseite.component.scss'],
  standalone: true,
  imports: [TableModule, NgClass, NgIf, Card, NgForOf, ChipModule, NgOptimizedImage, AvatarModule],
  providers: [NextMatchDayService, LastStatsService],
})
export class StartseiteComponent {
  private _nextMatchdayService = inject(NextMatchDayService);
  private _nextMatchday = this._nextMatchdayService.loadNextMatchDay();
  private _playersService = inject(PlayersService);

  gastgeber = computed(() => this._nextMatchday()?.gastgeber);
  datum = computed(() => this._nextMatchday()?.datum);
  zeit = computed(() => this._nextMatchday()?.zeit);
  gelddarten = computed(() => this._nextMatchday()?.gelddarten);
  oskardarten = computed(() => this._nextMatchday()?.oskardarten);
  season = computed(() => this._nextMatchday()?.season);
  matchday = computed(() => this._nextMatchday()?.matchday);
  location = computed(() => this._nextMatchday()?.location);
  image = computed(() => this._nextMatchday()?.image);
  games = computed(() => this._nextMatchday()?.games);
  boardA = computed(() => this._nextMatchday()?.boardA);
  boardB = computed(() => this._nextMatchday()?.boardB);

  // Upcoming season preview (v2 format)
  upcoming = this._nextMatchdayService.loadUpcomingV2();

  private _lastStatsService = inject(LastStatsService);
  private _lastStats = this._lastStatsService.loadLastStats();

  lastStats = computed(() => this._lastStats());

  getPlayerImage(playerName: string): string {
    const players = this._playersService.getPlayers({});
    const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    return player?.image
      ? `assets/players/${player.image}`
      : 'assets/players/default-avatar.png';
  }
}
