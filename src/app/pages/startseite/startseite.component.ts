import { Component, computed, inject, Input, signal } from '@angular/core';
import { LastStatsService } from '../../services/lastStats.service';
import { NextMatchDayService } from '../../services/nextMatchDay.service';
import { TableModule } from 'primeng/table';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { Card } from 'primeng/card';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-startseite',
  templateUrl: './startseite.component.html',
  styleUrls: ['./startseite.component.scss'],
  standalone: true,
  imports: [TableModule, NgClass, Card, NgForOf, ChipModule, NgOptimizedImage],
  providers: [NextMatchDayService, NextMatchDayService, LastStatsService],
})
export class StartseiteComponent {
  private _nextMatchdayService = inject(NextMatchDayService);
  private _nextMatchday = this._nextMatchdayService.loadNextMatchDay();

  gastgeber = computed(() => this._nextMatchday()?.gastgeber);
  datum = computed(() => this._nextMatchday()?.datum);
  zeit = computed(() => this._nextMatchday()?.zeit);
  gelddarten = computed(() => this._nextMatchday()?.gelddarten);
  oskardarten = computed(() => this._nextMatchday()?.oskardarten);
  season = computed(() => this._nextMatchday()?.season);
  matchday = computed(() => this._nextMatchday()?.matchday);
  games = computed(() => this._nextMatchday()?.games);

  private _lastStatsService = inject(LastStatsService);
  private _lastStats = this._lastStatsService.loadLastStats();

  lastStats = computed(() => this._lastStats());
}
