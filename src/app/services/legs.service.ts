import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError, shareReplay, map } from 'rxjs/operators';
import { SeasonDataSource, SeasonSelectorService } from './season-selector.service';

export interface LegRow {
  id: number;
  game_id: number | string;
  season?: string | number;
  matchday?: number;
  leg_number: number;
  player1_id: number;
  player2_id: number;
  p1_score?: number | null;
  p1_left?: number | null;
  p2_score?: number | null;
  p2_left?: number | null;
  round?: number | null;
  p1_darts_leg: number | null;
  p2_darts_leg: number | null;
  p1_avg_3dart_leg?: number | null;
  p2_avg_3dart_leg?: number | null;
  leg_winner_id: number | null;
  starter?: string | null;
  starter_id?: number | null;
}

export interface CheckoutData {
  value: number;
  darts: number;
  matchday: number;
  gameId: number | string;
  legNumber: number;
  season: string;
}

export interface WonLegData {
  darts: number;
  avg: number;
  matchday: number;
  gameId: number | string;
  legNumber: number;
  season: string;
}

interface GameData {
  game_id: number | string;
  season?: string | number;
  matchday?: number;
  legs: {
    leg_number: number;
    starter_id: number;
    leg_winner_id: number | null;
    p1_darts_leg: number | null;
    p2_darts_leg: number | null;
    p1_avg_3dart_leg?: number | null;
    p2_avg_3dart_leg?: number | null;
    rounds: {
      round: number;
      p1_score?: number | null;
      p1_left?: number | null;
      p2_score?: number | null;
      p2_left?: number | null;
    }[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class LegsService implements SeasonDataSource {
  private legsUrl = 'assets/legs.json';
  private legsSignal = signal<LegRow[] | null>(null);
  private gamesDataSignal = signal<GameData[] | null>(null);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  constructor(private http: HttpClient, private seasonSelector: SeasonSelectorService) {
    this.initializeSeasonSelector();
  }

  private initializeSeasonSelector(): void {
    this.seasonSelector.setDataSource(this);
  }

  loadLegs$(): Observable<LegRow[]> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    return this.http.get<GameData[]>(this.legsUrl).pipe(
      map(games => {
        this.gamesDataSignal.set(games);
        return this.transformGamesToLegs(games);
      }),
      catchError(err => {
        console.error('Fehler beim Laden der Legs-Daten:', err);
        this.errorSignal.set('Leg-Daten konnten nicht geladen werden.');
        return of([]);
      }),
      shareReplay(1)
    );
  }

  private transformGamesToLegs(games: GameData[]): LegRow[] {
    const legs: LegRow[] = [];
    let idCounter = 1;
    games.forEach(game => {
      game.legs.forEach(leg => {
        legs.push({
          id: idCounter++,
          game_id: game.game_id,
          season: game.season,
          matchday: game.matchday,
          leg_number: leg.leg_number,
          player1_id: game.legs[0].starter_id, // Annahme: player1_id ist der Starter
          player2_id: game.legs.find(l => l.starter_id !== leg.starter_id)?.starter_id || 0,
          p1_score: leg.rounds[leg.rounds.length - 1]?.p1_score || null,
          p1_left: leg.rounds[leg.rounds.length - 1]?.p1_left || null,
          p2_score: leg.rounds[leg.rounds.length - 1]?.p2_score || null,
          p2_left: leg.rounds[leg.rounds.length - 1]?.p2_left || null,
          round: leg.rounds.length > 0 ? leg.rounds[leg.rounds.length - 1].round : null,
          p1_darts_leg: leg.p1_darts_leg,
          p2_darts_leg: leg.p2_darts_leg,
          p1_avg_3dart_leg: leg.p1_avg_3dart_leg,
          p2_avg_3dart_leg: leg.p2_avg_3dart_leg,
          leg_winner_id: leg.leg_winner_id,
          starter: null,
          starter_id: leg.starter_id
        });
      });
    });
    return legs;
  }

  async ensureLoaded(): Promise<void> {
    if (this.legsSignal() !== null) return;
    const rows = await firstValueFrom(this.loadLegs$());
    this.legsSignal.set(rows ?? []);
    this.loadingSignal.set(false);
  }

  getLegs(): LegRow[] {
    return this.legsSignal() ?? [];
  }

  isLoading(): boolean {
    return this.loadingSignal();
  }

  getError(): string | null {
    return this.errorSignal();
  }

  async refresh(): Promise<void> {
    this.legsSignal.set(null);
    this.gamesDataSignal.set(null);
    await this.ensureLoaded();
  }

  getPlayerCheckouts(playerId: number, season: string, limit: number = 5): CheckoutData[] {
    const games = this.gamesDataSignal();
    if (!games) return [];

    const checkouts: CheckoutData[] = [];

    games
      .filter(g => g.season === season)
      .forEach(game => {
        game.legs.forEach(leg => {
          // Check if player won this leg
          if (leg.leg_winner_id !== playerId) return;

          // Determine if player is p1 or p2
          const isPlayer1 = game.legs[0].starter_id === playerId ||
                           (leg.starter_id === playerId && leg.leg_number === 1);

          // Get the last round
          const lastRound = leg.rounds[leg.rounds.length - 1];
          if (!lastRound) return;

          const score = isPlayer1 ? lastRound.p1_score : lastRound.p2_score;
          const left = isPlayer1 ? lastRound.p1_left : lastRound.p2_left;

          // Check if this is a checkout (negative score and null left)
          if (score && score < 0 && left === null) {
            // Get the previous round for checkout value
            const prevRound = leg.rounds[leg.rounds.length - 2];
            if (prevRound) {
              const checkoutValue = isPlayer1 ? prevRound.p1_left : prevRound.p2_left;
              if (checkoutValue && checkoutValue > 0) {
                checkouts.push({
                  value: checkoutValue,
                  darts: Math.abs(score),
                  matchday: game.matchday || 0,
                  gameId: game.game_id,
                  legNumber: leg.leg_number,
                  season: season
                });
              }
            }
          }
        });
      });

    // Sort by matchday desc, then game_id desc, then leg_number desc
    return checkouts
      .sort((a, b) => {
        if (b.matchday !== a.matchday) return b.matchday - a.matchday;
        if (Number(b.gameId) !== Number(a.gameId)) return Number(b.gameId) - Number(a.gameId);
        return b.legNumber - a.legNumber;
      })
      .slice(0, limit);
  }

  getPlayerWonLegs(playerId: number, season: string, limit: number = 5): WonLegData[] {
    const games = this.gamesDataSignal();
    if (!games) return [];

    const wonLegs: WonLegData[] = [];

    games
      .filter(g => g.season === season)
      .forEach(game => {
        game.legs.forEach(leg => {
          // Check if player won this leg
          if (leg.leg_winner_id !== playerId) return;

          // Determine if player is p1 or p2
          const isPlayer1 = game.legs[0].starter_id === playerId ||
                           (leg.starter_id === playerId && leg.leg_number === 1);

          const darts = isPlayer1 ? leg.p1_darts_leg : leg.p2_darts_leg;
          const avg = isPlayer1 ? leg.p1_avg_3dart_leg : leg.p2_avg_3dart_leg;

          if (darts && avg) {
            wonLegs.push({
              darts,
              avg,
              matchday: game.matchday || 0,
              gameId: game.game_id,
              legNumber: leg.leg_number,
              season: season
            });
          }
        });
      });

    // Sort by matchday desc, then game_id desc, then leg_number desc
    return wonLegs
      .sort((a, b) => {
        if (b.matchday !== a.matchday) return b.matchday - a.matchday;
        if (Number(b.gameId) !== Number(a.gameId)) return Number(b.gameId) - Number(a.gameId);
        return b.legNumber - a.legNumber;
      })
      .slice(0, limit);
  }

  getSeasons$(): Observable<any[]> {
    return this.loadLegs$();
  }
}