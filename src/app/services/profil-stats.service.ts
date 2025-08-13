// src/app/services/profile-stats.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { StatsQueryService } from './stats-query.service';
import { StatRow } from './stats.service';
import { SeasonSelectorService } from './season-selector.service';

@Injectable({ providedIn: 'root' })
export class ProfileStatsService {
  constructor(
    private statsQuery: StatsQueryService,
    private seasonSelector: SeasonSelectorService
  ) {}

  getPlayerStats(playerId: number): Observable<{
    totalLegsWon: number;
    total180s: number;
    avgDarts: number;
    setsWon: number;
    setsWonPercent: number; // Korrekt definiert
    legsPlayed: number;
    legsWon: number;
    legsWonPercent: number;
    keepPercent: number;
    keepCount: number;
    breakPercent: number;
    breakCount: number;
    avgDartsNeeded: number;
  }> {
    return this.seasonSelector.getSelectedSeason$().pipe(
      switchMap(season => this.statsQuery.getFullStatsBySeason$(season || '2024/2025')),
      map(rows => {
        const playerRows = rows.filter(r => r.player_id === playerId);
        const totalLegsWon = playerRows.reduce((sum, r) => sum + (r.legs_won || 0), 0);
        const total180s = playerRows.reduce((sum, r) => sum + (r.score_180 || 0), 0);
        const avgDarts = playerRows.reduce((sum, r) => sum + (r.avg_darts || 0), 0) / playerRows.length || 0;
        const setsWon = playerRows.reduce((sum, r) => sum + (r.sets_won || 0), 0);
        const setsPlayed = playerRows.reduce((sum, r) => sum + (r.sets_won || 0) + (r.sets_won || 0), 0); // Korrigiere sets_played, falls verfügbar
        const legsPlayed = playerRows.reduce((sum, r) => sum + (r.legs_played || 0), 0);
        const legsWon = playerRows.reduce((sum, r) => sum + (r.legs_won || 0), 0);
        const setsWonPercent = setsPlayed > 0 ? (setsWon / setsPlayed * 100) : 0; // Korrekt berechnet
        const legsWonPercent = legsPlayed > 0 ? (legsWon / legsPlayed * 100) : 0;
        const keepPercent = playerRows.reduce((sum, r) => sum + (r.keep_pct || 0), 0) / playerRows.length || 0;
        const keepCount = playerRows.reduce((sum, r) => sum + Number(r.keep_ratio.split('/')[0] || 0), 0);
        const breakPercent = playerRows.reduce((sum, r) => sum + (r.break_pct || 0), 0) / playerRows.length || 0;
        const breakCount = playerRows.reduce((sum, r) => sum + Number(r.break_ratio.split('/')[0] || 0), 0);
        const avgDartsNeeded = playerRows.reduce((sum, r) => sum + (r.avg_darts || 0), 0) / playerRows.length || 0;

        return {
          totalLegsWon,
          total180s,
          avgDarts,
          setsWon,
          setsWonPercent,
          legsPlayed,
          legsWon,
          legsWonPercent,
          keepPercent,
          keepCount,
          breakPercent,
          breakCount,
          avgDartsNeeded,
        };
      })
    );
  }
}