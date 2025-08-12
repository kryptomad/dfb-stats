import { Injectable } from '@angular/core';
import { LegsService, LegRow } from './legs.service';
import { PlayersService, Player } from './players.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SeasonSelectorService } from './season-selector.service';

export interface BestLegEntry {
  player_id: number;
  player_name: string;
  darts: number;
  avg: number;
  game_id: string | number;
  leg_number: number;
  season?: string;
  matchday?: number;
}

@Injectable({ providedIn: 'root' })
export class LegsQueriesService {
  constructor(
    private legs: LegsService,
    private players: PlayersService,
    private seasonSelector: SeasonSelectorService
  ) {}

  private getLegs$(): Observable<LegRow[]> {
    return this.legs.loadLegs$().pipe(
      map(legs => legs.filter(l => l.season !== undefined && l.season !== null) || [])
    );
  }

  perPlayerBestLegsInSeason(): Observable<BestLegEntry[]> {
    return this.seasonSelector.getSelectedSeason$().pipe(
      switchMap(season => this.getLegs$().pipe(
        map(legs => this.calculateBestLegPerPlayer(legs.filter(l => l.season === season), season || ''))
      ))
    );
  }

  private calculateBestLegPerPlayer(legs: LegRow[], season: string): BestLegEntry[] {
    const players = this.players.getPlayers({ activeOnly: true });
    const playerBestLeg = new Map<number, BestLegEntry>();

    legs.forEach(leg => {
      if (!leg.leg_winner_id) return; // Ignoriere Legs ohne Gewinner
      const winnerId = leg.leg_winner_id;
      const winner = players.find(p => p.id === winnerId);
      if (!winner) return;

      const isPlayer1Winner = leg.player1_id === winnerId;
      const entry: BestLegEntry = {
        player_id: winnerId,
        player_name: winner.name,
        darts: isPlayer1Winner ? (leg.p1_darts_leg ?? Infinity) : (leg.p2_darts_leg ?? Infinity),
        avg: isPlayer1Winner ? (leg.p1_avg_3dart_leg ?? 0) : (leg.p2_avg_3dart_leg ?? 0),
        game_id: leg.game_id,
        leg_number: leg.leg_number,
        season,
        matchday: leg.matchday
      };

      const currentBest = playerBestLeg.get(winnerId);
      if (!currentBest || entry.darts < currentBest.darts || (entry.darts === currentBest.darts && entry.avg > currentBest.avg)) {
        playerBestLeg.set(winnerId, entry);
      }
    });

    // Alle besten Legs von jedem Spieler, sortiert nach Darts (beste zuerst)
    const topLegs = Array.from(playerBestLeg.values()).sort((a, b) => a.darts - b.darts);
    return topLegs;
  }

  getLatestSeason(): Observable<string | null> {
    return this.getLegs$().pipe(
      map(legs => {
        const seasons = [...new Set(legs.map(l => l.season?.toString()).filter(s => s !== undefined))];
        return seasons.length ? seasons.sort((a, b) => {
          const [yearA] = a.split('/').map(Number);
          const [yearB] = b.split('/').map(Number);
          return yearB - yearA;
        })[0] : null;
      })
    );
  }
}